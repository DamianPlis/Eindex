import type { DeadlineItem } from "./types";
import { resolveDeadlineStatus } from "./defaults";

export type DeadlineUndo = {
  kind: "remove" | "done";
  deadline: DeadlineItem;
  index: number;
  uid: string;
};

/** Apply an undo to the latest state without replacing other deadline changes. */
export function restoreDeadline(deadlines: DeadlineItem[], undo: DeadlineUndo): DeadlineItem {
  const { deadline, kind, index } = undo;
  if (
    !deadline || typeof deadline.id !== "string" || !deadline.id ||
    typeof deadline.text !== "string" || !deadline.text.trim() ||
    typeof deadline.description !== "string" ||
    typeof deadline.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline.date) ||
    !["upcoming", "today", "expired", "done"].includes(deadline.status) ||
    !Number.isInteger(index) || index < 0 ||
    (kind !== "remove" && kind !== "done")
  ) throw new Error("Invalid deadline undo");

  const current = deadlines.find((item) => item.id === deadline.id);
  if (kind === "done") {
    if (!current) throw new Error("Deadline no longer exists");
    // Only change status: keep any edits made since completion.
    current.status = resolveDeadlineStatus({ date: current.date });
    return current;
  }

  // A retried request must never create a duplicate or overwrite newer edits.
  if (current) return current;
  const restored: DeadlineItem = {
    id: deadline.id,
    text: deadline.text,
    description: deadline.description,
    date: deadline.date,
    status: resolveDeadlineStatus(deadline),
  };
  deadlines.splice(Math.min(index, deadlines.length), 0, restored);
  return restored;
}
