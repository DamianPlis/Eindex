import type { Metadata } from "next";
import PlanningPageClient from "@/components/pages/PlanningPageClient";
import { buildDaysForWeek, normalizeWeekKey } from "@/lib/schedule/defaults";
import {
  getUserSettings,
  getPlanningPageState,
  getPeriodUsage,
} from "@/lib/schedule/store";
import { getDateRange, sortPlanningSubjects } from "@/lib/schedule/stats";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/config";
import { requireSession } from "@/lib/session";
import { assertLocale } from "@/lib/i18n/server";
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
  const locale: AppLocale = assertLocale((await params).locale);
  const query = await searchParams;
  const weekStart = normalizeWeekKey(query.week);
  const now = new Date();
  const currentYear = now.getFullYear();

  const session = await requireSession();
  const prevWeek = shiftWeek(weekStart, -1);
  const nextWeek = shiftWeek(weekStart, 1);
  const [state, { settings, usage }] = await Promise.all([
    getPlanningPageState(session.uid, weekStart),
    getUserSettings().then(async (settings) => {
      const { startISO, endISO } = getDateRange(
        "year",
        now,
        0,
        settings.useSchoolYear,
      );
      const usage = settings.planningSubjectSort.startsWith("count-")
        ? await getPeriodUsage(session.uid, "year", startISO, endISO)
        : [];
      return { settings, usage };
    }),
  ]);
  const subjectUsage = Object.fromEntries(
    usage.map(({ subjectId, weightedCount }) => [subjectId, weightedCount]),
  );
  const week = state.weeks[weekStart] || {
    weekStart,
    days: buildDaysForWeek(weekStart),
  };

  return (
    <PlanningPageClient
      key={weekStart}
      weekStart={weekStart}
      currentYear={currentYear}
      currentWeekStart={normalizeWeekKey()}
      prevWeek={prevWeek}
      nextWeek={nextWeek}
      days={week.days}
      subjects={sortPlanningSubjects(
        state.subjects,
        locale,
        settings.planningSubjectSort,
        getMessages(locale),
        subjectUsage,
      )}
    />
  );
}
