import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Button } from "@/components/ui/button";
import { DeleteEventButton } from "./delete-event-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminEventDetailPage({
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
      eventFilms: {
        include: { film: true },
        orderBy: { slotOrder: "asc" },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
      },
      featureRequests: true,
    },
  });

  if (!event) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {event.description ?? "No description provided yet."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="outline">
            <Link href={`/events/${event.slug}`} target="_blank">
              View public page
            </Link>
          </Button>
          <DeleteEventButton slug={event.slug} />
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Total sent: {event.invitations.length}</p>
            <p>
              Accepted / Maybe: {
                event.invitations.filter((invite) =>
                  ["ACCEPTED", "MAYBE"].includes(invite.status),
                ).length
              }
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/events/${event.slug}/invitations`}>
                Manage invitations
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Feature requests linked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {event.featureRequests.length > 0 ? (
              event.featureRequests.map((request) => (
                <div key={request.id} className="rounded-lg border bg-muted/30 p-3">
                  <p className="font-medium">{request.filmTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {request.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No requests linked yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Line-up</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Runtime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.eventFilms.map(({ film, slotOrder }) => (
                  <TableRow key={film.id}>
                    <TableCell>{slotOrder + 1}</TableCell>
                    <TableCell>{film.title}</TableCell>
                    <TableCell>{film.runtimeMinutes ?? "?"} min</TableCell>
                  </TableRow>
                ))}
                {event.eventFilms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Line-up not configured.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

