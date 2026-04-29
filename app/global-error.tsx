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
        <main className="min-h-screen grid place-items-center p-5">
          <div className="container text-center">
            <h1 className="mb-2">500 - Unexpected Error</h1>
            <p className="mt-0">
              A critical error occurred while rendering the app.
            </p>
            <button className="add-button" onClick={reset}>
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
