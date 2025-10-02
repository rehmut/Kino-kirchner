import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { fetchLetterboxdMetadata } from "@/lib/letterboxd";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const lineupItemSchema = z
  .object({
    filmId: z
      .union([z.string().cuid(), z.literal("")])
      .optional()
      .transform((value) => (value ? value : undefined)),
    title: z.string().min(1).optional(),
    letterboxdUrl: z.string().url().optional(),
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

const updateEventSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().max(2000).optional(),
    scheduledAt: z.string().datetime().optional(),
    doorTime: z.string().datetime().optional(),
    location: z.string().max(255).optional(),
    heroImage: z.string().url().optional(),
    isPublished: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    featureRequestIds: z.array(z.string().cuid()).optional(),
    lineup: z.array(lineupItemSchema).optional(),
  })
  .strict();

export async function GET(
  _request: Request,
  context: { params: { slug: string } },
) {
  const event = await prisma.event.findUnique({
    where: { slug: context.params.slug },
    include: {
      eventFilms: {
        include: { film: true },
        orderBy: { slotOrder: "asc" },
      },
      invitations: {
        orderBy: { createdAt: "asc" },
      },
      featureRequests: true,
    },
  });

  if (!event) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(
  request: Request,
  context: { params: { slug: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateEventSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.event.findUnique({
    where: { slug: context.params.slug },
  });

  if (!existing) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { lineup, featureRequestIds, title, ...rest } = parsed.data;

  const updates: Record<string, unknown> = { ...rest };

  if (title && title !== existing.title) {
    updates.title = title;
    updates.slug = slugify(title);
  }

  if (parsed.data.scheduledAt) {
    updates.scheduledAt = new Date(parsed.data.scheduledAt);
  }

  if (parsed.data.doorTime) {
    updates.doorTime = parsed.data.doorTime
      ? new Date(parsed.data.doorTime)
      : null;
  }

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
      enrichedLineupEntries
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
    const updatedEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: existing.id },
        data: {
          ...updates,
          featureRequests:
            featureRequestIds && featureRequestIds.length > 0
              ? {
                  set: featureRequestIds.map((id) => ({ id })),
                }
              : featureRequestIds
                ? { set: [] }
                : undefined,
        },
      });

      if (lineup) {
        await tx.eventFilm.deleteMany({ where: { eventId: event.id } });
      }

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

    const refreshedSlug = (updates.slug as string | undefined) ?? context.params.slug;

    const eventWithRelations = await prisma.event.findUnique({
      where: { slug: refreshedSlug },
      include: {
        eventFilms: {
          include: { film: true },
          orderBy: { slotOrder: "asc" },
        },
        featureRequests: true,
      },
    });

    return NextResponse.json({ event: eventWithRelations ?? updatedEvent });
  } catch (error) {
    console.error("Error updating event", error);
    return NextResponse.json(
      { error: "Unable to update event. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { slug: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const event = await prisma.event.update({
    where: { slug: context.params.slug },
    data: { isArchived: true, isPublished: false },
  });

  return NextResponse.json({ event });
}
