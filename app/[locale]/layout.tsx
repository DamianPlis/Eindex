import { APP_LOCALES } from "@/lib/i18n/config";
import { assertLocale } from "@/lib/i18n/server";

export function generateStaticParams() {
  return APP_LOCALES.map((locale) => ({ locale }));
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
