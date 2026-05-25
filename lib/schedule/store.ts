import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import { adminDb, adminFieldValue } from "@/lib/firebase/admin";
import { buildDaysForWeek, migrateState, normalizeWeekKey } from "@/lib/schedule/defaults";
import { autoSortSubjectsByUsage } from "@/lib/schedule/stats";
import type { ScheduleState } from "@/lib/schedule/types";
import { DEFAULT_SETTINGS, mergeSettings, normalizeSettings } from "@/lib/settings/defaults";
import type { AppSettings } from "@/lib/settings/types";

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

function cloneSettings(settings: AppSettings): AppSettings {
  return structuredClone(settings);
}

function resolveStoredSettings(data: unknown): AppSettings {
  if (!data || typeof data !== "object") return { ...DEFAULT_SETTINGS };

  const source = data as {
    settings?: unknown;
    state?: {
      settings?: unknown;
    };
  };

  return mergeSettings(source.state?.settings, source.settings);
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

function syncCachedSettings(uid: string, settings: AppSettings) {
  const entry = stateCache.get(uid);
  if (!entry) return;
  entry.state.settings = cloneSettings(settings);
}

function userDocRef(uid: string) {
  return adminDb.collection(USER_COLLECTION).doc(uid);
}

const getUserDoc = cache(async (uid: string) => userDocRef(uid).get());

export async function getUserState(uid: string): Promise<ScheduleState> {
  noStore();
  if (CACHE_TTL_MS > 0) {
    const cached = getCachedState(uid);
    if (cached) return cached;
  }

  const ref = userDocRef(uid);
  const snap = await getUserDoc(uid);

  if (!snap.exists) {
    const fresh = migrateState(null);
    fresh.subjects = autoSortSubjectsByUsage(fresh.subjects, fresh);
    await ref.set(
      {
        state: fresh,
        settings: fresh.settings,
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (CACHE_TTL_MS > 0) setCachedState(uid, fresh);
    return fresh;
  }

  const data = snap.data() || {};
  const state = migrateState(data.state);
  state.subjects = autoSortSubjectsByUsage(state.subjects, state);
  state.settings = resolveStoredSettings(data);
  if (CACHE_TTL_MS > 0) setCachedState(uid, state);
  return cloneState(state);
}

export const getCachedUserState = cache(async (uid: string) => {
  return await getUserState(uid); 
});

export async function updateUserState(
  uid: string,
  mutate: (draft: ScheduleState) => void | ScheduleState,
  options?: { writerId?: string },
): Promise<ScheduleState> {
  const ref = userDocRef(uid);
  const nextState = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : null;
    const current = migrateState(data?.state ?? null);
    current.settings = resolveStoredSettings(data);
    const draft = cloneState(current);
    const result = mutate(draft);
    const next = migrateState((result || draft) as ScheduleState);
    tx.set(
      ref,
      {
        state: next,
        settings: next.settings,
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

export async function getUserSettings(uid: string): Promise<AppSettings> {
  noStore();

  if (CACHE_TTL_MS > 0) {
    const cached = getCachedState(uid);
    if (cached) return cloneSettings(cached.settings);
  }

  const snap = await getUserDoc(uid);
  if (!snap.exists) return { ...DEFAULT_SETTINGS };

  return cloneSettings(resolveStoredSettings(snap.data() || {}));
}

export async function getUserSettingsMaybe(uid: string | null): Promise<AppSettings | null> {
  if (!uid) return null;
  return await getUserSettings(uid);
}

export async function updateUserSettings(
  uid: string,
  mutate: (draft: AppSettings) => void | AppSettings,
  options?: { writerId?: string },
): Promise<AppSettings> {
  const ref = userDocRef(uid);
  const nextSettings = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = resolveStoredSettings(snap.exists ? snap.data() : null);
    const draft = cloneSettings(current);
    const result = mutate(draft);
    const next = normalizeSettings((result || draft) as AppSettings);

    tx.set(
      ref,
      {
        settings: next,
        updatedAt: adminFieldValue.serverTimestamp(),
        lastWriter: options?.writerId || null,
      },
      { merge: true },
    );

    return next;
  });

  if (CACHE_TTL_MS > 0) syncCachedSettings(uid, nextSettings);
  return cloneSettings(nextSettings);
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
