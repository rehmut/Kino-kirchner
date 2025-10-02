import { RsvpLookupForm } from "./rsvp-lookup-form";

export default function RsvpIndexPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Have an invitation code?
        </h1>
        <p className="text-muted-foreground">
          Enter the RSVP code from your email invite to respond to the upcoming
          screening.
        </p>
      </div>
      <RsvpLookupForm />
    </div>
  );
}
