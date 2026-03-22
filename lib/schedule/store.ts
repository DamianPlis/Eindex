import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { adminDb, adminFieldValue } from "@/lib/firebase/admin";
import { buildDaysForWeek, migrateState, normalizeWeekKey } from "@/lib/schedule/defaults";
import type { ScheduleState } from "@/lib/schedule/types";

const USER_COLLECTION = "users";
const CACHE_TTL_MS =
  process.env.ENABLE_STATE_READ_CACHE === "1" ? Number(process.env.USER_STATE_CACHE_MS || 0) : 0;

type CacheEntry = {
  expiresAt: number;
  state: ScheduleState;
};

const stateCache = new Map<string, CacheEntry>();

function cloneState(state: ScheduleState): ScheduleState {
  return structuredClone(state);
}

function getCachedState(uid: string): ScheduleState | null {
  const entry = stateCache.get(uid);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    stateCache.delete(uid);
    return null;
  }
  return cloneState(entry.state);
}

function setCachedState(uid: string, state: ScheduleState) {
  stateCache.set(uid, {
    expiresAt: Date.now() + Math.max(0, CACHE_TTL_MS),
    state: cloneState(state),
  });
}

function userDocRef(uid: string) {
  return adminDb.collection(USER_COLLECTION).doc(uid);
}

export async function getUserState(uid: string): Promise<ScheduleState> {
  noStore();
  if (CACHE_TTL_MS > 0) {
    const cached = getCachedState(uid);
    if (cached) return cached;
  }

  const ref = userDocRef(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    const fresh = migrateState(null);
    await ref.set(
      {
        state: fresh,
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (CACHE_TTL_MS > 0) setCachedState(uid, fresh);
    return fresh;
  }

  const state = migrateState(snap.data()?.state);
  if (CACHE_TTL_MS > 0) setCachedState(uid, state);
  return cloneState(state);
}

export async function saveUserState(uid: string, state: ScheduleState) {
  const normalizedState = migrateState(state);
  const ref = userDocRef(uid);
  await ref.set(
    {
      state: normalizedState,
      updatedAt: adminFieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  if (CACHE_TTL_MS > 0) setCachedState(uid, normalizedState);
}

export async function updateUserState(
  uid: string,
  mutate: (draft: ScheduleState) => void | ScheduleState,
  options?: { writerId?: string },
): Promise<ScheduleState> {
  const ref = userDocRef(uid);
  const nextState = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = migrateState(snap.exists ? snap.data()?.state : null);
    const draft = cloneState(current);
    const result = mutate(draft);
    const next = migrateState((result || draft) as ScheduleState);
    tx.set(
      ref,
      {
        state: next,
        updatedAt: adminFieldValue.serverTimestamp(),
        lastWriter: options?.writerId || null,
      },
      { merge: true },
    );

    return next;
  });

  if (CACHE_TTL_MS > 0) setCachedState(uid, nextState);
  return cloneState(nextState);
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
