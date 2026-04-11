"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/app";
import { prepareForCloudSignIn } from "@/lib/auth/access-mode-client";

import { startLocalMode } from "../actions/public-access";
import { signInSchema } from "../validators";
import { PasswordField } from "./password-field";

type Feedback = {
  title?: string;
  message: string;
  variant: "info" | "success" | "error";
};

type SignInFormProps = {
  googleEnabled: boolean;
  initialEmail?: string;
  initialFeedback?: Feedback | null;
};

export function SignInForm({ googleEnabled, initialEmail, initialFeedback = null }: SignInFormProps): JSX.Element {
  const searchParams = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo = requestedReturnTo?.startsWith("/") ? requestedReturnTo : ROUTES.dashboard;

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const emailErrorId = fieldErrors.email ? "signin-email-error" : undefined;

  async function handleCredentialsSubmit(formData: FormData): Promise<void> {
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password")
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      setFieldErrors(
        Object.fromEntries(
          Object.entries(flattened)
            .map(([key, value]) => [key, value?.[0]])
            .filter((entry): entry is [string, string] => Boolean(entry[1]))
        )
      );
      setFeedback({
        variant: "error",
        title: "Check your details",
        message: "Use a valid email and password to continue."
      });
      return;
    }

    setFieldErrors({});
    setFeedback(null);

    try {
      await prepareForCloudSignIn();
    } catch {
      setFeedback({
        variant: "error",
        title: "Could not start cloud sign-in",
        message: "Try again in a moment."
      });
      return;
    }

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl: returnTo
    });

    if (!result || result.error) {
      const isRateLimited = result?.error?.includes("RATE_LIMITED");

      setFeedback({
        variant: "error",
        title: isRateLimited ? "Too many attempts" : "Could not sign in",
        message: isRateLimited
          ? "Too many sign-in attempts came from this connection. Give it a few minutes, then try again."
          : "Those details did not match an existing verified account. Make sure you are using the exact email address you created and verified."
      });
      return;
    }

    window.location.assign(result.url ?? returnTo);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void handleCredentialsSubmit(formData);
    });
  }

  function handleGoogleSignIn(): void {
    if (!googleEnabled) {
      return;
    }

    setFeedback(null);
    startGoogleTransition(() => {
      void (async () => {
        try {
          await prepareForCloudSignIn();
        } catch {
          setFeedback({
            variant: "error",
            title: "Could not start cloud sign-in",
            message: "Try again in a moment."
          });
          return;
        }

        await signIn("google", { callbackUrl: returnTo });
      })();
    });
  }

  return (
    <div className="space-y-7">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-foreground" htmlFor="signin-email">
            Email
          </label>
          <Input
            aria-describedby={emailErrorId}
            aria-invalid={fieldErrors.email ? true : undefined}
            autoComplete="email"
            defaultValue={initialEmail}
            id="signin-email"
            name="email"
            placeholder="you@example.com"
            type="email"
            className="h-12"
          />
          {fieldErrors.email ? (
            <p className="text-sm text-danger" id={emailErrorId} role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-foreground" htmlFor="signin-password">
              Password
            </label>
            <Link className="text-sm text-muted underline decoration-primary/50 underline-offset-4 transition-all duration-300 hover:text-foreground hover:underline-offset-6" href={ROUTES.forgotPassword}>
              Forgot password?
            </Link>
          </div>
          <PasswordField
            autoComplete="current-password"
            error={fieldErrors.password}
            id="signin-password"
            label=""
            name="password"
            placeholder="Enter your password"
          />
        </div>

        {feedback ? (
          <div className="rounded-[1.2rem] bg-background-elevated/60 p-4 shadow-sm">
            <Alert title={feedback.title} variant={feedback.variant}>
              {feedback.message}
            </Alert>
          </div>
        ) : null}

        <Button disabled={isPending} fullWidth size="lg" type="submit" className="min-h-12 text-base">
          {isPending ? "Signing in..." : "Sign in"}
          {!isPending ? <ArrowRight className="size-4" /> : null}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <span>New here?</span>
          <Link className="text-foreground font-medium underline decoration-primary/50 underline-offset-4 transition-all duration-300 hover:text-primary hover:underline hover:underline-offset-6" href={ROUTES.signUp}>
            Create an account
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
        </div>
      ) : null}

      <div className="rounded-[1.6rem] border border-border-subtle bg-background-elevated/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-3.5 text-primary" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Need a no-account preview first?</p>
            <p className="text-sm leading-relaxed text-muted">You can open the protected shell in local mode and keep the setup on this device.</p>
            <form action={startLocalMode} className="mt-3">
              <Button fullWidth type="submit" variant="subtle">
                Continue in local mode
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
