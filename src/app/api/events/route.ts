import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchLetterboxdMetadata } from "@/lib/letterboxd";
import { slugify } from "@/lib/slug";

const lineupItemSchema = z
  .object({
    filmId: z.string().cuid().optional(),
    title: z.string().min(1).optional(),
    letterboxdUrl: z
      .string()
      .url({ message: "Provide a valid Letterboxd URL" })
      .optional(),
    runtimeMinutes: z.coerce.number().int().min(1).max(600).optional(),
    posterImage: z.string().url().optional(),
    director: z.string().max(120).optional(),
    synopsis: z.string().max(2000).optional(),
    note: z.string().max(255).optional(),
    slotOrder: z.number().int().min(0).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.filmId) {
      if (!value.title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Title is required when creating a new film",
          path: ["title"],
        });
      }
      if (!value.letterboxdUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Letterboxd URL is required when creating a new film",
          path: ["letterboxdUrl"],
        });
      }
    }
  });

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  doorTime: z.string().datetime().optional(),
  location: z.string().max(255).optional(),
  heroImage: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  featureRequestIds: z.array(z.string().cuid()).optional(),
  lineup: z.array(lineupItemSchema).optional(),
});

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { scheduledAt: "asc" },
    include: {
      eventFilms: {
        include: {
          film: true,
        },
        orderBy: { slotOrder: "asc" },
      },
      invitations: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const payload = events.map((event) => ({
    ...event,
    attendingCount: event.invitations.filter((invite) =>
      ["ACCEPTED", "MAYBE"].includes(invite.status),
    ).length,
  }));

  return NextResponse.json({ events: payload });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, scheduledAt, doorTime, featureRequestIds, lineup, ...rest } = parsed.data;
  const slug = slugify(title);

  const lineupEntries = lineup ?? [];

  const enrichedLineupEntries = await Promise.all(
    lineupEntries.map(async (entry) => {
      if (!entry.letterboxdUrl) {
        return entry;
      }

      const metadata = await fetchLetterboxdMetadata(entry.letterboxdUrl);
      if (!metadata) {
        return entry;
      }

      return {
        ...entry,
        title: entry.title ?? metadata.title,
        runtimeMinutes: entry.runtimeMinutes ?? metadata.runtimeMinutes,
        posterImage: entry.posterImage ?? metadata.posterImage,
        director: entry.director ?? metadata.director,
        synopsis: entry.synopsis ?? metadata.description,
      };
    }),
  );
  const filmIdsToValidate = Array.from(
    new Set(
      lineupEntries
        .map((item) => item.filmId)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (filmIdsToValidate.length > 0) {
    const existingFilms = await prisma.film.findMany({
      where: { id: { in: filmIdsToValidate } },
      select: { id: true },
    });
    if (existingFilms.length !== filmIdsToValidate.length) {
      return NextResponse.json(
        { error: "One or more selected films could not be found" },
        { status: 400 },
      );
    }
  }

  try {
    const createdEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title,
          slug,
          scheduledAt: new Date(scheduledAt),
          doorTime: doorTime ? new Date(doorTime) : undefined,
          createdById: session.user.id,
          ...rest,
          featureRequests:
            featureRequestIds && featureRequestIds.length > 0
              ? {
                  connect: featureRequestIds.map((id) => ({ id })),
                }
              : undefined,
        },
      });

      if (enrichedLineupEntries.length > 0) {
        for (const [index, item] of enrichedLineupEntries.entries()) {
          let filmId = item.filmId;

          if (!filmId && item.letterboxdUrl && item.title) {
            const film = await tx.film.upsert({
              where: { letterboxdUrl: item.letterboxdUrl },
              create: {
                title: item.title,
                letterboxdUrl: item.letterboxdUrl,
                runtimeMinutes: item.runtimeMinutes ?? undefined,
                posterImage: item.posterImage,
                director: item.director,
                synopsis: item.synopsis,
              },
              update: {
                title: item.title,
                runtimeMinutes: item.runtimeMinutes ?? undefined,
                posterImage: item.posterImage ?? undefined,
                director: item.director ?? undefined,
                synopsis: item.synopsis ?? undefined,
              },
            });
            filmId = film.id;
          }

          if (!filmId) {
            throw new Error("Missing film identifier for lineup entry");
          }

          await tx.eventFilm.create({
            data: {
              eventId: event.id,
              filmId,
              note: item.note,
              slotOrder: item.slotOrder ?? index,
            },
          });
        }
      }

      return event;
    });

    const eventWithRelations = await prisma.event.findUnique({
      where: { id: createdEvent.id },
      include: {
        eventFilms: {
          include: { film: true },
          orderBy: { slotOrder: "asc" },
        },
        featureRequests: true,
      },
    });

    return NextResponse.json({ event: eventWithRelations }, { status: 201 });
  } catch (error) {
    console.error("Error creating event", error);
    return NextResponse.json(
      { error: "Unable to create event. Please try again." },
      { status: 500 },
    );
  }
}
