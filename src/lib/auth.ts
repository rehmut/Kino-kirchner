import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

type UserWithRole = User & { role: string };

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (!adminEmail || !adminPassword) {
          console.warn("ADMIN_EMAIL or ADMIN_PASSWORD env vars not set");
          return null;
        }

        if (
          credentials.email.toLowerCase() === adminEmail.toLowerCase() &&
          credentials.password === adminPassword
        ) {
          const userRecord = await prisma.user.upsert({
            where: { email: adminEmail },
            create: {
              email: adminEmail,
              role: "ADMIN",
            },
            update: {},
          });

          const adminUser: UserWithRole = {
            id: userRecord.id,
            email: userRecord.email ?? adminEmail,
            name: userRecord.name ?? "Host",
            role: userRecord.role,
          };

          return adminUser;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = typeof token.role === "string" ? token.role : session.user.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user && typeof (user as Partial<UserWithRole>).role === "string") {
        token.role = (user as UserWithRole).role;
      }
      return token;
    },
    async signIn({ user }) {
      if (!user?.id) {
        return false;
      }
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      return dbUser?.role === "ADMIN";
    },
  },
  pages: {
    signIn: "/admin/sign-in",
  },
};
