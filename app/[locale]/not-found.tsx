import Link from "next/link";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getRequestMessages } from "@/lib/i18n/server";
import e from "@/app/ErrorPage.module.css";
import u from "@/components/ui/shared.module.css";

export default async function LocaleNotFoundPage() {
  const [, messages] = await Promise.all([
    getPreferredLocale(null),
    getRequestMessages(),
  ]);

  return (
    <main className={e.errorContainer}>
      <h1 className={e.errorTitle}>{messages.errors.notFoundTitle}</h1>
      <p className={e.errorText}>{messages.errors.notFoundMessage}</p>
      <Link href={"/"} className={`${u.primaryButton} ${e.errorLink}`} style={{ marginTop: 12 }}>
        {messages.errors.goHome}
      </Link>
    </main>
  );
}
