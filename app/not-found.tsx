import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>404 - Page Not Found</h1>
      <p style={{ marginTop: 0 }}>
        The page you requested does not exist or was moved.
      </p>
      <Link
        href="/"
        className="add-button"
        style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}
      >
        Go to Home
      </Link>
    </main>
  );
}
