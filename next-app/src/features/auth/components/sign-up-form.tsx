"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useFormState } from "react-dom";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/app";
import { AUTH_ACTION_INITIAL_STATE } from "@/features/auth/types";

import { submitSignUp } from "../actions/public-access";
import { PasswordField } from "./password-field";

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }): JSX.Element {
  const [state, formAction] = useFormState(submitSignUp, AUTH_ACTION_INITIAL_STATE);
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const emailErrorId = state.fieldErrors?.email ? "signup-email-error" : undefined;
  const usernameErrorId = state.fieldErrors?.username ? "signup-username-error" : undefined;
  const passwordGroupHelpId = "signup-password-group-help";

  function handleGoogleSignIn(): void {
    if (!googleEnabled) {
      return;
    }

    setGoogleError(null);
    startGoogleTransition(() => {
      void signIn("google", { callbackUrl: ROUTES.dashboard });
    });
  }

  return (
    <div className="space-y-7">
      <form action={formAction} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
              Email
            </label>
            <Input
              aria-describedby={emailErrorId}
              aria-invalid={state.fieldErrors?.email ? true : undefined}
              autoComplete="email"
              id="signup-email"
              name="email"
              placeholder="you@example.com"
              type="email"
              className="h-12"
            />
            {state.fieldErrors?.email ? (
              <p className="text-sm text-danger" id={emailErrorId} role="alert">
                {state.fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor="signup-username">
              Username <span className="text-muted/70">(optional)</span>
            </label>
            <Input
              aria-describedby={usernameErrorId}
              aria-invalid={state.fieldErrors?.username ? true : undefined}
              id="signup-username"
              name="username"
              placeholder="discipline-builder"
              type="text"
              className="h-12"
            />
            {state.fieldErrors?.username ? (
              <p className="text-sm text-danger" id={usernameErrorId} role="alert">
                {state.fieldErrors.username}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-border-subtle bg-background-elevated/80 p-5 shadow-sm">
          <legend className="text-sm font-medium text-foreground mb-4">Password</legend>
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted" id={passwordGroupHelpId}>
              Use at least 10 characters. Reveal it if you want to catch typos before submitting.
            </p>

            <div className="space-y-4">
              <PasswordField
                aria-describedby={passwordGroupHelpId}
                autoComplete="new-password"
                error={state.fieldErrors?.password}
                id="signup-password"
                label="Create password"
                name="password"
                placeholder="Create a strong password"
              />

              <PasswordField
                aria-describedby={passwordGroupHelpId}
                autoComplete="new-password"
                error={state.fieldErrors?.confirmPassword}
                id="signup-confirm-password"
                label="Confirm password"
                name="confirmPassword"
                placeholder="Type the same password again"
              />
            </div>
          </div>
        </div>

        {state.message ? (
          <div className="rounded-[1.2rem] bg-background-elevated/60 p-4 shadow-sm">
            <Alert title={state.status === "error" ? "Could not create the account" : "Account created"} variant={state.status === "error" ? "error" : "success"}>
              {state.message}
            </Alert>
          </div>
        ) : null}

        <Button fullWidth size="lg" type="submit" className="min-h-12 text-base">
          Create account
          <ArrowRight className="size-4" />
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <span>Already have an account?</span>
          <Link className="text-foreground font-medium underline decoration-primary/50 underline-offset-4 transition-all duration-300 hover:text-primary hover:underline hover:underline-offset-6" href={ROUTES.signIn}>
            Sign in
          </Link>
        </div>
      </form>

      {googleEnabled ? (
        <div className="relative space-y-3 border-t border-border-subtle pt-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-subtle" />
          </div>
          <div className="relative flex items-center justify-center gap-3 text-sm text-muted">
            <span className="bg-background px-3 py-1">Or continue with</span>
          </div>
          <Button disabled={isGooglePending} fullWidth onClick={handleGoogleSignIn} type="button" variant="secondary" className="mt-4">
            {isGooglePending ? "Opening Google..." : "Continue with Google"}
          </Button>
          {googleError ? <Alert variant="error">{googleError}</Alert> : null}
        </div>
      ) : null}
    </div>
  );
}
