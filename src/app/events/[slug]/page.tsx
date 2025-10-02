import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      eventFilms: {
        include: { film: true },
        orderBy: { slotOrder: "asc" },
      },
      invitations: {
        orderBy: [{ status: "asc" }, { inviteeName: "asc" }],
      },
      featureRequests: true,
    },
  });

  if (!event) {
    return notFound();
  }

  const attending = event.invitations.filter((invite) =>
    ["ACCEPTED", "MAYBE"].includes(invite.status),
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">
            {format(event.scheduledAt, "PPPP p")}
          </Badge>
          {event.location ? (
            <Badge variant="secondary">{event.location}</Badge>
          ) : null}
          <Badge>{attending.length} attending</Badge>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">
          {event.title}
        </h1>
        {event.description ? (
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Link href="/feature-request" className="hover:underline">
            Request a film for a future night
          </Link>
          <span aria-hidden className="text-muted-foreground/50">
            �
          </span>
          <Link href="/rsvp" className="hover:underline">
            Have an invite? Enter your RSVP code
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Film line-up</h2>
        {event.eventFilms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {event.eventFilms.map(({ film, slotOrder }) => (
              <Card key={film.id}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    <Link
                      href={film.letterboxdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      #{slotOrder + 1} {film.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {film.runtimeMinutes ? (
                    <p className="text-sm text-muted-foreground">
                      Runtime: {film.runtimeMinutes} min
                    </p>
                  ) : null}
                  {film.posterImage ? (
                    <div
                      className="relative h-48 rounded-xl bg-muted"
                      style={{
                        backgroundImage: `url(${film.posterImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              The film line-up is coming soon.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">RSVP snapshot</h2>
        {event.invitations.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {event.invitations.map((invite) => (
              <Card key={invite.id} className="border-muted/70">
                <CardContent className="flex items-center justify-between py-5">
                  <div>
                    <p className="font-medium">
                      {invite.inviteeName ?? invite.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invite.email}
                    </p>
                  </div>
                  <Badge
                    variant={
                      invite.status === "ACCEPTED"
                        ? "default"
                        : invite.status === "DECLINED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {invite.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Invitations have not been sent yet for this event.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
