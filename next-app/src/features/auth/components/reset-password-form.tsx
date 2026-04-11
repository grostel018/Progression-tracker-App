"use client";

import Link from "next/link";
import { useFormState } from "react-dom";

import { Alert } from "@/components/ui/alert";
import { AUTH_ACTION_INITIAL_STATE } from "@/features/auth/types";

import { submitResetPassword } from "../actions/public-access";
import { AuthSubmitButton } from "./auth-submit-button";
import { PasswordField } from "./password-field";

export function ResetPasswordForm({ email, token }: { email?: string; token?: string }): JSX.Element {
  const [state, formAction] = useFormState(submitResetPassword, AUTH_ACTION_INITIAL_STATE);
  const hasToken = Boolean(email && token);

  return (
    <form action={formAction} className="space-y-5">
      <input name="email" type="hidden" value={email ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />

      <PasswordField
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        helperText="Use something strong and easy for you to confirm before saving it."
        id="reset-password"
        label="New password"
        name="password"
        placeholder="At least 10 characters"
      />

      <PasswordField
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
        id="reset-password-confirm"
        label="Confirm password"
        name="confirmPassword"
        placeholder="Repeat your password"
      />

      {!hasToken ? (
        <Alert title="Reset link needed" variant="error">
          Open the password-reset link from your email, or request a new one.
        </Alert>
      ) : null}

      {state.message ? (
        <Alert title={state.status === "error" ? "Could not reset password" : "Password updated"} variant={state.status === "error" ? "error" : "success"}>
          {state.message}
        </Alert>
      ) : null}

      <div className="space-y-3">
        <AuthSubmitButton>Save new password</AuthSubmitButton>
        <Link className="text-sm text-muted underline decoration-primary/50 underline-offset-4 transition hover:text-foreground" href="/sign-in">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
