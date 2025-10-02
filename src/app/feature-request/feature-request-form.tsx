"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  filmTitle: z.string().min(1, "Film title is required").max(200),
  letterboxdUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  submittedEmail: z.string().email("Please enter a valid email"),
  submitterName: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  eventSlug: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type FeatureRequestFormProps = {
  events: { slug: string; title: string }[];
};

export function FeatureRequestForm({ events }: FeatureRequestFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      filmTitle: "",
      letterboxdUrl: "",
      submittedEmail: "",
      submitterName: "",
      notes: "",
      eventSlug: undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    setMessage(null);
    setStatus("idle");

    startTransition(async () => {
      const payload = {
        filmTitle: values.filmTitle.trim(),
        letterboxdUrl: values.letterboxdUrl?.trim() || undefined,
        submittedEmail: values.submittedEmail.trim(),
        submitterName: values.submitterName?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        eventSlug: values.eventSlug || undefined,
      };

      const response = await fetch("/api/feature-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setMessage(body?.error ?? "Unable to submit request. Please try again.");
        setStatus("error");
        return;
      }

      form.reset();
      setStatus("success");
      setMessage("Thanks! Your request has been sent to the host.");
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-3xl border border-white/10 bg-card/80 p-8 shadow-xl backdrop-blur"
      >
        <FormField
          control={form.control}
          name="filmTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Film title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter the movie you want to screen"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="letterboxdUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Letterboxd link</FormLabel>
              <FormControl>
                <Input placeholder="https://letterboxd.com/film/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="submittedEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your email *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submitterName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="eventSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attach to a scheduled event</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value || undefined)}
                value={field.value ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific event" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No specific event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.slug} value={event.slug}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why this film?</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Share any context or why it is a good fit."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Sending..." : "Submit request"}
          </Button>
          {message ? (
            <p
              className={`text-sm ${
                status === "success" ? "text-primary" : "text-destructive"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
