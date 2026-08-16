import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Helper to ensure a Convex user exists matching the legacy Firebase UID.
 */
async function getOrCreateUserByFirebaseUid(
  ctx: MutationCtx,
  firebaseUid: string,
  email?: string,
  name?: string,
  image?: string,
  createdAt?: number
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_firebase_uid", (q) => q.eq("firebaseUid", firebaseUid))
    .first();

  const now = createdAt || Date.now();

  if (existing) {
    const updates: {
      createdAt?: number;
      email?: string;
      name?: string;
      image?: string;
    } = {};
    if (createdAt && (!existing.createdAt || existing.createdAt !== createdAt)) {
      updates.createdAt = createdAt;
    }
    if (email && existing.email !== email) updates.email = email;
    if (name && existing.name !== name) updates.name = name;
    if (image && existing.image !== image) updates.image = image;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing._id, updates);
    }
    return existing._id;
  }

  const id = await ctx.db.insert("users", {
    firebaseUid,
    email: email || undefined,
    name: name || undefined,
    image: image || undefined,
    createdAt: now,
  });

  return id;
}

export const syncUserAndSettings = mutation({
  args: {
    firebaseUid: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    theme: v.union(v.literal("light"), v.literal("dark")),
    locale: v.union(v.literal("cs"), v.literal("en"), v.literal("pl")),
    useSchoolYear: v.boolean(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(
      ctx,
      args.firebaseUid,
      args.email,
      args.name,
      args.image,
      args.createdAt
    );

    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = args.updatedAt || Date.now();

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        theme: args.theme,
        locale: args.locale,
        useSchoolYear: args.useSchoolYear,
        updatedAt: now,
        lastWriter: args.writerId,
      });
      return { userId, settingsId: existingSettings._id };
    }

    const settingsId = await ctx.db.insert("userSettings", {
      userId,
      theme: args.theme,
      locale: args.locale,
      useSchoolYear: args.useSchoolYear,
      updatedAt: now,
      lastWriter: args.writerId,
    });

    return { userId, settingsId };
  },
});

export const syncSlotSubject = mutation({
  args: {
    firebaseUid: v.string(),
    weekStart: v.string(),
    date: v.string(),
    dayIndex: v.number(),
    slotIndex: v.number(),
    time: v.string(),
    fixed: v.boolean(),
    fixedKey: v.optional(
      v.union(
        v.literal("morningCircle"),
        v.literal("currentEvents"),
        v.literal("lunch"),
        v.literal("tutor"),
        v.literal("pe"),
        v.literal("assembly")
      )
    ),
    fixedLabel: v.optional(v.string()),
    allowTopic: v.boolean(),
    subjectId: v.optional(v.union(v.string(), v.null())),
    updatedAt: v.optional(v.number()),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existingSlot = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_slot_coord", (q) =>
        q
          .eq("userId", userId)
          .eq("weekStart", args.weekStart)
          .eq("dayIndex", args.dayIndex)
          .eq("slotIndex", args.slotIndex)
      )
      .first();

    const now = args.updatedAt || Date.now();

    if (existingSlot) {
      await ctx.db.patch(existingSlot._id, {
        subjectId: args.subjectId || null,
        updatedAt: now,
        lastWriter: args.writerId,
      });
      return existingSlot._id;
    }

    return await ctx.db.insert("scheduleSlots", {
      userId,
      weekStart: args.weekStart,
      date: args.date,
      dayIndex: args.dayIndex,
      slotIndex: args.slotIndex,
      time: args.time,
      fixed: args.fixed,
      fixedKey: args.fixedKey,
      fixedLabel: args.fixedLabel,
      allowTopic: args.allowTopic,
      subjectId: args.subjectId || null,
      topic: "",
      updatedAt: now,
      lastWriter: args.writerId,
    });
  },
});

export const syncSlotTopic = mutation({
  args: {
    firebaseUid: v.string(),
    weekStart: v.string(),
    date: v.string(),
    dayIndex: v.number(),
    slotIndex: v.number(),
    time: v.string(),
    fixed: v.boolean(),
    fixedKey: v.optional(
      v.union(
        v.literal("morningCircle"),
        v.literal("currentEvents"),
        v.literal("lunch"),
        v.literal("tutor"),
        v.literal("pe"),
        v.literal("assembly")
      )
    ),
    fixedLabel: v.optional(v.string()),
    allowTopic: v.boolean(),
    topic: v.string(),
    updatedAt: v.optional(v.number()),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existingSlot = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_slot_coord", (q) =>
        q
          .eq("userId", userId)
          .eq("weekStart", args.weekStart)
          .eq("dayIndex", args.dayIndex)
          .eq("slotIndex", args.slotIndex)
      )
      .first();

    const now = args.updatedAt || Date.now();

    if (existingSlot) {
      await ctx.db.patch(existingSlot._id, {
        topic: args.topic || "",
        updatedAt: now,
        lastWriter: args.writerId,
      });
      return existingSlot._id;
    }

    return await ctx.db.insert("scheduleSlots", {
      userId,
      weekStart: args.weekStart,
      date: args.date,
      dayIndex: args.dayIndex,
      slotIndex: args.slotIndex,
      time: args.time,
      fixed: args.fixed,
      fixedKey: args.fixedKey,
      fixedLabel: args.fixedLabel,
      allowTopic: args.allowTopic,
      subjectId: null,
      topic: args.topic || "",
      updatedAt: now,
      lastWriter: args.writerId,
    });
  },
});

export const syncSlotsBatch = mutation({
  args: {
    firebaseUid: v.string(),
    slots: v.array(
      v.object({
        weekStart: v.string(),
        date: v.string(),
        dayIndex: v.number(),
        slotIndex: v.number(),
        time: v.string(),
        fixed: v.boolean(),
        fixedKey: v.optional(
          v.union(
            v.literal("morningCircle"),
            v.literal("currentEvents"),
            v.literal("lunch"),
            v.literal("tutor"),
            v.literal("pe"),
            v.literal("assembly")
          )
        ),
        fixedLabel: v.optional(v.string()),
        allowTopic: v.boolean(),
        subjectId: v.optional(v.union(v.string(), v.null())),
        topic: v.string(),
        updatedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);
    const fallbackNow = Date.now();

    for (const slot of args.slots) {
      const slotUpdatedAt = slot.updatedAt || fallbackNow;
      const existing = await ctx.db
        .query("scheduleSlots")
        .withIndex("by_user_slot_coord", (q) =>
          q
            .eq("userId", userId)
            .eq("weekStart", slot.weekStart)
            .eq("dayIndex", slot.dayIndex)
            .eq("slotIndex", slot.slotIndex)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          subjectId: slot.subjectId || null,
          topic: slot.topic || "",
          updatedAt: slotUpdatedAt,
        });
      } else {
        await ctx.db.insert("scheduleSlots", {
          userId,
          weekStart: slot.weekStart,
          date: slot.date,
          dayIndex: slot.dayIndex,
          slotIndex: slot.slotIndex,
          time: slot.time,
          fixed: slot.fixed,
          fixedKey: slot.fixedKey,
          fixedLabel: slot.fixedLabel,
          allowTopic: slot.allowTopic,
          subjectId: slot.subjectId || null,
          topic: slot.topic || "",
          updatedAt: slotUpdatedAt,
        });
      }
    }

    return { count: args.slots.length };
  },
});

export const syncDeadline = mutation({
  args: {
    firebaseUid: v.string(),
    deadlineId: v.string(),
    text: v.string(),
    description: v.string(),
    date: v.string(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("today"),
      v.literal("expired"),
      v.literal("done")
    ),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existing = await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("deadlineId"), args.deadlineId))
      .first();

    const now = args.updatedAt || Date.now();
    const createdTime = args.createdAt || now;

    if (existing) {
      await ctx.db.patch(existing._id, {
        text: args.text,
        description: args.description,
        date: args.date,
        status: args.status,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("deadlines", {
      userId,
      deadlineId: args.deadlineId,
      text: args.text,
      description: args.description,
      date: args.date,
      status: args.status,
      createdAt: createdTime,
      updatedAt: now,
    });
  },
});

export const syncSubject = mutation({
  args: {
    firebaseUid: v.string(),
    slug: v.string(),
    name: v.string(),
    color: v.string(),
    order: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug)
      )
      .first();

    const now = args.updatedAt || Date.now();
    const createdTime = args.createdAt || now;

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        color: args.color,
        order: args.order,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subjects", {
      userId,
      slug: args.slug,
      name: args.name,
      color: args.color,
      order: args.order,
      createdAt: createdTime,
      updatedAt: now,
    });
  },
});

export const syncSubjectGroup = mutation({
  args: {
    firebaseUid: v.string(),
    slug: v.string(),
    name: v.union(v.string(), v.record(v.string(), v.string())),
    subjectIds: v.array(v.string()),
    namePreferences: v.optional(v.record(v.string(), v.string())),
    order: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existing = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();

    const now = args.updatedAt || Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        subjectIds: args.subjectIds,
        namePreferences: args.namePreferences,
        order: args.order,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subjectGroups", {
      userId,
      slug: args.slug,
      name: args.name,
      subjectIds: args.subjectIds,
      namePreferences: args.namePreferences,
      order: args.order,
      updatedAt: now,
    });
  },
});

export const syncRemoveDeadline = mutation({
  args: {
    firebaseUid: v.string(),
    deadlineId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existing = await ctx.db
      .query("deadlines")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("deadlineId"), args.deadlineId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true };
  },
});

export const syncDeleteSubject = mutation({
  args: {
    firebaseUid: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Clear subject assignment from slots
    const slots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_subject", (q) =>
        q.eq("userId", userId).eq("subjectId", args.slug)
      )
      .collect();

    for (const slot of slots) {
      await ctx.db.patch(slot._id, {
        subjectId: null,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const syncDeleteSubjectGroup = mutation({
  args: {
    firebaseUid: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserByFirebaseUid(ctx, args.firebaseUid);

    const existing = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return { success: true };
  },
});
