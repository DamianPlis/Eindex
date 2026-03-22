import React from 'react'
import type { DeadlineItem } from '@/lib/schedule/types';

type StatusPillProps = {
  status: DeadlineItem["status"];
}

function StatusPill(props: StatusPillProps) {
    const { status } = props;
    let statusClass;
    let statusLabel;
    if (status === "today") {
        statusClass = "today"
        statusLabel = "Due Today"
    } else if (status === "expired") {
        statusClass = "expired"
        statusLabel = "Expired"
    } else if (status === "done") {
        statusClass = "done"
        statusLabel = "Done"
    }
     else {
        statusClass = "upcoming"
        statusLabel = "Upcoming"
    }


  return (
    <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
  )
}

export default StatusPill