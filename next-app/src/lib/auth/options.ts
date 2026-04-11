import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { ROUTES } from "@/constants/app";
import { getAuthEnv, getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { USER_ROLES } from "@/lib/auth/roles";
import { buildCompositeRateLimitIdentifier, consumeRateLimit } from "@/lib/security/rate-limit";
import { ensureUserScaffolding, findUserByEmail, syncGoogleUserByEmail } from "@/features/auth/repository";

const authEnv = getAuthEnv();
const serverEnv = getServerEnv();

process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || authEnv.NEXTAUTH_URL || authEnv.APP_URL;

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials, request) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      const identifier = buildCompositeRateLimitIdentifier({
        headersLike: request.headers as Headers,
        values: [email],
        fallback: "credentials"
      });
      const rateLimit = await consumeRateLimit("sign-in", identifier);

      if (!rateLimit.success) {
        throw new Error("RATE_LIMITED");
      }

      if (!email || !password) {
        return null;
      }

      const user = await findUserByEmail(email);

      if (!user || !user.passwordHash || user.status !== "ACTIVE" || !user.emailVerified) {
        return null;
      }

      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        username: user.username,
        status: user.status
      };
    }
  })
];

if (serverEnv.GOOGLE_CLIENT_ID && serverEnv.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: authEnv.AUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: ROUTES.signIn,
    error: ROUTES.signIn
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as { email_verified?: boolean } | undefined;

        if (googleProfile?.email_verified !== true || !user.email) {
          return false;
        }

        await syncGoogleUserByEmail({
          email: user.email,
          name: user.name,
          image: user.image
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? USER_ROLES.USER;
        token.username = user.username ?? null;
      }

      if ((!token.role || !token.username) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: {
            email: token.email
          }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.username = dbUser.username;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = token.role ?? USER_ROLES.USER;
        session.user.username = token.username ?? null;
      }

      return session;
    }
  },
  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          role: USER_ROLES.USER,
          status: "ACTIVE",
          name: user.name ?? undefined,
          image: user.image ?? undefined
        }
      });

      await ensureUserScaffolding(user.id);
    }
  }
};

