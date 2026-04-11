import crypto from "node:crypto";

import { prisma } from "@/lib/db";

export const AUTH_TOKEN_PURPOSES = {
  VERIFY_EMAIL: "verify-email",
  RESET_PASSWORD: "reset-password"
} as const;

export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSES)[keyof typeof AUTH_TOKEN_PURPOSES];

export type IssuedAuthToken = {
  rawToken: string;
  expiresAt: Date;
};

export function buildTokenIdentifier(purpose: AuthTokenPurpose, email: string): string {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

export function hashAuthToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRawToken(purpose: AuthTokenPurpose): string {
  if (purpose === AUTH_TOKEN_PURPOSES.VERIFY_EMAIL) {
    return crypto.randomInt(100000, 999999).toString();
  }

  return crypto.randomBytes(32).toString("hex");
}

export async function issueAuthToken(purpose: AuthTokenPurpose, email: string, expiresInMinutes: number): Promise<IssuedAuthToken> {
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = buildTokenIdentifier(purpose, normalizedEmail);
  const rawToken = generateRawToken(purpose);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier
    }
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashAuthToken(rawToken),
      expires: expiresAt
    }
  });

  return { rawToken, expiresAt };
}

export async function consumeAuthToken(purpose: AuthTokenPurpose, email: string, rawToken: string): Promise<boolean> {
  const identifier = buildTokenIdentifier(purpose, email);
  const token = hashAuthToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier,
        token
      }
    }
  });

  if (!record || record.expires < new Date()) {
    return false;
  }

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier,
        token
      }
    }
  });

  return true;
}

export async function clearAuthTokens(purpose: AuthTokenPurpose, email: string): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: buildTokenIdentifier(purpose, email)
    }
  });
}
