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
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
          <div className="container" style={{ textAlign: "center" }}>
            <h1 style={{ marginBottom: 8 }}>500 - Unexpected Error</h1>
            <p style={{ marginTop: 0 }}>A critical error occurred while rendering the app.</p>
            <button className="add-button" onClick={reset}>
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
