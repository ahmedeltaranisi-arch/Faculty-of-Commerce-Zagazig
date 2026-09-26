import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import argon2 from "argon2";
import { prisma } from "@/server/db/prisma";
import { requiresEmailVerification } from "@/server/auth/settings";

async function getAccess(userId: string) {
  const record = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
        },
      },
    },
  });

  if (!record) return { status: "SUSPENDED", permissions: [] as string[] };

  const permissions = record.roles.flatMap((entry) => [
    entry.role.name,
    ...entry.role.permissions.map((item) => item.permission.code),
  ]);

  return { status: record.status, permissions: [...new Set(permissions)] };
}

const oauthProviders = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      })
    : null,
  process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
    ? Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      })
    : null,
].filter((provider): provider is NonNullable<typeof provider> => provider !== null);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Credentials authentication always creates a JWT cookie in Auth.js. A
  // database session strategy would make that cookie unreadable on the next
  // request, which is why the dashboard appeared to log users out immediately.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "development-only-secret-change-me"),
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { normalizedEmail: email },
        });
        const canLogin =
          user?.status === "ACTIVE" ||
          (!requiresEmailVerification() &&
            user?.status === "PENDING_VERIFICATION");

        if (!user || !user.passwordHash || !canLogin) return null;

        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;

        // Email verification is opt-in until the mail provider is configured.
        // This also upgrades accounts created before that setting was changed.
        if (
          !requiresEmailVerification() &&
          user.status === "PENDING_VERIFICATION"
        ) {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE" },
          });
        }

        const access = await getAccess(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          status: access.status,
          permissions: access.permissions,
        };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    async signIn() {
      // Database updates for OAuth users belong in the signIn event below.
      // Auth.js invokes this callback before it creates a new OAuth user, so
      // updating Prisma here breaks first-time Google/Facebook sign-ins.
      return true;
    },
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      const access = await getAccess(userId);
      token.sub = userId;
      token.status = access.status;
      token.permissions = access.permissions;
      if (user?.name) token.name = user.name;
      if (user?.email) token.email = user.email;
      if (user?.image) token.picture = user.image;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const access = await getAccess(token.sub);
        session.user.id = token.sub;
        session.user.name = token.name ?? null;
        session.user.email = token.email ?? "";
        session.user.image =
          typeof token.picture === "string" ? token.picture : null;
        session.user.status = access.status;
        session.user.permissions = access.permissions;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials" || !user.id) return;

      // This runs after Auth.js has created/found the database user. Keeping it
      // here fixes first-time OAuth login and keeps the custom user status in
      // sync with the Auth.js email verification field.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "ACTIVE",
          emailVerified: new Date(),
          lastLoginAt: new Date(),
        },
      });
    },
  },
});
