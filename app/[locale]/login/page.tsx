import type { Metadata } from "next";
import LoginPanel from "@/components/auth/LoginPanel";
import { assertLocale } from "@/lib/i18n/server";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "login", locale, path: "/login" });
}

export default async function LocaleLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  assertLocale((await params).locale);
  return <LoginPanel />;
}
