import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/app/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cinema Evenings",
    template: "%s - Cinema Evenings",
  },
  description:
    "Plan curated movie nights, send invitations, and track RSVPs all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
                <Link
                  href="/"
                  className="text-xs font-semibold uppercase tracking-[0.4em] text-primary hover:text-primary/80"
                >
                  Kino-Kirchner
                </Link>
                <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link href="/events" className="transition hover:text-primary">
                    Upcoming Events
                  </Link>
                  <Link href="/feature-request" className="transition hover:text-primary">
                    Request a Film
                  </Link>
                  <Link href="/admin" className="transition hover:text-primary">
                    Admin
                  </Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
