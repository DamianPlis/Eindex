import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type AppLocale, isAppLocale, normalizeAppLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function assertLocale(locale: string): AppLocale {
  if (!isAppLocale(locale)) notFound();
  return locale;
}

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  return normalizeAppLocale(cookieLocale || DEFAULT_LOCALE);
}

export async function getRequestMessages() {
  return getMessages(await getRequestLocale());
}
