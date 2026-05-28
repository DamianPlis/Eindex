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
import RemindersListSkeleton from "@/components/skeletons/RemindersListSkeleton";
import ScheduleListSkeleton from "@/components/skeletons/ScheduleListSkeleton";
import a from "@/components/layout/AppShell.module.css";
import d from "@/components/deadlines/Deadlines.module.css";
import u from "@/components/ui/shared.module.css";

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
  const isToday = selectedISO === todayISO;
  const currentDay = isToday ? messages.home.today : messages.home.tomorrow;

  return (
    <div className={a.mainContainer}>
      <div className={a.mainHeader}>
        <h2 className={a.mainTitle}>
          {currentDay} - {selectedISO}
        </h2>
        {todayISO === selectedISO ? (
          <Link
            className={`${u.primaryButton} ${a.mainDateButton}`}
            href={localizePath(locale, `/?date=${tomorrowISO}`)}
          >
            {messages.home.tomorrow}
          </Link>
        ) : (
          <Link
            className={`${u.primaryButton} ${a.mainDateButton}`}
            href={localizePath(locale, `/`)}
          >
            {messages.home.today}
          </Link>
        )}
      </div>
      <Suspense
        key={`reminders-${selectedISO}`}
        fallback={<RemindersListSkeleton />}
      >
        <RemindersContainer
          uid={session.uid}
          locale={locale}
          messages={messages}
          selectedISO={selectedISO}
          isToday={isToday}
        />
      </Suspense>

      <Suspense
        key={`schedule-${selectedISO}`}
        fallback={<ScheduleListSkeleton />}
      >
        <ScheduleListContainer
          uid={session.uid}
          messages={messages}
          selectedDateISO={selectedISO}
          isToday={isToday}
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
  isToday,
}: {
  uid: string;
  locale: AppLocale;
  messages: ReturnType<typeof getMessages>;
  selectedISO: string;
  isToday: boolean;
}) {
  const state = await getUserState(uid);
  const deadlines = splitDeadlines(state.deadlines, selectedISO);

  return (
    <>
      <div className={d.remindersSection}>
        {deadlines.length > 0 ? (
          deadlines.map((item) => (
            <div key={item.id} className={d.reminderCard}>
              <div className={d.reminderContent}>
                <div>
                  <Link
                    className={u.inlineLink}
                    href={localizePath(
                      locale,
                      `/deadlines/${item.id}?redirect=main`,
                    )}
                  >
                    {item.text}
                  </Link>
                  <div className={d.reminderDate}>{item.date}</div>
                  <div className={d.reminderRelativeDate}>
                    {formatDeadlineRelativeLabel(item.date, locale)}
                  </div>
                </div>
                <StatusPill status={item.status} />
              </div>
            </div>
          ))
        ) : (
          <div className={d.emptyState}>
            {isToday
              ? messages.home.noDeadlinesForToday
              : messages.home.noDeadlinesForTomorrow}
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
  isToday,
}: {
  uid: string;
  messages: ReturnType<typeof getMessages>;
  selectedDateISO: string;
  isToday: boolean;
}) {
  const [state, scrapedLunch] = await Promise.all([
    getCachedUserState(uid),
    getLunchPerDay(),
  ]);
  const slots = pickTodaySchedule(state, selectedDateISO);

  // Merge: scraped data takes priority, fall back to user-stored lunches
  const lunchPerDay: Record<string, string> = {
    ...state.lunches,
    ...scrapedLunch,
  };

  return (
    <div className={d.scheduleList}>
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
          const lunchText = isLunch ? (lunchPerDay[selectedDateISO] || messages.home.menuUnavailable || "Menu unavailable") : "";
          const title = slot.fixed
            ? getFixedSlotDisplayName(slot, messages)
            : getSubjectDisplayName(subject, messages) || slot.topic || "-";

          let subtitle = "";
          if (isLunch && lunchText) {
            subtitle = lunchText;
          } else if (slot.fixed && slot.allowTopic && slot.topic) {
            subtitle = slot.topic;
          } else if (!slot.fixed && slot.topic) {
            subtitle = slot.topic;
          }

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
        <div className={d.emptyState}>
          {isToday
            ? messages.home.noScheduleForToday
            : messages.home.noScheduleForTomorrow}
        </div>
      )}
    </div>
  );
}
