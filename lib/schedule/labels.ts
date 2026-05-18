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
const builtinSubjectGroupIdSet = new Set<string>(builtInSubjectGroupIds);

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

export function getSubjectGroupDisplayName(
  subjectGroup: SubjectGroup | null,
  messages: AppMessages,
): string {
  if (!subjectGroup) return "";
  if (builtinSubjectGroupIdSet.has(subjectGroup.id)) {
    return messages.subjectGroups.builtin[
      subjectGroup.id as BuiltinSubjectGroupId
    ];
  }
  return subjectGroup.name;
}
