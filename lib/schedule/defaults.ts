import type { ScheduleState, Slot, Subject, DeadlineItem } from "@/lib/schedule/types";

type SlotTemplate = {
  time: string;
  fixedLabel?: string;
  allowTopic?: boolean;
};

type DayTemplate = {
  slots: SlotTemplate[];
};

export const defaultSubjects: Subject[] = [
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

export const dayTemplates: DayTemplate[] = [
  {
    slots: [
      { time: "08:00-08:15", fixedLabel: "Ranni kruh" },
      { time: "08:20-10:20" },
      { time: "10:30-11:30" },
      { time: "11:40-12:40", fixedLabel: "Aktuality", allowTopic: true },
      { time: "12:40-13:15", fixedLabel: "Obed" },
      { time: "13:15-14:00" },
      { time: "14:05-15:00" },
    ],
  },
  {
    slots: [
      { time: "08:00-08:15", fixedLabel: "Ranni kruh" },
      { time: "08:20-10:20" },
      { time: "10:30-11:40" },
      { time: "11:40-12:15", fixedLabel: "Obed" },
      { time: "12:15-13:00", fixedLabel: "Tutor" },
      { time: "13:10-15:00", fixedLabel: "Telocvik", allowTopic: true },
    ],
  },
  {
    slots: [
      { time: "08:00-08:15", fixedLabel: "Ranni kruh" },
      { time: "08:20-10:20" },
      { time: "10:30-12:15" },
      { time: "12:15-13:15", fixedLabel: "Obed" },
      { time: "13:15-14:00"},
      { time: "14:05-15:00" },
    ],
  },
  {
    slots: [
      { time: "08:00-08:15", fixedLabel: "Ranni kruh" },
      { time: "08:20-09:20" },
      { time: "09:25-10:25" },
      { time: "10:30-11:30" },
      { time: "11:40-12:40" },
      { time: "12:40-13:15", fixedLabel: "Obed" },
      { time: "13:15-14:00", fixedLabel: "Shromazdeni" },
      { time: "14:05-15:00" },
    ],
  },
  {
    slots: [{ time: "08:00-15:00" }],
  },
];

export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isoDate(date: Date = new Date()): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeWeekKey(input?: string): string {
  if (!input) return isoDate(getMonday());
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return isoDate(getMonday());
  return isoDate(getMonday(parsed));
}

export function buildDaysForWeek(weekStartISO: string) {
  const base = new Date(weekStartISO);
  return dayTemplates.map((dayTpl, dayIdx) => {
    const current = new Date(base);
    current.setDate(base.getDate() + dayIdx);
    const slots: Slot[] = dayTpl.slots.map((slotTpl, slotIdx) => ({
      id: `${weekStartISO}:${dayIdx}:${slotIdx}`,
      time: slotTpl.time,
      fixed: Boolean(slotTpl.fixedLabel),
      fixedLabel: slotTpl.fixedLabel || "",
      allowTopic: Boolean(slotTpl.allowTopic),
      subjectId: slotTpl.fixedLabel === "Obed" ? "lunch" : null,
      topic: "",
      updatedAt: 0,
    }));
    return { date: isoDate(current), slots };
  });
}

export function createDefaultState(): ScheduleState {
  const monday = isoDate(getMonday());
  return {
    subjects: defaultSubjects,
    weeks: {
      [monday]: {
        weekStart: monday,
        days: buildDaysForWeek(monday),
      },
    },
    lunches: {},
    deadlines: [],
    settings: {
      theme: "light",
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
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

export function normalizeDeadlines(
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
    const text = typeof rawDeadline.text === "string" ? rawDeadline.text.trim() : "";
    const date = typeof rawDeadline.date === "string" ? rawDeadline.date : "";

    if (!id || !text || !date) continue;

    validDeadlines.push({
      id,
      text,
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
  
  base.subjects = Array.isArray(source.subjects) && source.subjects.length ? source.subjects : defaultSubjects;

  const todayISO = isoDate(new Date());
  base.deadlines = normalizeDeadlines(source.deadlines, todayISO);


  base.lunches = source.lunches && typeof source.lunches === "object" ? source.lunches : {};
  base.settings = source.settings?.theme === "dark" ? { theme: "dark" } : { theme: "light" };

  const weekMap = source.weeks && typeof source.weeks === "object" ? source.weeks : {};
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
      for (let slotIdx = 0; slotIdx < builtDays[dayIdx].slots.length; slotIdx++) {
        const srcSlot = srcDay.slots?.[slotIdx];
        if (!srcSlot) continue;
        builtDays[dayIdx].slots[slotIdx] = {
          ...builtDays[dayIdx].slots[slotIdx],
          ...srcSlot,
          updatedAt: srcSlot.updatedAt || 0,
        };
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

export function parseRangeMinutes(timeStr: string): number | null {
  if (!timeStr || !timeStr.includes("-")) return null;
  const [startRaw, endRaw] = timeStr.split("-").map((t) => t.trim());
  const [sh, sm] = startRaw.split(":").map(Number);
  const [eh, em] = endRaw.split(":").map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return null;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}
