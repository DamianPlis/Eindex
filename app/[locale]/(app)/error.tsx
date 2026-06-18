"use client";

import Link from "next/link";
import { useEffect } from "react";
import { localizePath } from "@/lib/i18n/routing";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import e from "@/app/ErrorPage.module.css";
import u from "@/components/ui/shared.module.css";

export default function LocaleAppErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useAppLocale();
  const messages = useMessages();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={e.errorContainer}>
      <h1 className={e.errorTitle}>{messages.errors.somethingWentWrong}</h1>
      <p className={e.errorText}>{messages.errors.renderFailed}</p>
      <div className={e.errorActions}>
        <button className={u.primaryButton} onClick={reset}>
          {messages.errors.tryAgain}
        </button>
        <Link href={localizePath(locale, "/")} className={`${u.primaryButton} ${e.errorLink}`}>
          {messages.common.home}
        </Link>
      </div>
    </main>
  );
}
