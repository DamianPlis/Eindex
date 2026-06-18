import { getPreferredLocale } from "@/lib/i18n/preference";
import { getRequestMessages } from "@/lib/i18n/server";
import NotFoundContent from "@/components/pages/NotFoundContent";

export default async function LocaleNotFoundPage() {
  const [locale, messages] = await Promise.all([
    getPreferredLocale(null),
    getRequestMessages(),
  ]);

  return (
    <NotFoundContent locale={locale} messages={messages} homeHref={"/"} />
  );
}
