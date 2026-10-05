import type { Metadata } from "next";
import AddDeadline from "@/components/deadlines/AddDeadline";
import DeadlinesList from "@/components/deadlines/DeadlinesList";
import StatsCardSkeleton from "@/components/skeletons/StatsCardSkeleton";
import StatsCard from "@/components/deadlines/StatsCard";
import { getMessages } from "@/lib/i18n/messages";
import { assertLocale } from "@/lib/i18n/server";
import {
  getDeadlines,
  getPeriodUsage,
  getSubjectCatalog,
  getUserSettings,
} from "@/lib/schedule/store";
import { getDateRange } from "@/lib/schedule/stats";
import { isoDate } from "@/lib/schedule/date-utils";
import type { StatsOptions } from "@/lib/schedule/types";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";
import DeadlinesListSkeleton from "@/components/skeletons/DeadlinesListSkeleton";
import { DeadlinesRefreshProvider } from "@/components/deadlines/DeadlinesRefreshContext";
import d from "@/components/deadlines/Deadlines.module.css";
import { generatePageMetadata } from "@/lib/metadata";
import { DeadlineToastProvider } from "@/components/deadlines/DeadlineToastProvider";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({
    page: "deadlines",
    locale,
    path: "/deadlines",
  });
}

export default async function LocaleDeadlinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await requireSession();
  const locale = assertLocale((await params).locale);
  const messages = getMessages(locale);

  return (
    <div className={d.deadlinesContainer}>
      <DeadlineToastProvider key={session.uid}>
        <DeadlinesRefreshProvider>
          <div className={d.flexBetween}>
            <h2 className={d.deadlinesTitle}>{messages.deadlines.title}</h2>
            <AddDeadline />
          </div>

          {/* Stream the deadlines list */}
          <Suspense fallback={<DeadlinesListSkeleton />}>
            <DeadlinesListContainer />
          </Suspense>
        </DeadlinesRefreshProvider>

        <h2 className={d.deadlinesTitle}>
          {messages.deadlines.statistics.statistics}
        </h2>
        <div className={d.statsContainer}>
          {/* Stream the stats cards */}
          <Suspense fallback={<StatsCardSkeleton />}>
            <StatsCards />
          </Suspense>
        </div>
      </DeadlineToastProvider>
    </div>
  );
}

async function StatsCards() {
  const session = await requireSession();
  const uid = session.uid;
  const [catalog, settings] = await Promise.all([
    getSubjectCatalog(),
    getUserSettings(),
  ]);
  const referenceISO = isoDate(new Date());
  const referenceDate = new Date(`${referenceISO}T12:00:00`);
  const periods: StatsOptions[] = ["week", "month", "year"];
  const cards = await Promise.all(
    periods.map(async (period) => {
      const initialRange = getDateRange(
        period,
        referenceDate,
        0,
        settings.useSchoolYear,
      );
      const initialUsage = await getPeriodUsage(
        uid,
        period,
        initialRange.startISO,
        initialRange.endISO,
      );
      return { period, initialRange, initialUsage };
    }),
  );

  return (
    <>
      {cards.map((card) => (
        <StatsCard
          key={card.period}
          {...card}
          {...catalog}
          referenceISO={referenceISO}
          useSchoolYear={settings.useSchoolYear}
        />
      ))}
    </>
  );
}

async function DeadlinesListContainer() {
  const deadlines = await getDeadlines();
  return (
    <DeadlinesList
      deadlines={deadlines}
      currentYear={new Date().getFullYear()}
    />
  );
}
