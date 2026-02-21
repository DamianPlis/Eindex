export type Subject = {
  id: string;
  name: string;
  color: string;
};

export type Slot = {
  id: string;
  time: string;
  fixed: boolean;
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
};

export type ScheduleState = {
  subjects: Subject[];
  weeks: Record<string, WeekSchedule>;
  lunches: Record<string, string>;
  deadlines: DeadlineItem[];
  settings: {
    theme: "light" | "dark";
  };
};
