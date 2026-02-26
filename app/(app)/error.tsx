"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h2 style={{ marginBottom: 8 }}>500 - App Error</h2>
      <p style={{ marginTop: 0 }}>Something went wrong while rendering this page.</p>
      {process.env.NODE_ENV === "development" ? (
        <pre style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>{error.message}</pre>
      ) : null}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
        <button className="add-button" onClick={reset}>
          Try Again
        </button>
        <Link href="/" className="add-button" style={{ textDecoration: "none" }}>
          Home
        </Link>
      </div>
    </div>
  );
}
