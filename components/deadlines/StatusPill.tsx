"use client";

import { useMessages } from "@/components/i18n/UserSyncProvider";
import type { DeadlineItem } from "@/lib/schedule/types";
import s from "./Deadlines.module.css";

type StatusPillProps = {
  status: DeadlineItem["status"];
}

function StatusPill(props: StatusPillProps) {
    const messages = useMessages();
    const { status } = props;
    let pillClass;
    let statusLabel;
    if (status === "today") {
        pillClass = s.statusPillToday
        statusLabel = messages.deadlines.status.today
    } else if (status === "expired") {
        pillClass = s.statusPillExpired
        statusLabel = messages.deadlines.status.expired
    } else if (status === "done") {
        pillClass = s.statusPillDone
        statusLabel = messages.deadlines.status.done
    }
     else {
        pillClass = s.statusPillUpcoming
        statusLabel = messages.deadlines.status.upcoming
    }


  return (
    <span className={pillClass}>{statusLabel}</span>
  )
}

export default StatusPill
