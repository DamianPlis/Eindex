import Link from "next/link";

export default function AppSegmentNotFoundPage() {
  return (
    <div className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h2 style={{ marginBottom: 8 }}>404 - Not Found</h2>
      <p style={{ marginTop: 0 }}>We could not find that page in the app.</p>
      <Link
        href="/"
        className="add-button"
        style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
