import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type AppLocale, isAppLocale, normalizeAppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

/**
 * Validates a locale string. Throws a 404 error if the locale is not supported.
 * 
 * @param locale - The locale string to assert.
 * @returns The asserted AppLocale.
 */
export function assertLocale(locale: string): AppLocale {
  if (!isAppLocale(locale)) notFound();
  return locale;
}

/**
 * Retrieves the preferred request locale from client cookies, falling back to the default locale.
 * 
 * @returns The resolved AppLocale.
 */
export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  return normalizeAppLocale(cookieLocale || DEFAULT_LOCALE);
}

/**
 * Fetches the translations/messages dictionary for the current request's locale.
 * 
 * @returns The localization messages object.
 */
export async function getRequestMessages() {
  return getMessages(await getRequestLocale());
}
