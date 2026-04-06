"use client";

import Link from "next/link";
import { useEffect } from "react";
import { localizePath } from "@/lib/i18n/routing";
import { useAppLocale, useMessages } from "@/components/i18n/LocaleProvider";

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
    <main className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>{messages.errors.somethingWentWrong}</h1>
      <p style={{ marginTop: 0 }}>{messages.errors.renderFailed}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
        <button className="add-button" onClick={reset}>
          {messages.errors.tryAgain}
        </button>
        <Link href={localizePath(locale, "/")} className="add-button" style={{ textDecoration: "none" }}>
          {messages.common.home}
        </Link>
      </div>
    </main>
  );
}
