import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/sign-in");
  }

  const [events, featureRequests] = await Promise.all([
    prisma.event.findMany({
      where: { isArchived: false },
      orderBy: { scheduledAt: "asc" },
      include: {
        _count: { select: { invitations: true } },
        invitations: {
          where: { status: { in: ["ACCEPTED", "MAYBE"] } },
          select: { id: true },
        },
      },
    }),
    prisma.featureRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage events, invitations, and film requests.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/events/new">Create event</Link>
        </Button>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {event.title}
                <Badge variant={event.isPublished ? "default" : "secondary"}>
                  {event.isPublished ? "Published" : "Draft"}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(event.scheduledAt).toLocaleString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Invitations</span>
                <span className="font-medium">{event._count.invitations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>RSVP yes / maybe</span>
                <span className="font-medium">{event.invitations.length}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/admin/events/${event.slug}`}>Manage event</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center text-muted-foreground">
              No events yet. Create your first cinema evening to get started.
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Latest feature requests</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/feature-requests">View all</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Film</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.filmTitle}</TableCell>
                    <TableCell>
                      {request.submitterName ? `${request.submitterName} - ` : ""}
                      {request.submittedEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {featureRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No feature requests yet.
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
