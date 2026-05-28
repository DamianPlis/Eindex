"use client";

import { useEffect } from "react";
import e from "@/app/ErrorPage.module.css";
import u from "@/components/ui/shared.module.css";

export default function GlobalErrorPage({
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
    <html lang="en">
      <body>
        <main className={e.fullScreenCenter}>
          <div className={`${u.container} ${e.textCenter}`}>
            <h1 className={e.errorTitle}>500 - Unexpected Error</h1>
            <p className={e.errorText}>
              A critical error occurred while rendering the app.
            </p>
            <button className={u.primaryButton} onClick={reset}>
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
