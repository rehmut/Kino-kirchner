import { prisma } from "@/lib/prisma";

import { EventCard } from "@/components/event-card";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { scheduledAt: "desc" },
    include: {
      eventFilms: {
        include: { film: true },
        orderBy: { slotOrder: "asc" },
      },
      invitations: {
        where: { status: { in: ["ACCEPTED", "MAYBE"] } },
        select: { id: true },
      },
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">All screenings</h1>
        <p className="text-muted-foreground">
          Browse past and upcoming cinema evenings.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            attendingCount={event.invitations.length}
          />
        ))}
      </div>
    </div>
  );
}
