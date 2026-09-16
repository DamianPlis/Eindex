"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeAppLocale } from "@/lib/i18n/config";
import {
  normalizeTheme,
  normalizeSettings,
  normalizePlanningSubjectSort,
} from "@/lib/settings/defaults";
import type { DeadlineUndo } from "@/lib/schedule/deadline-undo";
import type { Id } from "@/convex/_generated/dataModel";
import type { AppSettings } from "@/lib/settings/types";
import { requireSession } from "@/lib/session";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type SlotUpdateInput = {
  weekStart: string;
  dayIndex: number;
  slotIndex: number;
};

export async function setSlotSubjectAction(
  input: SlotUpdateInput & { subjectId: string | null; writerId?: string },
) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  await fetchMutation(
    api.schedule.setSlotSubject,
    {
      weekStart: input.weekStart,
      dayIndex: input.dayIndex,
      slotIndex: input.slotIndex,
      subjectId: input.subjectId || null,
      writerId: input.writerId,
    },
    { token },
  );
}

export async function setSlotTopicAction(
  input: SlotUpdateInput & { topic: string; writerId?: string },
) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  await fetchMutation(
    api.schedule.setSlotTopic,
    {
      weekStart: input.weekStart,
      dayIndex: input.dayIndex,
      slotIndex: input.slotIndex,
      topic: input.topic || "",
      writerId: input.writerId,
    },
    { token },
  );
}

export async function addCustomSubjectAction(input: {
  name: string;
  color: string;
  writerId?: string;
}) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const cleanName = input.name.trim();
  if (!cleanName) return null;

  const result = await fetchMutation(
    api.subjects.addSubject,
    {
      name: cleanName,
      color: input.color || "#64748b",
      writerId: input.writerId,
    },
    { token },
  );

  return result?.slug || null;
}

export async function updateSubjectAction(input: {
  id: string;
  name: string;
  color: string;
  writerId?: string;
}) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const cleanName = input.name.trim();
  if (!cleanName || !input.id) return;

  await fetchMutation(
    api.subjects.updateSubject,
    {
      slug: input.id,
      name: cleanName,
      color: input.color,
      writerId: input.writerId,
    },
    { token },
  );
}

export async function deleteSubjectAction(input: {
  id: string;
  writerId?: string;
}) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  if (!input.id) return;

  await fetchMutation(
    api.subjects.deleteSubject,
    {
      slug: input.id,
      writerId: input.writerId,
    },
    { token },
  );
}

export async function addSubjectGroupAction(input: {
  name: Record<string, string>;
  subjectIds: string[];
  namePreferences?: Record<string, string>;
  writerId?: string;
}) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const result = await fetchMutation(
    api.subjects.addSubjectGroup,
    {
      name: input.name,
      subjectIds: input.subjectIds,
      namePreferences: input.namePreferences,
      writerId: input.writerId,
    },
    { token },
  );

  return result?.slug || null;
}

export async function updateSubjectGroupAction(input: {
  id: string;
  name: Record<string, string>;
  subjectIds: string[];
  namePreferences?: Record<string, string>;
  writerId?: string;
}) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  if (!input.id) return;

  await fetchMutation(
    api.subjects.updateSubjectGroup,
    {
      slug: input.id,
      name: input.name,
      subjectIds: input.subjectIds,
      namePreferences: input.namePreferences,
      writerId: input.writerId,
    },
    { token },
  );
}

export async function deleteSubjectGroupAction(input: {
  id: string;
  writerId?: string;
}) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  if (!input.id) return;

  await fetchMutation(
    api.subjects.deleteSubjectGroup,
    {
      slug: input.id,
      writerId: input.writerId,
    },
    { token },
  );
}

export async function updateSettingsAction(
  input: Partial<AppSettings> & {
    writerId?: string;
  },
) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const updates: {
    theme?: "light" | "dark";
    locale?: "cs" | "en" | "pl";
    useSchoolYear?: boolean;
    planningSubjectSort?: AppSettings["planningSubjectSort"];
    writerId?: string;
  } = {};

  if (input.theme !== undefined) {
    updates.theme = normalizeTheme(input.theme);
  }
  if (input.locale !== undefined) {
    updates.locale = normalizeAppLocale(input.locale);
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, updates.locale, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }
  if (input.useSchoolYear !== undefined) {
    updates.useSchoolYear = input.useSchoolYear === true;
  }
  if (input.writerId !== undefined) {
    updates.writerId = input.writerId;
  }
  if (input.planningSubjectSort !== undefined) {
    updates.planningSubjectSort = normalizePlanningSubjectSort(
      input.planningSubjectSort,
    );
  }

  const result = await fetchMutation(api.settings.updateSettings, updates, {
    token,
  });

  return normalizeSettings(result);
}

export async function addDeadlineAction(formData: FormData) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const text = String(formData.get("text") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "").trim();
  if (!text || !date) return;

  await fetchMutation(
    api.deadlines.addDeadline,
    {
      text,
      description: description || undefined,
      date,
    },
    { token },
  );
}

export async function removeDeadlineAction(formData: FormData) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const deadlineId = String(formData.get("id") || "").trim();
  if (!deadlineId) return null;

  return await fetchMutation(
    api.deadlines.removeDeadline,
    { deadlineId },
    { token },
  );
}

export async function markAsDoneDeadlineAction(formData: FormData) {
  await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");

  const deadlineId = String(formData.get("id") || "").trim();
  if (!deadlineId) return null;

  return await fetchMutation(
    api.deadlines.markAsDone,
    { deadlineId },
    { token },
  );
}

export async function undoDeadlineAction(undo: DeadlineUndo) {
  const session = await requireSession();
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  if (!undo || undo.uid !== session.uid || !undo.receiptId)
    throw new Error("Invalid deadline undo");
  await fetchMutation(
    api.deadlines.undoDeadline,
    { receiptId: undo.receiptId as Id<"deadlineUndos"> },
    { token },
  );
}
