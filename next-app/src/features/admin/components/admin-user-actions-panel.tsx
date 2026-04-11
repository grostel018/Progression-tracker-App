"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  grantTesterAction,
  resendVerificationAction,
  restoreUserAction,
  revokeTesterAction,
  sendPasswordResetAdminAction,
  suspendUserAction,
  type AdminActionState
} from "../actions";

export function AdminUserActionsPanel(props: {
  userId: string;
  role: "USER" | "TESTER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  hasPasswordAuth: boolean;
}): JSX.Element {
  const [state, setState] = useState<AdminActionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  function runAction(fn: (userId: string) => Promise<AdminActionState>): void {
    startTransition(() => {
      void (async () => {
        const nextState = await fn(props.userId);
        setState(nextState);
      })();
    });
  }

  return (
    <div className="space-y-4">
      {state.message ? <Alert variant={state.status === "error" ? "error" : "success"}>{state.message}</Alert> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {props.status === "SUSPENDED" ? (
          <Button disabled={isPending} onClick={() => runAction(restoreUserAction)} type="button">Restore user</Button>
        ) : (
          <Button disabled={isPending} onClick={() => runAction(suspendUserAction)} type="button" variant="secondary">Suspend user</Button>
        )}
        {props.role === "TESTER" ? (
          <Button disabled={isPending} onClick={() => runAction(revokeTesterAction)} type="button" variant="secondary">Remove tester role</Button>
        ) : props.role !== "ADMIN" ? (
          <Button disabled={isPending} onClick={() => runAction(grantTesterAction)} type="button">Grant tester role</Button>
        ) : null}
        <Button disabled={isPending} onClick={() => runAction(resendVerificationAction)} type="button" variant="ghost">Resend verification</Button>
        {props.hasPasswordAuth ? <Button disabled={isPending} onClick={() => runAction(sendPasswordResetAdminAction)} type="button" variant="ghost">Send password reset</Button> : null}
      </div>
    </div>
  );
}
