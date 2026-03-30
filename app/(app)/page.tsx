import { getLunchPerDay } from "@/lib/lunch/server";
import { getTodayISO, pickTodaySchedule, splitDeadlines } from "@/lib/schedule/selectors";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import StatusPill from "@/components/deadlines/StatusPill";
import Link from "next/link";
import SlotBubble from "@/components/layout/SlotBubble";

export default async function MainPage() {
  const session = await requireSession();
  const [state, lunchPerDay] = await Promise.all([getUserState(session.uid), getLunchPerDay()]);
  const todayISO = getTodayISO();
  const slots = pickTodaySchedule(state, todayISO);
  const deadlines = splitDeadlines(state.deadlines);

  return (
    <div className="main-container">
      <h2 className="main-title">Today - {todayISO}</h2>

      <div className="reminders-section">
        {deadlines.length > 0 ? (
          deadlines.map((item) => (
            <div key={item.id} className="reminder-card">
              <div className="reminder-content">
                  <div style={{
                    // display: "flex",
                    // alignItems: "center",
                    // gap: 8,
                    // justifyContent: "space-between",
                  }}>
                      {/* <div className="reminder-title">{item.text}</div> */}
                      <Link className="inline-link" href={`/deadlines/${item.id}?redirect=${encodeURIComponent("main")}`}>
                          {item.text}
                      </Link>
                    <div className="reminder-date">{item.date}</div>
                    
                  </div>
                  <StatusPill status={item.status} />
              </div>
            </div>
          ))
        ) : (
          <div className="empty-reminders">No deadlines for today</div>
        )}
      </div>

      <div className="schedule-list">
        {slots.length > 0 ? (
          slots.map((slot) => {
            const subject = slot.subjectId
              ? state.subjects.find((s) => s.id === slot.subjectId) || null
              : null;
            const isLunch = slot.subjectId === "lunch" || /obed|lunch/i.test(slot.fixedLabel || "");
            const lunchText = isLunch ? lunchPerDay[todayISO] : "";
            const title = slot.fixed ? slot.fixedLabel || "Activity" : subject?.name || slot.topic || "-";

            let subtitle = "";
            if (isLunch && lunchText) subtitle = lunchText;
            if (slot.fixed && slot.allowTopic && slot.topic) subtitle = slot.topic;
            else if (!slot.fixed && slot.topic) subtitle = slot.topic;

            return (
              <SlotBubble
                key={slot.id}
                slot={slot}
                subject={subject}
                isLunch={isLunch}
                lunchText={lunchText}
                title={title}
                subtitle={subtitle}
              />
            );
          })
        ) : (
          <div className="empty-schedule">No schedule for today.</div>
        )}
      </div>
    </div>
  );
}
