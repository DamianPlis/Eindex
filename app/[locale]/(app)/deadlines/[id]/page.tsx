import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusPill from "@/components/deadlines/StatusPill";
import ArrowLeft from "@/icons/chevron-left.svg";
import Calendar from "@/icons/calendar.svg";
import { getMessages } from "@/lib/i18n/messages";
import { localizePath } from "@/lib/i18n/routing";
import { assertLocale } from "@/lib/i18n/server";
import { formatDeadlineRelativeLabel } from "@/lib/schedule/selectors";
import { formatEuropeanDate } from "@/lib/schedule/date-utils";
import { getUserState } from "@/lib/schedule/store";
import { getSession, requireSession } from "@/lib/session";
import dp from "@/app/[locale]/(app)/deadlines/DeadlinesPage.module.css";
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
      customDescription =
        item.description ||
        `Termín odevzdání úkolu: ${formatEuropeanDate(item.date)}`;
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
    <div className={dp.detailContainer}>
      <Link href={backHref} className={dp.backLink}>
        <ArrowLeft
          width={20}
          height={20}
          fill="currentColor"
          aria-hidden="true"
        />
        <span>
          {messages.deadlines.backTo} {backLabel}
        </span>
      </Link>
      <article className={dp.detailCard} aria-labelledby="deadline-title">
        <header className={dp.detailHeader}>
          <div className={dp.detailHeading}>
            <div className={dp.detailMeta}>
              <StatusPill status={item.status} />
            </div>
            <h1 id="deadline-title" className={dp.detailTitle}>
              {item.text}
            </h1>
          </div>
          <div className={dp.detailDuePanel}>
            <span className={dp.detailDueIcon}>
              <Calendar
                width={22}
                height={22}
                fill="currentColor"
                aria-hidden="true"
              />
            </span>
            <div className={dp.detailDueContent}>
              <p className={dp.detailDueLabel}>{messages.deadlines.due}</p>
              <time className={dp.detailDue} dateTime={item.date}>
                {formatEuropeanDate(item.date)}
              </time>
              <p className={dp.detailRelativeDate}>
                {formatDeadlineRelativeLabel(item.date, locale)}
              </p>
            </div>
          </div>
        </header>
        {item.description ? (
          <section
            className={dp.detailDescriptionBlock}
            aria-labelledby="deadline-description"
          >
            <h2 id="deadline-description" className={dp.detailDescriptionLabel}>
              {messages.deadlines.description}
            </h2>
            <p className={dp.detailDescriptionText}>{item.description}</p>
          </section>
        ) : null}
      </article>
    </div>
  );
}
