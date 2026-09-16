"use client";

import { useState } from "react";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import RemoveDeadline from "@/components/deadlines/RemoveDeadline";
import StatusPill from "@/components/deadlines/StatusPill";
import MarkDeadlineDone from "@/components/deadlines/MarkDeadlineDone";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import type { DeadlineItem } from "@/lib/schedule/types";
import { formatDeadlineRelativeLabel } from "@/lib/schedule/selectors";
import { useDeadlinesRefresh } from "@/components/deadlines/DeadlinesRefreshContext";
import DeadlinesListSkeleton from "@/components/skeletons/DeadlinesListSkeleton";
import s from "./Deadlines.module.css";
import u from "@/components/ui/shared.module.css";

export default function DeadlinesList({
  deadlines,
}: {
  deadlines: DeadlineItem[];
}) {
  const locale = useAppLocale();
  const messages = useMessages();
  const { isRefreshing } = useDeadlinesRefresh();
  const [showDone, setShowDone] = useState(false);

  if (isRefreshing) return <DeadlinesListSkeleton />;

  const activeDeadlines = deadlines.filter(
    (deadline) =>
      deadline.status === "today" ||
      deadline.status === "expired" ||
      deadline.status === "upcoming",
  );
  const doneDeadlines = deadlines.filter(
    (deadline) => deadline.status === "done",
  );
  const visibleDeadlines = showDone
    ? [...activeDeadlines, ...doneDeadlines]
    : activeDeadlines;

  return (
    <>
      <div className={s.showDoneRow}>
        <button
          className={s.showDoneButton}
          type="button"
          onClick={() => setShowDone((current) => !current)}
        >
          {showDone
            ? messages.deadlines.hideDoneDeadlines
            : messages.deadlines.showDoneDeadlines}
        </button>
      </div>
      <ul className={s.deadlinesList}>
        {visibleDeadlines.length === 0 ? (
          <p>{messages.deadlines.noDeadlinesYet}</p>
        ) : null}
        {visibleDeadlines.map((deadline) => {
          return (
            <li key={deadline.id} className={s.deadlineItem}>
              <span className={s.deadlineBody}>
                <Link
                  className={u.inlineLink}
                  href={localizePath(locale, `/deadlines/${deadline.id}`)}
                >
                  {deadline.text}
                </Link>
                <span className={s.deadlineTiming}>
                  <time dateTime={deadline.date}>{deadline.date}</time>
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatDeadlineRelativeLabel(deadline.date, locale)}
                  </span>
                </span>
              </span>
              <div className={s.deadlineActions}>
                <StatusPill status={deadline.status} />
                {deadline.status !== "done" ? (
                  <MarkDeadlineDone deadline={deadline} />
                ) : null}
                <RemoveDeadline deadline={deadline} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
