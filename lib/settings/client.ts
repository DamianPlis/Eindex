"use client";

import type { AppTheme } from "@/lib/settings/types";

function resolveThemeRoot() {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(".app-shell") || document.documentElement;
}

export function applyTheme(theme: AppTheme) {
  const themeRoot = resolveThemeRoot();
  if (!themeRoot) return;

  themeRoot.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;

  const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = theme === "dark" ? "#07111f" : "#eef3ff";
  }
}
