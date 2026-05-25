import type {
  DeadlineItem,
  FixedSlotKey,
  ScheduleState,
  Slot,
  Subject,
  SubjectGroup,
} from "@/lib/schedule/types";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/lib/settings/defaults";
import {
  getMonday,
  isoDate,
  normalizeWeekKey,
} from "@/lib/schedule/date-utils";

// Re-export date utilities for backward compatibility
export { getMonday, isoDate, normalizeWeekKey, parseRangeMinutes } from "@/lib/schedule/date-utils";

type SlotTemplate = {
  time: string;
  fixedKey?: FixedSlotKey;
  fixedLabel?: string;
  allowTopic?: boolean;
};

type DayTemplate = {
  slots: SlotTemplate[];
};

const defaultSubjects: Subject[] = [
  { id: "math", name: "Matematika", color: "#b09ce3" },
  { id: "theater", name: "Impro", color: "#b09ce3" },
  { id: "conversation", name: "Konverzace", color: "#ea8ae1" },
  { id: "physics", name: "Fyzika", color: "#b09ce3" },
  { id: "bio", name: "Prirodopis", color: "#a8f08a" },
  { id: "chem", name: "Chemie", color: "#a8f08a" },
  { id: "czech", name: "Cestina", color: "#ffd09e" },
  { id: "spanish", name: "Spanelstina", color: "#f68d8d" },
  { id: "music", name: "Hudba", color: "#f68d8d" },
  { id: "obcanka", name: "Obcanka", color: "#ffdf80" },
  { id: "english", name: "Anglictina", color: "#fbc1da" },
  { id: "farm", name: "Chynice", color: "#adadad" },
  { id: "it", name: "Informatika", color: "#adadad" },
  { id: "history", name: "Dejepis", color: "#9abffe" },
  { id: "geo", name: "Zemepis", color: "#9abffe" },
  { id: "other", name: "Ostatni", color: "#8f9cae" },
  { id: "sp", name: "SP", color: "#adadad" },
  { id: "art", name: "Vytvarka", color: "#c4e7ee" },
];

const defaultSubjectGroups: SubjectGroup[] = [
  {
    id: "languages",
    name: "Jazyky",
    subjectIds: ["czech", "english", "spanish", "conversation"],
  },
  {
    id: "sciences",
    name: "Přírodní vědy",
    subjectIds: ["math", "physics", "chem", "bio", "it"],
  },
  {
    id: "humanities",
    name: "Humanitní vědy",
    subjectIds: ["history", "geo", "obcanka"],
  },
  {
    id: "other",
    name: "Ostatní",
    subjectIds: ["theater", "music", "art", "farm", "sp", "other"],
  },
];

const dayTemplates: DayTemplate[] = [
  {
    slots: [
      {
        time: "08:00-08:15",
        fixedKey: "morningCircle",
        fixedLabel: "Ranni kruh",
      },
      { time: "08:20-10:20" },
      { time: "10:30-11:30" },
      {
        time: "11:40-12:40",
        fixedKey: "currentEvents",
        fixedLabel: "Aktuality",
        allowTopic: true,
      },
      { time: "12:40-13:15", fixedKey: "lunch", fixedLabel: "Obed" },
      { time: "13:15-14:00" },
      { time: "14:05-15:00" },
    ],
  },
  {
    slots: [
      {
        time: "08:00-08:15",
        fixedKey: "morningCircle",
        fixedLabel: "Ranni kruh",
      },
      { time: "08:20-10:20" },
      { time: "10:30-11:40" },
      { time: "11:40-12:15", fixedKey: "lunch", fixedLabel: "Obed" },
      { time: "12:15-13:00", fixedKey: "tutor", fixedLabel: "Tutor" },
      {
        time: "13:10-15:00",
        fixedKey: "pe",
        fixedLabel: "Telocvik",
        allowTopic: true,
      },
    ],
  },
  {
    slots: [
      {
        time: "08:00-08:15",
        fixedKey: "morningCircle",
        fixedLabel: "Ranni kruh",
      },
      { time: "08:20-10:20" },
      { time: "10:30-12:15" },
      { time: "12:15-13:15", fixedKey: "lunch", fixedLabel: "Obed" },
      { time: "13:15-14:00" },
      { time: "14:05-15:00" },
    ],
  },
  {
    slots: [
      {
        time: "08:00-08:15",
        fixedKey: "morningCircle",
        fixedLabel: "Ranni kruh",
      },
      { time: "08:20-09:20" },
      { time: "09:25-10:25" },
      { time: "10:30-11:30" },
      { time: "11:40-12:40" },
      { time: "12:40-13:15", fixedKey: "lunch", fixedLabel: "Obed" },
      { time: "13:15-14:00", fixedKey: "assembly", fixedLabel: "Shromazdeni" },
      { time: "14:05-15:00" },
    ],
  },
  {
    slots: [{ time: "08:00-15:00" }],
  },
];

export function buildDaysForWeek(weekStartISO: string) {
  const base = new Date(weekStartISO);
  return dayTemplates.map((dayTpl, dayIdx) => {
    const current = new Date(base);
    current.setDate(base.getDate() + dayIdx);
    const slots: Slot[] = dayTpl.slots.map((slotTpl, slotIdx) => ({
      id: `${weekStartISO}:${dayIdx}:${slotIdx}`,
      time: slotTpl.time,
      fixed: Boolean(slotTpl.fixedLabel),
      fixedKey: slotTpl.fixedKey || null,
      fixedLabel: slotTpl.fixedLabel || "",
      allowTopic: Boolean(slotTpl.allowTopic),
      subjectId: slotTpl.fixedKey === "lunch" ? "lunch" : null,
      topic: "",
      updatedAt: 0,
    }));
    return { date: isoDate(current), slots };
  });
}

function createDefaultState(): ScheduleState {
  const monday = isoDate(getMonday());
  return {
    subjects: defaultSubjects,
    subjectGroups: defaultSubjectGroups,
    weeks: {
      [monday]: {
        weekStart: monday,
        days: buildDaysForWeek(monday),
      },
    },
    lunches: {},
    deadlines: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeFixedLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function inferFixedSlotKey(
  rawKey: unknown,
  rawLabel: unknown,
): FixedSlotKey | null {
  if (typeof rawKey === "string") {
    const normalizedKey = rawKey.trim();
    if (
      normalizedKey === "morningCircle" ||
      normalizedKey === "currentEvents" ||
      normalizedKey === "lunch" ||
      normalizedKey === "tutor" ||
      normalizedKey === "pe" ||
      normalizedKey === "assembly"
    ) {
      return normalizedKey;
    }
  }

  if (typeof rawLabel !== "string") return null;

  const normalizedLabel = normalizeFixedLabel(rawLabel);
  if (normalizedLabel === "rannikruh" || normalizedLabel === "morningcircle")
    return "morningCircle";
  if (normalizedLabel === "aktuality" || normalizedLabel === "currentevents")
    return "currentEvents";
  if (normalizedLabel === "obed" || normalizedLabel === "lunch") return "lunch";
  if (normalizedLabel === "tutor") return "tutor";
  if (normalizedLabel === "telocvik" || normalizedLabel === "pe") return "pe";
  if (normalizedLabel === "shromazdeni" || normalizedLabel === "assembly")
    return "assembly";
  return null;
}

export function resolveDeadlineStatus(
  deadline: Pick<DeadlineItem, "date"> & Partial<Pick<DeadlineItem, "status">>,
  todayISO: string = isoDate(new Date()),
): DeadlineItem["status"] {
  if (deadline.status === "done") return "done";
  if (deadline.date === todayISO) return "today";
  if (deadline.date < todayISO) return "expired";
  return "upcoming";
}

function normalizeDeadlines(
  rawDeadlines: unknown,
  todayISO: string = isoDate(new Date()),
): DeadlineItem[] {
  const deadlineSource = Array.isArray(rawDeadlines)
    ? rawDeadlines
    : isRecord(rawDeadlines)
      ? Object.keys(rawDeadlines)
          .filter((key) => /^\d+$/.test(key))
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => rawDeadlines[key])
      : [];

  const validDeadlines: DeadlineItem[] = [];

  for (const rawDeadline of deadlineSource) {
    if (!isRecord(rawDeadline)) continue;

    const id = typeof rawDeadline.id === "string" ? rawDeadline.id.trim() : "";
    const text =
      typeof rawDeadline.text === "string" ? rawDeadline.text.trim() : "";
    const description =
      typeof rawDeadline.description === "string"
        ? rawDeadline.description.trim()
        : "";
    const date = typeof rawDeadline.date === "string" ? rawDeadline.date : "";

    if (!id || !text || !date) continue;

    validDeadlines.push({
      id,
      text,
      description,
      date,
      status: resolveDeadlineStatus(
        {
          date,
          status: rawDeadline.status as DeadlineItem["status"] | undefined,
        },
        todayISO,
      ),
    });
  }

  return validDeadlines;
}

export function migrateState(raw: unknown): ScheduleState {
  if (!raw || typeof raw !== "object") return createDefaultState();

  const source = raw as Partial<ScheduleState>;
  const base = createDefaultState();
  const basicSubjects =
    Array.isArray(source.subjects) && source.subjects.length
      ? source.subjects
      : defaultSubjects;
  base.subjects = basicSubjects;

  const basicSubjectGroups =
    Array.isArray(source.subjectGroups) && source.subjectGroups.length
      ? source.subjectGroups
      : defaultSubjectGroups;
  base.subjectGroups = basicSubjectGroups;

  const todayISO = isoDate(new Date());
  base.deadlines = normalizeDeadlines(source.deadlines, todayISO);

  base.lunches =
    source.lunches && typeof source.lunches === "object" ? source.lunches : {};
  base.settings = normalizeSettings(source.settings);

  const weekMap =
    source.weeks && typeof source.weeks === "object" ? source.weeks : {};
  const weekKeys = Object.keys(weekMap);
  if (weekKeys.length === 0) return base;

  base.weeks = {};
  for (const key of weekKeys) {
    const rawWeek = weekMap[key];
    const normalized = normalizeWeekKey(key);
    const builtDays = buildDaysForWeek(normalized);
    const srcDays = rawWeek?.days || [];

    for (let dayIdx = 0; dayIdx < builtDays.length; dayIdx++) {
      const srcDay = srcDays[dayIdx];
      if (!srcDay) continue;
      builtDays[dayIdx].date = srcDay.date || builtDays[dayIdx].date;
      for (
        let slotIdx = 0;
        slotIdx < builtDays[dayIdx].slots.length;
        slotIdx++
      ) {
        const srcSlot = srcDay.slots?.[slotIdx];
        if (!srcSlot) continue;
        const mergedSlot = {
          ...builtDays[dayIdx].slots[slotIdx],
          ...srcSlot,
          updatedAt: srcSlot.updatedAt || 0,
        };
        mergedSlot.fixedKey =
          inferFixedSlotKey(srcSlot.fixedKey, srcSlot.fixedLabel) ||
          mergedSlot.fixedKey;
        builtDays[dayIdx].slots[slotIdx] = mergedSlot;
      }
    }

    base.weeks[normalized] = {
      weekStart: normalized,
      days: builtDays,
    };
  }

  const currentWeek = isoDate(getMonday());
  if (!base.weeks[currentWeek]) {
    base.weeks[currentWeek] = {
      weekStart: currentWeek,
      days: buildDaysForWeek(currentWeek),
    };
  }

  return base;
}
