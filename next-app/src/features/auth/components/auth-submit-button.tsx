"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type AuthSubmitButtonProps = {
  children: string;
  variant?: "primary" | "secondary" | "subtle" | "ghost";
};

export function AuthSubmitButton({ children, variant = "primary" }: AuthSubmitButtonProps): JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} fullWidth type="submit" variant={variant}>
      {pending ? "Working..." : children}
    </Button>
  );
}
