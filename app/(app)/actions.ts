"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeAppLocale } from "@/lib/i18n/config";
import { resolveDeadlineStatus } from "@/lib/schedule/defaults";
import {
  ensureWeekExists,
  updateUserSettings,
  updateUserState,
} from "@/lib/schedule/store";
import { normalizeTheme } from "@/lib/settings/defaults";
import type { AppSettings } from "@/lib/settings/types";
import { requireSession } from "@/lib/session";

type SlotUpdateInput = {
  weekStart: string;
  dayIndex: number;
  slotIndex: number;
};

export async function setSlotSubjectAction(
  input: SlotUpdateInput & { subjectId: string | null; writerId?: string },
) {
  const session = await requireSession();
  await updateUserState(
    session.uid,
    (state) => {
      const key = ensureWeekExists(state, input.weekStart);
      const slot =
        state.weeks[key]?.days?.[input.dayIndex]?.slots?.[input.slotIndex];
      if (!slot) return;

      if (slot.fixed && slot.fixedLabel.toLowerCase().includes("obed")) {
        slot.subjectId = "lunch";
      } else if (slot.fixed) {
        slot.subjectId = null;
      } else {
        slot.subjectId = input.subjectId || null;
        slot.updatedAt = Date.now();
      }
    },
    { writerId: input.writerId },
  );
}

export async function setSlotTopicAction(
  input: SlotUpdateInput & { topic: string; writerId?: string },
) {
  const session = await requireSession();
  await updateUserState(
    session.uid,
    (state) => {
      const key = ensureWeekExists(state, input.weekStart);
      const slot =
        state.weeks[key]?.days?.[input.dayIndex]?.slots?.[input.slotIndex];
      if (!slot) return;
      if (!slot.allowTopic && slot.fixed) return;
      slot.topic = input.topic || "";
      slot.updatedAt = Date.now();
    },
    { writerId: input.writerId },
  );
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
}

export async function updateSettingsAction(
  input: Partial<AppSettings> & {
    writerId?: string;
  },
) {
  const session = await requireSession();

  const nextSettings = await updateUserSettings(
    session.uid,
    (settings) => {
      if (input.theme !== undefined) {
        settings.theme = normalizeTheme(input.theme);
      }
      if (input.locale !== undefined) {
        settings.locale = normalizeAppLocale(input.locale);
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

  return nextSettings;
}

export async function addDeadlineAction(formData: FormData) {
  const session = await requireSession();
  const text = String(formData.get("text") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "").trim();
  const id = crypto.randomUUID();
  if (!text || !date) return;

  await updateUserState(session.uid, (state) => {
    state.deadlines.push({
      id: id,
      text,
      description,
      date,
      status: resolveDeadlineStatus({ date }),
    });
  });
  //revalidatePath("/deadlines");
}

export async function removeDeadlineAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await updateUserState(session.uid, (state) => {
    state.deadlines = state.deadlines.filter((item) => item.id !== id);
  });
  //revalidatePath("/deadlines");
}

export async function markAsDoneDeadlineAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await updateUserState(session.uid, (state) => {
    state.deadlines = state.deadlines.map((item) =>
      item.id === id ? { ...item, status: "done" } : item,
    );
  });
  //revalidatePath("/deadlines");
}
