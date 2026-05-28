import { DEFAULT_LOCALE, type AppLocale, isAppLocale } from "@/lib/i18n/config";

/**
 * Splits a path into its pathname and query/hash suffix.
 * 
 * @param path - The full path string.
 * @returns An object with pathname and suffix.
 */
function splitPathSuffix(path: string) {
  const match = path.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match?.[1] || path,
    suffix: match?.[2] || "",
  };
}

/**
 * Extracts a valid application locale from the first segment of a pathname.
 * 
 * @param pathname - The URL pathname.
 * @returns The matching AppLocale, or null if invalid or not present.
 */
export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const segment = pathname.split("/")[1] || "";
  return isAppLocale(segment) ? segment : null;
}

/**
 * Strips the locale prefix from a path if present.
 * 
 * @param path - The path string.
 * @returns The stripped path string.
 */
export function stripLocaleFromPath(path: string): string {
  const { pathname, suffix } = splitPathSuffix(path);
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return `${pathname || "/"}${suffix}`;

  const stripped = pathname.slice(locale.length + 1) || "/";
  return `${stripped.startsWith("/") ? stripped : `/${stripped}`}${suffix}`;
}

/**
 * Prefixes a path with the specified locale, ensuring the path is localized.
 * 
 * @param locale - The locale to apply.
 * @param path - The target path.
 * @returns The localized path string.
 */
export function localizePath(locale: AppLocale, path: string): string {
  const normalizedLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE;
  const stripped = stripLocaleFromPath(path);
  if (stripped === "/") return `/${normalizedLocale}`;
  return `/${normalizedLocale}${stripped}`;
}
