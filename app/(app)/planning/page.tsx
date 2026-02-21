import PlanningPageClient from "@/components/pages/PlanningPageClient";
import { buildDaysForWeek, normalizeWeekKey } from "@/lib/schedule/defaults";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";

function shiftWeek(weekISO: string, deltaWeeks: number) {
  const date = new Date(weekISO);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return normalizeWeekKey(date.toISOString());
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireSession();
  const state = await getUserState(session.uid);
  const params = await searchParams;
  const weekStart = normalizeWeekKey(params.week);
  const week = state.weeks[weekStart] || {
    weekStart,
    days: buildDaysForWeek(weekStart),
  };

  return (
    <PlanningPageClient
      weekStart={weekStart}
      prevWeek={shiftWeek(weekStart, -1)}
      nextWeek={shiftWeek(weekStart, 1)}
      days={week.days}
      subjects={state.subjects}
    />
  );
}
