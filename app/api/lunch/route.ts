import { NextResponse } from "next/server";
import { getLunchWeekStart } from "@/lib/lunch/dates";
import { getLunchPerDay } from "@/lib/lunch/server";

export async function GET() {
  const perDay = await getLunchPerDay();
  return NextResponse.json({
    weekStart: getLunchWeekStart(Object.keys(perDay).sort()[0]),
    perDay,
    fetchedAt: Date.now(),
  });
}
