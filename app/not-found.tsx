import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="status-page">
      <section className="status-panel page-enter">
        <p className="status-code">404</p>
        <h1 className="status-title">Page not found</h1>
        <p className="status-copy">The page you requested does not exist or was moved.</p>
        <Link href="/" className="btn-primary">
          Go to Home
        </Link>
      </section>
    </main>
  );
}
