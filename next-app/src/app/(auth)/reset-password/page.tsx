import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password and get back into your workspace."
};

export default function ResetPasswordPage({ searchParams }: { searchParams?: { email?: string; token?: string } }): JSX.Element {
  return (
    <AuthShell
      asideBody="Open the reset link from your email, choose a new password, and return to sign in."
      asideTitle="Choose a new password"
      description="No branching, no confusion. If the link is valid, you set a new password and continue."
      kicker="Reset"
      title="Set a new password and keep moving."
    >
      <ResetPasswordForm email={searchParams?.email} token={searchParams?.token} />
    </AuthShell>
  );
}
