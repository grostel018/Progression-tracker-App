"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { AUTH_ACTION_INITIAL_STATE } from "@/features/auth/types";

import { submitResendVerification, submitVerifyEmail } from "../actions/public-access";
import { AuthSubmitButton } from "./auth-submit-button";

type Feedback = {
  title?: string;
  message: string;
  variant: "info" | "success" | "error";
};

export function VerifyEmailForm({ email, token, initialFeedback = null }: { email?: string; token?: string; initialFeedback?: Feedback | null }): JSX.Element {
  const [verifyState, verifyAction] = useFormState(submitVerifyEmail, AUTH_ACTION_INITIAL_STATE);
  const [resendState, resendAction] = useFormState(submitResendVerification, AUTH_ACTION_INITIAL_STATE);

  const activeToken = resendState.status === "success" ? undefined : token;

  const verifyMessage: Feedback | null = resendState.status === "success"
    ? null
    : verifyState.message
      ? {
          title: verifyState.status === "error" ? "Could not verify the account" : undefined,
          message: verifyState.message,
          variant: verifyState.status === "error" ? "error" : "success"
        }
      : initialFeedback;

  const resendMessage: Feedback | null = resendState.message
    ? {
        title: resendState.status === "error" ? "Could not resend verification" : undefined,
        message: resendState.message,
        variant: resendState.status === "error" ? "error" : "success"
      }
    : null;
  const verifyEmailErrorId = verifyState.fieldErrors?.email ? "verify-email-error" : undefined;
  const verifyCodeErrorId = verifyState.fieldErrors?.code ? "verify-code-error" : undefined;
  const resendEmailErrorId = resendState.fieldErrors?.email ? "verify-resend-email-error" : undefined;

  return (
    <div className="space-y-6">
      <form action={verifyAction} className="space-y-5">
        <input name="token" type="hidden" value={activeToken ?? ""} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="verify-email">
            Email
          </label>
          <Input
            aria-describedby={verifyEmailErrorId}
            aria-invalid={verifyState.fieldErrors?.email ? true : undefined}
            defaultValue={email ?? ""}
            id="verify-email"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
          {verifyState.fieldErrors?.email ? (
            <p className="text-sm text-danger" id={verifyEmailErrorId} role="alert">
              {verifyState.fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="verify-code">
            Verification code <span className="text-muted">(optional)</span>
          </label>
          <Input
            aria-describedby={verifyCodeErrorId}
            aria-invalid={verifyState.fieldErrors?.code ? true : undefined}
            autoComplete="one-time-code"
            id="verify-code"
            inputMode="numeric"
            maxLength={6}
            name="code"
            pattern="[0-9]{6}"
            placeholder="6-digit code"
            type="text"
          />
          {verifyState.fieldErrors?.code ? (
            <p className="text-sm text-danger" id={verifyCodeErrorId} role="alert">
              {verifyState.fieldErrors.code}
            </p>
          ) : null}
        </div>

        {activeToken ? <p className="text-xs leading-6 text-muted">This screen can use the verification link automatically while the token is still valid.</p> : null}

        {verifyMessage ? <Alert variant={verifyMessage.variant}>{verifyMessage.message}</Alert> : null}

        <div className="space-y-3">
          <AuthSubmitButton>Verify email</AuthSubmitButton>
          <Link className="text-sm text-muted underline decoration-primary/50 underline-offset-4 transition hover:text-foreground" href="/sign-in">
            Back to sign in
          </Link>
        </div>
      </form>

      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">Need a fresh verification link?</h3>
          <p className="text-sm leading-6 text-muted">Enter your email and we will prepare a new verification message right away.</p>
        </div>

        <form action={resendAction} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="verify-resend-email">
              Email for resend
            </label>
            <Input
              aria-describedby={resendEmailErrorId}
              aria-invalid={resendState.fieldErrors?.email ? true : undefined}
              defaultValue={email ?? ""}
              id="verify-resend-email"
              name="email"
              placeholder="you@example.com"
              type="email"
            />
            {resendState.fieldErrors?.email ? (
              <p className="text-sm text-danger" id={resendEmailErrorId} role="alert">
                {resendState.fieldErrors.email}
              </p>
            ) : null}
          </div>

          {resendMessage ? <Alert variant={resendMessage.variant}>{resendMessage.message}</Alert> : null}

          <AuthSubmitButton>Send a new verification link</AuthSubmitButton>
        </form>
      </div>
    </div>
  );
}
