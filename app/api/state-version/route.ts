import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/session";
import { toMillis } from "@/lib/utils/timestamp";

export const dynamic = "force-dynamic";
export const revalidate = 0;


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
