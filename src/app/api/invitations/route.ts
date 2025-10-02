import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createInvitationSchema = z.object({
  eventId: z.string().cuid(),
  inviteeName: z
    .string()
    .max(120)
    .optional()
    .transform((value) => value?.trim() || undefined),
  email: z.string().email(),
  plusOnes: z.number().int().min(0).max(5).optional(),
  note: z
    .string()
    .max(255)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  const invitations = await prisma.invitation.findMany({
    where: eventId ? { eventId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createInvitationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const token = randomUUID();
  const invitation = await prisma.invitation.create({
    data: {
      token,
      status: "PENDING",
      ...parsed.data,
    },
  });

  return NextResponse.json({ invitation }, { status: 201 });
}
