"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container" style={{ margin: "16px" }}>
      <h2>Something went wrong</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
      <button className="add-button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
