import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a cloud account for Progression Tracker."
};

export default async function SignUpPage(): Promise<JSX.Element> {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <AuthShell
      asideBody="Create an email/password account first. If Google is configured correctly, it appears as an optional shortcut."
      asideTitle="Create account"
      description="This step should feel calm and direct: one form, one next step, and an easy verification flow afterward."
      kicker="Account setup"
      title="Create the account, then unlock the workspace."
    >
      <SignUpForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
