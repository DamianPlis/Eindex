import "server-only";

import { cookies } from "next/headers";
import type { AppTheme } from "@/lib/settings/types";
import { THEME_COOKIE } from "@/lib/settings/constants";

/**
 * Reads the theme preference from the request cookie.
 * Returns null when no cookie is set (first visit).
 *
 * @returns The stored AppTheme or null.
 */
export async function getThemeCookie(): Promise<AppTheme | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  if (value === "dark") return "dark";
  if (value === "light") return "light";
  return null;
}

