"use client";

import Link from "next/link";
import { useEffect } from "react";
import e from "@/app/ErrorPage.module.css";
import u from "@/components/ui/shared.module.css";

export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={e.errorContainer}>
      <h1 className={e.errorTitle}>500 - Something went wrong</h1>
      <p className={e.errorText}>
        The page failed to render. Try again or return home.
      </p>
      <div className={e.errorActions}>
        <button className={u.primaryButton} onClick={reset}>
          Try Again
        </button>
        <Link href="/" className={`${u.primaryButton} ${e.errorLink}`}>
          Home
        </Link>
      </div>
    </main>
  );
}
