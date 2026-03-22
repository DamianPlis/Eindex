"use client";

import React, { useEffect, useState } from 'react'
import RemoveDeadline from "@/components/deadlines/RemoveDeadline"
import StatusPill from "@/components/deadlines/StatusPill";
import MarkDeadlineDone from "@/components/deadlines/MarkDeadlineDone";
import Link from "next/link";
import type { DeadlineItem } from '@/lib/schedule/types';

export function DeadlinesList({ deadlines }: { deadlines: DeadlineItem[] }) {


  const defaultDeadlinesFilter = deadlines.filter((deadline) => deadline.status === "today" || deadline.status === "expired" || deadline.status === "upcoming")
  const [filteredDeadlines, setFilteredDeadlines] = useState(defaultDeadlinesFilter);
  const [showDone, setShowDone] = useState(false);
  const doneDeadlines = deadlines.filter((deadline) => deadline.status === "done");

  function handleClick() {
    setShowDone(!showDone)
    if (showDone) {
      setFilteredDeadlines(defaultDeadlinesFilter);
    } else {
      setFilteredDeadlines([...defaultDeadlinesFilter, ...doneDeadlines]);
    }
  }

  return (
    <>
        <div style={{display: "flex", justifyContent: "end"}}>
          <button className="show-done-deadlines-button" style={{marginLeft: "auto"}} onClick={() => {handleClick()}}>
            {showDone ? "Hide" : "Show"} Done Deadlines
          </button>
        </div>
        <ul className="deadlines-list">
            {filteredDeadlines.length === 0 ? <p>No deadlines yet</p> : null}
            {filteredDeadlines.map((deadline) => {
            return (
                <li key={deadline.id} className={`deadline-item`}>
                <span>
                    <Link className="inline-link" href={`/deadlines/${deadline.id}`}>
                    {deadline.text}
                    </Link>{" "}
                    - {deadline.date}
                </span>
                <div className="deadline-actions">
                    <StatusPill status={deadline.status} />
                    <MarkDeadlineDone deadline={deadline} />
                    <RemoveDeadline deadline={deadline} />
                </div>
                </li>
            );
            })}
        </ul>
    </>
  )
}

export default DeadlinesList
