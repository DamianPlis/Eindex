"use client";

import type { AppTheme } from "@/lib/settings/types";
import { THEME_COOKIE, COOKIE_MAX_AGE } from "@/lib/settings/constants";

/**
 * Resolves the DOM element that serves as the theme root.
 * First checks for an element with class `.app-shell`, falling back to `documentElement`.
 *
 * @returns The target HTMLElement or null when on the server.
 */
function resolveThemeRoot() {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector<HTMLElement>(".app-shell") ||
    document.documentElement
  );
}

/**
 * Applies the selected application theme by setting the `data-theme` attribute on the theme root.
 * Also persists the choice as a cookie so the server can read it instantly on the next load.
 *
 * @param theme - The selected application theme.
 */
export function applyTheme(theme: AppTheme) {
  const themeRoot = resolveThemeRoot();
  if (!themeRoot) return;

  themeRoot.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;

  // Persist for instant server-side reads on future navigations
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;

  // const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  // if (metaTheme) {
  //   metaTheme.content = theme === "dark" ? getCSSVariable("--bg-dark") : getCSSVariable("--bg");
  // }
}
