import AddDeadline from "@/components/deadlines/AddDeadline";
import DeadlinesList from "@/components/deadlines/DeadlinesList";
import StatsCardSkeleton from "@/components/skeletons/StatsCardSkeleton";
import StatsCard from "@/components/deadlines/StatsCard";
import { getMessages } from "@/lib/i18n/messages";
import { assertLocale } from "@/lib/i18n/server";
import { getCachedUserState, getUserSettings } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";
import DeadlinesListSkeleton from "@/components/skeletons/DeadlinesListSkeleton";
import { DeadlinesRefreshProvider } from "@/components/deadlines/DeadlinesRefreshContext";
import d from "@/components/deadlines/Deadlines.module.css";

export default async function LocaleDeadlinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = assertLocale((await params).locale);
  const messages = getMessages(locale);

  return (
    <div className={d.deadlinesContainer}>
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
    </div>
  );
}

async function StatsCards() {
  const session = await requireSession();
  const uid = session.uid;
  const state = await getCachedUserState(uid);
  const settings = await getUserSettings(uid);

  return (
    <>
      <StatsCard period="week" state={state} />
      <StatsCard period="month" state={state} />
      <StatsCard
        period="year"
        state={state}
        useSchoolYear={settings.useSchoolYear}
      />
    </>
  );
}

async function DeadlinesListContainer() {
  const session = await requireSession();
  const uid = session.uid;
  const state = await getCachedUserState(uid);
  return <DeadlinesList deadlines={state.deadlines} />;
}
