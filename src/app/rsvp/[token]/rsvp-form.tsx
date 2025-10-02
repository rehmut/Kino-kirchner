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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "MAYBE"]),
  plusOnes: z.coerce.number().int().min(0).max(5).default(0),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

type RsvpFormProps = {
  token: string;
  defaultValues: FormValues;
};

export function RsvpForm({ token, defaultValues }: RsvpFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setMessage(body?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setMessage("Thanks! Your RSVP has been recorded.");
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How are you feeling about this screening?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACCEPTED">I am in</SelectItem>
                  <SelectItem value="MAYBE">Maybe / need to confirm</SelectItem>
                  <SelectItem value="DECLINED">Unfortunately cannot make it</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plusOnes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How many guests will you bring?</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={5} {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Leave as 0 if you are coming solo. Reach out to the host if you need additional spots.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anything the host should know?</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Allergic to popcorn, arriving late, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between gap-4">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Saving..." : "Submit RSVP"}
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </form>
    </Form>
  );
}
