import type { Metadata } from "next";
import PlanningPageClient from "@/components/pages/PlanningPageClient";
import { buildDaysForWeek, normalizeWeekKey } from "@/lib/schedule/defaults";
import { getUserSettings, getUserState } from "@/lib/schedule/store";
import { sortPlanningSubjects } from "@/lib/schedule/stats";
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
  const locale = assertLocale((await params).locale);
  const query = await searchParams;
  const weekStart = normalizeWeekKey(query.week);

  return (
    <Suspense key={`planning-${weekStart}`} fallback={<PlanningPageSkeleton />}>
      <PlanningPageContent weekStart={weekStart} locale={locale} />
    </Suspense>
  );
}

async function PlanningPageContent({
  weekStart,
  locale,
}: {
  weekStart: string;
  locale: AppLocale;
}) {
  const session = await requireSession();
  const [state, settings] = await Promise.all([
    getUserState(session.uid),
    getUserSettings(session.uid),
  ]);
  const week = state.weeks[weekStart] || {
    weekStart,
    days: buildDaysForWeek(weekStart),
  };

  return (
    <PlanningPageClient
      weekStart={weekStart}
      currentWeekStart={normalizeWeekKey()}
      prevWeek={shiftWeek(weekStart, -1)}
      nextWeek={shiftWeek(weekStart, 1)}
      days={week.days}
      subjects={sortPlanningSubjects(
        state.subjects,
        state,
        locale,
        settings.planningSubjectSort,
        getMessages(locale),
      )}
    />
  );
}
