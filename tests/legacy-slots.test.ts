import { expect, test } from "vitest";
import { buildLegacySlots } from "../scripts/legacy-slots";

test("legacy slots keep coordinates and normalize optional fields", () => {
  const slots = buildLegacySlots(
    {
      "2026-09-21": {
        days: [
          {
            date: "2026-09-22",
            slots: [
              {
                time: "08:00-08:15",
                fixedKey: "assembly",
                allowTopic: true,
                subjectId: "math",
                updatedAt: { toMillis: () => 42 },
              },
              { fixedKey: "unknown" },
            ],
          },
        ],
      },
    },
    99,
  );

  expect(slots).toHaveLength(2);
  expect(slots[0]).toMatchObject({
    weekStart: "2026-09-21",
    date: "2026-09-22",
    dayIndex: 0,
    slotIndex: 0,
    fixedKey: "assembly",
    allowTopic: true,
    subjectId: "math",
    updatedAt: 42,
  });
  expect(slots[1]).toMatchObject({
    dayIndex: 0,
    slotIndex: 1,
    time: "08:00-09:00",
    fixed: false,
    subjectId: null,
    topic: "",
    updatedAt: 99,
  });
  expect(slots[1].fixedKey).toBeUndefined();
});
