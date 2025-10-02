"use client";

import { format } from "date-fns";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type InvitationRow = {
  id: string;
  inviteeName: string | null;
  email: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "MAYBE";
  plusOnes: number;
  token: string;
  note: string | null;
  createdAt: string;
  rsvpAt: string | null;
};

type InvitationsTableProps = {
  invitations: InvitationRow[];
};

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = async (token: string) => {
    try {
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/rsvp/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      console.error("Unable to copy RSVP link", error);
    }
  };

  if (invitations.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        No invitations yet. Add guests using the form above.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Plus ones</TableHead>
          <TableHead>Invited</TableHead>
          <TableHead>RSVP link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invite) => (
          <TableRow key={invite.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{invite.inviteeName ?? "�"}</span>
                <span className="text-xs text-muted-foreground">{invite.email}</span>
                {invite.note ? (
                  <span className="mt-1 text-xs text-muted-foreground">Note: {invite.note}</span>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  invite.status === "ACCEPTED"
                    ? "default"
                    : invite.status === "DECLINED"
                      ? "destructive"
                      : invite.status === "MAYBE"
                        ? "outline"
                        : "secondary"
                }
              >
                {invite.status}
              </Badge>
            </TableCell>
            <TableCell>{invite.plusOnes}</TableCell>
            <TableCell>{format(new Date(invite.createdAt), "PP")}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-xs">{invite.token.slice(0, 8)}�</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(invite.token)}
                >
                  {copiedToken === invite.token ? "Copied" : "Copy link"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
