import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import schema from "./schema";
import { requireUser, touchUser } from "./model";
import { resolveDeadlineStatus } from "../lib/schedule/defaults";

const status = v.union(
  v.literal("upcoming"),
  v.literal("today"),
  v.literal("expired"),
  v.literal("done"),
);
const undoResult = v.union(
  v.null(),
  v.object({
    receiptId: v.id("deadlineUndos"),
    kind: v.union(v.literal("remove"), v.literal("done")),
    deadline: v.object({
      id: v.string(),
      text: v.string(),
      description: v.string(),
      date: v.string(),
      status,
    }),
    index: v.number(),
    uid: v.string(),
  }),
);
const maxDeadlines = 4000;
function findDeadline(
  ctx: MutationCtx,
  userId: Id<"users">,
  deadlineId: string,
) {
  return ctx.db
    .query("deadlines")
    .withIndex("by_user_deadlineId", (q) =>
      q.eq("userId", userId).eq("deadlineId", deadlineId),
    )
    .unique();
}
async function receipt(
  ctx: MutationCtx,
  deadline: Doc<"deadlines">,
  kind: "done" | "remove",
) {
  const receiptId = await ctx.db.insert("deadlineUndos", {
    userId: deadline.userId,
    kind,
    deadlineId: deadline.deadlineId,
    text: deadline.text,
    description: deadline.description,
    date: deadline.date,
    status: deadline.status,
    originalCreatedAt: deadline.createdAt,
    order: deadline.order ?? deadline._creationTime,
    used: false,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  await ctx.scheduler.runAfter(
    24 * 60 * 60 * 1000,
    internal.deadlines.expireUndo,
    { receiptId },
  );
  return {
    receiptId,
    kind,
    deadline: {
      id: deadline.deadlineId,
      text: deadline.text,
      description: deadline.description,
      date: deadline.date,
      status: deadline.status,
    },
    index: 0,
    uid: deadline.userId,
  };
}
export const expireUndo = internalMutation({
  args: { receiptId: v.id("deadlineUndos") },
  returns: v.null(),
  handler: async (ctx, { receiptId }) => {
    await ctx.db.delete(receiptId);
    return null;
  },
});
export const getDeadlines = query({
  args: {},
  returns: v.array(schema.doc("deadlines")),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(maxDeadlines + 1);
    if (rows.length > maxDeadlines) throw new Error("Too many deadlines");
    return rows.sort(
      (a, b) => (a.order ?? a._creationTime) - (b.order ?? b._creationTime),
    );
  },
});
export const getDeadlinesForDate = query({
  args: { date: v.string() },
  returns: v.array(schema.doc("deadlines")),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("deadlines")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date),
      )
      .take(maxDeadlines);
  },
});
export const getDeadline = query({
  args: { deadlineId: v.string() },
  returns: v.union(v.null(), schema.doc("deadlines")),
  handler: async (ctx, { deadlineId }) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("deadlines")
      .withIndex("by_user_deadlineId", (q) =>
        q.eq("userId", userId).eq("deadlineId", deadlineId),
      )
      .unique();
  },
});
export const addDeadline = mutation({
  args: {
    text: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    status: v.optional(status),
  },
  returns: v.object({ _id: v.id("deadlines"), deadlineId: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (
      !args.text.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(args.date) ||
      Number.isNaN(Date.parse(args.date))
    )
      throw new Error("Text and valid date are required");
    const rows = await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(maxDeadlines);
    if (rows.length >= maxDeadlines) throw new Error("Too many deadlines");
    const now = Date.now(),
      deadlineId = crypto.randomUUID();
    const id = await ctx.db.insert("deadlines", {
      userId,
      deadlineId,
      text: args.text.trim(),
      description: (args.description ?? "").trim(),
      date: args.date,
      status: args.status ?? "upcoming",
      createdAt: now,
      updatedAt: now,
    });
    await touchUser(ctx, userId);
    return { _id: id, deadlineId };
  },
});
export const removeDeadline = mutation({
  args: { deadlineId: v.string() },
  returns: undoResult,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const deadline = await findDeadline(ctx, userId, args.deadlineId);
    if (!deadline) return null;
    const undo = await receipt(ctx, deadline, "remove");
    await ctx.db.delete(deadline._id);
    await touchUser(ctx, userId);
    return undo;
  },
});
export const markAsDone = mutation({
  args: { deadlineId: v.string() },
  returns: undoResult,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const deadline = await findDeadline(ctx, userId, args.deadlineId);
    if (!deadline || deadline.status === "done") return null;
    const undo = await receipt(ctx, deadline, "done");
    await ctx.db.patch(deadline._id, { status: "done", updatedAt: Date.now() });
    await touchUser(ctx, userId);
    return undo;
  },
});
export const undoDeadline = mutation({
  args: { receiptId: v.id("deadlineUndos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const undo = await ctx.db.get(args.receiptId);
    if (!undo || undo.userId !== userId || undo.expiresAt < Date.now())
      throw new Error("Invalid deadline undo");
    if (undo.used) return null;
    const current = await findDeadline(ctx, userId, undo.deadlineId);
    if (undo.kind === "done") {
      if (!current) throw new Error("Deadline no longer exists");
      await ctx.db.patch(current._id, {
        status: resolveDeadlineStatus({ date: current.date }),
        updatedAt: Date.now(),
      });
    } else if (!current) {
      await ctx.db.insert("deadlines", {
        userId,
        deadlineId: undo.deadlineId,
        text: undo.text,
        description: undo.description,
        date: undo.date,
        status: resolveDeadlineStatus({ date: undo.date, status: undo.status }),
        createdAt: undo.originalCreatedAt,
        order: undo.order,
        updatedAt: Date.now(),
      });
    }
    await ctx.db.patch(undo._id, { used: true });
    await touchUser(ctx, userId);
    return null;
  },
});
