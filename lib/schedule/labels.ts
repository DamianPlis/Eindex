import type { AppMessages } from "@/lib/i18n/messages";
import type { FixedSlotKey, Slot, Subject } from "@/lib/schedule/types";

const builtinSubjectIds = [
  "math",
  "theater",
  "conversation",
  "physics",
  "bio",
  "chem",
  "czech",
  "spanish",
  "music",
  "obcanka",
  "english",
  "farm",
  "it",
  "history",
  "geo",
  "other",
  "sp",
  "art",
] as const;

type BuiltinSubjectId = (typeof builtinSubjectIds)[number];

const builtinSubjectIdSet = new Set<string>(builtinSubjectIds);

export function getSubjectDisplayName(subject: Subject | null, messages: AppMessages): string {
  if (!subject) return "";
  if (builtinSubjectIdSet.has(subject.id)) {
    return messages.subjects.builtin[subject.id as BuiltinSubjectId];
  }
  return subject.name;
}

export function getFixedSlotDisplayName(
  slot: Pick<Slot, "fixedKey" | "fixedLabel">,
  messages: AppMessages,
): string {
  const fallbackKey: FixedSlotKey | "activity" = slot.fixedKey || "activity";
  return messages.planning.fixedSlots[fallbackKey] || slot.fixedLabel || messages.planning.fixedSlots.activity;
}
