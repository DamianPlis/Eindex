"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { setSlotSubjectAction, setSlotTopicAction } from "@/app/(app)/actions";
import { useAppLocale, useMessages } from "@/components/i18n/LocaleProvider";
import ArrowLeft from "@/icons/keyboard_arrow_left_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import ArrowRight from "@/icons/keyboard_arrow_right_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import DoubleArrowLeft from "@/icons/keyboard_double_arrow_left_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import DoubleArrowRight from "@/icons/keyboard_double_arrow_right_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import { localizePath } from "@/lib/i18n/routing";
import {
  getFixedSlotDisplayName,
  getSubjectDisplayName,
} from "@/lib/schedule/labels";
import type { DaySchedule, Slot, Subject } from "@/lib/schedule/types";
import { getClientId } from "@/lib/sync/client-id";
import s from "./PlanningPageClient.module.css";
import u from "@/components/ui/shared.module.css";

type PlanningPageClientProps = {
  weekStart: string;
  currentWeekStart: string;
  prevWeek: string;
  nextWeek: string;
  days: DaySchedule[];
  subjects: Subject[];
};

function safeHexToRgb(hex: string) {
  let h = (hex || "").trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function contrastForHex(hex: string, fallback = "#000000") {
  const rgb = safeHexToRgb(hex);
  if (!rgb) return fallback;
  const lum =
    0.2126 * (rgb.r / 255) + 0.7152 * (rgb.g / 255) + 0.0722 * (rgb.b / 255);
  return lum > 0.6 ? "#000000" : "#ffffff";
}

function getFallbackDayLabels(isoDateStr: string) {
  return {
    shortName: isoDateStr,
    longName: isoDateStr,
    shortDate: isoDateStr,
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

function getDayLabels(isoDateStr: string, locale: string) {
  const utcDate = createUtcDate(isoDateStr);
  if (!utcDate) return getFallbackDayLabels(isoDateStr);

  return {
    shortName: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(utcDate),
    longName: new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    }).format(utcDate),
    shortDate: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "numeric",
      timeZone: "UTC",
    }).format(utcDate),
  };
}

function formatDayLabel(isoDateStr: string, locale: string) {
  return getDayLabels(isoDateStr, locale).longName;
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

export default function PlanningPageClient({
  weekStart,
  currentWeekStart,
  prevWeek,
  nextWeek,
  days,
  subjects,
}: PlanningPageClientProps) {
  const locale = useAppLocale();
  const messages = useMessages();
  const planningRootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingSubjectUpdatesRef = useRef<Record<string, string | null>>({});
  const lastSyncedTopicsRef = useRef<Record<string, string>>({});
  const clientIdRef = useRef("");
  const isActiveDayIndexTriggeredByObserver = useRef(false);
  const activeDayIndexRef = useRef(0);
  const [, startTransition] = useTransition();

  const [activeDayIndex, setActiveDayIndex] = useState(0);

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
    activeDayIndexRef.current = activeDayIndex;
  }, [activeDayIndex]);

  useEffect(() => {
    const planningRoot = planningRootRef.current;
    if (!planningRoot) return;
    const container = containerRef.current;
    if (!container) return;
    const child = container.children.item(activeDayIndex);
    if (!child) return;
    if (isActiveDayIndexTriggeredByObserver.current) {
      isActiveDayIndexTriggeredByObserver.current = false;
      return;
    }
    try {
      child.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    } catch {
      container.scrollLeft = activeDayIndex * container.clientWidth;
    }
  }, [activeDayIndex, weekStart]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !days) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisibleIndex = 0;
        let highestRatio = 0;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > highestRatio) {
            highestRatio = entry.intersectionRatio;
            mostVisibleIndex = Array.from(el.children).indexOf(entry.target);
          }
        });

        if (
          mostVisibleIndex !== -1 &&
          mostVisibleIndex !== activeDayIndexRef.current
        ) {
          isActiveDayIndexTriggeredByObserver.current = true;
          setActiveDayIndex(mostVisibleIndex);
        }
      },
      {
        root: el,
        threshold: [0.51],
      },
    );

    Array.from(el.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [days]);

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

    setSubjectOverrides((current) => {
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
          delete pendingSubjectUpdatesRef.current[slotId];
          changed = true;
          continue;
        }

        const serverValue = subjectsBySlot[slotId];
        const hasPending = Object.prototype.hasOwnProperty.call(
          pendingSubjectUpdatesRef.current,
          slotId,
        );
        const pendingValue = hasPending
          ? pendingSubjectUpdatesRef.current[slotId]
          : null;

        if (hasPending && pendingValue === serverValue) {
          delete next[slotId];
          delete pendingSubjectUpdatesRef.current[slotId];
          changed = true;
          continue;
        }

        if (!hasPending) {
          delete next[slotId];
          changed = true;
        }
      }

      return changed ? next : current;
    });
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

  return (
    <div ref={planningRootRef} className={s.planningRoot} aria-live="polite">
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
            {messages.planning.weekStarts} {weekStart}
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
            const labels = getDayLabels(day.date, locale);
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
                <span className={s.planningDayTabName}>
                  {labels.shortName}
                </span>
                <span className={s.planningDayTabDate}>
                  {labels.shortDate}
                </span>
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
                    {formatDayLabel(day.date, locale)}
                  </div>
                  <div className={s.dayDate}>{day.date}</div>
                </header>

                <div className={s.slots}>
                  {day.slots.map((slot, slotIndex) => {
                    const isFixed = slot.fixed;
                    const selectedSubject =
                      !isFixed && currentSubjectValue(slot)
                        ? subjects.find(
                            (subject) =>
                              subject.id === currentSubjectValue(slot),
                          ) || null
                        : null;
                    const slotBackground = isFixed
                      ? "#ff7fbf"
                      : selectedSubject?.color || null;
                    const slotStyle = slotBackground
                      ? {
                          background: slotBackground,
                          color: contrastForHex(slotBackground, "#000000"),
                        }
                      : undefined;
                    const slotTitle = isFixed
                      ? getFixedSlotDisplayName(slot, messages)
                      : getSubjectDisplayName(selectedSubject, messages) || "-";
                    const topicValue = currentTopicValue(slot);
                    const isFixedTopicSameAsLabel =
                      isFixed &&
                      Boolean(topicValue) &&
                      Boolean(slot.fixedLabel) &&
                      topicValue.trim().toLowerCase() ===
                        slot.fixedLabel.trim().toLowerCase();
                    const displayedFixedTopic = isFixedTopicSameAsLabel
                      ? ""
                      : topicValue;

                    return (
                      <div
                        key={slot.id}
                        className={s.slotCard}
                        style={slotStyle}
                      >
                        <div className={s.slotTop}>
                          <div className={s.slotTitle}>{slotTitle}</div>
                          <div className={s.slotTime}>{slot.time}</div>
                        </div>

                        <div className={s.slotBody}>
                          {!isFixed ? (
                            <>
                              <select
                                className={u.formInput}
                                value={currentSubjectValue(slot)}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  updateSubject(
                                    dayIndex,
                                    slotIndex,
                                    slot,
                                    value || null,
                                  );
                                }}
                              >
                                <option value="">
                                  - {messages.planning.selectSubject} -
                                </option>
                                {subjects.map((subject) => (
                                  <option key={subject.id} value={subject.id}>
                                    {getSubjectDisplayName(subject, messages)}
                                  </option>
                                ))}
                              </select>

                              <input
                                className={u.formInput}
                                type="text"
                                value={topicValue}
                                onChange={(event) =>
                                  updateTopicLocal(slot, event.target.value)
                                }
                                onBlur={(event) =>
                                  commitTopic(
                                    dayIndex,
                                    slotIndex,
                                    slot,
                                    event.currentTarget.value,
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                  }
                                }}
                                placeholder={messages.planning.topicOptional}
                              />
                            </>
                          ) : null}

                          {isFixed && slot.allowTopic ? (
                            <input
                              className={u.formInput}
                              type="text"
                              value={displayedFixedTopic}
                              onChange={(event) =>
                                updateTopicLocal(slot, event.target.value)
                              }
                              onBlur={(event) =>
                                commitTopic(
                                  dayIndex,
                                  slotIndex,
                                  slot,
                                  event.currentTarget.value,
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              placeholder={`${messages.planning.topicFor} ${getFixedSlotDisplayName(slot, messages)}`}
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
