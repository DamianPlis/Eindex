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
import styles from "@/css/Deadlines.module.css";
import reminderStyles from "@/css/Reminders.module.css";

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
  const doneDeadlines = deadlines.filter(
    (deadline) => deadline.status === "done",
  );
  const visibleDeadlines = showDone
    ? [...activeDeadlines, ...doneDeadlines]
    : activeDeadlines;

  return (
    <>
      <div className="flex justify-end">
        <button
          className="mb-4 ml-auto primary-button"
          type="button"
          onClick={() => setShowDone((current) => !current)}
        >
          {showDone
            ? messages.deadlines.hideDoneDeadlines
            : messages.deadlines.showDoneDeadlines}
        </button>
      </div>
      <ul className={styles.deadlinesList}>
        {visibleDeadlines.length === 0 ? (
          <p>{messages.deadlines.noDeadlinesYet}</p>
        ) : null}
        {visibleDeadlines.map((deadline) => {
          return (
            <li key={deadline.id} className={styles.deadlineItem}>
              <span>
                <Link
                  className="inline-link"
                  href={localizePath(locale, `/deadlines/${deadline.id}`)}
                >
                  {deadline.text}
                </Link>{" "}
                - {deadline.date}
                <div
                  className={`${reminderStyles.reminderDate} ${reminderStyles.reminderRelativeDate}`}
                >
                  {formatDeadlineRelativeLabel(deadline.date, locale)}
                </div>
              </span>
              <div className={styles.deadlineActions}>
                <StatusPill status={deadline.status} />
                <MarkDeadlineDone deadline={deadline} />
                <RemoveDeadline deadline={deadline} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default DeadlinesList;
