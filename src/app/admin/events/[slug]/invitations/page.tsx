import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AddInvitationForm } from "./add-invitation-form";
import { InvitationsTable, type InvitationRow } from "./invitations-table";

export default async function ManageInvitationsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/sign-in");
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      invitations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) {
    redirect("/admin");
  }

  const invitations: InvitationRow[] = event.invitations.map((invite) => ({
    id: invite.id,
    inviteeName: invite.inviteeName,
    email: invite.email,
    status: invite.status,
    plusOnes: invite.plusOnes,
    token: invite.token,
    note: invite.note,
    createdAt: invite.createdAt.toISOString(),
    rsvpAt: invite.rsvpAt ? invite.rsvpAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Invitations for</p>
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href={`/admin/events/${event.slug}`}>Back to event</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/events/${event.slug}`} target="_blank">
              View public page
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Add a guest</h2>
        <AddInvitationForm eventId={event.id} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Guest list</h2>
          <p className="text-sm text-muted-foreground">
            Share each guest&apos;s unique RSVP link after adding them.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {invitations.length} invitation{invitations.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <InvitationsTable invitations={invitations} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
