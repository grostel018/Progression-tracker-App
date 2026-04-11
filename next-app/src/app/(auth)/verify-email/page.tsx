import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/app";
import { verifyEmailAddress } from "@/features/auth/service";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { buildCompositeRateLimitIdentifier, consumeAuthRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address to unlock account access."
};

type VerificationFeedback = {
  title?: string;
  message: string;
  variant: "error" | "success" | "info";
};

function normalizeVerificationToken(token?: string): string | undefined {
  if (!token) {
    return undefined;
  }

  const numericMatch = token.match(/\d{6,64}/);
  if (numericMatch?.[0]) {
    return numericMatch[0];
  }

  const trimmed = token.trim();
  return trimmed || undefined;
}

export default async function VerifyEmailPage({ searchParams }: { searchParams?: { email?: string; token?: string } }): Promise<JSX.Element> {
  const email = searchParams?.email;
  const token = normalizeVerificationToken(searchParams?.token);
  let feedback: VerificationFeedback | null = null;
  let formToken = token;

  if (email && token) {
    const identifier = buildCompositeRateLimitIdentifier({
      headersLike: headers(),
      values: [email],
      fallback: "verify-email-link"
    });
    const limiter = await consumeAuthRateLimit("verify-email", identifier);

    if (!limiter.success) {
      const retryInMinutes = Math.max(1, Math.ceil(limiter.retryAfterSeconds / 60));
      formToken = undefined;
      feedback = {
        variant: "error",
        title: "Too many verification attempts",
        message: `Try again in about ${retryInMinutes} minute${retryInMinutes === 1 ? "" : "s"}, or request a fresh verification email below.`
      };
    } else {
      try {
        await verifyEmailAddress({
          email,
          token,
          code: null
        });

        redirect(`${ROUTES.signIn}?status=verified&email=${encodeURIComponent(email)}`);
      } catch (error) {
        formToken = undefined;

        if (error instanceof Error && error.message === "INVALID_VERIFICATION_TOKEN") {
          feedback = {
            variant: "error",
            title: "That link expired",
            message: "Request a fresh verification email below."
          };
        } else {
          feedback = {
            variant: "error",
            title: "We could not use that link",
            message: "Try again or request a new verification email below."
          };
        }
      }
    }
  }

  return (
    <AuthShell
      asideBody="Use the verification link from the email, or paste the code manually if you have it."
      asideTitle="Verify email"
      description="The account stays locked until this step is complete. Once verified, sign-in should feel normal again."
      kicker="Verification"
      title="Verify the account and unlock the workspace."
    >
      <VerifyEmailForm email={email} token={formToken} initialFeedback={feedback} />
    </AuthShell>
  );
}
