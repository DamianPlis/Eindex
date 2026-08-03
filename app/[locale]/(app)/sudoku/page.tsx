import type { Metadata } from "next";
import { assertLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";
import { requireSession } from "@/lib/session";
import SudokuGame from "@/components/sudoku/SudokuGame";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "sudoku", locale, path: "/sudoku" });
}

export default async function SudokuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = assertLocale((await params).locale);
  await requireSession();
  const messages = getMessages(locale);

  return <SudokuGame messages={messages} />;
}
