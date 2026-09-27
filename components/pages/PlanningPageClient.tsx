"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { setSlotSubjectAction, setSlotTopicAction } from "@/app/(app)/actions";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import ArrowLeft from "@/icons/chevron-left.svg";
import ArrowRight from "@/icons/chevron-right.svg";
import DoubleArrowLeft from "@/icons/chevrons-left.svg";
import DoubleArrowRight from "@/icons/chevrons-right.svg";
import { localizePath } from "@/lib/i18n/routing";
import { formatEuropeanDate } from "@/lib/schedule/date-utils";
import type { DaySchedule, Slot, Subject } from "@/lib/schedule/types";
import { getClientId } from "@/lib/sync/client-id";
import s from "./PlanningPageClient.module.css";
import { PlanningSlotCard } from "./PlanningSlotCard";
import { usePlanningDayScroll } from "./usePlanningDayScroll";

type PlanningPageClientProps = {
  weekStart: string;
  currentYear: number;
  currentWeekStart: string;
  prevWeek: string;
  nextWeek: string;
  days: DaySchedule[];
  subjects: Subject[];
};

function getFallbackDayLabels(isoDateStr: string, currentYear: number) {
  const formattedDate = formatEuropeanDate(isoDateStr, currentYear);
  return {
    shortName: formattedDate,
    longName: formattedDate,
    shortDate: formattedDate,
  };
}

function createUtcDate(isoDateStr: string) {
  const match = isoDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) return null;
  return utcDate;
}

function getDayLabels(
  isoDateStr: string,
  currentYear: number,
  weekdayFormatters: { short: Intl.DateTimeFormat; long: Intl.DateTimeFormat },
) {
  const utcDate = createUtcDate(isoDateStr);
  if (!utcDate) return getFallbackDayLabels(isoDateStr, currentYear);

  return {
    shortName: weekdayFormatters.short.format(utcDate),
    longName: weekdayFormatters.long.format(utcDate),
    shortDate: formatEuropeanDate(isoDateStr, currentYear),
  };
}

function getWeekOffsetInDays(
  displayedWeekStart: string,
  currentWeekStart: string,
) {
  const displayedWeekDate = new Date(displayedWeekStart);
  const currentWeekDate = new Date(currentWeekStart);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return (
    (displayedWeekDate.getTime() - currentWeekDate.getTime()) /
    millisecondsPerDay
  );
}

function computeNextSubjectOverrides(
  current: Record<string, string | null>,
  subjectsBySlot: Record<string, string | null>,
  pendingUpdates: Record<string, string | null>,
) {
  const slotIds = Object.keys(current);
  if (slotIds.length === 0) return current;

  let changed = false;
  const next: Record<string, string | null> = { ...current };

  for (const slotId of slotIds) {
    const hasServerSlot = Object.prototype.hasOwnProperty.call(
      subjectsBySlot,
      slotId,
    );
    if (!hasServerSlot) {
      delete next[slotId];
      delete pendingUpdates[slotId];
      changed = true;
      continue;
    }

    const serverValue = subjectsBySlot[slotId];
    const hasPending = Object.prototype.hasOwnProperty.call(
      pendingUpdates,
      slotId,
    );
    const pendingValue = hasPending ? pendingUpdates[slotId] : null;

    if (hasPending && pendingValue === serverValue) {
      delete next[slotId];
      delete pendingUpdates[slotId];
      changed = true;
      continue;
    }

    if (!hasPending) {
      delete next[slotId];
      changed = true;
    }
  }

  return changed ? next : current;
}

export default function PlanningPageClient({
  weekStart,
  currentYear,
  currentWeekStart,
  prevWeek,
  nextWeek,
  days,
  subjects,
}: PlanningPageClientProps) {
  const locale = useAppLocale();
  const messages = useMessages();
  const dayLabels = useMemo(() => {
    const weekdayFormatters = {
      short: new Intl.DateTimeFormat(locale, {
        weekday: "short",
        timeZone: "UTC",
      }),
      long: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        timeZone: "UTC",
      }),
    };
    return days.map((day) =>
      getDayLabels(day.date, currentYear, weekdayFormatters),
    );
  }, [days, locale, currentYear]);
  // Keep the opening order across server refreshes. New subjects join at the end.
  const [subjectOrder, setSubjectOrder] = useState(() =>
    subjects.map((subject) => subject.id),
  );
  const knownIds = new Set(subjectOrder);
  const addedIds = subjects
    .filter((subject) => !knownIds.has(subject.id))
    .map((subject) => subject.id);
  if (addedIds.length > 0) setSubjectOrder([...subjectOrder, ...addedIds]);
  const subjectsById = new Map(
    subjects.map((subject) => [subject.id, subject]),
  );
  const stableSubjects = subjectOrder
    .map((id) => subjectsById.get(id))
    .filter((subject): subject is Subject => Boolean(subject));
  const { containerRef, activeDayIndex, setActiveDayIndex } =
    usePlanningDayScroll(days, weekStart);
  const pendingSubjectUpdatesRef = useRef<Record<string, string | null>>({});
  const lastSyncedTopicsRef = useRef<Record<string, string>>({});
  const clientIdRef = useRef("");
  const [, startTransition] = useTransition();

  const [subjectOverrides, setSubjectOverrides] = useState<
    Record<string, string | null>
  >({});
  const [topicOverrides, setTopicOverrides] = useState<Record<string, string>>(
    {},
  );

  const weekOffsetInDays = getWeekOffsetInDays(weekStart, currentWeekStart);
  const isShowingCurrentWeek = weekOffsetInDays === 0;
  const isShowingFutureWeek = weekOffsetInDays > 0;
  const isShowingPastWeek = weekOffsetInDays < 0;
  const isAtLeastTwoWeeksFromCurrent = Math.abs(weekOffsetInDays) >= 14;

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

  useEffect(() => {
    const topics: Record<string, string> = {};
    const subjectsBySlot: Record<string, string | null> = {};
    for (const day of days) {
      for (const slot of day.slots) {
        topics[slot.id] = slot.topic || "";
        subjectsBySlot[slot.id] = slot.subjectId || null;
      }
    }
    lastSyncedTopicsRef.current = topics;

    setSubjectOverrides((current) =>
      computeNextSubjectOverrides(
        current,
        subjectsBySlot,
        pendingSubjectUpdatesRef.current,
      ),
    );
  }, [days, weekStart]);

  function currentSubjectValue(slot: Slot): string {
    if (slot.id in subjectOverrides) return subjectOverrides[slot.id] || "";
    return slot.subjectId || "";
  }

  function currentTopicValue(slot: Slot): string {
    if (slot.id in topicOverrides) return topicOverrides[slot.id];
    return slot.topic || "";
  }

  function updateSubject(
    dayIndex: number,
    slotIndex: number,
    slot: Slot,
    subjectId: string | null,
  ) {
    const nextSubjectId = subjectId || null;
    if ((currentSubjectValue(slot) || null) === nextSubjectId) return;

    pendingSubjectUpdatesRef.current[slot.id] = nextSubjectId;
    setSubjectOverrides((current) => ({
      ...current,
      [slot.id]: nextSubjectId,
    }));

    startTransition(async () => {
      try {
        await setSlotSubjectAction({
          weekStart,
          dayIndex,
          slotIndex,
          subjectId: nextSubjectId,
          writerId: clientIdRef.current,
        });
      } catch {
        setSubjectOverrides((current) => {
          if (!(slot.id in current)) return current;
          const next = { ...current };
          delete next[slot.id];
          return next;
        });
      } finally {
        delete pendingSubjectUpdatesRef.current[slot.id];
      }
    });
  }

  function updateTopicLocal(slot: Slot, topic: string) {
    setTopicOverrides((current) => ({
      ...current,
      [slot.id]: topic,
    }));
  }

  function commitTopic(
    dayIndex: number,
    slotIndex: number,
    slot: Slot,
    topic: string,
  ) {
    const previous =
      lastSyncedTopicsRef.current[slot.id] !== undefined
        ? lastSyncedTopicsRef.current[slot.id]
        : slot.topic || "";
    if (topic === previous) return;
    startTransition(async () => {
      await setSlotTopicAction({
        weekStart,
        dayIndex,
        slotIndex,
        topic,
        writerId: clientIdRef.current,
      });
      lastSyncedTopicsRef.current[slot.id] = topic;
    });
  }

  function getTopicInputProps(slot: Slot, dayIndex: number, slotIndex: number) {
    return {
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        updateTopicLocal(slot, event.target.value),
      onBlur: (event: React.FocusEvent<HTMLInputElement>) =>
        commitTopic(dayIndex, slotIndex, slot, event.currentTarget.value),
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      },
    };
  }

  return (
    <div className={s.planningRoot} aria-live="polite">
      <div className={s.planningInner}>
        <div
          className={s.controls}
          role="region"
          aria-label={messages.planning.weekControls}
        >
          <div className={s.navGroup}>
            {!isShowingCurrentWeek &&
            isShowingFutureWeek &&
            isAtLeastTwoWeeksFromCurrent ? (
              <Link
                className={s.navShowCurrentWeek}
                href={localizePath(
                  locale,
                  `/planning?week=${encodeURIComponent(currentWeekStart)}`,
                )}
              >
                <DoubleArrowLeft fill="currentColor" />
              </Link>
            ) : null}

            <Link
              className={s.navBtn}
              href={localizePath(
                locale,
                `/planning?week=${encodeURIComponent(prevWeek)}`,
              )}
            >
              <ArrowLeft fill="currentColor" />
            </Link>
          </div>
          <div className={s.weekTitle}>
            {messages.planning.weekStarts}{" "}
            {formatEuropeanDate(weekStart, currentYear)}
          </div>
          <div className={s.navGroup}>
            <Link
              className={s.navBtn}
              href={localizePath(
                locale,
                `/planning?week=${encodeURIComponent(nextWeek)}`,
              )}
            >
              <ArrowRight fill="currentColor" />
            </Link>

            {!isShowingCurrentWeek &&
            isShowingPastWeek &&
            isAtLeastTwoWeeksFromCurrent ? (
              <Link
                className={s.navShowCurrentWeek}
                href={localizePath(
                  locale,
                  `/planning?week=${encodeURIComponent(currentWeekStart)}`,
                )}
              >
                <DoubleArrowRight fill="currentColor" />
              </Link>
            ) : null}
          </div>
        </div>

        <div
          className={s.planningDayTabs}
          role="tablist"
          aria-label={messages.planning.days}
        >
          {days.map((day, dayIndex) => {
            const labels = dayLabels[dayIndex];
            const isActive = dayIndex === activeDayIndex;
            return (
              <button
                key={day.date}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? s.planningDayTabActive : s.planningDayTab}
                onClick={() => setActiveDayIndex(dayIndex)}
              >
                <span className={s.planningDayTabName}>{labels.shortName}</span>
                <span className={s.planningDayTabDate}>{labels.shortDate}</span>
              </button>
            );
          })}
        </div>

        <div
          ref={containerRef}
          className={s.daysScroll}
          role="list"
          aria-label={messages.planning.days}
        >
          {days.map((day, dayIndex) => (
            <article key={day.date} className={s.dayCard} role="listitem">
              <div className={s.dayInner}>
                <header className={s.dayHeader}>
                  <div className={s.dayName}>
                    {dayLabels[dayIndex].longName}
                  </div>
                  <div className={s.dayDate}>
                    {dayLabels[dayIndex].shortDate}
                  </div>
                </header>

                <div className={s.slots}>
                  {day.slots.map((slot, slotIndex) => (
                    <PlanningSlotCard
                      key={slot.id}
                      slot={slot}
                      dayIndex={dayIndex}
                      slotIndex={slotIndex}
                      subjects={stableSubjects}
                      messages={messages}
                      currentSubjectValue={currentSubjectValue(slot)}
                      currentTopicValue={currentTopicValue(slot)}
                      updateSubject={updateSubject}
                      getTopicInputProps={getTopicInputProps}
                    />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
