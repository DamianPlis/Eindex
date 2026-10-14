"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import { getSubjectDisplayName } from "@/lib/schedule/labels";
import { isoDate } from "@/lib/schedule/date-utils";
import type {
  Subject,
  SubjectGroup,
  SortOption,
  FilterOption,
  StatsOptions,
} from "@/lib/schedule/types";
import {
  sortStats,
  filterStats,
  getDateRange,
  getPeriodLabel,
} from "@/lib/schedule/stats";
import SortIcon from "@/icons/sort.svg";
import SubjectsCombobox from "@/components/deadlines/SubjectsCombobox";
import { useStatsPeriodSwipe } from "./useStatsPeriodSwipe";
import styles from "./StatsCard.module.css";

interface StatsCardProps {
  period: StatsOptions;
  subjects: Subject[];
  subjectGroups: SubjectGroup[];
  initialUsage: { subjectId: string; weightedCount: number }[];
  initialRange: { startISO: string; endISO: string };
  referenceISO: string;
  useSchoolYear?: boolean;
}

export default function StatsCard({
  period,
  subjects,
  subjectGroups,
  initialUsage,
  initialRange,
  referenceISO,
  useSchoolYear = false,
}: StatsCardProps) {
  const locale = useAppLocale();
  const messages = useMessages();
  const [sortBy, setSortBy] = useState<SortOption>("count-desc");
  const [filterIds, setFilterIds] = useState<FilterOption>([]);
  const [offset, setOffset] = useState(0);
  const { isAuthenticated } = useConvexAuth();
  const { cardRef, contentRef } = useStatsPeriodSwipe((direction) =>
    setOffset((previous) => previous + direction),
  );

  const isSchoolYearPeriod = period === "year" && useSchoolYear;
  const localReferenceISO = useSyncExternalStore(
    () => () => {},
    () => isoDate(),
    () => referenceISO,
  );
  const referenceDate = React.useMemo(
    () => new Date(`${localReferenceISO}T12:00:00`),
    [localReferenceISO],
  );
  const range = getDateRange(period, referenceDate, offset, useSchoolYear);
  const liveUsage = useQuery(
    api.subjectUsage.getPeriodUsage,
    isAuthenticated ? { period, ...range } : "skip",
  );
  const usage =
    liveUsage ??
    (range.startISO === initialRange.startISO &&
    range.endISO === initialRange.endISO
      ? initialUsage
      : undefined);

  const title = React.useMemo(() => {
    if (offset === 0) {
      if (isSchoolYearPeriod) return messages.deadlines.statistics.schoolYear;
      if (period === "week") return messages.deadlines.statistics.thisWeek;
      if (period === "month") return messages.deadlines.statistics.thisMonth;
      return messages.deadlines.statistics.thisYear;
    }
    return getPeriodLabel(period, locale, offset, referenceDate, useSchoolYear);
  }, [
    offset,
    period,
    locale,
    messages,
    isSchoolYearPeriod,
    useSchoolYear,
    referenceDate,
  ]);

  const stats = React.useMemo(
    () =>
      Object.fromEntries(
        (usage ?? []).map(({ subjectId, weightedCount }) => [
          subjectId,
          weightedCount,
        ]),
      ),
    [usage],
  );

  const subjectMap = React.useMemo(
    () =>
      new Map(
        subjects.map((subject) => [
          subject.id,
          getSubjectDisplayName(subject, messages),
        ]),
      ),
    [messages, subjects],
  );

  const filteredStats = React.useMemo(
    () => filterStats(sortStats(stats, subjectMap, locale, sortBy), filterIds),
    [stats, subjectMap, locale, sortBy, filterIds],
  );

  const periodLabel = React.useMemo(
    () => getPeriodLabel(period, locale, offset, referenceDate, useSchoolYear),
    [period, locale, offset, useSchoolYear, referenceDate],
  );

  return (
    <div ref={cardRef} className={styles.statsCard}>
      <div className={styles.statsCardHeader}>
        <div className={styles.statsCardTitleNav}>
          <div className={styles.statsCardTitle}>
            <h3 style={{ margin: 0 }} aria-live="polite" aria-atomic="true">
              {title}
            </h3>
            {offset !== 0 && (
              <div className={styles.statsNavTodayContainer}>
                <button
                  type="button"
                  className={styles.statsNavToday}
                  onClick={() => setOffset(0)}
                  title={messages.common.today}
                >
                  {messages.common.today}
                </button>
              </div>
            )}
          </div>
          <div className={styles.statsCardNav}>
            <button
              type="button"
              className={styles.statsNavArrow}
              onClick={() => setOffset((previous) => previous - 1)}
              aria-label={messages.deadlines.statistics.previous}
              title={messages.deadlines.statistics.previous}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className={styles.statsNavLabel}>{periodLabel}</span>
            <button
              type="button"
              className={styles.statsNavArrow}
              onClick={() => setOffset((previous) => previous + 1)}
              aria-label={messages.deadlines.statistics.next}
              title={messages.deadlines.statistics.next}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className={styles.statsCardHeaderIcons} data-swipe-ignore>
          <div className="sort-icon-wrapper" style={{ position: "relative" }}>
            <SortIcon
              alt="Sort stats"
              fill="currentColor"
              className={styles.statsCardHeaderIcon}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
              aria-label="Sort options"
            >
              <option value="count-desc">
                {messages.deadlines.sortOptions.mostFrequent}
              </option>
              <option value="count-asc">
                {messages.deadlines.sortOptions.leastFrequent}
              </option>
              <option value="name-asc">
                {messages.deadlines.sortOptions.nameAsc}
              </option>
              <option value="name-desc">
                {messages.deadlines.sortOptions.nameDesc}
              </option>
            </select>
          </div>
          <SubjectsCombobox
            subjects={subjects}
            subjectGroups={subjectGroups}
            selectedIds={filterIds}
            onChange={setFilterIds}
          />
        </div>
      </div>
      <div className={styles.statsViewport}>
        <div
          ref={contentRef}
          className={styles.statsContent}
          aria-busy={usage === undefined}
        >
          {usage === undefined ? (
            <p role="status">{messages.common.loading}</p>
          ) : filteredStats.length === 0 ? (
            <p>{messages.deadlines.noData}</p>
          ) : (
            <ul>
              {filteredStats.map(
                ({
                  subjectId,
                  count,
                }: {
                  subjectId: string;
                  count: number;
                }) => (
                  <li
                    key={subjectId}
                    className={styles.statsEntry}
                    style={{
                      backgroundColor: `${subjects.find((s) => s.id === subjectId)?.color || "#000000"}55`,
                    }}
                  >
                    {subjectMap.get(subjectId) || subjectId}: {count}{" "}
                    {messages.deadlines.statistics.times}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
