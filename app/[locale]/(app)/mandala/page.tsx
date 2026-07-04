import { assertLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";
import { requireSession } from "@/lib/session";
import MandalaGame from "@/components/mandala/MandalaGame";

export default async function MandalaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = assertLocale((await params).locale);
  await requireSession();
  const messages = getMessages(locale);

  return <MandalaGame messages={messages} />;
}
