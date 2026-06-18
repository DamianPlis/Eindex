import { getPreferredLocale } from "@/lib/i18n/preference";
import { getRequestMessages } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import NotFoundContent from "@/components/pages/NotFoundContent";

export default async function NotFoundPage() {
  const [locale, messages] = await Promise.all([getPreferredLocale(null), getRequestMessages()]);

  return (
    <NotFoundContent
      locale={locale}
      messages={messages}
      homeHref={localizePath(locale, "/")}
    />
  );
}
