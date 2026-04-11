"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { ROUTES } from "@/constants/app";
import { ACCESS_MODE_COOKIE, ACCESS_MODES } from "@/lib/auth/cookies";
import { buildCompositeRateLimitIdentifier, consumeAuthRateLimit } from "@/lib/security/rate-limit";

import { AUTH_ACTION_INITIAL_STATE, type AuthActionState } from "../types";
import { requestPasswordReset, resetPasswordWithToken, registerCredentialUser, verifyEmailAddress } from "../service";
import { forgotPasswordSchema, resetPasswordSchema, signUpSchema, verifyEmailSchema } from "../validators";

function flattenFieldErrors(error: ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function withPreviewHint(message: string, previewPath?: string): string {
  if (!previewPath) {
    return message;
  }

  return `${message} Development preview saved to: ${previewPath}`;
}

function rateLimitedMessage(actionLabel: string, retryAfterSeconds: number): AuthActionState {
  const retryInMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return {
    status: "error",
    message: `Too many ${actionLabel} attempts right now. Try again in about ${retryInMinutes} minute${retryInMinutes === 1 ? "" : "s"}.`
  };
}

export async function startLocalMode(): Promise<never> {
  cookies().set(ACCESS_MODE_COOKIE, ACCESS_MODES.LOCAL, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production"
  });

  redirect(`${ROUTES.onboarding}?mode=local`);
}

export async function leaveLocalMode(): Promise<never> {
  cookies().delete(ACCESS_MODE_COOKIE);
  redirect(ROUTES.marketing);
}

export async function submitSignUp(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const limiter = await consumeAuthRateLimit("sign-up");

  if (!limiter.success) {
    return rateLimitedMessage("sign up", limiter.retryAfterSeconds);
  }

  try {
    const values = signUpSchema.parse({
      email: formData.get("email"),
      username: formData.get("username") || undefined,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword")
    });

    const result = await registerCredentialUser({
      email: values.email,
      username: values.username,
      password: values.password
    });

    return {
      status: "success",
      message: withPreviewHint(
        "Your account was created. Verify your email before signing in to the cloud workspace.",
        result.delivery?.previewPath
      )
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    if (error instanceof Error) {
      if (error.message === "EMAIL_IN_USE") {
        return {
          status: "error",
          message: "An account already exists for that email. Try signing in or resetting the password."
        };
      }

      if (error.message === "USERNAME_IN_USE") {
        return {
          status: "error",
          message: "That username is already taken. Choose another one or leave it empty for now."
        };
      }
    }

    return {
      status: "error",
      message: "Something went wrong while creating the account."
    };
  }
}

export async function submitForgotPassword(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const limiter = await consumeAuthRateLimit("forgot-password");

  if (!limiter.success) {
    return rateLimitedMessage("password reset", limiter.retryAfterSeconds);
  }

  try {
    const values = forgotPasswordSchema.parse({
      email: formData.get("email")
    });

    const result = await requestPasswordReset(values.email);

    return {
      status: "success",
      message: withPreviewHint(
        "If that email exists, we prepared the right recovery link. Google-first accounts receive a secure link that can create a password too.",
        result?.delivery?.previewPath
      )
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Enter a valid email address to continue.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    return {
      status: "error",
      message: "Something went wrong while preparing the recovery flow."
    };
  }
}

export async function submitResetPassword(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const email = formData.get("email");
    const token = formData.get("token");

    const values = resetPasswordSchema.parse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword")
    });

    if (typeof email !== "string" || typeof token !== "string" || !email || !token) {
      return {
        status: "error",
        message: "This reset link is incomplete. Request a new one and try again."
      };
    }

    await resetPasswordWithToken({
      email,
      token,
      password: values.password
    });

    return {
      status: "success",
      message: "Your password has been updated. You can sign in with the new password now."
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Check the highlighted fields and try again.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
      return {
        status: "error",
        message: "This reset link is invalid or expired. Request a fresh one and try again."
      };
    }

    return {
      status: "error",
      message: "Something went wrong while resetting the password."
    };
  }
}

export async function submitVerifyEmail(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const values = verifyEmailSchema.parse({
      email: formData.get("email"),
      code: formData.get("code") || undefined
    });
    const identifier = buildCompositeRateLimitIdentifier({
      headersLike: headers(),
      values: [values.email],
      fallback: "verify-email"
    });
    const limiter = await consumeAuthRateLimit("verify-email", identifier);

    if (!limiter.success) {
      return rateLimitedMessage("verification", limiter.retryAfterSeconds);
    }

    const tokenField = formData.get("token");
    const token = typeof tokenField === "string" && tokenField ? tokenField : null;

    const result = await verifyEmailAddress({
      email: values.email,
      token,
      code: values.code ?? null
    });

    if (result.alreadyVerified) {
      return {
        status: "success",
        message: "That email is already verified. You can sign in now."
      };
    }

    if (!token && !values.code) {
      return {
        status: "success",
        message: withPreviewHint("A verification link has been prepared for that email.", result.delivery?.previewPath)
      };
    }

    return {
      status: "success",
      message: "Your email has been verified. You can sign in to the cloud workspace now."
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Enter the email and optional code in the expected format.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    if (error instanceof Error && error.message === "INVALID_VERIFICATION_TOKEN") {
      return {
        status: "error",
        message: "That verification link or code is invalid. Request a fresh verification email and try again."
      };
    }

    return {
      status: "error",
      message: "Something went wrong while verifying the email."
    };
  }
}

export async function submitResendVerification(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const limiter = await consumeAuthRateLimit("resend-verification");

  if (!limiter.success) {
    return rateLimitedMessage("verification resend", limiter.retryAfterSeconds);
  }

  try {
    const values = verifyEmailSchema.parse({
      email: formData.get("email"),
      code: undefined
    });

    const result = await verifyEmailAddress({
      email: values.email,
      token: null,
      code: null
    });

    if (result.alreadyVerified) {
      return {
        status: "success",
        message: "This email is already verified. You can sign in now."
      };
    }

    return {
      status: "success",
      message: withPreviewHint("A fresh verification link has been prepared for that email.", result.delivery?.previewPath)
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Enter a valid email address to resend verification.",
        fieldErrors: flattenFieldErrors(error)
      };
    }

    return {
      status: "error",
      message: "We could not resend the verification email right now."
    };
  }
}
