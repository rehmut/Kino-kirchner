import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { EventForm } from "./create-event-form";

export default async function CreateEventPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/sign-in");
  }

  const featureRequests = await prisma.featureRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filmTitle: true,
      submitterName: true,
      submittedEmail: true,
      status: true,
    },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Create event</h1>
        <p className="text-sm text-muted-foreground">
          Plan the next cinema evening with title, timing, and optional feature
          request links.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm featureRequests={featureRequests} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
