import {
  initializeApp,
  cert,
  getApps,
  applicationDefault,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as dotenv from "dotenv";
import { isDeepStrictEqual } from "node:util";
import { internal } from "../convex/_generated/api";
import { migrationClient } from "./convex-admin";
import { normalizeSettings } from "../lib/settings/defaults";
import type { ScheduleState } from "../lib/schedule/types";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });
const url = process.argv[2] ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) throw new Error("Convex URL required");
const convex = migrationClient(url);
const credentials: ServiceAccount | null = process.env
  .FIREBASE_ADMIN_CREDENTIALS
  ? JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)
  : process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }
    : null;
const app =
  getApps()[0] ??
  initializeApp({
    credential: credentials ? cert(credentials) : applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
const byKey = <T>(rows: T[], key: (row: T) => string) =>
  [...rows].sort((a, b) => key(a).localeCompare(key(b)));

async function verify() {
  const users = await getFirestore(app).collection("users").get();
  let mismatches = 0;
  for (const doc of users.docs) {
    const raw = doc.data();
    const state = raw.state as ScheduleState | undefined;
    const snapshot = await convex.call(internal.migrations.legacySnapshot, {
      firebaseUid: doc.id,
    });
    const auth = await getAuth(app).getUser(doc.id);
    const fail = (field: string) => {
      mismatches++;
      console.error("Mismatch for legacy user " + doc.id + ": " + field);
    };
    if (!snapshot) {
      fail("missing Convex user");
      continue;
    }
    if (!auth.email || auth.email.trim().toLowerCase() !== snapshot.user.email)
      fail("email link");
    if (
      !isDeepStrictEqual(
        normalizeSettings(raw.settings ?? raw.state?.settings),
        normalizeSettings(snapshot.settings),
      )
    )
      fail("settings");
    const subjects = snapshot.subjects.map((s) => ({
      id: s.slug,
      name: s.name,
      color: s.color,
    }));
    const expectedSubjects = (state?.subjects ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color || "#64748b",
    }));
    if (
      !isDeepStrictEqual(
        byKey(subjects, (s) => s.id),
        byKey(expectedSubjects, (s) => s.id),
      )
    )
      fail("subjects");
    const groups = snapshot.groups.map((g) => ({
      id: g.slug,
      name: g.name,
      subjectIds: g.subjectIds,
      namePreferences: g.namePreferences ?? null,
    }));
    const expectedGroups = (state?.subjectGroups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      subjectIds: g.subjectIds,
      namePreferences: g.namePreferences ?? null,
    }));
    if (
      !isDeepStrictEqual(
        byKey(groups, (g) => g.id),
        byKey(expectedGroups, (g) => g.id),
      )
    )
      fail("subject groups");
    const deadlines = snapshot.deadlines.map((d) => ({
      id: d.deadlineId,
      text: d.text,
      description: d.description,
      date: d.date,
      done: d.status === "done",
    }));
    const expectedDeadlines = (state?.deadlines ?? []).map((d) => ({
      id: d.id,
      text: d.text,
      description: d.description || "",
      date: d.date,
      done: d.status === "done",
    }));
    if (
      !isDeepStrictEqual(
        byKey(deadlines, (d) => d.id),
        byKey(expectedDeadlines, (d) => d.id),
      )
    )
      fail("deadlines");
    const slots = snapshot.slots.map((s) => ({
      key: s.weekStart + "/" + s.dayIndex + "/" + s.slotIndex,
      date: s.date,
      time: s.time,
      fixed: s.fixed,
      fixedKey: s.fixedKey ?? null,
      fixedLabel: s.fixedLabel ?? "",
      allowTopic: s.allowTopic,
      subjectId: s.subjectId ?? null,
      topic: s.topic,
    }));
    const expectedSlots = Object.entries(state?.weeks ?? {}).flatMap(
      ([weekStart, week]) =>
        week.days.flatMap((day, dayIndex) =>
          day.slots.map((s, slotIndex) => ({
            key: weekStart + "/" + dayIndex + "/" + slotIndex,
            date: day.date,
            time: s.time,
            fixed: s.fixed,
            fixedKey: s.fixedKey ?? null,
            fixedLabel: s.fixedLabel ?? "",
            allowTopic: s.allowTopic,
            subjectId: s.subjectId ?? null,
            topic: s.topic,
          })),
        ),
    );
    if (
      !isDeepStrictEqual(
        byKey(slots, (s) => s.key),
        byKey(expectedSlots, (s) => s.key),
      )
    )
      fail("schedule slots");
  }
  if (mismatches) throw new Error(mismatches + " parity checks failed");
  console.log(
    "Verified both databases: " +
      users.size +
      " users; emails, settings, subjects, groups, deadlines, and all saved slots match.",
  );
}
verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
