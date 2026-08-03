import { AppLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * Global Metadata Configuration for Eindex
 */
export const SITE_CONFIG = {
  name: "Eindex",
  domain: "eindex.vercel.app",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "https://eindex.vercel.app",
  twitterHandle: "@eindexapp",
  defaultLocale: DEFAULT_LOCALE, // "cs"
  themeColor: "#ff7fbf",
  ogImage: "/og-image.png",
  iconSvg: "/icon.svg",
} as const;

/**
 * Mapping of AppLocale to OpenGraph ISO locale tags.
 */
export const OG_LOCALES: Record<AppLocale, string> = {
  cs: "cs_CZ",
  en: "en_US",
  pl: "pl_PL",
};
