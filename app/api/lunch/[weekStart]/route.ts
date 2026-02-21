import { NextResponse } from "next/server";
import { getLunchPerDay } from "@/lib/lunch/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ weekStart: string }> },
) {
  const { weekStart } = await params;
  const perDay = await getLunchPerDay();
  return NextResponse.json({
    weekStart,
    perDay,
    fetchedAt: Date.now(),
  });
}
