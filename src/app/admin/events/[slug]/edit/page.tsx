import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { EventForm, buildInitialEventValues } from "../../new/create-event-form";

export default async function EditEventPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/sign-in");
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      featureRequests: { select: { id: true } },
      eventFilms: {
        orderBy: { slotOrder: "asc" },
        include: {
          film: {
            select: {
              id: true,
              title: true,
              letterboxdUrl: true,
              runtimeMinutes: true,
              posterImage: true,
              director: true,
              synopsis: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    redirect("/admin");
  }

  const featureRequests = await prisma.featureRequest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filmTitle: true,
      submitterName: true,
      submittedEmail: true,
      status: true,
    },
  });

  const initialValues = buildInitialEventValues(event);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Edit event</h1>
        <p className="text-sm text-muted-foreground">
          Update the line-up, description, or publish state. Changes go live immediately.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground/90">
            {event.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            mode="edit"
            eventSlug={event.slug}
            featureRequests={featureRequests}
            initialValues={initialValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
