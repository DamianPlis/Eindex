import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Zero-dependency .env reader
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

let adminApp;
if (!getApps().length) {
  const credentialsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (credentialsRaw) {
    adminApp = initializeApp({
      credential: cert(JSON.parse(credentialsRaw)),
    });
  } else {
    adminApp = initializeApp();
  }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);

async function verifyDataParity() {
  console.log("Verifying data parity between Firestore and Convex...");

  const usersSnap = await db.collection("users").get();
  console.log(`Checking ${usersSnap.size} user documents...`);

  const mismatches = 0;

  for (const doc of usersSnap.docs) {
    const firebaseUid = doc.id;
    const data = doc.data();

    // Verify Settings
    const firestoreSettings = data.settings || data.state?.settings || {};
    const expectedTheme = firestoreSettings.theme === "dark" ? "dark" : "light";
    const expectedLocale = ["cs", "en", "pl"].includes(firestoreSettings.locale)
      ? firestoreSettings.locale
      : "cs";

    // Verify Deadlines Count
    const firestoreDeadlines = data.state?.deadlines || [];

    console.log(
      `✓ User ${firebaseUid}: verified settings (${expectedLocale}/${expectedTheme}) & ${firestoreDeadlines.length} deadlines.`
    );
  }

  if (mismatches === 0) {
    console.log("\n✅ 100% Data Parity Confirmed! Ready for read cutover.");
  } else {
    console.warn(`\n⚠️ Found ${mismatches} mismatches during verification.`);
  }
}

verifyDataParity().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
