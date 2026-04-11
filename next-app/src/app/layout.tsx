import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { bodyFont, displayFont } from "@/app/fonts";
import { buildThemeInitScript, normalizeThemePreference, resolveAppliedTheme, THEME_COOKIE } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Progression Tracker",
    template: "%s | Progression Tracker"
  },
  description: "A calm, motivating progress workspace for building momentum in local or cloud mode."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const themePreference = normalizeThemePreference(cookies().get(THEME_COOKIE)?.value);
  const appliedTheme = resolveAppliedTheme(themePreference, true);

  return (
    <html
      className={`${displayFont.variable} ${bodyFont.variable}`}
      data-theme={appliedTheme}
      data-theme-preference={themePreference}
      lang="en"
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: buildThemeInitScript(themePreference) }} />
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[1rem] focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[var(--color-on-primary)]"
          href="#main-content"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

