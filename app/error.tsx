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
    <main className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>500 - Something went wrong</h1>
      <p style={{ marginTop: 0 }}>
        The page failed to render. Try again or return home.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
        <button className="add-button" onClick={reset}>
          Try Again
        </button>
        <Link href="/" className="add-button" style={{ textDecoration: "none" }}>
          Home
        </Link>
      </div>
    </main>
  );
}
