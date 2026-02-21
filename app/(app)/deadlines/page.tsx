import Link from "next/link";
import { addDeadlineAction, removeDeadlineAction } from "@/app/(app)/actions";
import { isoDate } from "@/lib/schedule/defaults";
import { getWeekStats } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

function renderStats(
  title: string,
  stats: Record<string, number>,
  subjectMap: Map<string, string>,
) {
  return (
    <div className="stats-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {Object.keys(stats).length === 0 ? (
        <p>No data</p>
      ) : (
        <ul>
          {Object.entries(stats).map(([subjectId, count]) => (
            <li key={subjectId}>
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

      <form action={addDeadlineAction} className="add-form">
        <input
          type="text"
          name="text"
          placeholder="Homework description"
          className="add-input add-input-text"
          required
        />
        <input type="date" name="date" className="add-input add-input-date" required />
        <button type="submit" className="add-button">
          Add
        </button>
      </form>

      <ul className="deadlines-list">
        {state.deadlines.length === 0 ? <p>No deadlines yet</p> : null}
        {state.deadlines.map((deadline) => {
          const isExpired = deadline.date < todayISO;
          const isToday = deadline.date === todayISO;
          const statusClass = isToday ? "today" : isExpired ? "expired" : "upcoming";

          return (
            <li key={deadline.id} className={`deadline-item ${statusClass}`}>
              <span>
                <Link className="inline-link" href={`/deadlines/${deadline.id}`}>
                  {deadline.text}
                </Link>{" "}
                - {deadline.date}
              </span>
              <form action={removeDeadlineAction}>
                <input type="hidden" name="id" value={deadline.id} />
                <button className="remove-button" type="submit">
                  x
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <h2 className="deadlines-title">Statistics</h2>
      <div className="stats-container">
        {renderStats("This Week", weekStats, subjectMap)}
        {renderStats("This Month", monthStats, subjectMap)}
        {renderStats("This Year", yearStats, subjectMap)}
      </div>
    </div>
  );
}
