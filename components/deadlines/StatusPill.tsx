import React from 'react'

type StatusPillProps = {
  status: "today" | "expired" | "upcoming";
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
    } else {
        statusClass = "upcoming"
        statusLabel = "Upcoming"
    }


  return (
    <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
  )
}

export default StatusPill