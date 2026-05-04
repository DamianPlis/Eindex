import Link from "next/link";
import StatusPill from "@/components/deadlines/StatusPill";
import SlotBubble from "@/components/layout/SlotBubble";
import { localizePath } from "@/lib/i18n/routing";
import { getMessages } from "@/lib/i18n/messages";
import { assertLocale } from "@/lib/i18n/server";
import {
  getSubjectDisplayName,
  getFixedSlotDisplayName,
} from "@/lib/schedule/labels";
import {
  formatDeadlineRelativeLabel,
  getTodayISO,
  getTomorrowISO,
  pickTodaySchedule,
  splitDeadlines,
} from "@/lib/schedule/selectors";
import { getCachedUserState, getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { getLunchPerDay } from "@/lib/lunch/server";
import { AppLocale } from "@/lib/i18n/config";
import { Suspense } from "react";
import RemidersListSkeleton from "@/components/skeletons/RemidersListSkeleton";
import ScheduleListSkeleton from "@/components/skeletons/ScheduleListSkeleton";

export default async function LocaleMainPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; iso?: string }>;
}) {
  const locale = assertLocale((await params).locale);
  const query = await searchParams;
  const messages = getMessages(locale);
  const session = await requireSession();
  const selectedISO = getSelectedDateISO(query.date);
  const todayISO = getTodayISO();
  const tomorrowISO = getTomorrowISO();

  return (
    <div className="main-container">
      <div className="main-header">
        <h2 className="main-title">
          {messages.home.today} - {selectedISO}
        </h2>
        {todayISO === selectedISO ? (
          <Link
            className="add-button main-date-button"
            href={localizePath(locale, `/?date=${tomorrowISO}`)}
          >
            {messages.home.tomorrow}
          </Link>
        ) : (
          <Link
            className="add-button main-date-button"
            href={localizePath(locale, `/`)}
          >
            {messages.common.today}
          </Link>
        )}
      </div>
      <Suspense fallback={<RemidersListSkeleton />}>
        <RemindersContainer
          uid={session.uid}
          locale={locale}
          messages={messages}
          selectedISO={selectedISO}
        />
      </Suspense>

      <Suspense fallback={<ScheduleListSkeleton />}>
        <ScheduleListContainer
          uid={session.uid}
          messages={messages}
          selectedDateISO={selectedISO}
        />
      </Suspense>
    </div>
  );
}

function getSelectedDateISO(dateParam?: string): string {
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return dateParam;
  }
  return getTodayISO();
}

async function RemindersContainer({
  uid,
  locale,
  messages,
  selectedISO,
}: {
  uid: string;
  locale: AppLocale;
  messages: ReturnType<typeof getMessages>;
  selectedISO: string;
}) {
  const state = await getUserState(uid);
  const deadlines = splitDeadlines(state.deadlines, selectedISO);
  //const delay = new Promise(resolve => setTimeout(resolve, 70000));
  //await delay; // Simulate loading delay for demonstration purposes

  return (
    <>
      <div className="reminders-section">
        {deadlines.length > 0 ? (
          deadlines.map((item) => (
            <div key={item.id} className="reminder-card">
              <div className="reminder-content">
                <div>
                  <Link
                    className="inline-link"
                    href={localizePath(
                      locale,
                      `/deadlines/${item.id}?redirect=main`,
                    )}
                  >
                    {item.text}
                  </Link>
                  <div className="reminder-date">{item.date}</div>
                  <div className="reminder-date reminder-relative-date">
                    {formatDeadlineRelativeLabel(item.date, locale)}
                  </div>
                </div>
                <StatusPill status={item.status} />
              </div>
            </div>
          ))
        ) : (
          <div className="empty-reminders">
            {messages.home.noDeadlinesForToday}
          </div>
        )}
      </div>
    </>
  );
}

async function ScheduleListContainer({
  uid,
  messages,
  selectedDateISO,
}: {
  uid: string;
  messages: ReturnType<typeof getMessages>;
  selectedDateISO: string;
}) {
  const [state, lunchPerDay] = await Promise.all([
    getCachedUserState(uid),
    getLunchPerDay(),
  ]);
  //const delay = new Promise(resolve => setTimeout(resolve, 70000));
  //await delay; // Simulate loading delay for demonstration purposes
  const slots = pickTodaySchedule(state, selectedDateISO);

  return (
    <div className="schedule-list">
      {slots.length > 0 ? (
        slots.map((slot) => {
          const subject = slot.subjectId
            ? state.subjects.find(
                (stateSubject) => stateSubject.id === slot.subjectId,
              ) || null
            : null;
          const isLunch =
            slot.subjectId === "lunch" ||
            slot.fixedKey === "lunch" ||
            /obed|lunch/i.test(slot.fixedLabel || "");
          const lunchText = isLunch ? lunchPerDay[selectedDateISO] : "";
          const title = slot.fixed
            ? getFixedSlotDisplayName(slot, messages)
            : getSubjectDisplayName(subject, messages) || slot.topic || "-";

          let subtitle = "";
          if (isLunch && lunchText) subtitle = lunchText;
          if (slot.fixed && slot.allowTopic && slot.topic)
            subtitle = slot.topic;
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
        <div className="empty-schedule">{messages.home.noScheduleForToday}</div>
      )}
    </div>
  );
}
