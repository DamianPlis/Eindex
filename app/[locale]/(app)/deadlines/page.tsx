import AddDeadline from "@/components/deadlines/AddDeadline";
import DeadlinesList from "@/components/deadlines/DeadlinesList";
import StatsCard from "@/components/deadlines/StatsCard";
import { getMessages } from "@/lib/i18n/messages";
import { assertLocale } from "@/lib/i18n/server";
import { isoDate } from "@/lib/schedule/defaults";
import { getWeekStats } from "@/lib/schedule/selectors";
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

  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);

  const weekStats = getWeekStats(state, isoDate(weekStart), isoDate(weekEnd));
  const monthStats = getWeekStats(state, isoDate(monthStart), isoDate(monthEnd));
  const yearStats = getWeekStats(state, isoDate(yearStart), isoDate(yearEnd));

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
