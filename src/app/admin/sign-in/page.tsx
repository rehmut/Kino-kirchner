import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

import { AdminSignInForm } from "./sign-in-form";

export default async function AdminSignInPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Admin sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminSignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
