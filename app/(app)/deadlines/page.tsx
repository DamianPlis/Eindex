import Link from "next/link";
import AddDeadline from "@/components/deadlines/AddDeadline";
import RemoveDeadline from "@/components/deadlines/RemoveDeadline";
import { isoDate } from "@/lib/schedule/defaults";
import { getWeekStats } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import type { DeadlineItem, ScheduleState } from "@/lib/schedule/types";

function withAlpha(hex: string, alpha: number) {
  const cleaned = hex.trim().replace(/^#/, "");
  const expanded =
    cleaned.length === 3 ? cleaned.split("").map((char) => `${char}${char}`).join("") : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return `rgba(45, 91, 255, ${alpha})`;

  const parsed = parseInt(expanded, 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function sortByDate(items: DeadlineItem[]) {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || a.text.localeCompare(b.text));
}

function renderStats(
  title: string,
  stats: Record<string, number>,
  subjectMap: Map<string, string>,
  state: ScheduleState,
) {
  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <article className="stats-card">
      <h3 className="stats-card-title">{title}</h3>
      {entries.length === 0 ? (
        <p className="empty-state">No study data in this range.</p>
      ) : (
        <ul className="stats-list">
          {entries.map(([subjectId, count]) => {
            const color = state.subjects.find((subject) => subject.id === subjectId)?.color || "#2d5bff";
            return (
              <li key={subjectId} className="stats-entry" style={{ backgroundColor: withAlpha(color, 0.22) }}>
                <span>{subjectMap.get(subjectId) || subjectId}</span>
                <span>{count} times</span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function renderDeadlineSection(
  title: string,
  items: DeadlineItem[],
  statusLabel: string,
  statusClass: "is-today" | "is-upcoming" | "is-overdue",
  emptyMessage: string,
) {
  return (
    <section className="section-block">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <ul className="deadline-list">
          {items.map((deadline) => (
            <li key={deadline.id} className={`deadline-row ${statusClass}`}>
              <div className="deadline-main">
                <Link className="deadline-link" href={`/deadlines/${deadline.id}`}>
                  {deadline.text}
                </Link>
                <div className="deadline-date">{deadline.date}</div>
              </div>
              <div className="deadline-actions">
                <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
                <RemoveDeadline deadline={deadline} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
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

  const sortedDeadlines = sortByDate(state.deadlines);
  const todayItems = sortedDeadlines.filter((deadline) => deadline.date === todayISO);
  const upcomingItems = sortedDeadlines.filter((deadline) => deadline.date > todayISO);
  const overdueItems = sortedDeadlines
    .filter((deadline) => deadline.date < todayISO)
    .sort((a, b) => b.date.localeCompare(a.date) || a.text.localeCompare(b.text));

  return (
    <div className="deadline-page page-enter">
      <header className="page-hero">
        <div>
          <p className="page-kicker">Assignments</p>
          <h1 className="page-title">Deadlines</h1>
        </div>
      </header>

      <section className="section-block">
        <div className="section-head">
          <h2>Add New</h2>
        </div>
        <AddDeadline />
      </section>

      <div className="summary-chips" aria-label="Deadline summary">
        <div className="summary-chip">
          <span className="chip-label">Today</span>
          <span className="chip-value">{todayItems.length}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Upcoming</span>
          <span className="chip-value">{upcomingItems.length}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Overdue</span>
          <span className="chip-value">{overdueItems.length}</span>
        </div>
      </div>

      {renderDeadlineSection(
        "Today",
        todayItems,
        "Today",
        "is-today",
        "Nothing due today.",
      )}
      {renderDeadlineSection(
        "Upcoming",
        upcomingItems,
        "Upcoming",
        "is-upcoming",
        "No upcoming deadlines.",
      )}
      {renderDeadlineSection(
        "Overdue",
        overdueItems,
        "Overdue",
        "is-overdue",
        "No overdue deadlines.",
      )}

      <section className="section-block">
        <div className="section-head">
          <h2>Study Stats</h2>
        </div>
        <div className="stats-grid">
          {renderStats("This Week", weekStats, subjectMap, state)}
          {renderStats("This Month", monthStats, subjectMap, state)}
          {renderStats("This Year", yearStats, subjectMap, state)}
        </div>
      </section>
    </div>
  );
}
