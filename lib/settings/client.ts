"use client";

import type { AppTheme } from "@/lib/settings/types";

/**
 * Resolves the DOM element that serves as the theme root.
 * First checks for an element with class `.app-shell`, falling back to `documentElement`.
 * 
 * @returns The target HTMLElement or null when on the server.
 */
function resolveThemeRoot() {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(".app-shell") || document.documentElement;
}

/**
 * Applies the selected application theme by setting the `data-theme` attribute on the theme root.
 * 
 * @param theme - The selected application theme.
 */
export function applyTheme(theme: AppTheme) {
  const themeRoot = resolveThemeRoot();
  if (!themeRoot) return;

  themeRoot.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;

  // const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  // if (metaTheme) {
  //   metaTheme.content = theme === "dark" ? getCSSVariable("--bg-dark") : getCSSVariable("--bg");
  // }
}
