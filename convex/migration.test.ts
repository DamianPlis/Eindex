/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { resolveAuthUser } from "./authUser";
import { migrateState } from "../lib/schedule/defaults";
import { sortPlanningSubjects } from "../lib/schedule/stats";
import { getMessages } from "../lib/i18n/messages";
import * as legacySync from "./sync";
import { upsertLunch } from "./lunches";
const modules = import.meta.glob("./**/*.ts");
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function setup() {
  const t = convexTest(schema, modules);
  const [ownerId, otherId] = await t.run(async (ctx) => [
    await ctx.db.insert("users", { email: "owner@example.com" }),
    await ctx.db.insert("users", { email: "other@example.com" }),
  ]);
  const owner = t.withIdentity({ subject: ownerId + "|session-owner" });
  const other = t.withIdentity({ subject: otherId + "|session-other" });
  await owner.mutation(api.users.ensureInitialized, {});
  await other.mutation(api.users.ensureInitialized, {});
  return { t, owner, other, ownerId, otherId };
}
const newDeadline = (text: string) => ({
  text,
  description: "Full description",
  date: "2099-12-01",
});
const coord = { weekStart: "2026-09-14", dayIndex: 0, slotIndex: 1 };

test("planning visibility is reversible and preserves slots, groups, and subject edits", async () => {
  const { owner, other, t } = await setup();
  const trip = await owner.mutation(api.subjects.addSubject, {
    name: "School trip",
    color: "#123456",
  });
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    subjectId: trip.slug,
  });
  await owner.mutation(api.schedule.setSlotTopic, {
    ...coord,
    topic: "Museum",
  });
  await owner.mutation(api.subjects.addSubjectGroup, {
    name: { en: "Activities" },
    subjectIds: [trip.slug],
  });
  const before = await owner.query(api.schedule.getWeekSchedule, {
    weekStart: coord.weekStart,
  });
  const groupsBefore = await owner.query(api.subjects.getSubjectGroups, {});

  await expect(
    other.mutation(api.subjects.setPlanningVisibility, {
      slug: trip.slug,
      hiddenFromPlanning: true,
    }),
  ).rejects.toThrow("Subject not found");
  await expect(
    t.mutation(api.subjects.setPlanningVisibility, {
      slug: trip.slug,
      hiddenFromPlanning: true,
    }),
  ).rejects.toThrow("Unauthorized");

  await owner.mutation(api.subjects.setPlanningVisibility, {
    slug: trip.slug,
    hiddenFromPlanning: true,
    writerId: "visibility-tab",
  });
  await owner.mutation(api.subjects.updateSubject, {
    slug: trip.slug,
    name: "School trip updated",
    color: "#654321",
  });
  expect(
    (await owner.query(api.subjects.getSubjects, {})).find(
      (s) => s.slug === trip.slug,
    ),
  ).toMatchObject({ hiddenFromPlanning: true, name: "School trip updated" });
  expect(
    (
      await owner.query(api.schedule.getWeekSchedule, {
        weekStart: coord.weekStart,
      })
    ).slots,
  ).toEqual(before.slots);
  expect(await owner.query(api.subjects.getSubjectGroups, {})).toEqual(
    groupsBefore,
  );

  await owner.mutation(api.subjects.setPlanningVisibility, {
    slug: trip.slug,
    hiddenFromPlanning: false,
    writerId: "visibility-tab",
  });
  expect(
    (await owner.query(api.subjects.getSubjects, {})).find(
      (s) => s.slug === trip.slug,
    ),
  ).toMatchObject({ hiddenFromPlanning: false });
  expect(await owner.query(api.settings.getUserSettings, {})).toMatchObject({
    lastWriter: "visibility-tab",
  });

  await owner.mutation(api.subjects.setPlanningVisibility, {
    slug: "math",
    hiddenFromPlanning: true,
  });
  expect(
    (await other.query(api.subjects.getSubjects, {})).find(
      (s) => s.slug === "math",
    )?.hiddenFromPlanning,
  ).toBeUndefined();
});

test("first login persists editable defaults once and never resurrects deleted subjects/groups", async () => {
  const { owner } = await setup();
  const defaults = migrateState(null);
  expect(await owner.query(api.subjects.getSubjects, {})).toHaveLength(
    defaults.subjects.length,
  );
  await owner.mutation(api.subjects.updateSubject, {
    slug: "math",
    name: "My maths",
    color: "#123456",
  });
  for (const s of await owner.query(api.subjects.getSubjects, {}))
    await owner.mutation(api.subjects.deleteSubject, { slug: s.slug });
  for (const g of await owner.query(api.subjects.getSubjectGroups, {}))
    await owner.mutation(api.subjects.deleteSubjectGroup, { slug: g.slug });
  await owner.mutation(api.users.ensureInitialized, {});
  expect(await owner.query(api.subjects.getSubjects, {})).toEqual([]);
  expect(await owner.query(api.subjects.getSubjectGroups, {})).toEqual([]);
});
test("settings persist planning sorting, locale, theme and school year independently per user", async () => {
  const { owner, other } = await setup();
  await owner.mutation(api.settings.updateSettings, {
    theme: "dark",
    locale: "pl",
    useSchoolYear: true,
    planningSubjectSort: "name-desc",
    writerId: "tab-a",
  });
  await owner.mutation(api.settings.updateSettings, { theme: "light" });
  expect(await owner.query(api.settings.getUserSettings, {})).toMatchObject({
    theme: "light",
    locale: "pl",
    useSchoolYear: true,
    planningSubjectSort: "name-desc",
  });
  expect(await other.query(api.settings.getUserSettings, {})).toMatchObject({
    locale: "cs",
    planningSubjectSort: "name-asc",
  });
});

test("alphabetical defaults never replace a saved most-common planning sort", async () => {
  const { owner } = await setup();
  expect(await owner.query(api.settings.getUserSettings, {})).toMatchObject({
    planningSubjectSort: "name-asc",
  });
  await owner.mutation(api.settings.updateSettings, {
    planningSubjectSort: "count-desc",
  });
  await owner.mutation(api.users.ensureInitialized, {});
  await owner.mutation(api.settings.updateSettings, { theme: "dark" });
  expect(await owner.query(api.settings.getUserSettings, {})).toMatchObject({
    theme: "dark",
    planningSubjectSort: "count-desc",
  });
});
test("schedule updates retain other fields, historical weeks, and user isolation", async () => {
  const { owner, other } = await setup();
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    subjectId: "math",
  });
  await owner.mutation(api.schedule.setSlotTopic, {
    ...coord,
    topic: "Algebra",
  });
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    weekStart: "2025-01-06",
    subjectId: "czech",
  });
  const slots = await owner.query(api.schedule.listSlots, {
    paginationOpts: { numItems: 1, cursor: null },
  });
  expect(slots.page[0]).toMatchObject({ subjectId: "math", topic: "Algebra" });
  expect(slots.isDone).toBe(false);
  const next = await owner.query(api.schedule.listSlots, {
    paginationOpts: { numItems: 100, cursor: slots.continueCursor },
  });
  expect(next.page[0].weekStart).toBe("2025-01-06");
  expect(
    (
      await other.query(api.schedule.getWeekSchedule, {
        weekStart: coord.weekStart,
      })
    ).slots,
  ).toEqual([]);
});
test("slot validation prevents invalid dates, coordinates and foreign subject assignment", async () => {
  const { owner, other } = await setup();
  const foreign = await other.mutation(api.subjects.addSubject, {
    name: "Private",
    color: "#123456",
  });
  await expect(
    owner.mutation(api.schedule.setSlotSubject, {
      ...coord,
      subjectId: foreign.slug,
    }),
  ).rejects.toThrow("Subject not found");
  await expect(
    owner.mutation(api.schedule.setSlotSubject, {
      ...coord,
      slotIndex: 99,
      subjectId: "math",
    }),
  ).rejects.toThrow("Invalid schedule");
  await expect(
    owner.mutation(api.schedule.setSlotTopic, {
      ...coord,
      weekStart: "2026-09-15",
      topic: "Bad",
    }),
  ).rejects.toThrow("Invalid schedule");
});
test("fixed lunch remains lunch and fixed non-topic slots cannot gain a topic", async () => {
  const { owner } = await setup();
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    slotIndex: 4,
    subjectId: "math",
  });
  expect(
    await owner.mutation(api.schedule.setSlotTopic, {
      ...coord,
      slotIndex: 4,
      topic: "Bad",
    }),
  ).toBeNull();
  const data = await owner.query(api.schedule.getWeekSchedule, {
    weekStart: coord.weekStart,
  });
  expect(data.slots[0]).toMatchObject({
    subjectId: "lunch",
    fixedKey: "lunch",
    topic: "",
  });
});
test("deleting a subject clears its schedule and groups without touching another user", async () => {
  const { owner, other } = await setup();
  await owner.mutation(api.schedule.setSlotSubject, {
    ...coord,
    subjectId: "math",
  });
  await other.mutation(api.schedule.setSlotSubject, {
    ...coord,
    subjectId: "math",
  });
  await owner.mutation(api.subjects.deleteSubject, { slug: "math" });
  expect(
    (
      await owner.query(api.schedule.getWeekSchedule, {
        weekStart: coord.weekStart,
      })
    ).slots[0].subjectId,
  ).toBeNull();
  expect(
    (await owner.query(api.subjects.getSubjectGroups, {})).every(
      (g) => !g.subjectIds.includes("math"),
    ),
  ).toBe(true);
  expect(
    (
      await other.query(api.schedule.getWeekSchedule, {
        weekStart: coord.weekStart,
      })
    ).slots[0].subjectId,
  ).toBe("math");
});
test("remove and undo preserve content, completed status, and original list order", async () => {
  const { owner } = await setup();
  await owner.mutation(api.deadlines.addDeadline, newDeadline("a"));
  const b = await owner.mutation(api.deadlines.addDeadline, {
    ...newDeadline("b"),
    status: "done",
  });
  await owner.mutation(api.deadlines.addDeadline, newDeadline("c"));
  const before = await owner.query(api.deadlines.getDeadlines, {});
  const undo = (await owner.mutation(api.deadlines.removeDeadline, {
    deadlineId: b.deadlineId,
  }))!;
  expect(
    (await owner.query(api.deadlines.getDeadlines, {})).map((d) => d.text),
  ).toEqual(["a", "c"]);
  await owner.mutation(api.deadlines.undoDeadline, {
    receiptId: undo.receiptId,
  });
  const after = await owner.query(api.deadlines.getDeadlines, {});
  expect(
    after.map((d) => [
      d.deadlineId,
      d.text,
      d.description,
      d.date,
      d.status,
      d.createdAt,
    ]),
  ).toEqual(
    before.map((d) => [
      d.deadlineId,
      d.text,
      d.description,
      d.date,
      d.status,
      d.createdAt,
    ]),
  );
});
test("undo completion recalculates due state and preserves edits made afterward", async () => {
  const { t, owner } = await setup();
  const item = await owner.mutation(api.deadlines.addDeadline, {
    ...newDeadline("a"),
    date: "2000-01-01",
  });
  const undo = (await owner.mutation(api.deadlines.markAsDone, {
    deadlineId: item.deadlineId,
  }))!;
  await t.run((ctx) =>
    ctx.db.patch(item._id, { description: "Edited elsewhere" }),
  );
  await owner.mutation(api.deadlines.undoDeadline, {
    receiptId: undo.receiptId,
  });
  expect((await owner.query(api.deadlines.getDeadlines, {}))[0]).toMatchObject({
    status: "expired",
    description: "Edited elsewhere",
  });
});
test("multiple independent undo receipts are idempotent and cannot resurrect later deletions", async () => {
  const { owner } = await setup();
  const a = await owner.mutation(api.deadlines.addDeadline, newDeadline("a"));
  const b = await owner.mutation(api.deadlines.addDeadline, newDeadline("b"));
  const ua = (await owner.mutation(api.deadlines.removeDeadline, {
    deadlineId: a.deadlineId,
  }))!;
  const ub = (await owner.mutation(api.deadlines.removeDeadline, {
    deadlineId: b.deadlineId,
  }))!;
  await owner.mutation(api.deadlines.undoDeadline, { receiptId: ub.receiptId });
  await owner.mutation(api.deadlines.undoDeadline, { receiptId: ua.receiptId });
  await owner.mutation(api.deadlines.undoDeadline, { receiptId: ua.receiptId });
  expect(
    (await owner.query(api.deadlines.getDeadlines, {})).map((d) => d.text),
  ).toEqual(["a", "b"]);
  await owner.mutation(api.deadlines.removeDeadline, {
    deadlineId: a.deadlineId,
  });
  await owner.mutation(api.deadlines.undoDeadline, { receiptId: ua.receiptId });
  expect(
    (await owner.query(api.deadlines.getDeadlines, {})).map((d) => d.text),
  ).toEqual(["b"]);
});
test("no-op deadline changes return no receipt and undo completion never resurrects a removed row", async () => {
  const { owner } = await setup();
  const item = await owner.mutation(
    api.deadlines.addDeadline,
    newDeadline("a"),
  );
  const undo = (await owner.mutation(api.deadlines.markAsDone, {
    deadlineId: item.deadlineId,
  }))!;
  expect(
    await owner.mutation(api.deadlines.markAsDone, {
      deadlineId: item.deadlineId,
    }),
  ).toBeNull();
  expect(
    await owner.mutation(api.deadlines.removeDeadline, {
      deadlineId: "missing",
    }),
  ).toBeNull();
  await owner.mutation(api.deadlines.removeDeadline, {
    deadlineId: item.deadlineId,
  });
  await expect(
    owner.mutation(api.deadlines.undoDeadline, { receiptId: undo.receiptId }),
  ).rejects.toThrow("no longer exists");
});
test("a different user cannot read, complete, remove, or undo another user's deadline", async () => {
  const { owner, other } = await setup();
  const item = await owner.mutation(
    api.deadlines.addDeadline,
    newDeadline("Private"),
  );
  expect(await other.query(api.deadlines.getDeadlines, {})).toEqual([]);
  expect(
    await other.mutation(api.deadlines.markAsDone, {
      deadlineId: item.deadlineId,
    }),
  ).toBeNull();
  expect(
    await other.mutation(api.deadlines.removeDeadline, {
      deadlineId: item.deadlineId,
    }),
  ).toBeNull();
  const undo = (await owner.mutation(api.deadlines.removeDeadline, {
    deadlineId: item.deadlineId,
  }))!;
  await expect(
    other.mutation(api.deadlines.undoDeadline, { receiptId: undo.receiptId }),
  ).rejects.toThrow("Invalid deadline undo");
});
test("anonymous callers cannot read or write private app data", async () => {
  const { t } = await setup();
  await expect(t.query(api.deadlines.getDeadlines, {})).rejects.toThrow(
    "Unauthorized",
  );
  await expect(
    t.query(api.schedule.listSlots, {
      paginationOpts: { numItems: 10, cursor: null },
    }),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.mutation(api.deadlines.addDeadline, newDeadline("a")),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.mutation(api.settings.updateSettings, { theme: "dark" }),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.mutation(api.subjects.addSubject, { name: "Bad", color: "#fff" }),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.mutation(api.schedule.setSlotTopic, { ...coord, topic: "Bad" }),
  ).rejects.toThrow("Unauthorized");
});
test("every domain mutation advances the reactive revision for cross-device updates", async () => {
  const { owner } = await setup();
  let revision = (await owner.query(api.settings.getUserSettings, {}))!
    .updatedAt;
  const writes = [
    () =>
      owner.mutation(api.schedule.setSlotTopic, {
        ...coord,
        topic: "Topic",
        writerId: "tab-a",
      }),
    () =>
      owner.mutation(api.subjects.addSubject, {
        name: "Custom",
        color: "#fff",
      }),
    () =>
      owner.mutation(api.subjects.addSubjectGroup, {
        name: { en: "Custom" },
        subjectIds: ["math"],
      }),
    () => owner.mutation(api.deadlines.addDeadline, newDeadline("Task")),
  ];
  for (const write of writes) {
    await write();
    const next = (await owner.query(api.settings.getUserSettings, {}))!
      .updatedAt;
    expect(next).toBeGreaterThan(revision);
    revision = next;
  }
});
test("verified Google sign-in links imported data to the same Convex user", async () => {
  const t = convexTest(schema, modules);
  const migrated = await t.mutation(internal.sync.syncUserAndSettings, {
    firebaseUid: "legacy",
    email: "Legacy@Example.com",
    theme: "dark",
    locale: "en",
    useSchoolYear: true,
    planningSubjectSort: "name-asc",
  });
  await t.mutation(internal.sync.syncDeadline, {
    firebaseUid: "legacy",
    deadlineId: "old-task",
    text: "Imported",
    description: "Keep",
    date: "2099-01-01",
    status: "done",
  });
  const userId = await t.run((ctx) =>
    resolveAuthUser(ctx, {
      existingUserId: null,
      profile: {
        email: "legacy@example.com",
        emailVerified: true,
        name: "Legacy",
      },
    }),
  );
  expect(userId).toBe(migrated.userId);
  const owner = t.withIdentity({ subject: userId + "|session" });
  expect(
    (await owner.query(api.deadlines.getDeadlines, {}))[0].deadlineId,
  ).toBe("old-task");
  expect(await owner.query(api.settings.getUserSettings, {})).toMatchObject({
    theme: "dark",
    planningSubjectSort: "name-asc",
  });
});
test("unverified email cannot claim a migrated account and ambiguous duplicates fail closed", async () => {
  const { t } = await setup();
  await expect(
    t.run((ctx) =>
      resolveAuthUser(ctx, {
        existingUserId: null,
        profile: { email: "owner@example.com", emailVerified: false },
      }),
    ),
  ).rejects.toThrow("verified Google email");
  await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "owner@example.com",
      firebaseUid: "duplicate",
    }),
  );
  await expect(
    t.run((ctx) =>
      resolveAuthUser(ctx, {
        existingUserId: null,
        profile: { email: "owner@example.com", emailVerified: true },
      }),
    ),
  ).rejects.toThrow("Duplicate accounts");
});
test("Firebase migration writes and shared lunch writes are internal-only functions", () => {
  for (const fn of Object.values(legacySync))
    expect(fn).toHaveProperty("isInternal", true);
  expect(upsertLunch).toHaveProperty("isInternal", true);
});
test("planning sorting retains all four master options without mutating canonical order", () => {
  const state = migrateState(null);
  const original = state.subjects.map((s) => s.id);
  for (const sort of [
    "count-asc",
    "count-desc",
    "name-asc",
    "name-desc",
  ] as const) {
    expect(
      sortPlanningSubjects(
        state.subjects,
        state,
        "en",
        sort,
        getMessages("en"),
      ),
    ).toHaveLength(original.length);
  }
  expect(state.subjects.map((s) => s.id)).toEqual(original);
});
