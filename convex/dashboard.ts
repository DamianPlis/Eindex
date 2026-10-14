import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import schema from "./schema";
import { requireUser } from "./model";

// Match the existing deadline limit and stable ordering, including restored items.
const maxDeadlines = 4000;
const remindersLimit = 3;
function deadlineOrder(a: Doc<"deadlines">, b: Doc<"deadlines">) {
  return (
    (a.order ?? a._creationTime) - (b.order ?? b._creationTime) ||
    a._creationTime - b._creationTime
  );
}

async function getReminderCandidates(
  ctx: QueryCtx,
  userId: Id<"users">,
  selectedISO: string,
) {
  const due = await ctx.db
    .query("deadlines")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).lte("date", selectedISO),
    )
    .take(maxDeadlines + 1);
  if (due.length > maxDeadlines) throw new Error("Too many deadlines");
  const attention = due.filter((item) => item.status !== "done");
  if (attention.length >= remindersLimit) return attention.sort(deadlineOrder);

  const future: Doc<"deadlines">[] = [];
  const remaining = remindersLimit - attention.length;
  let scanned = due.length;
  for await (const item of ctx.db
    .query("deadlines")
    .withIndex("by_user_date", (q) =>
      q.eq("userId", userId).gt("date", selectedISO),
    )) {
    // Finish the final date's group before selecting: restored/custom order can
    // differ from creation order within that date. Later dates cannot win.
    if (future.length >= remaining && item.date !== future.at(-1)!.date) break;
    if (++scanned > maxDeadlines) throw new Error("Too many deadlines");
    if (item.status !== "done") future.push(item);
  }
  return [...attention, ...future].sort(deadlineOrder);
}

function selectedWeekStart(selectedISO: string): string | null {
  const date = new Date(`${selectedISO}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(selectedISO) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== selectedISO
  )
    return null;
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

export const getDashboardData = query({
  args: {
    selectedISO: v.string(), // YYYY-MM-DD
    canteenId: v.optional(v.string()), // e.g. "2069"
  },
  returns: v.object({
    slots: v.array(schema.doc("scheduleSlots")),
    deadlines: v.array(schema.doc("deadlines")),
    subjects: v.array(schema.doc("subjects")),
    lunchText: v.string(),
    weekStart: v.union(v.string(), v.null()),
    hasSavedWeek: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const weekStart = selectedWeekStart(args.selectedISO);
    const dayIndex =
      (new Date(`${args.selectedISO}T12:00:00Z`).getUTCDay() + 6) % 7;

    const [slots, deadlines, subjects, lunch, savedWeekSlot] =
      await Promise.all([
        // Legacy imports can have fallback dates; coordinates match the timetable.
        weekStart
          ? ctx.db
              .query("scheduleSlots")
              .withIndex("by_user_slot_coord", (q) =>
                q
                  .eq("userId", userId)
                  .eq("weekStart", weekStart)
                  .eq("dayIndex", dayIndex),
              )
              .take(100)
          : [],

        getReminderCandidates(ctx, userId, args.selectedISO),

        ctx.db
          .query("subjects")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .take(4001),

        args.canteenId
          ? ctx.db
              .query("schoolLunches")
              .withIndex("by_canteen_date", (q) =>
                q.eq("canteenId", args.canteenId!).eq("date", args.selectedISO),
              )
              .first()
          : null,
        weekStart
          ? ctx.db
              .query("scheduleSlots")
              .withIndex("by_user_week", (q) =>
                q.eq("userId", userId).eq("weekStart", weekStart),
              )
              .first()
          : null,
      ]);

    return {
      slots,
      deadlines,
      subjects,
      lunchText: lunch?.menuText || "",
      weekStart,
      hasSavedWeek: savedWeekSlot !== null,
    };
  },
});
