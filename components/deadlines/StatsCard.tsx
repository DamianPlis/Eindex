"use client";

import React, { useState } from "react";
import type { ScheduleState } from "@/lib/schedule/types";
import SortIcon from "@/icons/sort_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import FilterIcon from "@/icons/filter_list_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";

interface StatsCardProps {
  title: string;
  stats: Record<string, number>;
  subjects: ScheduleState["subjects"];
}

type SortOption = "count-desc" | "count-asc" | "name-asc" | "name-desc";

export default function StatsCard({ title, stats, subjects }: StatsCardProps) {
  const [sortBy, setSortBy] = useState<SortOption>("count-desc");

  const subjectMap = React.useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);

  const sortedStats = Object.entries(stats)
    .map(([subjectId, count]) => ({ subjectId, count }))
    .sort((a, b) => {
      if (sortBy === "count-desc") return b.count - a.count;
      if (sortBy === "count-asc") return a.count - b.count;
      
      const nameA = subjectMap.get(a.subjectId) || a.subjectId;
      const nameB = subjectMap.get(b.subjectId) || b.subjectId;
      
      if (sortBy === "name-asc") return nameA.localeCompare(nameB);
      if (sortBy === "name-desc") return nameB.localeCompare(nameA);
      
      return 0;
    });

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
              <option value="count-desc">Most frequent</option>
              <option value="count-asc">Least frequent</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
          <FilterIcon alt="Filter stats" fill="currentColor" className="stats-card-header-icon" />
        </div>
      </div>
      {Object.keys(stats).length === 0 ? (
        <p>No data</p>
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
              {subjectMap.get(subjectId) || subjectId}: {count} times
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
