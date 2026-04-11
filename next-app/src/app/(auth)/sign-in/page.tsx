import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to continue into your cloud workspace."
};

function mapSignInFeedback(error?: string): { title: string; message: string; variant: "error" | "success" | "info" } | null {
  switch (error) {
    case "OAuthAccountNotLinked":
      return {
        variant: "error",
        title: "Use your original sign-in method",
        message: "That email is already linked to another sign-in method. Use that one first."
      };
    case "AccessDenied":
      return {
        variant: "error",
        title: "Google sign-in was denied",
        message: "The Google account could not be verified, or access was cancelled."
      };
    case "Configuration":
    case "google":
      return {
        variant: "error",
        title: "Google sign-in is unavailable",
        message: "Check the local app URL, Google redirect URI, and OAuth test-user settings."
      };
    case "reset-success":
      return {
        variant: "success",
        title: "Password updated",
        message: "You can sign in with the new password now."
      };
    case "verified":
      return {
        variant: "success",
        title: "Email verified",
        message: "Your account is ready to sign in. Use the same email address that was just verified."
      };
    default:
      return null;
  }
}

export default async function SignInPage({ searchParams }: { searchParams?: { email?: string; error?: string; status?: string } }): Promise<JSX.Element> {
  const feedback = mapSignInFeedback(searchParams?.error ?? searchParams?.status);
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const initialEmail = typeof searchParams?.email === "string" ? searchParams.email : undefined;

  return (
    <AuthShell
      asideBody="Use your email and password to enter the cloud workspace. Google appears only when it is fully configured."
      asideTitle="Sign in"
      description="Keep it simple: one clear form, visible recovery paths, and a local-mode fallback if you want to explore first."
      kicker="Cloud access"
      title="Sign in and get back into your rhythm."
    >
      <SignInForm googleEnabled={googleEnabled} initialEmail={initialEmail} initialFeedback={feedback} />
    </AuthShell>
  );
}
