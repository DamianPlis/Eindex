import Link from "next/link";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getRequestMessages } from "@/lib/i18n/server";

export default async function LocaleNotFoundPage() {
  const [, messages] = await Promise.all([
    getPreferredLocale(null),
    getRequestMessages(),
  ]);

  return (
    <main className="container m-4 text-center">
      <h1 className="mb-2">{messages.errors.notFoundTitle}</h1>
      <p className="mt-0">{messages.errors.notFoundMessage}</p>
      <Link href={"/"} className="add-button inline-block mt-3 no-underline">
        {messages.errors.goHome}
      </Link>
    </main>
  );
}
