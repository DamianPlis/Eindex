import { getLunchPerDay } from "@/lib/lunch/server";
import { getTodayISO, pickTodaySchedule, splitDeadlines } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

function parseRange(timeStr: string) {
  if (!timeStr || !timeStr.includes("-")) return null;
  const [startRaw, endRaw] = timeStr.split("-").map((v) => v.trim());
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

function isCurrentSlot(timeStr: string) {
  const range = parseRange(timeStr);
  if (!range) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= range.start && minutes <= range.end;
}

function contrastColor(hex: string) {
  if (!hex || !hex.startsWith("#")) return "#000000";
  const parsed = parseInt(
    hex.slice(1).length === 3 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1),
    16,
  );
  if (Number.isNaN(parsed)) return "#000000";
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  const lum = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return lum > 0.6 ? "#000000" : "#ffffff";
}

function daysLate(dateISO: string, todayISO: string) {
  const due = new Date(`${dateISO}T00:00:00`);
  const today = new Date(`${todayISO}T00:00:00`);
  const diffMs = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default async function MainPage() {
  const session = await requireSession();
  const [state, lunchPerDay] = await Promise.all([getUserState(session.uid), getLunchPerDay()]);
  const todayISO = getTodayISO();
  const slots = pickTodaySchedule(state, todayISO);
  const { today: todaysDeadlines, expired } = splitDeadlines(state.deadlines, todayISO);
  const upcomingCount = state.deadlines.filter((item) => item.date > todayISO).length;
  const overdueItems = [...expired].sort(
    (a, b) => b.date.localeCompare(a.date) || a.text.localeCompare(b.text),
  );

  return (
    <div className="dashboard-page page-enter">
      <header className="page-hero">
        <div>
          <p className="page-kicker">Dashboard</p>
          <h1 className="page-title">Today</h1>
        </div>
        <p className="page-date">{todayISO}</p>
      </header>

      <div className="summary-chips" aria-label="Today summary">
        <div className="summary-chip">
          <span className="chip-label">Due today</span>
          <span className="chip-value">{todaysDeadlines.length}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Overdue</span>
          <span className="chip-value">{overdueItems.length}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Upcoming</span>
          <span className="chip-value">{upcomingCount}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Slots</span>
          <span className="chip-value">{slots.length}</span>
        </div>
      </div>

      <section className="section-block">
        <div className="section-head">
          <h2>Due Today</h2>
        </div>
        {todaysDeadlines.length > 0 ? (
          <ul className="list-grid">
            {todaysDeadlines.map((item) => (
              <li key={item.id} className="list-card">
                <div>
                  <p className="list-title">{item.text}</p>
                  <p className="list-sub">{item.date}</p>
                </div>
                <span className="status-pill is-today">Due today</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No reminders for today.</div>
        )}
      </section>

      {overdueItems.length > 0 ? (
        <section className="section-block">
          <div className="section-head">
            <h2>Overdue</h2>
          </div>
          <ul className="list-grid">
            {overdueItems.map((item) => {
              const lateDays = daysLate(item.date, todayISO);
              const lateLabel = lateDays === 1 ? "1 day late" : `${lateDays} days late`;
              return (
                <li key={item.id} className="list-card is-overdue">
                  <div>
                    <p className="list-title">{item.text}</p>
                    <p className="list-sub">{item.date}</p>
                  </div>
                  <span className="status-pill is-overdue">{lateLabel}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-head">
          <h2>Today&apos;s Schedule</h2>
        </div>

        <div className="schedule-grid">
          {slots.length > 0 ? (
            slots.map((slot) => {
              const subject = slot.subjectId
                ? state.subjects.find((s) => s.id === slot.subjectId) || null
                : null;
              const isLunch = slot.subjectId === "lunch" || /obed|lunch/i.test(slot.fixedLabel || "");
              const lunchText = isLunch ? lunchPerDay[todayISO] : "";
              const isLive = isCurrentSlot(slot.time);
              const bg = slot.fixed ? "#ffd0df" : subject?.color || "#e2e8f0";
              const color = contrastColor(bg);
              const title = slot.fixed ? slot.fixedLabel || "Activity" : subject?.name || slot.topic || "-";

              let subtitle = "";
              if (isLunch && lunchText) subtitle = `Meal: ${lunchText}`;
              else if (slot.fixed && slot.allowTopic && slot.topic) subtitle = slot.topic;
              else if (!slot.fixed && slot.topic) subtitle = slot.topic;

              return (
                <article
                  key={slot.id}
                  className={`schedule-card ${isLive ? "is-active" : ""}`}
                  style={{ backgroundColor: bg, color }}
                >
                  <div className="schedule-main">
                    <p className="schedule-title">{title}</p>
                    {subtitle ? <p className="schedule-sub">{subtitle}</p> : null}
                  </div>
                  <div className="schedule-side">
                    <span className="schedule-time">{slot.time}</span>
                    <span className={`status-pill ${isLive ? "is-today" : "is-neutral"}`}>
                      {isLive ? "Now" : slot.fixed ? "Fixed" : "Planned"}
                    </span>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">No schedule for today.</div>
          )}
        </div>
      </section>
    </div>
  );
}
