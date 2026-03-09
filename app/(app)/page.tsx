import { getLunchPerDay } from "@/lib/lunch/server";
import { getTodayISO, pickTodaySchedule, splitDeadlines } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import Image from "next/image";

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

export default async function MainPage() {
  const session = await requireSession();
  const [state, lunchPerDay] = await Promise.all([getUserState(session.uid), getLunchPerDay()]);
  const todayISO = getTodayISO();
  const slots = pickTodaySchedule(state, todayISO);
  const { today: todaysReminders, expired } = splitDeadlines(state.deadlines, todayISO);

  return (
    <div className="main-container">
      <h2 className="main-title">Today - {todayISO}</h2>

      <div className="reminders-section">
        {todaysReminders.length > 0 ? (
          todaysReminders.map((item) => (
            <div key={item.id} className="reminder-card">
              <div className="reminder-content">
                <div>
                  <div className="reminder-title">{item.text}</div>
                  <div className="reminder-date">{item.date}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-reminders">No reminders for today</div>
        )}
      </div>

      {expired.length > 0 ? (
        <div className="expired-section">
          <h3>Expired deadlines</h3>
          {expired.map((item) => (
            <div key={item.id} className="expired-card">
              <div className="expired-text">{item.text}</div>
              <div className="reminder-date">{item.date}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="schedule-list">
        {slots.length > 0 ? (
          slots.map((slot) => {
            const subject = slot.subjectId
              ? state.subjects.find((s) => s.id === slot.subjectId) || null
              : null;
            const isLunch = slot.subjectId === "lunch" || /obed|lunch/i.test(slot.fixedLabel || "");
            const lunchText = isLunch ? lunchPerDay[todayISO] : "";
            const bg = slot.fixed ? "#ff7fbf" : subject?.color || "#ffffff";
            const color = contrastColor(bg);
            const title = slot.fixed ? slot.fixedLabel || "Activity" : subject?.name || slot.topic || "-";

            let subtitle = "";
            if (isLunch && lunchText) subtitle = lunchText;
            if (slot.fixed && slot.allowTopic && slot.topic) subtitle = slot.topic;
            else if (!slot.fixed && slot.topic) subtitle = slot.topic;

            return (
              <div
                key={slot.id}
                className={`slot-bubble ${isCurrentSlot(slot.time) ? "active" : ""}`}
                style={{ background: bg, color }}
              >
                <div className="slot-content">
                  <div>
                    <div className="slot-title-text">{title}</div>
                    {subtitle ? <div className="slot-subtitle">
                      {isLunch && lunchText ? 
                      <Image src="/restaurant_24dp_999999_FILL0_wght400_GRAD0_opsz24.svg" alt="Lunch" width={16} height={16} style={{ verticalAlign: "middle" }} />
                       : null}
                       {subtitle}</div> : null}
                  </div>
                  <div className="slot-time-text">{slot.time}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-schedule">No schedule for today.</div>
        )}
      </div>
    </div>
  );
}
