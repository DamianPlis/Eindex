import { expect, test } from "vitest";
import { buildDaysForWeek, migrateState } from "../lib/schedule/defaults";

test.each(["2026-09-21", "2026-09-28", "2027-01-04"])(
  "weeks from 21 September use the 2026/27 PDF blocks (%s)",
  (weekStart) => {
    const days = buildDaysForWeek(weekStart);
    expect(
      days.map((day) => day.slots.map((slot) => [slot.time, slot.fixedKey])),
    ).toEqual([
      [
        ["08:00-08:15", "morningCircle"],
        ["08:20-10:20", null],
        ["10:30-11:30", null],
        ["11:40-12:40", "assembly"],
        ["12:40-13:20", "lunch"],
        ["13:20-14:00", null],
        ["14:05-15:00", null],
      ],
      [
        ["08:00-08:15", "morningCircle"],
        ["08:20-10:20", null],
        ["10:30-11:30", null],
        ["11:40-12:40", null],
        ["12:40-13:20", "lunch"],
        ["13:20-14:00", null],
        ["14:05-15:00", null],
      ],
      [
        ["08:00-08:15", "morningCircle"],
        ["08:20-10:20", null],
        ["10:30-11:30", null],
        ["11:30-12:05", "lunch"],
        ["12:05-13:05", "currentEvents"],
        ["13:10-15:00", "pe"],
      ],
      [
        ["08:00-08:15", "morningCircle"],
        ["08:20-10:20", null],
        ["10:30-11:30", null],
        ["11:40-12:40", null],
        ["12:40-13:20", "lunch"],
        ["13:20-14:00", "tutor"],
        ["14:05-15:00", null],
      ],
      [["08:00-15:00", null]],
    ]);

    for (const day of days) {
      for (const slot of day.slots) {
        expect(slot.fixed).toBe(slot.fixedKey !== null);
        expect(slot.subjectId).toBe(slot.fixedKey === "lunch" ? "lunch" : null);
        expect(slot.topic).toBe("");
        expect(slot.allowTopic).toBe(
          slot.fixedKey === "currentEvents" || slot.fixedKey === "pe",
        );
      }
    }
  },
);

test("the new layout keeps generated dates and editable slot IDs distinct", () => {
  const days = buildDaysForWeek("2026-09-21");
  expect(days.map((day) => day.date)).toEqual([
    "2026-09-21",
    "2026-09-22",
    "2026-09-23",
    "2026-09-24",
    "2026-09-25",
  ]);
  expect(days[1].slots[6]).toMatchObject({
    id: "2026-09-21:1:6",
    time: "14:05-15:00",
    fixed: false,
  });
  expect(days[3].slots[6].id).toBe("2026-09-21:3:6");
  const ids = days.flatMap((day) => day.slots.map((slot) => slot.id));
  expect(new Set(ids).size).toBe(28);
});

test("historical weeks retain their layout and saved final Thursday block", () => {
  const weekStart = "2026-09-14";
  const days = buildDaysForWeek(weekStart);
  expect(days.map((day) => day.slots.length)).toEqual([7, 6, 6, 8, 1]);
  expect(days[0].slots[3].fixedKey).toBe("currentEvents");
  expect(days[1].slots[4].fixedKey).toBe("tutor");
  expect(days[1].slots[5].fixedKey).toBe("pe");
  expect(days[3].slots[6].fixedKey).toBe("assembly");
  days[3].slots[7].subjectId = "math";
  days[3].slots[7].topic = "Saved lesson";
  const state = migrateState({
    weeks: { [weekStart]: { weekStart, days } },
  });
  expect(state.weeks[weekStart].days).toEqual(days);
});
