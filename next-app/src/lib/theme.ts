export const THEME_COOKIE = "pt-theme";
export const THEME_PREFERENCES = ["system", "dark", "light"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "system" || value === "dark" || value === "light";
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return isThemePreference(value) ? value : "system";
}

export function toThemeEnumValue(preference: ThemePreference): "SYSTEM" | "DARK" | "LIGHT" {
  switch (preference) {
    case "dark":
      return "DARK";
    case "light":
      return "LIGHT";
    default:
      return "SYSTEM";
  }
}

export function fromThemeEnumValue(value: "SYSTEM" | "DARK" | "LIGHT" | null | undefined): ThemePreference {
  switch (value) {
    case "DARK":
      return "dark";
    case "LIGHT":
      return "light";
    default:
      return "system";
  }
}

export function resolveAppliedTheme(preference: ThemePreference, systemPrefersDark: boolean): "dark" | "light" {
  if (preference === "dark" || preference === "light") {
    return preference;
  }

  return systemPrefersDark ? "dark" : "light";
}

export function buildThemeInitScript(defaultPreference: ThemePreference): string {
  return `(() => {
    const resolveTheme = (preference) => {
      if (preference === 'dark' || preference === 'light') {
        return preference;
      }

      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const fallbackPreference = ${JSON.stringify(defaultPreference)};

    try {
      const cookieMatch = document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);
      const rawPreference = cookieMatch ? decodeURIComponent(cookieMatch[1]) : fallbackPreference;
      const preference = rawPreference === 'dark' || rawPreference === 'light' || rawPreference === 'system' ? rawPreference : 'system';
      const appliedTheme = resolveTheme(preference);
      document.documentElement.dataset.themePreference = preference;
      document.documentElement.dataset.theme = appliedTheme;
      document.documentElement.style.colorScheme = appliedTheme;
    } catch {
      const appliedTheme = resolveTheme(fallbackPreference);
      document.documentElement.dataset.themePreference = fallbackPreference;
      document.documentElement.dataset.theme = appliedTheme;
      document.documentElement.style.colorScheme = appliedTheme;
    }
  })();`;
}
