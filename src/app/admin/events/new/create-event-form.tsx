"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type FeatureRequestOption = {
  id: string;
  filmTitle: string;
  submitterName: string | null;
  submittedEmail: string;
  status: string;
};

type LineupItemInput = {
  filmId?: string;
  letterboxdUrl: string;
};

type EventFormValues = {
  title: string;
  scheduledAt: string;
  location?: string;
  isPublished: boolean;
  featureRequestIds: string[];
  lineup: LineupItemInput[];
};

type EventFormProps = {
  featureRequests: FeatureRequestOption[];
  mode?: "create" | "edit";
  initialValues?: EventFormValues;
  eventSlug?: string;
};

const lineupFilmSchema = z
  .object({
    filmId: z
      .union([z.string().cuid(), z.literal("")])
      .optional()
      .transform((value) => (value ? value : undefined)),
    letterboxdUrl: z
      .string()
      .url("Provide the Letterboxd link (https://letterboxd.com/film/...)")
      .max(300, "URL seems too long")
      .transform((value) => value.trim()),
  })
  .refine((value) => Boolean(value.letterboxdUrl), {
    message: "Letterboxd link is required",
    path: ["letterboxdUrl"],
  });

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledAt: z.string().min(1, "Please pick a screening date and time"),
  location: z
    .string()
    .max(255, "Location is too long")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  isPublished: z.boolean().default(false),
  featureRequestIds: z.array(z.string()).default([]),
  lineup: z.array(lineupFilmSchema).min(1, "Add at least one film"),
});

const EMPTY_VALUES: EventFormValues = {
  title: "",
  scheduledAt: "",
  location: "",
  isPublished: false,
  featureRequestIds: [],
  lineup: [],
};

type SubmissionState = "idle" | "success" | "error";

function toDateTimeLocalString(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({
  featureRequests,
  mode = "create",
  initialValues,
  eventSlug,
}: EventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [isPending, startTransition] = useTransition();

  const defaults = JSON.parse(JSON.stringify(initialValues ?? EMPTY_VALUES)) as EventFormValues;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineup",
  });

  const selectedRequests = form.watch("featureRequestIds") ?? [];

  const toggleRequest = (id: string) => {
    const next = selectedRequests.includes(id)
      ? selectedRequests.filter((item) => item !== id)
      : [...selectedRequests, id];
    form.setValue("featureRequestIds", next, { shouldDirty: true, shouldTouch: true });
  };

  const onSubmit = (values: EventFormValues) => {
    setMessage(null);
    setStatus("idle");

    const lineupPayload = values.lineup.map((film, index) => ({
      filmId: film.filmId,
      letterboxdUrl: film.letterboxdUrl.trim(),
      slotOrder: index,
    }));

    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      location: values.location,
      isPublished: values.isPublished,
      featureRequestIds: values.featureRequestIds,
      lineup: lineupPayload,
    };

    startTransition(async () => {
      let response: Response;
      if (mode === "edit") {
        if (!eventSlug) {
          setStatus("error");
          setMessage("Missing event reference.");
          return;
        }
        response = await fetch(`/api/events/${eventSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setStatus("error");
        setMessage(body?.error ?? "Unable to save the event. Please try again.");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { event?: { slug: string } }
        | null;
      const slug = data?.event?.slug ?? eventSlug;
      setStatus("success");
      setMessage(mode === "edit" ? "Event updated." : "Event created.");
      if (slug) {
        router.push(`/admin/events/${slug}`);
        router.refresh();
      }
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 rounded-3xl border border-white/10 bg-card/80 p-8 shadow-xl backdrop-blur"
      >
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event title</FormLabel>
                <FormControl>
                  <Input placeholder="Filmfreitag" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Screening date & time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>Use 24-hour (military) time.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Heimkino, Wohnzimmer, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Film line-up</h3>
              <p className="text-sm text-muted-foreground">
                Paste the Letterboxd link for each film in order.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  filmId: "",
                  letterboxdUrl: "",
                })
              }
            >
              Add film
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/20 bg-muted/20 p-6 text-sm text-muted-foreground">
              Add at least one film to build the programme.
            </p>
          ) : (
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-4 rounded-2xl border border-white/10 bg-background/30 p-6 shadow-inner"
                >
                  <input
                    type="hidden"
                    {...form.register(`lineup.${index}.filmId` as const)}
                    defaultValue={(field as { filmId?: string }).filmId ?? ""}
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-semibold">Film #{index + 1}</h4>
                      <p className="text-xs text-muted-foreground">
                        Example: https://letterboxd.com/film/in-the-mood-for-love/
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label={`Remove film ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`lineup.${index}.letterboxdUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Letterboxd link *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://letterboxd.com/film/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-4">
              <div className="space-y-1">
                <FormLabel>Publish immediately</FormLabel>
                <FormDescription>
                  When enabled, the event is visible to guests as soon as it is created.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="featureRequestIds"
          render={() => (
            <FormItem>
              <FormLabel>Link feature requests</FormLabel>
              <FormDescription>
                Attach any guest requests you plan to include in this screening.
              </FormDescription>
              <div className="mt-4 space-y-3">
                {featureRequests.length > 0 ? (
                  featureRequests.map((request) => {
                    const checked = selectedRequests.includes(request.id);
                    return (
                      <label
                        key={request.id}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-muted/20 p-4 transition hover:bg-muted/30"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleRequest(request.id)}
                        />
                        <div className="space-y-1">
                          <p className="font-medium leading-tight text-foreground/90">
                            {request.filmTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.submitterName ? `${request.submitterName} - ` : ""}
                            {request.submittedEmail}
                          </p>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No pending feature requests right now.
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {message ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-primary" : "text-destructive"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : mode === "edit" ? "Save changes" : "Create event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function buildInitialEventValues(event: {
  title: string;
  scheduledAt: Date;
  location: string | null;
  isPublished: boolean;
  featureRequests: { id: string }[];
  eventFilms: {
    filmId: string;
    slotOrder: number;
    film: {
      id: string;
      letterboxdUrl: string;
    };
  }[];
}): EventFormValues {
  return {
    title: event.title,
    scheduledAt: toDateTimeLocalString(event.scheduledAt),
    location: event.location ?? "",
    isPublished: event.isPublished,
    featureRequestIds: event.featureRequests.map((request) => request.id),
    lineup: event.eventFilms
      .sort((a, b) => a.slotOrder - b.slotOrder)
      .map((entry) => ({
        filmId: entry.filmId,
        letterboxdUrl: entry.film.letterboxdUrl,
      })),
  };
}
