import type { FunctionArgs } from "convex/server";
import type { internal } from "../convex/_generated/api";
import type { FixedSlotKey } from "../lib/schedule/types";
import { toMillis } from "../lib/utils/timestamp";

export type LegacyWeeks = Record<
  string,
  { days?: Array<{ date?: string; slots?: Array<Record<string, unknown>> }> }
>;
type MigrationSlot = FunctionArgs<
  typeof internal.sync.syncSlotsBatch
>["slots"][number];

const fixedKeys: FixedSlotKey[] = [
  "morningCircle",
  "currentEvents",
  "lunch",
  "tutor",
  "pe",
  "assembly",
];

export function buildLegacySlots(
  weeks: LegacyWeeks,
  fallbackUpdatedAt: number,
) {
  const slots: MigrationSlot[] = [];
  for (const [weekStart, weekData] of Object.entries(weeks)) {
    for (const [dayIndex, day] of (weekData?.days || []).entries()) {
      if (!day) continue;
      for (const [slotIndex, slot] of (day.slots || []).entries()) {
        if (!slot) continue;
        const idParts = typeof slot.id === "string" ? slot.id.split(":") : [];
        const savedSlotIndex =
          idParts.length === 3 &&
          idParts[0] === weekStart &&
          idParts[1] === String(dayIndex) &&
          /^[0-7]$/.test(idParts[2] || "")
            ? Number(idParts[2])
            : slotIndex;
        const fixedKey = fixedKeys.includes(slot.fixedKey as FixedSlotKey)
          ? (slot.fixedKey as FixedSlotKey)
          : undefined;
        slots.push({
          weekStart,
          date: day.date || weekStart,
          dayIndex,
          slotIndex: savedSlotIndex,
          time: typeof slot.time === "string" ? slot.time : "08:00-09:00",
          fixed: Boolean(slot.fixed),
          fixedKey,
          fixedLabel:
            typeof slot.fixedLabel === "string" ? slot.fixedLabel : undefined,
          allowTopic: Boolean(slot.allowTopic),
          subjectId: typeof slot.subjectId === "string" ? slot.subjectId : null,
          topic: typeof slot.topic === "string" ? slot.topic : "",
          updatedAt:
            (typeof slot.updatedAt === "number" && slot.updatedAt > 0
              ? slot.updatedAt
              : toMillis(slot.updatedAt)) || fallbackUpdatedAt,
        });
      }
    }
  }
  return slots;
}
