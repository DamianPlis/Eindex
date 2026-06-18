import { assertLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";
import { requireSession } from "@/lib/session";
import SudokuGame from "@/components/sudoku/SudokuGame";

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
