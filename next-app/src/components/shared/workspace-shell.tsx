"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Compass,
  FolderKanban,
  Goal,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Star,
  type LucideIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WorkspaceIcon = "activity" | "categories" | "dashboard" | "dreams" | "goals" | "review" | "settings" | "sparkles" | "star";

type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: WorkspaceIcon;
};

type WorkspaceSectionItem = {
  id: string;
  label: string;
  icon?: WorkspaceIcon;
};

type WorkspaceShellProps = {
  displayName: string;
  modeLabel: string;
  statusText: string;
  workspaceLabel: string;
  workspaceLinks: readonly WorkspaceNavItem[];
  sectionLabel?: string;
  sectionLinks?: readonly WorkspaceSectionItem[];
  detailPanel?: {
    title: string;
    body: string;
  };
  children: React.ReactNode;
};

const ICONS: Record<WorkspaceIcon, LucideIcon> = {
  activity: Activity,
  categories: FolderKanban,
  dashboard: LayoutDashboard,
  dreams: Compass,
  goals: Goal,
  review: Sparkles,
  settings: Settings2,
  sparkles: Sparkles,
  star: Star
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionHref(id: string): string {
  return `#${id}`;
}

function SectionLinksList({ sectionLinks, activeSectionId, sectionLabel }: { sectionLinks: readonly WorkspaceSectionItem[]; activeSectionId: string; sectionLabel?: string }) {
  return (
    <nav aria-label={sectionLabel ?? "Sections"} className="space-y-1 border-t border-border-subtle pt-5">
      <p className="px-2 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted/70">{sectionLabel ?? "Sections"}</p>
      {sectionLinks.map((item) => {
        const Icon = item.icon ? ICONS[item.icon] : null;
        const isActive = activeSectionId === item.id;

        return (
          <Link
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-200 hover:bg-[var(--color-surface-muted-hover)] hover:text-foreground",
              isActive ? "bg-[var(--color-surface-muted-hover)] text-foreground" : "text-muted"
            )}
            href={sectionHref(item.id)}
            key={item.id}
          >
            {Icon ? <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted group-hover:text-foreground")} /> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceLinksList({ workspaceLinks, activePathname, workspaceLabel }: { workspaceLinks: readonly WorkspaceNavItem[]; activePathname: string; workspaceLabel: string }) {
  return (
    <nav aria-label={workspaceLabel} className="space-y-1">
      <p className="px-2 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted/70">{workspaceLabel}</p>
      {workspaceLinks.map((item) => {
        const Icon = ICONS[item.icon];
        const isActive = isActivePath(activePathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-200 hover:bg-[var(--color-surface-muted-hover)] hover:text-foreground",
              isActive ? "bg-primary/12 text-foreground" : "text-muted"
            )}
            href={item.href}
            key={item.href}
          >
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", isActive ? "bg-primary text-[var(--color-on-primary)]" : "bg-[var(--color-surface-muted)] text-muted group-hover:text-foreground")}>
              <Icon className="size-4" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceShell({
  displayName,
  modeLabel,
  statusText,
  workspaceLabel,
  workspaceLinks,
  sectionLabel,
  sectionLinks,
  detailPanel,
  children
}: WorkspaceShellProps): JSX.Element {
  const pathname = usePathname();
  const [activeSectionId, setActiveSectionId] = useState(sectionLinks?.[0]?.id ?? "");
  const sectionIds = useMemo(() => sectionLinks?.map((item) => item.id) ?? [], [sectionLinks]);

  useEffect(() => {
    if (!sectionIds.length) {
      return;
    }

    function syncFromHash(): void {
      const hash = window.location.hash.replace("#", "");

      if (hash && sectionIds.includes(hash)) {
        setActiveSectionId(hash);
        window.requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ block: "start", behavior: "auto" });
        });
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target.id && sectionIds.includes(visible.target.id)) {
          setActiveSectionId(visible.target.id);
        }
      },
      {
        rootMargin: "-18% 0px -60% 0px",
        threshold: [0.25, 0.5, 0.75]
      }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, [sectionIds]);

  return (
    <div className="space-y-6">
      <div className="space-y-3 xl:hidden">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {workspaceLinks.map((item) => {
            const Icon = ICONS[item.icon];
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "surface-interactive flex min-h-11 min-w-fit items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                  isActive ? "border-primary/35 bg-primary/12 text-foreground" : "border-border-subtle text-muted hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {sectionLinks?.length ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {sectionLinks.map((item) => {
              const isActive = activeSectionId === item.id;

              return (
                <Link
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "surface-interactive flex min-h-10 min-w-fit items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
                    isActive ? "border-primary/35 bg-primary/12 text-foreground" : "border-border-subtle text-muted hover:text-foreground"
                  )}
                  href={sectionHref(item.id)}
                  key={item.id}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-8 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-[1.5rem] border border-border-subtle bg-background-elevated/82 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="border-b border-border-subtle px-2 pb-5">
              <Badge variant="primary">Progression tracker</Badge>
              <div className="mt-4 space-y-2">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary/80">{modeLabel}</p>
                <h2 className="text-2xl font-semibold leading-tight text-foreground">{displayName}</h2>
                <p className="text-sm leading-6 text-muted">{statusText}</p>
              </div>
            </div>

            <div className="space-y-5 pt-5">
              <WorkspaceLinksList workspaceLinks={workspaceLinks} activePathname={pathname} workspaceLabel={workspaceLabel} />

              {sectionLinks?.length ? (
                <SectionLinksList sectionLinks={sectionLinks} activeSectionId={activeSectionId} sectionLabel={sectionLabel} />
              ) : null}
            </div>

            {detailPanel ? (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-muted">
                <div className="flex items-center gap-2 text-foreground">
                  <Sparkles className="size-4 text-primary" />
                  <span className="font-semibold">{detailPanel.title}</span>
                </div>
                <p className="mt-2">{detailPanel.body}</p>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 space-y-8">{children}</div>
      </div>
    </div>
  );
}