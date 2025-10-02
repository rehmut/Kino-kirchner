"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RsvpLookupForm() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token.trim()) return;
    router.push(`/rsvp/${token.trim()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm"
    >
      <Input
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Enter your invite code"
        required
      />
      <Button type="submit">Find invite</Button>
    </form>
  );
}
