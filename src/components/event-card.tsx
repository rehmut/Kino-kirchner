import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type EventFilm = {
  film: {
    id: string;
    title: string;
    letterboxdUrl: string;
    posterImage: string | null;
    runtimeMinutes: number | null;
  };
  slotOrder: number;
  note: string | null;
};

type EventCardProps = {
  event: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    scheduledAt: Date;
    location: string | null;
    heroImage: string | null;
    eventFilms: EventFilm[];
  };
  attendingCount: number;
};

export function EventCard({ event, attendingCount }: EventCardProps) {
  const primaryFilm = event.eventFilms[0]?.film;
  const posterUrl = event.heroImage ?? primaryFilm?.posterImage ?? null;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-white/10 bg-card/80 shadow-xl backdrop-blur">
      <div className="relative h-[26rem] w-full overflow-hidden">
        {posterUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-secondary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04020d] via-[#04020d]/70 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end gap-4 p-7">
          <Badge variant="secondary" className="w-fit bg-white/15 text-white">
            {format(event.scheduledAt, "EEE, d MMM yyyy")}
          </Badge>
          <Link
            href={`/events/${event.slug}`}
            className="text-3xl font-semibold text-white transition hover:text-primary"
          >
            {event.title}
          </Link>
          {event.location ? (
            <p className="text-sm text-white/80">{event.location}</p>
          ) : null}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        {event.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}
        {primaryFilm ? (
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
            Featuring {primaryFilm.title}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-white/10 bg-gradient-to-r from-white/5 to-transparent px-6 py-4 text-sm text-muted-foreground">
        <span>{attendingCount} attending</span>
        <Link href={`/events/${event.slug}`} className="font-medium text-primary hover:underline">
          View details
        </Link>
      </CardFooter>
    </Card>
  );
}
