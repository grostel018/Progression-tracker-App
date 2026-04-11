"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, RefreshCcw } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { localWorkspaceService, type LocalWorkspaceSummary, type LocalWorkspaceSurface } from "../storage";

type LocalWorkspaceCardProps = {
  surface: LocalWorkspaceSurface;
  title: string;
  description: string;
};

function formatDate(value?: string): string {
  if (!value) {
    return "Not recorded yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function LocalWorkspaceCard({ surface, title, description }: LocalWorkspaceCardProps): JSX.Element {
  const [summary, setSummary] = useState<LocalWorkspaceSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unsupported" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshSummary = useCallback(async (): Promise<void> => {
    try {
      setStatus("loading");
      setErrorMessage(null);

      const nextSummary = await localWorkspaceService.touchSurface(surface);
      setSummary(nextSummary);
      setStatus(nextSummary.isAvailable ? "ready" : "unsupported");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not refresh the local workspace state.");
    }
  }, [surface]);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  const currentSurfaceTimestamp = summary?.state?.surfaces[surface];

  return (
    <Card className="bg-background-elevated/80">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Badge variant={status === "ready" ? "success" : status === "error" ? "warning" : "muted"}>
            {status === "ready" ? "Device storage live" : status === "loading" ? "Checking storage" : status === "unsupported" ? "IndexedDB unavailable" : "Storage error"}
          </Badge>
          <Button className="shrink-0" onClick={() => void refreshSummary()} size="sm" type="button" variant="ghost">
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
        </div>
        <CardTitle className="flex items-center gap-2 text-2xl" level={2}>
          <Database className="size-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "loading" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="motion-safe:animate-pulse space-y-3 rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-3/4 rounded-full bg-white/10" />
            </div>
            <div className="motion-safe:animate-pulse space-y-3 rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="h-4 w-20 rounded-full bg-white/10" />
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-2/3 rounded-full bg-white/10" />
            </div>
          </div>
        ) : null}

        {status === "unsupported" ? (
          <Alert title="Local storage is not available on this device" variant="info">
            The app can still render, but real local persistence needs IndexedDB support in the browser environment.
          </Alert>
        ) : null}

        {status === "error" ? (
          <Alert title="Could not read the local workspace" variant="error">
            {errorMessage ?? "An unknown local persistence error occurred."}
          </Alert>
        ) : null}

        {status === "ready" && summary?.state ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Saved items</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{summary.keyCount}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Setup answers and planner data currently saved in this browser for the local workspace.</p>
            </div>
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Recent section</p>
              <p className="mt-2 text-base font-semibold capitalize text-foreground">{surface}</p>
              <p className="mt-2 text-sm leading-6 text-muted">Last active here at {formatDate(currentSurfaceTimestamp)}.</p>
            </div>
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Started on this device</p>
              <p className="mt-2 text-sm leading-6 text-muted">{formatDate(summary.state.initializedAt)}</p>
            </div>
            <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Last saved</p>
              <p className="mt-2 text-sm leading-6 text-muted">{formatDate(summary.state.lastAccessedAt)}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
