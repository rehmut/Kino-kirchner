import Link from "next/link";

import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const events = await prisma.event.findMany({
    where: { isArchived: false },
    orderBy: { scheduledAt: "asc" },
    take: 6,
    include: {
      eventFilms: {
        orderBy: { slotOrder: "asc" },
        include: { film: true },
      },
      invitations: {
        where: { status: { in: ["ACCEPTED", "MAYBE"] } },
        select: { id: true },
      },
    },
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:py-24">
      <section className="rounded-3xl border border-white/10 bg-card/80 p-10 shadow-2xl backdrop-blur-xl sm:p-14">
        <div className="space-y-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
            Kino-Kirchner
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Filmfreitag am Donnerstag
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground sm:mx-0">
            Die kalte Jahreszeit hat begonnen &ndash; und um Herbst und Winter gut zu ueberstehen, lade ich dich an jedem zweiten Donnerstag herzlich in mein Heimkino ein.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
            <Button asChild size="lg">
              <Link href="/admin">Open the dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/feature-request">Request a film</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-foreground">Upcoming screenings</h2>
          <Button asChild variant="ghost">
            <Link href="/events">Browse all events</Link>
          </Button>
        </div>
        {events.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                attendingCount={event.invitations.length}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-card/60 p-12 text-center backdrop-blur-lg">
            <p className="text-lg font-medium text-foreground">No screenings planned yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Head over to the admin dashboard to create your first cinema evening and send invitations.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
