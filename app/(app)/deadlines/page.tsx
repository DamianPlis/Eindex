import { isoDate } from "@/lib/schedule/defaults";
import { getWeekStats } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import AddDeadline from "@/components/deadlines/AddDeadline";
import type { ScheduleState } from "@/lib/schedule/types";
import StatsCard from "@/components/deadlines/StatsCard";
import DeadlinesList from "@/components/deadlines/DeadlinesList";

function renderStats(
  title: string,
  stats: Record<string, number>,
  state: ScheduleState,
) {
  return (
    <StatsCard title={title} stats={stats} subjects={state.subjects} />
  )
}

export default async function DeadlinesPage() {
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
  //const subjectMap = new Map(state.subjects.map((subject) => [subject.id, subject.name]));


  return (
    <div className="deadlines-container">
      <h2 className="deadlines-title">Homework Deadlines</h2>
      <AddDeadline />
      <DeadlinesList deadlines={state.deadlines}/>

      <h2 className="deadlines-title">Statistics</h2>
      <div className="stats-container">
        {renderStats("This Week", weekStats, state, )}
        {renderStats("This Month", monthStats, state, )}
        {renderStats("This Year", yearStats, state,)}
      </div>
    </div>
  );
}
