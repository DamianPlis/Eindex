"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import type { DeadlineItem } from "@/lib/schedule/types";
import styles from "@/css/Deadlines.module.css";

type StatusPillProps = {
  status: DeadlineItem["status"];
}

function StatusPill(props: StatusPillProps) {
    const messages = useMessages();
    const { status } = props;
    let statusClass;
    let statusLabel;
    if (status === "today") {
        statusClass = styles.today
        statusLabel = messages.deadlines.status.today
    } else if (status === "expired") {
        statusClass = styles.expired
        statusLabel = messages.deadlines.status.expired
    } else if (status === "done") {
        statusClass = styles.done
        statusLabel = messages.deadlines.status.done
    }
     else {
        statusClass = styles.upcoming
        statusLabel = messages.deadlines.status.upcoming
    }

  return (
    <span className={`${styles.statusPill} ${statusClass}`}>{statusLabel}</span>
  )
}

export default StatusPill
