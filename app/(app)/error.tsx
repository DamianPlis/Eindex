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
    <main className="status-page">
      <section className="status-panel page-enter">
        <p className="status-code">500</p>
        <h1 className="status-title">App error</h1>
        <p className="status-copy">Something went wrong while rendering this page.</p>
        {process.env.NODE_ENV === "development" ? (
          <pre className="status-debug">{error.message}</pre>
        ) : null}
        <div className="status-actions">
          <button className="btn-primary" onClick={reset}>
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}
