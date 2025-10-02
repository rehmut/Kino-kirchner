import { prisma } from "@/lib/prisma";

import { FeatureRequestForm } from "./feature-request-form";

export default async function FeatureRequestPage() {
  const events = await prisma.event.findMany({
    where: { isArchived: false },
    orderBy: { scheduledAt: "asc" },
    select: {
      slug: true,
      title: true,
    },
  });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Request a film
        </h1>
        <p className="text-muted-foreground">
          Suggest a movie for an upcoming cinema evening, include the Letterboxd
          link, and share why it should make the line-up.
        </p>
      </div>
      <FeatureRequestForm events={events} />
    </div>
  );
}
