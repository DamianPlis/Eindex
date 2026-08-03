import type { Metadata } from "next";
import { APP_LOCALES } from "@/lib/i18n/config";
import { assertLocale } from "@/lib/i18n/server";
import { generatePageMetadata } from "@/lib/metadata";

export function generateStaticParams() {
  return APP_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "root", locale });
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);
  return children;
}

