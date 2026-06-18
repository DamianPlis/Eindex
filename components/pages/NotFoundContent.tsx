import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import type { AppLocale } from "@/lib/i18n/config";
import type { AppMessages } from "@/lib/i18n/messages";
import e from "@/app/ErrorPage.module.css";
import u from "@/components/ui/shared.module.css";

type NotFoundContentProps = {
  locale: AppLocale;
  messages: AppMessages;
  /** Override the home link href. Defaults to localizePath(locale, "/"). */
  homeHref?: string;
};

export default function NotFoundContent({
  locale,
  messages,
  homeHref,
}: NotFoundContentProps) {
  const href = homeHref ?? localizePath(locale, "/");

  return (
    <main className={e.errorContainer}>
      <h1 className={e.errorTitle}>{messages.errors.notFoundTitle}</h1>
      <p className={e.errorText}>{messages.errors.notFoundMessage}</p>
      <Link
        href={href}
        className={`${u.primaryButton} ${e.errorLink}`}
        style={{ marginTop: 12 }}
      >
        {messages.errors.goHome}
      </Link>
    </main>
  );
}
