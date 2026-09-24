import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const planningSubjectSortValidator = v.union(
  v.literal("count-desc"),
  v.literal("count-asc"),
  v.literal("name-asc"),
  v.literal("name-desc"),
);

// Retain palette data written before the appearance rollback.
export const brandColorsValidator = v.object({
  primary: v.string(),
  fixed: v.string(),
  completion: v.string(),
});

export default defineSchema({
  // Authentication tables provided by @convex-dev/auth (users, authSessions, authAccounts, etc.)
  ...authTables,

  /**
   * Users Table Extension
   * Extends @convex-dev/auth users table with firebaseUid index for migration.
   */
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    firebaseUid: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("by_firebase_uid", ["firebaseUid"]),

  /**
   * User Settings & Preferences
   * Strictly matches APP_LOCALES (cs, en, pl) and DEFAULT_SETTINGS.
   */
  userSettings: defineTable({
    userId: v.id("users"),
    theme: v.union(v.literal("light"), v.literal("dark")),
    locale: v.union(v.literal("cs"), v.literal("en"), v.literal("pl")),
    useSchoolYear: v.boolean(),
    planningSubjectSort: v.optional(planningSubjectSortValidator),
    colors: v.optional(brandColorsValidator),
    updatedAt: v.number(),
    lastWriter: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  /**
   * Subjects
   * Contains built-in defaults (e.g. math, czech) and user-defined custom subjects.
   */
  subjects: defineTable({
    userId: v.id("users"),
    slug: v.string(), // e.g. "math", "czech", "custom_abc"
    name: v.string(), // e.g. "Matematika", "Čeština"
    color: v.string(), // Hex string e.g. "#b09ce3"
    order: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    hiddenFromPlanning: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_slug", ["userId", "slug"])
    .index("by_user_order", ["userId", "order"]),

  /**
   * Subject Groups
   * Groups subjects for filtering and stats (e.g. languages, sciences, humanities, other).
   */
  subjectGroups: defineTable({
    userId: v.id("users"),
    slug: v.string(), // e.g. "languages", "group_123"
    name: v.union(
      v.string(),
      v.record(v.string(), v.string()), // Localized name map: { cs: "Jazyky", en: "Languages", pl: "Języki" }
    ),
    subjectIds: v.array(v.string()), // Array of subject slugs
    namePreferences: v.optional(v.record(v.string(), v.string())),
    order: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_slug", ["userId", "slug"]),

  /**
   * Schedule Slots (Normalized Granular Model)
   * Represents individual timetable slots with specific day and period coordinates.
   */
  scheduleSlots: defineTable({
    userId: v.id("users"),
    weekStart: v.string(), // ISO Monday date (YYYY-MM-DD), e.g. "2026-08-10"
    date: v.string(), // ISO Day date (YYYY-MM-DD), e.g. "2026-08-12"
    dayIndex: v.number(), // 0 = Monday, 1 = Tuesday, ... 4 = Friday
    slotIndex: v.number(), // 0 to 7 (period of the day)
    time: v.string(), // e.g. "08:20-10:20"
    fixed: v.boolean(),
    fixedKey: v.optional(
      v.union(
        v.literal("morningCircle"),
        v.literal("currentEvents"),
        v.literal("lunch"),
        v.literal("tutor"),
        v.literal("pe"),
        v.literal("assembly"),
      ),
    ),
    fixedLabel: v.optional(v.string()),
    allowTopic: v.boolean(),
    subjectId: v.optional(v.union(v.string(), v.null())), // Subject slug, "lunch", or null
    topic: v.string(),
    updatedAt: v.number(),
    lastWriter: v.optional(v.string()),
  })
    // 0. Base query by user:
    .index("by_user", ["userId"])
    // 1. Used by Planning Page to fetch exact 35 slots for a week:
    .index("by_user_week", ["userId", "weekStart"])
    // 2. Used by Dashboard to fetch today's/tomorrow's 5-8 slots:
    .index("by_user_date", ["userId", "date"])
    // 3. Used for O(1) single-slot updates:
    .index("by_user_slot_coord", [
      "userId",
      "weekStart",
      "dayIndex",
      "slotIndex",
    ])
    // 4. Used for fast statistics aggregation without table scanning:
    .index("by_user_subject", ["userId", "subjectId"]),

  /**
   * Deadlines
   * Tasks and assignment reminders.
   */
  deadlines: defineTable({
    userId: v.id("users"),
    deadlineId: v.string(), // Original UUID
    text: v.string(),
    description: v.string(),
    date: v.string(), // ISO Due date (YYYY-MM-DD)
    status: v.union(
      v.literal("upcoming"),
      v.literal("today"),
      v.literal("expired"),
      v.literal("done"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    order: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_deadlineId", ["userId", "deadlineId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_status", ["userId", "status"]),

  deadlineUndos: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("remove"), v.literal("done")),
    deadlineId: v.string(),
    text: v.string(),
    description: v.string(),
    date: v.string(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("today"),
      v.literal("expired"),
      v.literal("done"),
    ),
    originalCreatedAt: v.number(),
    order: v.number(),
    used: v.boolean(),
    expiresAt: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * School Lunches (Shared Canteen Table)
   * Scraped menu from jidelna.cz. Shared across all users.
   */
  schoolLunches: defineTable({
    canteenId: v.string(), // e.g. "2069"
    date: v.string(), // ISO Date (YYYY-MM-DD)
    menuText: v.string(),
    fetchedAt: v.number(),
  }).index("by_canteen_date", ["canteenId", "date"]),
});
