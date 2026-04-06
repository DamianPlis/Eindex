"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import type { DeadlineItem } from "@/lib/schedule/types";

type StatusPillProps = {
  status: DeadlineItem["status"];
}

function StatusPill(props: StatusPillProps) {
    const messages = useMessages();
    const { status } = props;
    let statusClass;
    let statusLabel;
    if (status === "today") {
        statusClass = "today"
        statusLabel = messages.deadlines.status.today
    } else if (status === "expired") {
        statusClass = "expired"
        statusLabel = messages.deadlines.status.expired
    } else if (status === "done") {
        statusClass = "done"
        statusLabel = messages.deadlines.status.done
    }
     else {
        statusClass = "upcoming"
        statusLabel = messages.deadlines.status.upcoming
    }


  return (
    <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
  )
}

export default StatusPill
