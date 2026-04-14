"use client";

import React, { useState } from "react";
import { useAppLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { getSubjectDisplayName } from "@/lib/schedule/labels";
import type { ScheduleState } from "@/lib/schedule/types";
import SortIcon from "@/icons/sort_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import FilterIcon from "@/icons/filter_list_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import type { SortOption } from "@/lib/schedule/types";
import { sortStats } from "@/lib/schedule/selectors";

interface StatsCardProps {
  title: string;
  stats: Record<string, number>;
  subjects: ScheduleState["subjects"];
}

export default function StatsCard({ title, stats, subjects }: StatsCardProps) {
  const locale = useAppLocale();
  const messages = useMessages();
  const [sortBy, setSortBy] = useState<SortOption>("count-desc");

  const subjectMap = React.useMemo(
    () => new Map(subjects.map((subject) => [subject.id, getSubjectDisplayName(subject, messages)])),
    [messages, subjects],
  );
  const sortedStats = React.useMemo(() => sortStats(stats, subjectMap, locale, sortBy), [stats, subjectMap, locale, sortBy]);

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h3 style={{ margin: 0 }}>{title}</h3>
        <div className="stats-card-header-icons">
          <div className="sort-icon-wrapper" style={{ position: "relative" }}>
            <SortIcon alt="Sort stats" fill="currentColor" className="stats-card-header-icon" />
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
              <option value="count-desc">{messages.deadlines.sortOptions.mostFrequent}</option>
              <option value="count-asc">{messages.deadlines.sortOptions.leastFrequent}</option>
              <option value="name-asc">{messages.deadlines.sortOptions.nameAsc}</option>
              <option value="name-desc">{messages.deadlines.sortOptions.nameDesc}</option>
            </select>
          </div>
          <FilterIcon alt="Filter stats" fill="currentColor" className="stats-card-header-icon" />
        </div>
      </div>
      {Object.keys(stats).length === 0 ? (
        <p>{messages.deadlines.noData}</p>
      ) : (
        <ul>
          {sortedStats.map(({ subjectId, count }) => (
            <li
              key={subjectId}
              className="stats-entry"
              style={{
                backgroundColor: `${subjects.find((s) => s.id === subjectId)?.color || "#000000"}55`,
              }}
            >
              {subjectMap.get(subjectId) || subjectId}: {count} {messages.deadlines.times}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
