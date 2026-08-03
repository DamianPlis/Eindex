import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/deadlines/StatusPill";
import { getMessages } from "@/lib/i18n/messages";
import { localizePath } from "@/lib/i18n/routing";
import { assertLocale } from "@/lib/i18n/server";
import { formatDeadlineRelativeLabel } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { getSession, requireSession } from "@/lib/session";
import dp from "@/app/[locale]/(app)/deadlines/DeadlinesPage.module.css";
import d from "@/components/deadlines/Deadlines.module.css";
import u from "@/components/ui/shared.module.css";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  assertLocale(locale);
  const session = await getSession();
  let customTitle: string | undefined;
  let customDescription: string | undefined;

  if (session) {
    const state = await getUserState(session.uid);
    const item = state.deadlines.find((d) => d.id === id);
    if (item) {
      customTitle = item.text;
      customDescription = item.description || `Termín odevzdání úkolu: ${item.date}`;
    }
  }

  return generatePageMetadata({
    page: "deadlines",
    locale,
    customTitle,
    customDescription,
    path: `/deadlines/${id}`,
  });
}

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

  const backHref =
    redirectParam === "main"
      ? localizePath(locale, "/")
      : localizePath(locale, "/deadlines");
  const backLabel =
    redirectParam === "main"
      ? messages.deadlines.homePage
      : messages.deadlines.deadlinesPage;

  return (
    <div className={`${dp.detailContainer} ${u.container}`}>
      <StatusPill status={item.status} />
      <h2 className={dp.detailTitle}>{item.text}</h2>
      <p className={dp.detailDue}>
        {messages.deadlines.due}: {item.date}
      </p>
      <div className={`${d.reminderRelativeDate} ${dp.detailRelativeDate}`}>
        {formatDeadlineRelativeLabel(item.date, locale)}
      </div>
      {item.description ? (
        <div className={dp.detailDescriptionBlock}>
          <p className={dp.detailDescriptionLabel}>
            {messages.deadlines.description}
          </p>
          <p className={dp.detailDescriptionText}>{item.description}</p>
        </div>
      ) : null}
      <Link href={backHref} className={u.inlineLink}>
        {messages.deadlines.backTo} {backLabel}
      </Link>
    </div>
  );
}
