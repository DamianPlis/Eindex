import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import { getRequestLocale, getRequestMessages } from "@/lib/i18n/server";

export default async function NotFoundPage() {
  const [locale, messages] = await Promise.all([getRequestLocale(), getRequestMessages()]);

  return (
    <main className="container" style={{ margin: "16px", textAlign: "center" }}>
      <h1 style={{ marginBottom: 8 }}>{messages.errors.notFoundTitle}</h1>
      <p style={{ marginTop: 0 }}>{messages.errors.notFoundMessage}</p>
      <Link
        href={localizePath(locale, "/")}
        className="add-button"
        style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}
      >
        {messages.errors.goHome}
      </Link>
    </main>
  );
}
