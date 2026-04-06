import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/deadlines/StatusPill";
import { getMessages } from "@/lib/i18n/messages";
import { localizePath } from "@/lib/i18n/routing";
import { assertLocale } from "@/lib/i18n/server";
import { formatDeadlineRelativeLabel } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

export default async function LocaleDeadlineDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ redirect?: string | string[] }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = assertLocale(rawLocale);
  const messages = getMessages(locale);
  const redirectValues = await searchParams;
  const redirectParam = Array.isArray(redirectValues?.redirect)
    ? redirectValues?.redirect[0]
    : redirectValues?.redirect;
  const session = await requireSession();
  const state = await getUserState(session.uid);
  const item = state.deadlines.find((deadline) => deadline.id === id);

  if (!item) notFound();

  const backHref = redirectParam === "main" ? localizePath(locale, "/") : localizePath(locale, "/deadlines");
  const backLabel =
    redirectParam === "main" ? messages.deadlines.homePage : messages.deadlines.deadlinesPage;

  return (
    <div className="container" style={{ margin: "16px" }}>
      <StatusPill status={item.status} />
      <h2>{item.text}</h2>
      <p style={{ marginBottom: 0 }}>
        {messages.deadlines.due}: {item.date}
      </p>
      <div style={{ marginBottom: "1em" }} className="reminder-date reminder-relative-date">
        {formatDeadlineRelativeLabel(item.date, locale)}
      </div>
      <Link href={backHref} className="inline-link">
        {messages.deadlines.backTo} {backLabel}
      </Link>
    </div>
  );
}
