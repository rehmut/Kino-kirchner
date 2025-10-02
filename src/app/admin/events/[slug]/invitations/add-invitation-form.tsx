"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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

const invitationSchema = z.object({
  inviteeName: z
    .string()
    .max(120, "Keep names under 120 characters")
    .optional(),
  email: z.string().email("Enter a valid email address"),
  plusOnes: z.coerce.number().int().min(0).max(5).default(0),
  note: z.string().max(255, "Note is too long").optional(),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

type AddInvitationFormProps = {
  eventId: string;
};

export function AddInvitationForm({ eventId }: AddInvitationFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      inviteeName: "",
      email: "",
      plusOnes: 0,
      note: "",
    },
  });

  const onSubmit = (values: InvitationFormValues) => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          inviteeName: values.inviteeName?.trim() || undefined,
          email: values.email.trim(),
          plusOnes: values.plusOnes,
          note: values.note?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setMessage(body?.error ?? "Could not create invitation. Check the details and retry.");
        return;
      }

      form.reset({ inviteeName: "", email: "", plusOnes: 0, note: "" });
      router.refresh();
      setMessage("Invitation added. Share the RSVP link with your guest.");
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="inviteeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="guest@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="plusOnes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plus ones</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Private note</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Dietary restrictions, arrival time, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add invitation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
