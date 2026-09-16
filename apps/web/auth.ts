import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@ltp/db";
import { verifyPassword } from "./lib/password";

/**
 * Credentials-only auth (email + scrypt-hashed password). No OAuth
 * provider is wired up: doing so would need a real client ID/secret from
 * Google/GitHub/etc, and the project rule is never to fabricate external
 * API credentials. The provider list is designed to be extended later —
 * adding an OAuth provider here is additive, not a rewrite.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : null;
        const password = typeof credentials?.password === "string" ? credentials.password : null;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
