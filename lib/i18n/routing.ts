import { DEFAULT_LOCALE, type AppLocale, isAppLocale } from "@/lib/i18n/config";

function splitPathSuffix(path: string) {
  const match = path.match(/^([^?#]*)(.*)$/);
  return {
    pathname: match?.[1] || path,
    suffix: match?.[2] || "",
  };
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const segment = pathname.split("/")[1] || "";
  return isAppLocale(segment) ? segment : null;
}

export function stripLocaleFromPath(path: string): string {
  const { pathname, suffix } = splitPathSuffix(path);
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return `${pathname || "/"}${suffix}`;

  const stripped = pathname.slice(locale.length + 1) || "/";
  return `${stripped.startsWith("/") ? stripped : `/${stripped}`}${suffix}`;
}

export function localizePath(locale: AppLocale, path: string): string {
  const normalizedLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE;
  const stripped = stripLocaleFromPath(path);
  if (stripped === "/") return `/${normalizedLocale}`;
  return `/${normalizedLocale}${stripped}`;
}
