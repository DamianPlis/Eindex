import AddDeadline from "@/components/deadlines/AddDeadline";
import DeadlinesList from "@/components/deadlines/DeadlinesList";
import DeadlinesPageSkeleton from "@/components/skeletons/DeadlinesPageSkeleton";
import StatsCard from "@/components/deadlines/StatsCard";
import { getMessages } from "@/lib/i18n/messages";
import { assertLocale } from "@/lib/i18n/server";
import { getCurrentWeekStats } from "@/lib/schedule/selectors";
import { getCachedUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { Suspense } from "react";
import DeadlinesListSkeleton from "@/components/skeletons/DeadlinesListSkeleton";
import { DeadlinesRefreshProvider } from "@/components/deadlines/DeadlinesRefreshContext";

export default async function LocaleDeadlinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = assertLocale((await params).locale);
  const messages = getMessages(locale);

  return (
    <div className="deadlines-container">
      <DeadlinesRefreshProvider>
        <div className="flex justify-between">
          <h2 className="deadlines-title">{messages.deadlines.title}</h2>
          <AddDeadline />
        </div>

        {/* Stream the deadlines list */}
        <Suspense fallback={<DeadlinesListSkeleton />}>
          <DeadlinesListContainer />
        </Suspense>
      </DeadlinesRefreshProvider>

      <h2 className="deadlines-title">
        {messages.deadlines.statistics.statistics}
      </h2>
      <div className="stats-container">
        {/* Stream the stats cards. You can wrap them individually or together */}
        <Suspense fallback={<DeadlinesPageSkeleton showList={false} />}>
          <StatsCards
            messages={messages.deadlines.statistics}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function StatsCards({
  messages,
}: {
  messages: ReturnType<typeof getMessages>["deadlines"]["statistics"];
}) {
  const session = await requireSession();
  const uid = session.uid;
  const state = await getCachedUserState(uid);
  //await new Promise(resolve => setTimeout(resolve, 3000));

  const weekStats = getCurrentWeekStats("week", state);
  const monthStats = getCurrentWeekStats("month", state);
  const yearStats = getCurrentWeekStats("year", state);

  return (
    <>
      <StatsCard
        stats={weekStats}
        title={messages.thisWeek}
        subjects={state.subjects}
        subjectGroups={state.subjectGroups}
      />
      <StatsCard
        stats={monthStats}
        title={messages.thisMonth}
        subjects={state.subjects}
        subjectGroups={state.subjectGroups}
      />
      <StatsCard
        stats={yearStats}
        title={messages.thisYear}
        subjects={state.subjects}
        subjectGroups={state.subjectGroups}
      />
    </>
  );
}

async function DeadlinesListContainer() {
  const session = await requireSession();
  const uid = session.uid;
  const state = await getCachedUserState(uid);
  //await new Promise(resolve => setTimeout(resolve, 3000));
  return <DeadlinesList deadlines={state.deadlines} />;
}
