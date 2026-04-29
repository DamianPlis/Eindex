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
    <main className="container m-4 text-center">
      <h1 className="mb-2">500 - Something went wrong</h1>
      <p className="mt-0">
        The page failed to render. Try again or return home.
      </p>
      <div className="flex gap-2.5 justify-center mt-3">
        <button className="add-button" onClick={reset}>
          Try Again
        </button>
        <Link href="/" className="add-button no-underline">
          Home
        </Link>
      </div>
    </main>
  );
}
