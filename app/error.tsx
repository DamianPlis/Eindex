"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <main className="status-page">
      <section className="status-panel page-enter">
        <p className="status-code">500</p>
        <h1 className="status-title">Something went wrong</h1>
        <p className="status-copy">The page failed to render. Try again or return home.</p>
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
