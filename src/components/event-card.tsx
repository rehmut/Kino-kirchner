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
  const lineup = event.eventFilms.slice(0, 3);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-white/10 bg-card/80 shadow-xl backdrop-blur">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {posterUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-secondary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04020d] via-[#04020d]/60 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end gap-3 p-6">
          <Badge variant="secondary" className="w-fit bg-white/15 text-white">
            {format(event.scheduledAt, "EEE, d MMM yyyy")}
          </Badge>
          <Link
            href={`/events/${event.slug}`}
            className="text-2xl font-semibold text-white transition hover:text-primary"
          >
            {event.title}
          </Link>
          {event.location ? (
            <p className="text-sm text-white/80">{event.location}</p>
          ) : null}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        {event.eventFilms.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-1">
            {event.eventFilms.slice(0, 5).map(({ film }) => (
              <Link
                key={film.id}
                href={film.letterboxdUrl}
                target="_blank"
                rel="noreferrer"
                className="relative block h-36 w-24 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-primary/40 to-secondary/40"
              >
                {film.posterImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                    style={{ backgroundImage: `url(${film.posterImage})` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-white/70">
                    {film.title}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </Link>
            ))}
          </div>
        ) : null}

        {event.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}

        {lineup.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
              Lineup highlights
            </p>
            <ul className="space-y-2">
              {lineup.map(({ film, slotOrder }) => (
                <li key={film.id} className="flex items-start justify-between gap-4 text-sm text-foreground/90">
                  <div>
                    <Link
                      href={film.letterboxdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:text-primary hover:underline"
                    >
                      #{slotOrder + 1} {film.title}
                    </Link>
                    {film.runtimeMinutes ? (
                      <p className="text-xs text-muted-foreground">{film.runtimeMinutes} min</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {event.eventFilms.length > 3 ? (
              <p className="text-xs text-muted-foreground">
                +{event.eventFilms.length - 3} more films in the programme
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">Line-up reveal coming soon.</p>
        )}
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
