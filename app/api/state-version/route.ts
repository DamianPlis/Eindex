import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis() || 0;
  }
  return 0;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await adminDb.collection("users").doc(session.uid).get();
  const data = snap.data() || {};

  return NextResponse.json(
    {
      updatedAt: toMillis(data.updatedAt),
      lastWriter: typeof data.lastWriter === "string" ? data.lastWriter : "",
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
