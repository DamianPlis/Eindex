import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      updatedAt: Date.now(),
      lastWriter: "",
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
