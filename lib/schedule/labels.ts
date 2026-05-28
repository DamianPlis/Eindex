import type { AppMessages } from "@/lib/i18n/messages";
import type {
  FixedSlotKey,
  Slot,
  Subject,
  SubjectGroup,
} from "@/lib/schedule/types";

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

const builtInSubjectGroupIds = [
  "languages",
  "sciences",
  "humanities",
  "other",
] as const;

type BuiltinSubjectId = (typeof builtinSubjectIds)[number];
type BuiltinSubjectGroupId = (typeof builtInSubjectGroupIds)[number];

const builtinSubjectIdSet = new Set<string>(builtinSubjectIds);
export const builtinSubjectGroupIdSet = new Set<string>(builtInSubjectGroupIds);

/**
 * Resolves the display name of a subject.
 * Returns the localized name for built-in subjects, or the custom name for custom subjects.
 * 
 * @param subject - The Subject object or null.
 * @param messages - The localized app messages dictionary.
 * @returns The subject display name, or an empty string.
 */
export function getSubjectDisplayName(
  subject: Subject | null,
  messages: AppMessages,
 ): string {
  if (!subject) return "";
  if (builtinSubjectIdSet.has(subject.id)) {
    return messages.subjects.builtin[subject.id as BuiltinSubjectId];
  }
  return subject.name;
}

/**
 * Resolves the display name for a fixed activity slot.
 * Falls back to slot label or localized default activity name.
 * 
 * @param slot - Slot representation with fixedKey and fixedLabel.
 * @param messages - The localized app messages dictionary.
 * @returns The fixed slot display name.
 */
export function getFixedSlotDisplayName(
  slot: Pick<Slot, "fixedKey" | "fixedLabel">,
  messages: AppMessages,
): string {
  const fallbackKey: FixedSlotKey | "activity" = slot.fixedKey || "activity";
  return (
    messages.planning.fixedSlots[fallbackKey] ||
    slot.fixedLabel ||
    messages.planning.fixedSlots.activity
  );
}

/**
 * Resolves the display name for a subject group.
 * Handles localized name maps, built-in IDs, or plain text fallback.
 * 
 * @param subjectGroup - The SubjectGroup object or null.
 * @param messages - The localized app messages dictionary.
 * @param locale - The current locale string (defaults to "cs").
 * @returns The group display name, or an empty string.
 */
export function getSubjectGroupDisplayName(
  subjectGroup: SubjectGroup | null,
  messages: AppMessages,
  locale: string = "cs"
): string {
  if (!subjectGroup) return "";
  if (typeof subjectGroup.name === 'object' && subjectGroup.name !== null) {
    const nameMap = subjectGroup.name as Record<string, string>;
    return nameMap[locale] || nameMap["cs"] || Object.values(nameMap)[0] || "";
  }
  if (builtinSubjectGroupIdSet.has(subjectGroup.id)) {
    return messages.subjectGroups.builtin[
      subjectGroup.id as BuiltinSubjectGroupId
    ];
  }
  return String(subjectGroup.name || "");
}
