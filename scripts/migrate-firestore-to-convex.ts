import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL environment variable is missing.");
  process.exit(1);
}

const convex = new ConvexHttpClient(convexUrl);

async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 1) throw err;
    console.warn(`[Retry] Transient network error, retrying in ${delay}ms...`);
    await new Promise((r) => setTimeout(r, delay));
    return callWithRetry(fn, retries - 1, delay * 2);
  }
}

function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "").replace(/,$/, "");
}

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

function loadServiceAccountFromEnv(): ServiceAccount | null {
  const rawJson = cleanEnv(process.env.FIREBASE_ADMIN_CREDENTIALS);
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as ServiceAccount;
      if (parsed.privateKey) {
        parsed.privateKey = parsed.privateKey.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch {
      throw new Error("FIREBASE_ADMIN_CREDENTIALS is set but is not valid JSON.");
    }
  }

  const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = cleanEnv(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

const serviceAccount = loadServiceAccountFromEnv();
const projectId =
  serviceAccount?.projectId ||
  cleanEnv(process.env.FIREBASE_PROJECT_ID) ||
  cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
  "eindex-fe0ae";

const adminApp =
  getApps()[0] ||
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId,
  });

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

async function migrateAllUsers() {
  console.log("Starting Firestore -> Convex data migration...");
  console.log(`Connecting to Firestore project: ${projectId}...`);

  const usersSnap = await db.collection("users").get();
  console.log(`Found ${usersSnap.size} user documents in Firestore.`);

  let migratedUsers = 0;
  let totalSlots = 0;
  let totalDeadlines = 0;
  let totalSubjects = 0;
  let totalGroups = 0;

  for (const doc of usersSnap.docs) {
    const firebaseUid = doc.id;
    const data = doc.data();

    // Fetch real Firebase Auth user profile and creation time
    const authUser = await auth.getUser(firebaseUid).catch(() => null);

    const authCreatedAt = authUser?.metadata?.creationTime
      ? new Date(authUser.metadata.creationTime).getTime()
      : 0;

    const firestoreUpdatedAt = toMillis(data.updatedAt);
    const firestoreCreatedAt = toMillis(data.createdAt);

    const realUserCreatedAt = authCreatedAt || firestoreCreatedAt || firestoreUpdatedAt || Date.now();
    const realUserUpdatedAt = firestoreUpdatedAt || realUserCreatedAt;

    console.log(`\nMigrating user: ${firebaseUid} (created: ${new Date(realUserCreatedAt).toISOString()})...`);

    // 1. Sync User & Settings with real createdAt & updatedAt
    const rawSettings = data.settings || data.state?.settings || {};
    const theme = rawSettings.theme === "dark" ? "dark" : "light";
    const locale = ["cs", "en", "pl"].includes(rawSettings.locale)
      ? rawSettings.locale
      : "cs";
    const useSchoolYear = rawSettings.useSchoolYear === true;

    await callWithRetry(() =>
      convex.mutation(api.sync.syncUserAndSettings, {
        firebaseUid,
        email: authUser?.email || undefined,
        name: authUser?.displayName || undefined,
        image: authUser?.photoURL || undefined,
        createdAt: realUserCreatedAt,
        updatedAt: realUserUpdatedAt,
        theme,
        locale,
        useSchoolYear,
      })
    );

    // 2. Sync Subjects
    const subjects = data.state?.subjects || [];
    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      if (!s.id || !s.name) continue;
      const subjUpdatedAt = toMillis(s.updatedAt) || realUserUpdatedAt;
      const subjCreatedAt = toMillis(s.createdAt) || realUserCreatedAt;

      await callWithRetry(() =>
        convex.mutation(api.sync.syncSubject, {
          firebaseUid,
          slug: s.id,
          name: s.name,
          color: s.color || "#64748b",
          order: i,
          createdAt: subjCreatedAt,
          updatedAt: subjUpdatedAt,
        })
      );
      totalSubjects++;
    }

    // 3. Sync Subject Groups
    const subjectGroups = data.state?.subjectGroups || [];
    for (let i = 0; i < subjectGroups.length; i++) {
      const g = subjectGroups[i];
      if (!g.id || !g.name) continue;
      const groupUpdatedAt = toMillis(g.updatedAt) || realUserUpdatedAt;

      await callWithRetry(() =>
        convex.mutation(api.sync.syncSubjectGroup, {
          firebaseUid,
          slug: g.id,
          name: g.name,
          subjectIds: Array.isArray(g.subjectIds) ? g.subjectIds : [],
          namePreferences: g.namePreferences || undefined,
          order: i,
          updatedAt: groupUpdatedAt,
        })
      );
      totalGroups++;
    }

    // 4. Sync Deadlines with original timestamps
    const deadlines = data.state?.deadlines || [];
    for (const d of deadlines) {
      if (!d.id || !d.text || !d.date) continue;
      const status = ["upcoming", "today", "expired", "done"].includes(d.status)
        ? d.status
        : "upcoming";

      const deadlineCreatedAt = toMillis(d.createdAt) || realUserCreatedAt;
      const deadlineUpdatedAt = toMillis(d.updatedAt) || realUserUpdatedAt;

      await callWithRetry(() =>
        convex.mutation(api.sync.syncDeadline, {
          firebaseUid,
          deadlineId: d.id,
          text: d.text,
          description: d.description || "",
          date: d.date,
          status,
          createdAt: deadlineCreatedAt,
          updatedAt: deadlineUpdatedAt,
        })
      );
      totalDeadlines++;
    }

    // 5. Sync Weeks & Slots with real timestamps (Batched)
    const weeks = (data.state?.weeks || {}) as Record<string, { days?: Array<{ date?: string; slots?: Array<Record<string, unknown>> }> }>;
    const userSlots: Array<{
      weekStart: string;
      date: string;
      dayIndex: number;
      slotIndex: number;
      time: string;
      fixed: boolean;
      fixedKey?: "morningCircle" | "currentEvents" | "lunch" | "tutor" | "pe" | "assembly";
      fixedLabel?: string;
      allowTopic: boolean;
      subjectId: string | null;
      topic: string;
      updatedAt: number;
    }> = [];

    for (const [weekStart, weekData] of Object.entries(weeks)) {
      const days = weekData?.days || [];
      for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
        const day = days[dayIdx];
        if (!day) continue;
        const slots = day.slots || [];
        for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
          const slot = slots[slotIdx];
          if (!slot) continue;

          const slotUpdatedAt =
            typeof slot.updatedAt === "number" && slot.updatedAt > 0
              ? slot.updatedAt
              : toMillis(slot.updatedAt) || realUserUpdatedAt;

          const fixedKey = [
            "morningCircle",
            "currentEvents",
            "lunch",
            "tutor",
            "pe",
            "assembly",
          ].includes(String(slot.fixedKey))
            ? (slot.fixedKey as "morningCircle" | "currentEvents" | "lunch" | "tutor" | "pe" | "assembly")
            : undefined;

          userSlots.push({
            weekStart,
            date: day.date || weekStart,
            dayIndex: dayIdx,
            slotIndex: slotIdx,
            time: typeof slot.time === "string" ? slot.time : "08:00-09:00",
            fixed: Boolean(slot.fixed),
            fixedKey,
            fixedLabel: typeof slot.fixedLabel === "string" ? slot.fixedLabel : undefined,
            allowTopic: Boolean(slot.allowTopic),
            subjectId: typeof slot.subjectId === "string" ? slot.subjectId : null,
            topic: typeof slot.topic === "string" ? slot.topic : "",
            updatedAt: slotUpdatedAt,
          });
        }
      }
    }

    // Insert in batches of 50 with retry
    const BATCH_SIZE = 50;
    for (let i = 0; i < userSlots.length; i += BATCH_SIZE) {
      const chunk = userSlots.slice(i, i + BATCH_SIZE);
      await callWithRetry(() =>
        convex.mutation(api.sync.syncSlotsBatch, {
          firebaseUid,
          slots: chunk,
        })
      );
      totalSlots += chunk.length;
    }

    migratedUsers++;
    console.log(`✓ User ${firebaseUid} successfully migrated (${userSlots.length} slots, real createdAt preserved).`);
  }

  console.log("\n================ MIGRATION SUMMARY ================");
  console.log(`Migrated Users:     ${migratedUsers}`);
  console.log(`Migrated Subjects:  ${totalSubjects}`);
  console.log(`Migrated Groups:    ${totalGroups}`);
  console.log(`Migrated Deadlines: ${totalDeadlines}`);
  console.log(`Migrated Slots:     ${totalSlots}`);
  console.log("===================================================\n");
}

migrateAllUsers().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
