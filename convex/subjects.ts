import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getSubjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("subjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const addSubject = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const cleanName = args.name.trim();
    if (!cleanName) throw new Error("Subject name is required");

    const baseSlug =
      cleanName.toLowerCase().replace(/[^a-z0-9_]+/g, "_") || "custom";
    let slug = baseSlug;
    let counter = 1;

    const existingSubjects = await ctx.db
      .query("subjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const existingSlugs = new Set(existingSubjects.map((s) => s.slug));
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}_${counter++}`;
    }

    const now = Date.now();
    const id = await ctx.db.insert("subjects", {
      userId,
      slug,
      name: cleanName,
      color: args.color || "#64748b",
      order: existingSubjects.length,
      createdAt: now,
      updatedAt: now,
    });

    return { _id: id, slug, name: cleanName, color: args.color };
  },
});

export const updateSubject = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    color: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const cleanName = args.name.trim();
    if (!cleanName) throw new Error("Subject name is required");

    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug)
      )
      .first();

    if (!subject) throw new Error("Subject not found");

    await ctx.db.patch(subject._id, {
      name: cleanName,
      color: args.color || subject.color,
      updatedAt: Date.now(),
    });

    return { slug: args.slug, name: cleanName, color: args.color };
  },
});

export const deleteSubject = mutation({
  args: {
    slug: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug)
      )
      .first();

    if (subject) {
      await ctx.db.delete(subject._id);
    }

    // Clear subject assignment from matching slots
    const slotsWithSubject = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_subject", (q) =>
        q.eq("userId", userId).eq("subjectId", args.slug)
      )
      .collect();

    for (const slot of slotsWithSubject) {
      await ctx.db.patch(slot._id, {
        subjectId: null,
        updatedAt: Date.now(),
      });
    }

    // Remove subject from all groups
    const groups = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const group of groups) {
      if (group.subjectIds.includes(args.slug)) {
        await ctx.db.patch(group._id, {
          subjectIds: group.subjectIds.filter((id) => id !== args.slug),
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

export const getSubjectGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const addSubjectGroup = mutation({
  args: {
    name: v.record(v.string(), v.string()),
    subjectIds: v.array(v.string()),
    namePreferences: v.optional(v.record(v.string(), v.string())),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const slug = `group_${crypto.randomUUID().replace(/-/g, "").substring(0, 8)}`;
    const now = Date.now();

    const id = await ctx.db.insert("subjectGroups", {
      userId,
      slug,
      name: args.name,
      subjectIds: args.subjectIds,
      namePreferences: args.namePreferences,
      updatedAt: now,
    });

    return { _id: id, slug };
  },
});

export const updateSubjectGroup = mutation({
  args: {
    slug: v.string(),
    name: v.record(v.string(), v.string()),
    subjectIds: v.array(v.string()),
    namePreferences: v.optional(v.record(v.string(), v.string())),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const group = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();

    if (!group) throw new Error("Subject group not found");

    await ctx.db.patch(group._id, {
      name: args.name,
      subjectIds: args.subjectIds,
      namePreferences: args.namePreferences,
      updatedAt: Date.now(),
    });

    return { slug: args.slug };
  },
});

export const deleteSubjectGroup = mutation({
  args: {
    slug: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const group = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();

    if (group) {
      await ctx.db.delete(group._id);
    }

    return { success: true };
  },
});
