import type { Metadata } from "next";
import PlanningPageClient from "@/components/pages/PlanningPageClient";
import { buildDaysForWeek, normalizeWeekKey } from "@/lib/schedule/defaults";
import { getUserSettings, getPlanningPageState } from "@/lib/schedule/store";
import {
  getCurrentPeriodStats,
  sortPlanningSubjects,
} from "@/lib/schedule/stats";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";
import { requireSession } from "@/lib/session";
import { assertLocale } from "@/lib/i18n/server";
import { Suspense } from "react";
import PlanningPageSkeleton from "@/components/skeletons/PlanningPageSkeleton";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "planning", locale, path: "/planning" });
}

function shiftWeek(weekISO: string, deltaWeeks: number) {
  const date = new Date(`${weekISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaWeeks * 7);
  return date.toISOString().slice(0, 10);
}

export default async function LocalePlanningPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const locale = assertLocale((await params).locale);
  const query = await searchParams;
  const weekStart = normalizeWeekKey(query.week);

  return (
    <Suspense key={`planning-${weekStart}`} fallback={<PlanningPageSkeleton />}>
      <PlanningPageContent
        weekStart={weekStart}
        locale={locale}
        currentYear={new Date().getFullYear()}
      />
    </Suspense>
  );
}

async function PlanningPageContent({
  weekStart,
  locale,
  currentYear,
}: {
  weekStart: string;
  locale: AppLocale;
  currentYear: number;
}) {
  const session = await requireSession();
  const prevWeek = shiftWeek(weekStart, -1);
  const nextWeek = shiftWeek(weekStart, 1);
  const [state, settings] = await Promise.all([
    getPlanningPageState(session.uid, weekStart),
    getUserSettings(session.uid),
  ]);
  const rankingWeek = new Date(`${weekStart}T12:00:00`);
  const subjectUsage: Record<string, number> = {};
  for (const offset of [-1, 0, 1]) {
    const weekUsage = getCurrentPeriodStats("week", state, rankingWeek, offset);
    for (const [subjectId, count] of Object.entries(weekUsage)) {
      subjectUsage[subjectId] = (subjectUsage[subjectId] ?? 0) + count;
    }
  }
  const week = state.weeks[weekStart] || {
    weekStart,
    days: buildDaysForWeek(weekStart),
  };

  return (
    <PlanningPageClient
      weekStart={weekStart}
      currentYear={currentYear}
      currentWeekStart={normalizeWeekKey()}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      days={week.days}
      subjects={sortPlanningSubjects(
        state.subjects,
        state,
        locale,
        settings.planningSubjectSort,
        getMessages(locale),
        subjectUsage,
      )}
    />
  );
}
