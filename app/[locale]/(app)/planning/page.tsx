import PlanningPageClient from "@/components/pages/PlanningPageClient";
import { buildDaysForWeek, normalizeWeekKey } from "@/lib/schedule/defaults";
import { getUserState } from "@/lib/schedule/store";
import { requireSession } from "@/lib/session";
import { assertLocale } from "@/lib/i18n/server";
import { Suspense } from "react";
import PlanningPageSkeleton from "@/components/skeletons/PlanningPageSkeleton";

function shiftWeek(weekISO: string, deltaWeeks: number) {
  const date = new Date(weekISO);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return normalizeWeekKey(date.toISOString());
}

export default async function LocalePlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  assertLocale((await params).locale);
  const query = await searchParams;
  const weekStart = normalizeWeekKey(query.week);

  return (
    <Suspense key={`planning-${weekStart}`} fallback={<PlanningPageSkeleton />}>
      <PlanningPageContent weekStart={weekStart} />
    </Suspense>
  );
}

async function PlanningPageContent({ weekStart }: { weekStart: string }) {
  const session = await requireSession();
  const state = await getUserState(session.uid);
  const week = state.weeks[weekStart] || {
    weekStart,
    days: buildDaysForWeek(weekStart),
  };
  //const delay = new Promise((resolve) => setTimeout(resolve, 50000));
  //await delay; // Simulate loading delay for skeleton screen

  return (
    <PlanningPageClient
      weekStart={weekStart}
      currentWeekStart={normalizeWeekKey()}
      prevWeek={shiftWeek(weekStart, -1)}
      nextWeek={shiftWeek(weekStart, 1)}
      days={week.days}
      subjects={state.subjects}
    />
  );
}
