import Link from "next/link";

export default function AppSegmentNotFoundPage() {
  return (
    <main className="status-page">
      <section className="status-panel page-enter">
        <p className="status-code">404</p>
        <h1 className="status-title">Not found</h1>
        <p className="status-copy">We could not find that page in the app.</p>
        <Link href="/" className="btn-primary">
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
