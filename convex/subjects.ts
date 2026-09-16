import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, initializeUser, touchUser } from "./model";
import schema from "./schema";

export const getSubjects = query({
  returns: v.array(schema.doc("subjects")),
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    return await ctx.db
      .query("subjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(4001);
  },
});

export const addSubject = mutation({
  returns: v.object({
    _id: v.id("subjects"),
    slug: v.string(),
    name: v.string(),
    color: v.string(),
  }),
  args: {
    name: v.string(),
    color: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    await touchUser(ctx, userId, args.writerId);

    const cleanName = args.name.trim();
    if (!cleanName) throw new Error("Subject name is required");

    const baseSlug =
      cleanName.toLowerCase().replace(/[^a-z0-9_]+/g, "_") || "custom";
    let slug = baseSlug;
    let counter = 1;

    const existingSubjects = await ctx.db
      .query("subjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(4001);

    if (existingSubjects.length >= 1000) throw new Error("Too many subjects");
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
  returns: v.object({ slug: v.string(), name: v.string(), color: v.string() }),
  args: {
    slug: v.string(),
    name: v.string(),
    color: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    await touchUser(ctx, userId, args.writerId);

    const cleanName = args.name.trim();
    if (!cleanName) throw new Error("Subject name is required");

    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
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
  returns: v.object({ success: v.boolean() }),
  args: {
    slug: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    await touchUser(ctx, userId, args.writerId);

    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
      )
      .first();

    if (subject) {
      await ctx.db.delete(subject._id);
    }

    // Clear subject assignment from matching slots
    const slotsWithSubject = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_user_subject", (q) =>
        q.eq("userId", userId).eq("subjectId", args.slug),
      )
      .take(4001);

    if (slotsWithSubject.length > 4000)
      throw new Error("Too many assigned slots to delete at once");
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
      .take(4001);

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
  returns: v.array(schema.doc("subjectGroups")),
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    return await ctx.db
      .query("subjectGroups")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(4001);
  },
});

export const addSubjectGroup = mutation({
  returns: v.object({ _id: v.id("subjectGroups"), slug: v.string() }),
  args: {
    name: v.record(v.string(), v.string()),
    subjectIds: v.array(v.string()),
    namePreferences: v.optional(v.record(v.string(), v.string())),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    await touchUser(ctx, userId, args.writerId);

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
  returns: v.object({ slug: v.string() }),
  args: {
    slug: v.string(),
    name: v.record(v.string(), v.string()),
    subjectIds: v.array(v.string()),
    namePreferences: v.optional(v.record(v.string(), v.string())),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    await touchUser(ctx, userId, args.writerId);

    const group = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
      )
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
  returns: v.object({ success: v.boolean() }),
  args: {
    slug: v.string(),
    writerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await initializeUser(ctx, userId);
    await touchUser(ctx, userId, args.writerId);

    const group = await ctx.db
      .query("subjectGroups")
      .withIndex("by_user_slug", (q) =>
        q.eq("userId", userId).eq("slug", args.slug),
      )
      .first();

    if (group) {
      await ctx.db.delete(group._id);
    }

    return { success: true };
  },
});
