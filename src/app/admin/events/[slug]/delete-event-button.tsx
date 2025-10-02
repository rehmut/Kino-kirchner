"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

type DeleteEventButtonProps = {
  slug: string;
};

export function DeleteEventButton({ slug }: DeleteEventButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    setError(null);
    const confirmed = window.confirm(
      "Delete this event? This will hide it from guests and remove its line-up.",
    );
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/events/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body?.error ?? "Unable to delete event. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="destructive" onClick={onDelete} disabled={isPending}>
        {isPending ? "Deleting..." : "Delete event"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
