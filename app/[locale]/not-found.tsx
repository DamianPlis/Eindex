import Link from "next/link";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getRequestMessages } from "@/lib/i18n/server"; 

export default async function LocaleNotFoundPage() {
  const [, messages] = await Promise.all([getPreferredLocale(null), getRequestMessages()]);

  return (
    <main className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>{messages.errors.notFoundTitle}</h1>
      <p style={{ marginTop: 0 }}>{messages.errors.notFoundMessage}</p>
      <Link
        href={"/"}
        className="add-button"
        style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}
      >
        {messages.errors.goHome}
      </Link>
    </main>
  );
}
