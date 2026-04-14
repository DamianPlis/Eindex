import AddDeadline from "@/components/deadlines/AddDeadline";
import DeadlinesList from "@/components/deadlines/DeadlinesList";
import StatsCard from "@/components/deadlines/StatsCard";
import { getMessages } from "@/lib/i18n/messages";
import { assertLocale } from "@/lib/i18n/server";
import { getCurrentWeekStats } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

export default async function LocaleDeadlinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = assertLocale((await params).locale);
  const messages = getMessages(locale);
  const session = await requireSession();
  const state = await getUserState(session.uid);

  const weekStats = getCurrentWeekStats("week", state);
  const monthStats = getCurrentWeekStats("month", state);
  const yearStats = getCurrentWeekStats("year", state);

  return (
    <div className="deadlines-container">
      <h2 className="deadlines-title">{messages.deadlines.title}</h2>
      <AddDeadline />
      <DeadlinesList deadlines={state.deadlines} />

      <h2 className="deadlines-title">{messages.deadlines.statistics}</h2>
      <div className="stats-container">
        <StatsCard title={messages.deadlines.thisWeek} stats={weekStats} subjects={state.subjects} />
        <StatsCard title={messages.deadlines.thisMonth} stats={monthStats} subjects={state.subjects} />
        <StatsCard title={messages.deadlines.thisYear} stats={yearStats} subjects={state.subjects} />
      </div>
    </div>
  );
}
