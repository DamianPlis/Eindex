export type FixedSlotKey =
  "morningCircle" | "currentEvents" | "lunch" | "tutor" | "pe" | "assembly";

export type Subject = {
  id: string;
  name: string;
  color: string;
  hiddenFromPlanning?: boolean;
};

export type SubjectGroup = {
  id: string;
  name: string | Record<string, string>;
  subjectIds: string[];
  namePreferences?: Record<string, string>; // e.g. { pl: "cs" } means PL uses CS's name
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
  description: string;
  date: string;
  status: "upcoming" | "today" | "expired" | "done";
};

export type ScheduleState = {
  subjects: Subject[];
  subjectGroups: SubjectGroup[];
  weeks: Record<string, WeekSchedule>;
  lunches: Record<string, string>;
  deadlines: DeadlineItem[];
};

export type SortOption = "count-desc" | "count-asc" | "name-asc" | "name-desc";

export type FilterOption = string[];

export type StatsOptions = "week" | "month" | "year";
