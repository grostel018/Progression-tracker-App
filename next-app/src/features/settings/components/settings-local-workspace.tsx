"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Database, DoorOpen, LockKeyhole, MoonStar, UserPlus } from "lucide-react";

import { leaveLocalMode } from "@/features/auth/actions/public-access";
import { saveThemePreferenceAction } from "@/features/settings/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/app";
import type { ThemePreference } from "@/lib/theme";

import { readLocalMigrationSnapshot } from "../local-data";
import type { LocalMigrationSnapshot, ThemeActionState } from "../types";

function applyTheme(preference: ThemePreference, appliedTheme: "dark" | "light"): void {
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = appliedTheme;
  document.documentElement.style.colorScheme = appliedTheme;
}

export function SettingsLocalWorkspace(): JSX.Element {
  const [snapshot, setSnapshot] = useState<LocalMigrationSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unsupported" | "error">("loading");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [themeState, setThemeState] = useState<ThemeActionState>({ status: "idle", preference: "system", appliedTheme: "dark" });
  const [isSavingTheme, startThemeTransition] = useTransition();

  useEffect(() => {
    void (async () => {
      try {
        const nextSnapshot = await readLocalMigrationSnapshot();
        setSnapshot(nextSnapshot);
        setStatus(nextSnapshot.supported ? "ready" : "unsupported");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  function handleThemeSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    startThemeTransition(() => {
      void (async () => {
        const nextState = await saveThemePreferenceAction({ preference: themePreference });
        setThemeState(nextState);
        if (nextState.status === "success" && nextState.preference && nextState.appliedTheme) {
          applyTheme(nextState.preference, nextState.appliedTheme);
        }
      })();
    });
  }

  return (
    <main className="section-shell space-y-8 py-8 sm:py-10" id="main-content">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="success">Settings</Badge>
            <CardTitle className="text-3xl" level={1}>
              Local workspace settings live here now.
            </CardTitle>
            <CardDescription>
              This page keeps the device-first path honest: you can see whether this browser has saved data, persist your theme, exit local mode cleanly, or move into a cloud account when you are ready.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary/16 bg-primary/8">
          <CardHeader>
            <Badge variant="muted">Mode</Badge>
            <CardTitle className="text-2xl" level={2}>Local workspace</CardTitle>
            <CardDescription>
              Profile images, cloud reminders, and account-linked identity edits unlock after you sign in, but local browser data stays here until then.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-background-elevated/80 lg:col-span-2">
          <CardHeader>
            <Badge variant="muted">Browser data</Badge>
            <CardTitle className="flex items-center gap-2 text-2xl" level={2}>
              <Database className="size-5 text-primary" />
              Local browser snapshot
            </CardTitle>
            <CardDescription>Settings reads the same local IndexedDB workspace that powers onboarding, planner, and weekly review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "loading" ? <Alert variant="info">Checking this browser for local workspace data.</Alert> : null}
            {status === "unsupported" ? <Alert variant="info">This browser cannot use IndexedDB, so local persistence is unavailable here.</Alert> : null}
            {status === "error" ? <Alert variant="error">We could not read local browser data right now.</Alert> : null}
            {status === "ready" && snapshot ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.45rem] border surface-subtle p-4">
                  <p className="eyebrow">Stored keys</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.keyCount}</p>
                </div>
                <div className="rounded-[1.45rem] border surface-subtle p-4">
                  <p className="eyebrow">Setup steps</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.counts.onboardingSteps}</p>
                </div>
                <div className="rounded-[1.45rem] border surface-subtle p-4">
                  <p className="eyebrow">Planner items</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.counts.categories + snapshot.counts.dreams + snapshot.counts.goals + snapshot.counts.habits + snapshot.counts.tasks}</p>
                </div>
                <div className="rounded-[1.45rem] border surface-subtle p-4">
                  <p className="eyebrow">Weekly reviews</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{snapshot.counts.weeklyReviews}</p>
                </div>
              </div>
            ) : null}
            {status === "ready" && snapshot && !snapshot.hasLocalData ? (
              <Alert variant="info">This browser is ready for local mode, but there is not any meaningful setup or planner data to migrate yet.</Alert>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="primary">Appearance</Badge>
            <CardTitle className="flex items-center gap-2 text-2xl" level={2}>
              <MoonStar className="size-5 text-primary" />
              Theme preference
            </CardTitle>
            <CardDescription>Theme now persists even when you stay local-first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleThemeSubmit}>
              <select className="surface-field focus-ring min-h-11 w-full rounded-[1rem] border px-3 py-2 text-sm text-foreground" onChange={(event) => setThemePreference(event.target.value as ThemePreference)} value={themePreference}>
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
              {themeState.message ? <Alert variant={themeState.status === "error" ? "error" : "success"}>{themeState.message}</Alert> : null}
              <Button disabled={isSavingTheme} type="submit">{isSavingTheme ? "Saving theme..." : "Save theme"}</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="muted">Cloud-only upgrades</Badge>
            <CardTitle className="text-2xl" level={2}>Some settings grow after sign-in.</CardTitle>
            <CardDescription>Profile images, account-linked reminders, and identity controls all become available once this browser is attached to a cloud account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted">
            <div className="rounded-[1.35rem] border surface-subtle p-4">Profile image support is cloud-only in v1 so avatar storage stays durable and account-scoped.</div>
            <div className="rounded-[1.35rem] border surface-subtle p-4">Reminder delivery is email-backed and account-linked, so it only becomes active in cloud mode.</div>
          </CardContent>
        </Card>

        <Card className="bg-background-elevated/80">
          <CardHeader>
            <Badge variant="primary">Next steps</Badge>
            <CardTitle className="text-2xl" level={2}>Move at your own pace.</CardTitle>
            <CardDescription>Cloud account tools stay one click away, but leaving local mode does not wipe this browser data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild fullWidth>
              <Link href={ROUTES.signIn}>
                <LockKeyhole className="size-4" />
                Sign in to cloud
              </Link>
            </Button>
            <Button asChild fullWidth variant="secondary">
              <Link href={ROUTES.signUp}>
                <UserPlus className="size-4" />
                Create account
              </Link>
            </Button>
            <form action={leaveLocalMode}>
              <Button fullWidth type="submit" variant="ghost">
                <DoorOpen className="size-4" />
                Exit local mode
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

