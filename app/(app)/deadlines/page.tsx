import Link from "next/link";
import { isoDate } from "@/lib/schedule/defaults";
import { getWeekStats } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import RemoveDeadline from "@/components/deadlines/RemoveDeadline"
import AddDeadline from "@/components/deadlines/AddDeadline";
import StatusPill from "@/components/deadlines/StatusPill";
import type { ScheduleState } from "@/lib/schedule/types";
import SortIcon from "@/icons/sort_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import FilterIcon from "@/icons/filter_list_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

function renderStats(
  title: string,
  stats: Record<string, number>,
  subjectMap: Map<string, string>,
  state: ScheduleState,
) {
  return (
    <div className="stats-card">
        <div className="stats-card-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <div className="stats-card-header-icons">
              <SortIcon alt="Sort stats" fill="currentColor" className="stats-card-header-icon"/>
              <FilterIcon alt="Filter stats" fill="currentColor" className="stats-card-header-icon" />
          </div>
        </div>
      {Object.keys(stats).length === 0 ? (
        <p>No data</p>
      ) : (
        <ul>
          {Object.entries(stats).map(([subjectId, count]) => (
            <li key={subjectId} className="stats-entry" style={{
              backgroundColor: `${state.subjects.find((s) => s.id === subjectId)?.color || "#000000"}55`,
            }}>
              {subjectMap.get(subjectId) || subjectId}: {count} times
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function DeadlinesPage() {
  const session = await requireSession();
  const state = await getUserState(session.uid);

  const todayISO = isoDate(new Date());
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
  const subjectMap = new Map(state.subjects.map((subject) => [subject.id, subject.name]));

  return (
    <div className="deadlines-container">
      <h2 className="deadlines-title">Homework Deadlines</h2>
      <AddDeadline />
      <ul className="deadlines-list">
        {state.deadlines.length === 0 ? <p>No deadlines yet</p> : null}
        {state.deadlines.map((deadline) => {
          const isExpired = deadline.date < todayISO;
          const isToday = deadline.date === todayISO;


          return (
            <li key={deadline.id} className={`deadline-item`}>
              <span>
                <Link className="inline-link" href={`/deadlines/${deadline.id}`}>
                  {deadline.text}
                </Link>{" "}
                - {deadline.date}
              </span>
              <div className="deadline-actions">
                <StatusPill status={isExpired ? "expired" : isToday ? "today" : "upcoming"} />
                <RemoveDeadline deadline={deadline} />
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="deadlines-title">Statistics</h2>
      <div className="stats-container">
        {renderStats("This Week", weekStats, subjectMap, state)}
        {renderStats("This Month", monthStats, subjectMap, state)}
        {renderStats("This Year", yearStats, subjectMap, state)}
      </div>
    </div>
  );
}
