import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const rsvpSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "MAYBE"]),
  note: z.string().max(500).optional(),
  plusOnes: z.number().int().min(0).max(5).optional(),
});

export async function GET(
  _request: Request,
  context: { params: { token: string } },
) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: context.params.token },
    include: {
      event: {
        include: {
          eventFilms: {
            include: { film: true },
            orderBy: { slotOrder: "asc" },
          },
        },
      },
    },
  });

  if (!invitation) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json({ invitation });
}

export async function POST(
  request: Request,
  context: { params: { token: string } },
) {
  const json = await request.json().catch(() => null);
  const parsed = rsvpSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const invitation = await prisma.invitation.update({
    where: { token: context.params.token },
    data: {
      status: parsed.data.status,
      note: parsed.data.note,
      plusOnes: parsed.data.plusOnes ?? 0,
      rsvpAt: new Date(),
    },
    include: {
      event: true,
    },
  });

  return NextResponse.json({ invitation });
}
