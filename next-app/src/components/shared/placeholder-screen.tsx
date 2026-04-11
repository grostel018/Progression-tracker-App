import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cardTones = {
  calm: "bg-background-elevated/80",
  bright: "bg-primary/10",
  muted: "bg-background-soft/40"
} as const;

type PlaceholderAction = {
  href: Route;
  label: string;
};

type PlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: PlaceholderAction[];
  children?: ReactNode;
  tone?: keyof typeof cardTones;
};

export function PlaceholderScreen({ eyebrow, title, description, actions = [], children, tone = "calm" }: PlaceholderScreenProps): JSX.Element {
  return (
    <main className="section-shell flex min-h-[calc(100vh-80px)] items-center py-8">
      <Card className={`w-full rounded-[2rem] border-border/70 ${cardTones[tone]}`}>
        <CardHeader className="gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <CardTitle className="max-w-2xl text-3xl leading-tight sm:text-4xl" level={1}>
            {title}
          </CardTitle>
          <p className="max-w-2xl text-base leading-7 text-muted">{description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Button asChild key={action.href}>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          ) : null}
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
