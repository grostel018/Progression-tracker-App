"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedAppNav({ items }: { items: readonly NavItem[] }): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="col-span-2 row-start-2 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-4 pb-1 text-sm xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:mx-0 xl:w-auto xl:max-w-[680px] xl:justify-center xl:rounded-full xl:border xl:border-border-subtle xl:bg-background-elevated/60 xl:p-1"
    >
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "focus-ring inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors duration-200 sm:px-4",
              isActive
                ? "bg-primary text-[var(--color-on-primary)] shadow-[0_8px_20px_rgba(22,140,103,0.16)]"
                : "text-muted hover:bg-[var(--color-surface-muted-hover)] hover:text-foreground"
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}