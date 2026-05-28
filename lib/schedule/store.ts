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

/**
 * Deep clones the given ScheduleState object.
 * 
 * @param state - The state object to clone.
 * @returns A deep copy of the state.
 */
function cloneState(state: ScheduleState): ScheduleState {
  return structuredClone(state);
}

/**
 * Deep clones the given AppSettings object.
 * 
 * @param settings - The settings object to clone.
 * @returns A deep copy of the settings.
 */
function cloneSettings(settings: AppSettings): AppSettings {
  return structuredClone(settings);
}

/**
 * Resolves the stored AppSettings from raw database document data.
 * Merges top-level settings and nested state-level settings, falling back to defaults.
 * 
 * @param data - The raw document data.
 * @returns Resolved AppSettings object.
 */
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

/**
 * Retrieves the cached schedule state for a user if it hasn't expired.
 * 
 * @param uid - The user's unique identifier.
 * @returns The cached ScheduleState or null.
 */
function getCachedState(uid: string): ScheduleState | null {
  const entry = stateCache.get(uid);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    stateCache.delete(uid);
    return null;
  }
  return cloneState(entry.state);
}

/**
 * Caches the schedule state for a user with the configured TTL.
 * 
 * @param uid - The user's unique identifier.
 * @param state - The schedule state to cache.
 */
function setCachedState(uid: string, state: ScheduleState) {
  stateCache.set(uid, {
    expiresAt: Date.now() + Math.max(0, CACHE_TTL_MS),
    state: cloneState(state),
  });
}

/**
 * Synchronizes new settings into the cached schedule state.
 * 
 * @param uid - The user's unique identifier.
 * @param settings - The new AppSettings object.
 */
function syncCachedSettings(uid: string, settings: AppSettings) {
  const entry = stateCache.get(uid);
  if (!entry) return;
  entry.state.settings = cloneSettings(settings);
}

/**
 * Helper to get the Firestore DocumentReference for a user.
 * 
 * @param uid - The user's unique identifier.
 * @returns The DocumentReference instance.
 */
function userDocRef(uid: string) {
  return adminDb.collection(USER_COLLECTION).doc(uid);
}

const getUserDoc = cache(async (uid: string) => userDocRef(uid).get());

/**
 * Fetches the complete schedule state for a given user.
 * Initializes the document with defaults if it doesn't exist.
 * 
 * @param uid - The user's unique identifier.
 * @returns The resolved ScheduleState.
 */
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

/**
 * Updates a user's schedule state inside a Firestore transaction.
 * Automatically runs migrations on the current data and updates cache.
 * 
 * @param uid - The user's unique identifier.
 * @param mutate - Callback function that edits the draft state.
 * @param options - Additional options like writerId.
 * @returns The updated ScheduleState.
 */
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

/**
 * Retrieves the settings object for a given user.
 * 
 * @param uid - The user's unique identifier.
 * @returns The user's AppSettings.
 */
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

/**
 * Helper to retrieve user settings if UID is provided, otherwise returns null.
 * 
 * @param uid - The user's unique identifier or null.
 * @returns The user's AppSettings or null.
 */
export async function getUserSettingsMaybe(uid: string | null): Promise<AppSettings | null> {
  if (!uid) return null;
  return await getUserSettings(uid);
}

/**
 * Updates a user's settings object inside a Firestore transaction.
 * 
 * @param uid - The user's unique identifier.
 * @param mutate - Callback function that edits the draft settings.
 * @param options - Additional options like writerId.
 * @returns The updated AppSettings.
 */
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

/**
 * Ensures that a week schedule object exists for the given week date key.
 * If not present, initializes it with defaults.
 * 
 * @param state - The schedule state to mutate.
 * @param weekInput - The optional target week date.
 * @returns The normalized week date key.
 */
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
