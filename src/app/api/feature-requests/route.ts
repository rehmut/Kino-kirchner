import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const featureRequestSchema = z.object({
  submittedEmail: z.string().email(),
  submitterName: z.string().max(120).optional(),
  filmTitle: z.string().min(1).max(200),
  letterboxdUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  eventSlug: z.string().min(1).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const requests = await prisma.featureRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      event: true,
      film: true,
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = featureRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { eventSlug, ...rest } = parsed.data;

  const event = eventSlug
    ? await prisma.event.findUnique({ where: { slug: eventSlug } })
    : null;

  const requestRecord = await prisma.featureRequest.create({
    data: {
      ...rest,
      eventId: event?.id,
    },
  });

  return NextResponse.json({ request: requestRecord }, { status: 201 });
}
