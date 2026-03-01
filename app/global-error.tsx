"use client";

import { useEffect } from "react";

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
        <main className="status-page">
          <section className="status-panel page-enter">
            <p className="status-code">500</p>
            <h1 className="status-title">Unexpected error</h1>
            <p className="status-copy">A critical error occurred while rendering the app.</p>
            <button className="btn-primary" onClick={reset}>
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
