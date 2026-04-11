"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { prepareForCloudSignOut } from "@/lib/auth/access-mode-client";

type SignOutButtonProps = {
  callbackUrl?: string;
};

export function SignOutButton({ callbackUrl = "/" }: SignOutButtonProps): JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            void (async () => {
              setError(null);

              try {
                await prepareForCloudSignOut();
                await signOut({ callbackUrl });
              } catch {
                setError("Could not complete sign out right now. Try again.");
              }
            })();
          });
        }}
        type="button"
        variant="secondary"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? <Alert variant="error">{error}</Alert> : null}
    </div>
  );
}
