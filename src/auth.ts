import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import argon2 from "argon2";
import { prisma } from "@/server/db/prisma";

async function getAccess(userId: string) {
  const record = await prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
  if (!record) return { status: "SUSPENDED", permissions: [] as string[] };
  const permissions = record.roles.flatMap((entry) => [entry.role.name, ...entry.role.permissions.map((item) => item.permission.code)]);
  return { status: record.status, permissions: [...new Set(permissions)] };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? "development-only-secret-change-me",
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { normalizedEmail: email } });
        if (!user || !user.passwordHash || user.status !== "ACTIVE") return null;
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;
        const access = await getAccess(user.id);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, image: user.image, status: access.status, permissions: access.permissions };
      },
    }),
    Google({ clientId: process.env.AUTH_GOOGLE_ID ?? "", clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "" }),
    Facebook({ clientId: process.env.AUTH_FACEBOOK_ID ?? "", clientSecret: process.env.AUTH_FACEBOOK_SECRET ?? "" }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.id) {
        await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE", emailVerifiedAt: new Date(), lastLoginAt: new Date() } });
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        const access = await getAccess(user.id);
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.status = access.status;
        session.user.permissions = access.permissions;
      }
      return session;
    },
  },
});
