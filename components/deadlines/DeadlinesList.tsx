"use client";

import { useState } from "react";
import { useAppLocale, useMessages } from "@/components/i18n/LocaleProvider";
import RemoveDeadline from "@/components/deadlines/RemoveDeadline";
import StatusPill from "@/components/deadlines/StatusPill";
import MarkDeadlineDone from "@/components/deadlines/MarkDeadlineDone";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import type { DeadlineItem } from "@/lib/schedule/types";
import { formatDeadlineRelativeLabel } from "@/lib/schedule/selectors";

export function DeadlinesList({ deadlines }: { deadlines: DeadlineItem[] }) {
  const locale = useAppLocale();
  const messages = useMessages();
  const [showDone, setShowDone] = useState(false);
  const activeDeadlines = deadlines.filter(
    (deadline) =>
      deadline.status === "today" ||
      deadline.status === "expired" ||
      deadline.status === "upcoming",
  );
  const doneDeadlines = deadlines.filter((deadline) => deadline.status === "done");
  const visibleDeadlines = showDone ? [...activeDeadlines, ...doneDeadlines] : activeDeadlines;

  return (
    <>
        <div style={{display: "flex", justifyContent: "end"}}>
          <button
            className="show-done-deadlines-button"
            style={{marginLeft: "auto"}}
            type="button"
            onClick={() => setShowDone((current) => !current)}
          >
            {showDone ? messages.deadlines.hideDoneDeadlines : messages.deadlines.showDoneDeadlines}
          </button>
        </div>
        <ul className="deadlines-list">
            {visibleDeadlines.length === 0 ? <p>{messages.deadlines.noDeadlinesYet}</p> : null}
            {visibleDeadlines.map((deadline) => {
            return (
                <li key={deadline.id} className={`deadline-item`}>
                <span>
                    <Link className="inline-link" href={localizePath(locale, `/deadlines/${deadline.id}`)}>
                    {deadline.text}
                    </Link>{" "}
                    - {deadline.date}                     
                    <div className="reminder-date reminder-relative-date">
                      {formatDeadlineRelativeLabel(deadline.date, locale)}
                    </div>
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
