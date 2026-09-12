"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeAppLocale } from "@/lib/i18n/config";
import { resolveDeadlineStatus } from "@/lib/schedule/defaults";
import {
  ensureWeekExists,
  updateUserSettings,
  updateUserState,
} from "@/lib/schedule/store";
import {
  normalizePlanningSubjectSort,
  normalizeTheme,
} from "@/lib/settings/defaults";
import type { AppSettings } from "@/lib/settings/types";
import { requireSession } from "@/lib/session";
import type { ScheduleState, Slot } from "@/lib/schedule/types";
import { shadowWriteToConvex } from "@/lib/convex/dual-write";
import { restoreDeadline, type DeadlineUndo } from "@/lib/schedule/deadline-undo";

type SlotUpdateInput = {
  weekStart: string;
  dayIndex: number;
  slotIndex: number;
};

/** Resolve a slot reference inside a state draft, creating the week if needed. */
function getSlotForUpdate(
  state: ScheduleState,
  input: SlotUpdateInput,
): Slot | null {
  const key = ensureWeekExists(state, input.weekStart);
  return (
    state.weeks[key]?.days?.[input.dayIndex]?.slots?.[input.slotIndex] ?? null
  );
}

/** Shared helper: look up a deadline by form ID and apply a mutation. */
async function modifyDeadlineById(
  formData: FormData,
  mutate: (state: ScheduleState, id: string) => void,
) {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  if (!id) return null;

  const nextState = await updateUserState(session.uid, (state) => {
    mutate(state, id);
  });

  return { session, id, nextState };
}

export async function setSlotSubjectAction(
  input: SlotUpdateInput & { subjectId: string | null; writerId?: string },
) {
  const session = await requireSession();
  const now = Date.now();
  let modifiedSlot: Slot | null = null;
  let slotDate = input.weekStart;

  await updateUserState(
    session.uid,
    (state) => {
      const slot = getSlotForUpdate(state, input);
      if (!slot) return;

      const day = state.weeks[input.weekStart]?.days?.[input.dayIndex];
      if (day?.date) slotDate = day.date;

      if (slot.fixed && slot.fixedLabel.toLowerCase().includes("obed")) {
        slot.subjectId = "lunch";
      } else if (slot.fixed) {
        slot.subjectId = null;
      } else {
        slot.subjectId = input.subjectId || null;
        slot.updatedAt = now;
      }
      modifiedSlot = structuredClone(slot);
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  if (modifiedSlot) {
    const slot = modifiedSlot as Slot;
    void shadowWriteToConvex("syncSlotSubject", {
      firebaseUid: session.uid,
      weekStart: input.weekStart,
      date: slotDate,
      dayIndex: input.dayIndex,
      slotIndex: input.slotIndex,
      time: slot.time,
      fixed: slot.fixed,
      fixedKey: slot.fixedKey || undefined,
      fixedLabel: slot.fixedLabel || undefined,
      allowTopic: slot.allowTopic,
      subjectId: slot.subjectId || null,
      updatedAt: now,
      writerId: input.writerId,
    });
  }
}

export async function setSlotTopicAction(
  input: SlotUpdateInput & { topic: string; writerId?: string },
) {
  const session = await requireSession();
  const now = Date.now();
  let modifiedSlot: Slot | null = null;
  let slotDate = input.weekStart;

  await updateUserState(
    session.uid,
    (state) => {
      const slot = getSlotForUpdate(state, input);
      if (!slot) return;
      if (!slot.allowTopic && slot.fixed) return;

      const day = state.weeks[input.weekStart]?.days?.[input.dayIndex];
      if (day?.date) slotDate = day.date;

      slot.topic = input.topic || "";
      slot.updatedAt = now;
      modifiedSlot = structuredClone(slot);
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  if (modifiedSlot) {
    const slot = modifiedSlot as Slot;
    void shadowWriteToConvex("syncSlotTopic", {
      firebaseUid: session.uid,
      weekStart: input.weekStart,
      date: slotDate,
      dayIndex: input.dayIndex,
      slotIndex: input.slotIndex,
      time: slot.time,
      fixed: slot.fixed,
      fixedKey: slot.fixedKey || undefined,
      fixedLabel: slot.fixedLabel || undefined,
      allowTopic: slot.allowTopic,
      topic: slot.topic || "",
      updatedAt: now,
      writerId: input.writerId,
    });
  }
}

export async function addCustomSubjectAction(input: {
  name: string;
  color: string;
  writerId?: string;
}) {
  const session = await requireSession();
  const cleanName = input.name.trim();
  if (!cleanName) return null;

  let createdId = "";
  const now = Date.now();

  await updateUserState(
    session.uid,
    (state) => {
      const baseId =
        cleanName.toLowerCase().replace(/[^a-z0-9_]+/g, "_") || "custom";
      let id = baseId;
      let i = 1;
      const existing = new Set(state.subjects.map((s) => s.id));
      while (existing.has(id)) {
        id = `${baseId}_${i++}`;
      }
      state.subjects.push({
        id,
        name: cleanName,
        color: input.color || "#64748b",
      });
      createdId = id;
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  if (createdId) {
    void shadowWriteToConvex("syncSubject", {
      firebaseUid: session.uid,
      slug: createdId,
      name: cleanName,
      color: input.color || "#64748b",
      createdAt: now,
      updatedAt: now,
    });
  }

  return createdId || null;
}

export async function updateSubjectAction(input: {
  id: string;
  name: string;
  color: string;
  writerId?: string;
}) {
  const session = await requireSession();
  const cleanName = input.name.trim();
  if (!cleanName || !input.id) return;
  const now = Date.now();

  await updateUserState(
    session.uid,
    (state) => {
      const subject = state.subjects.find((s) => s.id === input.id);
      if (subject) {
        subject.name = cleanName;
        subject.color = input.color || subject.color;
      }
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  void shadowWriteToConvex("syncSubject", {
    firebaseUid: session.uid,
    slug: input.id,
    name: cleanName,
    color: input.color,
    updatedAt: now,
  });
}

export async function deleteSubjectAction(input: {
  id: string;
  writerId?: string;
}) {
  const session = await requireSession();
  if (!input.id) return;

  await updateUserState(
    session.uid,
    (state) => {
      state.subjects = state.subjects.filter((s) => s.id !== input.id);
      for (const week of Object.values(state.weeks)) {
        for (const day of week.days) {
          for (const slot of day.slots) {
            if (slot.subjectId === input.id) {
              slot.subjectId = null;
            }
          }
        }
      }
      for (const group of state.subjectGroups) {
        group.subjectIds = group.subjectIds.filter((id) => id !== input.id);
      }
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  void shadowWriteToConvex("syncDeleteSubject", {
    firebaseUid: session.uid,
    slug: input.id,
  });
}

export async function addSubjectGroupAction(input: {
  name: Record<string, string>;
  subjectIds: string[];
  namePreferences?: Record<string, string>;
  writerId?: string;
}) {
  const session = await requireSession();
  let createdId = "";
  const now = Date.now();

  await updateUserState(
    session.uid,
    (state) => {
      const id = "group_" + crypto.randomUUID().replace(/-/g, "").substring(0, 8);
      state.subjectGroups.push({
        id,
        name: input.name,
        subjectIds: input.subjectIds,
        namePreferences: input.namePreferences || undefined,
      });
      createdId = id;
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  if (createdId) {
    void shadowWriteToConvex("syncSubjectGroup", {
      firebaseUid: session.uid,
      slug: createdId,
      name: input.name,
      subjectIds: input.subjectIds,
      namePreferences: input.namePreferences || undefined,
      updatedAt: now,
    });
  }

  return createdId || null;
}

export async function updateSubjectGroupAction(input: {
  id: string;
  name: Record<string, string>;
  subjectIds: string[];
  namePreferences?: Record<string, string>;
  writerId?: string;
}) {
  const session = await requireSession();
  if (!input.id) return;
  const now = Date.now();

  await updateUserState(
    session.uid,
    (state) => {
      const group = state.subjectGroups.find((g) => g.id === input.id);
      if (group) {
        group.name = input.name;
        group.subjectIds = input.subjectIds;
        group.namePreferences = input.namePreferences || undefined;
      }
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  void shadowWriteToConvex("syncSubjectGroup", {
    firebaseUid: session.uid,
    slug: input.id,
    name: input.name,
    subjectIds: input.subjectIds,
    namePreferences: input.namePreferences || undefined,
    updatedAt: now,
  });
}

export async function deleteSubjectGroupAction(input: {
  id: string;
  writerId?: string;
}) {
  const session = await requireSession();
  if (!input.id) return;

  await updateUserState(
    session.uid,
    (state) => {
      state.subjectGroups = state.subjectGroups.filter((g) => g.id !== input.id);
    },
    { writerId: input.writerId },
  );

  // Shadow Dual-Write to Convex
  void shadowWriteToConvex("syncDeleteSubjectGroup", {
    firebaseUid: session.uid,
    slug: input.id,
  });
}

export async function updateSettingsAction(
  input: Partial<AppSettings> & {
    writerId?: string;
  },
) {
  const session = await requireSession();
  const now = Date.now();

  const nextSettings = await updateUserSettings(
    session.uid,
    (settings) => {
      if (input.theme !== undefined) {
        settings.theme = normalizeTheme(input.theme);
      }
      if (input.locale !== undefined) {
        settings.locale = normalizeAppLocale(input.locale);
      }
      if (input.useSchoolYear !== undefined) {
        settings.useSchoolYear = input.useSchoolYear === true;
      }
      if (input.planningSubjectSort !== undefined) {
        settings.planningSubjectSort = normalizePlanningSubjectSort(
          input.planningSubjectSort,
        );
      }
    },
    { writerId: input.writerId },
  );

  if (input.locale !== undefined) {
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, nextSettings.locale, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }

  // Shadow Dual-Write to Convex
  void shadowWriteToConvex("syncUserAndSettings", {
    firebaseUid: session.uid,
    theme: nextSettings.theme,
    locale: nextSettings.locale,
    useSchoolYear: nextSettings.useSchoolYear,
    planningSubjectSort: nextSettings.planningSubjectSort,
    updatedAt: now,
    writerId: input.writerId,
  });

  return nextSettings;
}

export async function addDeadlineAction(formData: FormData) {
  const session = await requireSession();
  const text = String(formData.get("text") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const id = crypto.randomUUID();
  if (!text || !date) return;
  const now = Date.now();
  const status = resolveDeadlineStatus({ date });

  await updateUserState(session.uid, (state) => {
    state.deadlines.push({
      id: id,
      text,
      description,
      date,
      status,
    });
  });

  // Shadow Dual-Write to Convex
  void shadowWriteToConvex("syncDeadline", {
    firebaseUid: session.uid,
    deadlineId: id,
    text,
    description,
    date,
    status,
    createdAt: now,
    updatedAt: now,
  });
}

export async function removeDeadlineAction(formData: FormData) {
  let undo: DeadlineUndo | null = null;
  const res = await modifyDeadlineById(formData, (state, id) => {
    // Firestore can retry the transaction; capture only the committed attempt.
    undo = null;
    const index = state.deadlines.findIndex((item) => item.id === id);
    if (index < 0) return;
    undo = { kind: "remove", deadline: { ...state.deadlines[index] }, index, uid: "" };
    state.deadlines = state.deadlines.filter((item) => item.id !== id);
  });

  // Shadow Dual-Write to Convex
  if (res && undo) {
    await shadowWriteToConvex("syncRemoveDeadline", {
      firebaseUid: res.session.uid,
      deadlineId: res.id,
    });
    return { ...(undo as DeadlineUndo), uid: res.session.uid };
  }
  return null;
}

export async function markAsDoneDeadlineAction(formData: FormData) {
  let undo: DeadlineUndo | null = null;
  let updatedItem: { text: string; description: string; date: string } | null = null;

  const res = await modifyDeadlineById(formData, (state, id) => {
    undo = null;
    updatedItem = null;
    state.deadlines = state.deadlines.map((item, index) => {
      if (item.id === id && item.status !== "done") {
        undo = { kind: "done", deadline: { ...item }, index, uid: "" };
        updatedItem = { text: item.text, description: item.description, date: item.date };
        return { ...item, status: "done" };
      }
      return item;
    });
  });

  // Shadow Dual-Write to Convex
  if (res && updatedItem) {
    const item = updatedItem as { text: string; description: string; date: string };
    await shadowWriteToConvex("syncDeadline", {
      firebaseUid: res.session.uid,
      deadlineId: res.id,
      text: item.text,
      description: item.description,
      date: item.date,
      status: "done",
      updatedAt: Date.now(),
    });
  }
  return res && undo ? { ...(undo as DeadlineUndo), uid: res.session.uid } : null;
}

export async function undoDeadlineAction(undo: DeadlineUndo) {
  const session = await requireSession();
  if (!undo || undo.uid !== session.uid) throw new Error("Invalid deadline undo");
  const next = await updateUserState(session.uid, (state) => {
    restoreDeadline(state.deadlines, undo);
  });
  const item = next.deadlines.find((deadline) => deadline.id === undo.deadline.id)!;
  await shadowWriteToConvex("syncDeadline", {
    firebaseUid: session.uid,
    deadlineId: item.id,
    text: item.text,
    description: item.description,
    date: item.date,
    status: item.status,
    updatedAt: Date.now(),
  });
}
