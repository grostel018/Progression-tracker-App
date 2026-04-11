import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Recover access to your Progression Tracker account."
};

export default function ForgotPasswordPage(): JSX.Element {
  return (
    <AuthShell
      asideBody="Enter the account email and we will send the safest next step for that account."
      asideTitle="Recover access"
      description="Whether the account started with a password or Google, this flow should help you move forward without guessing."
      kicker="Recovery"
      title="Recover access with less friction."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
