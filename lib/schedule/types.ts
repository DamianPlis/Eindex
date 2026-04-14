import type { AppSettings } from "@/lib/settings/types";

export type FixedSlotKey =
  | "morningCircle"
  | "currentEvents"
  | "lunch"
  | "tutor"
  | "pe"
  | "assembly";

export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type Slot = {
  id: string;
  time: string;
  fixed: boolean;
  fixedKey: FixedSlotKey | null;
  fixedLabel: string;
  allowTopic: boolean;
  subjectId: string | null;
  topic: string;
  updatedAt: number;
};

export type DaySchedule = {
  date: string;
  slots: Slot[];
};

export type WeekSchedule = {
  weekStart: string;
  days: DaySchedule[];
};

export type DeadlineItem = {
  id: string;
  text: string;
  date: string;
  status: "upcoming" | "today" | "expired" | "done";
};

export type ScheduleState = {
  subjects: Subject[];
  weeks: Record<string, WeekSchedule>;
  lunches: Record<string, string>;
  deadlines: DeadlineItem[];
  settings: AppSettings;
};

export type SortOption = "count-desc" | "count-asc" | "name-asc" | "name-desc";

export type StatsOptions = "week" | "month" | "year";