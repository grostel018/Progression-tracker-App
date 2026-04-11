"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { AUTH_ACTION_INITIAL_STATE } from "@/features/auth/types";

import { submitForgotPassword } from "../actions/public-access";
import { AuthSubmitButton } from "./auth-submit-button";

export function ForgotPasswordForm(): JSX.Element {
  const [state, formAction] = useFormState(submitForgotPassword, AUTH_ACTION_INITIAL_STATE);
  const emailErrorId = state.fieldErrors?.email ? "forgot-email-error" : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="forgot-email">
          Email
        </label>
        <Input
          aria-describedby={emailErrorId}
          aria-invalid={state.fieldErrors?.email ? true : undefined}
          autoComplete="email"
          id="forgot-email"
          name="email"
          placeholder="you@example.com"
          type="email"
        />
        {state.fieldErrors?.email ? (
          <p className="text-sm text-danger" id={emailErrorId} role="alert">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <Alert variant="info">
        If this account started with Google, we can still send a secure link that lets you create a password for email sign-in.
      </Alert>

      {state.message ? (
        <Alert title={state.status === "error" ? "Could not prepare recovery" : "Check your email"} variant={state.status === "error" ? "error" : "success"}>
          {state.message}
        </Alert>
      ) : null}

      <div className="space-y-3">
        <AuthSubmitButton>Continue recovery</AuthSubmitButton>
        <Link className="text-sm text-muted underline decoration-primary/50 underline-offset-4 transition hover:text-foreground" href="/sign-in">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
