import type { DeadlineItem } from "./types";

/** Display data plus an opaque, owner-bound Convex receipt. Only the server snapshot is restored. */
export type DeadlineUndo = {
  receiptId: string;
  kind: "remove" | "done";
  deadline: DeadlineItem;
  index: number;
  uid: string;
};
