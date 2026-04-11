import { getServerEnv } from "@/lib/env";
import { buildResetMessage, buildVerificationMessage, sendMail, type DeliveryResult } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { AUTH_TOKEN_PURPOSES, clearAuthTokens, consumeAuthToken, issueAuthToken } from "@/lib/auth/tokens";

import { createCredentialUser, ensureUserScaffolding, findUserByEmail, findUserByUsername, markUserEmailVerified, updateUserPassword } from "./repository";

export type ServiceResult = {
  delivery?: DeliveryResult;
  recoveryMode?: "reset-password" | "create-password";
  alreadyVerified?: boolean;
};

function normalizeVerificationSecret(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const numericMatch = value.match(/\d{6,64}/);
  if (numericMatch?.[0]) {
    return numericMatch[0];
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export async function registerCredentialUser(input: { email: string; username?: string | null; password: string }): Promise<ServiceResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedUsername = input.username?.trim() || null;

  const existingEmail = await findUserByEmail(normalizedEmail);
  if (existingEmail) {
    throw new Error("EMAIL_IN_USE");
  }

  if (normalizedUsername) {
    const existingUsername = await findUserByUsername(normalizedUsername);
    if (existingUsername) {
      throw new Error("USERNAME_IN_USE");
    }
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createCredentialUser({
    email: normalizedEmail,
    username: normalizedUsername,
    passwordHash
  });

  await ensureUserScaffolding(user.id);

  const { rawToken } = await issueAuthToken(AUTH_TOKEN_PURPOSES.VERIFY_EMAIL, normalizedEmail, 60);
  const delivery = await sendMail(buildVerificationMessage(normalizedEmail, rawToken, getServerEnv().APP_URL ?? "http://localhost:3000"));

  return {
    delivery
  };
}

export async function requestPasswordReset(email: string): Promise<ServiceResult | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return null;
  }

  const isGoogleOnlyAccount = !user.passwordHash && user.accounts.some((account) => account.provider === "google");
  const recoveryMode: ServiceResult["recoveryMode"] = isGoogleOnlyAccount ? "create-password" : "reset-password";

  const { rawToken } = await issueAuthToken(AUTH_TOKEN_PURPOSES.RESET_PASSWORD, normalizedEmail, 30);
  const delivery = await sendMail(buildResetMessage(normalizedEmail, rawToken, getServerEnv().APP_URL ?? "http://localhost:3000", recoveryMode));

  return {
    delivery,
    recoveryMode
  };
}

export async function resetPasswordWithToken(input: { email: string; token: string; password: string }): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("INVALID_RESET_TOKEN");
  }

  const isValid = await consumeAuthToken(AUTH_TOKEN_PURPOSES.RESET_PASSWORD, normalizedEmail, input.token);

  if (!isValid) {
    throw new Error("INVALID_RESET_TOKEN");
  }

  const passwordHash = await hashPassword(input.password);
  await updateUserPassword(user.id, passwordHash);
  await clearAuthTokens(AUTH_TOKEN_PURPOSES.RESET_PASSWORD, normalizedEmail);
}

export async function verifyEmailAddress(input: { email: string; token?: string | null; code?: string | null }): Promise<ServiceResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("EMAIL_NOT_FOUND");
  }

  if (user.emailVerified) {
    return { alreadyVerified: true };
  }

  const providedToken = normalizeVerificationSecret(input.token) || normalizeVerificationSecret(input.code) || null;

  if (!providedToken) {
    const { rawToken } = await issueAuthToken(AUTH_TOKEN_PURPOSES.VERIFY_EMAIL, normalizedEmail, 60);
    const delivery = await sendMail(buildVerificationMessage(normalizedEmail, rawToken, getServerEnv().APP_URL ?? "http://localhost:3000"));
    return { delivery };
  }

  const isValid = await consumeAuthToken(AUTH_TOKEN_PURPOSES.VERIFY_EMAIL, normalizedEmail, providedToken);

  if (!isValid) {
    throw new Error("INVALID_VERIFICATION_TOKEN");
  }

  await markUserEmailVerified(user.id);
  await clearAuthTokens(AUTH_TOKEN_PURPOSES.VERIFY_EMAIL, normalizedEmail);

  return {};
}
