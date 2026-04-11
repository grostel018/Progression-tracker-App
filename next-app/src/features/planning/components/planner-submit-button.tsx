"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type PlannerSubmitButtonProps = {
  children: string;
  pending?: boolean;
  pendingLabel?: string;
};

export function PlannerSubmitButton({ children, pending, pendingLabel = "Saving..." }: PlannerSubmitButtonProps): JSX.Element {
  const { pending: formPending } = useFormStatus();
  const isPending = pending ?? formPending;

  return (
    <Button disabled={isPending} fullWidth type="submit">
      {isPending ? pendingLabel : children}
    </Button>
  );
}
