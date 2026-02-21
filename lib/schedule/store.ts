import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import { buildDaysForWeek, migrateState, normalizeWeekKey } from "@/lib/schedule/defaults";
import type { ScheduleState } from "@/lib/schedule/types";

const DATA_ROOT = path.join(process.cwd(), ".data", "users");

function sanitizeUid(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function userFile(uid: string): string {
  return path.join(DATA_ROOT, `${sanitizeUid(uid)}.json`);
}

async function ensureRootDir() {
  await mkdir(DATA_ROOT, { recursive: true });
}

export async function getUserState(uid: string): Promise<ScheduleState> {
  noStore();
  await ensureRootDir();
  const file = userFile(uid);

  try {
    const raw = await readFile(file, "utf8");
    return migrateState(JSON.parse(raw));
  } catch {
    const fresh = migrateState(null);
    await saveUserState(uid, fresh);
    return fresh;
  }
}

export async function saveUserState(uid: string, state: ScheduleState) {
  await ensureRootDir();
  const file = userFile(uid);
  const tmp = `${file}.tmp`;
  const payload = JSON.stringify(state, null, 2);
  await writeFile(tmp, payload, "utf8");
  await rename(tmp, file);
}

export async function updateUserState(
  uid: string,
  mutate: (draft: ScheduleState) => void | ScheduleState,
): Promise<ScheduleState> {
  const current = await getUserState(uid);
  const draft = structuredClone(current);
  const result = mutate(draft);
  const next = (result || draft) as ScheduleState;
  await saveUserState(uid, next);
  return next;
}

export function ensureWeekExists(state: ScheduleState, weekInput?: string) {
  const weekStart = normalizeWeekKey(weekInput);
  if (!state.weeks[weekStart]) {
    state.weeks[weekStart] = {
      weekStart,
      days: buildDaysForWeek(weekStart),
    };
  }
  return weekStart;
}
