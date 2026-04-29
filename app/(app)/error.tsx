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
    <div className="container m-4 text-center">
      <h2 className="mb-2">500 - App Error</h2>
      <p className="mt-0">Something went wrong while rendering this page.</p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="whitespace-pre-wrap text-left">{error.message}</pre>
      ) : null}
      <div className="flex gap-2.5 justify-center mt-3">
        <button className="add-button" onClick={reset}>
          Try Again
        </button>
        <Link href="/" className="add-button no-underline">
          Home
        </Link>
      </div>
    </div>
  );
}
