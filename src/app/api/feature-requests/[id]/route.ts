import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateFeatureRequestSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
  filmId: z.string().cuid().nullable().optional(),
  eventSlug: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateFeatureRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { eventSlug, filmId, ...rest } = parsed.data;

  const event = eventSlug
    ? await prisma.event.findUnique({ where: { slug: eventSlug } })
    : null;

  const requestRecord = await prisma.featureRequest.update({
    where: { id: context.params.id },
    data: {
      ...rest,
      eventId: event?.id,
      filmId: filmId ?? undefined,
    },
  });

  return NextResponse.json({ request: requestRecord });
}
