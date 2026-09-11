import type { Metadata } from "next";
import Link from "next/link";
import ArrowRightIcon from "@/icons/arrow_right_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import CalendarIcon from "@/icons/calendar_month_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import CheckIcon from "@/icons/check_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
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
  selectDashboardDeadlines,
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
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "home", locale });
}

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
}: {
  uid: string;
  locale: AppLocale;
  messages: ReturnType<typeof getMessages>;
  selectedISO: string;
}) {
  const state = await getUserState(uid);
  const deadlineSelection = selectDashboardDeadlines(
    state.deadlines,
    selectedISO,
  );
  const isAttentionMode = deadlineSelection.mode === "attention";
  const panelTitle = isAttentionMode
    ? messages.home.attentionTitle
    : messages.home.upcomingTitle;

  return (
    <section
      className={d.remindersPanel}
      aria-labelledby="dashboard-deadlines-title"
    >
      <header className={d.remindersHeader}>
        <div className={d.remindersHeadingGroup}>
          <span className={d.remindersIcon} aria-hidden="true">
            <CalendarIcon fill="currentColor" />
          </span>
          <div>
            <p className={d.remindersEyebrow}>
              {messages.home.deadlinesOverview}
            </p>
            <h3 id="dashboard-deadlines-title" className={d.remindersTitle}>
              {deadlineSelection.mode === "empty"
                ? messages.home.allClearTitle
                : panelTitle}
            </h3>
          </div>
        </div>
        <Link
          className={d.remindersViewAll}
          href={localizePath(locale, "/deadlines")}
        >
          <span>{messages.home.viewAllDeadlines}</span>
          <ArrowRightIcon fill="currentColor" aria-hidden="true" />
        </Link>
      </header>

      {deadlineSelection.mode === "empty" ? (
        <div className={d.remindersEmptyState}>
          <span className={d.remindersEmptyIcon} aria-hidden="true">
            <CheckIcon fill="currentColor" />
          </span>
          <p>{messages.home.allClearDescription}</p>
        </div>
      ) : (
        <ul>
          {deadlineSelection.items.map((item) => (
            <li key={item.id}>
              <div className={d.deadlineItem}>
                <span className={d.reminderBody}>
                  <Link
                    href={localizePath(
                      locale,
                      `/deadlines/${item.id}?redirect=main`,
                    )}
                    className={u.inlineLink}
                  >
                    {item.text}
                  </Link>
                  <span className={d.reminderTiming}>
                    <time dateTime={item.date}>{item.date}</time>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatDeadlineRelativeLabel(item.date, locale)}
                    </span>
                  </span>
                </span>
                <StatusPill status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
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
          const lunchText = isLunch
            ? lunchPerDay[selectedDateISO] ||
              messages.home.menuUnavailable ||
              "Menu unavailable"
            : "";
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
