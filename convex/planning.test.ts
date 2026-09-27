/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

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
  return { t, owner, other };
}

test("planning data is limited to adjacent weeks and each user sees only their own rows", async () => {
  const { t, owner, other } = await setup();
  const previousWeekStart = "2024-12-30";
  const weekStart = "2025-01-06";
  const nextWeekStart = "2025-01-13";

  for (const [start, topic] of [
    [previousWeekStart, "previous"],
    [weekStart, "selected"],
    [nextWeekStart, "next"],
    ["2025-01-20", "outside"],
  ]) {
    await owner.mutation(api.schedule.setSlotTopic, {
      weekStart: start,
      dayIndex: 0,
      slotIndex: 1,
      topic,
    });
  }
  const privateSubject = await owner.mutation(api.subjects.addSubject, {
    name: "Private subject",
    color: "#123456",
  });

  const args = { weekStart };
  const result = await owner.query(api.schedule.getPlanningData, args);
  expect(result.weekStarts).toEqual([
    previousWeekStart,
    weekStart,
    nextWeekStart,
  ]);
  expect(result.slots.map((slot) => slot.topic)).toEqual([
    "previous",
    "selected",
    "next",
  ]);
  expect(result.slots.map((slot) => slot.weekStart)).toEqual([
    previousWeekStart,
    weekStart,
    nextWeekStart,
  ]);
  expect(
    (
      await owner.query(api.schedule.getPlanningData, {
        weekStart: previousWeekStart,
      })
    ).weekStarts,
  ).toEqual(["2024-12-23", previousWeekStart, weekStart]);
  const shiftedForward = await owner.query(api.schedule.getPlanningData, {
    weekStart: nextWeekStart,
  });
  expect(shiftedForward.weekStarts).toEqual([
    weekStart,
    nextWeekStart,
    "2025-01-20",
  ]);
  expect(shiftedForward.slots.map((slot) => slot.topic)).toEqual([
    "selected",
    "next",
    "outside",
  ]);
  expect(
    result.subjects.some((subject) => subject.slug === privateSubject.slug),
  ).toBe(true);

  const otherResult = await other.query(api.schedule.getPlanningData, args);
  expect(otherResult.slots).toEqual([]);
  expect(
    otherResult.subjects.some(
      (subject) => subject.slug === privateSubject.slug,
    ),
  ).toBe(false);
  await expect(t.query(api.schedule.getPlanningData, args)).rejects.toThrow(
    "Unauthorized",
  );
  await expect(
    owner.query(api.schedule.getPlanningData, { weekStart: "2025-01-07" }),
  ).rejects.toThrow("Invalid planning week start");
});
