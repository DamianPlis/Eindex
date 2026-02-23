import "server-only";

import { applicationDefault, cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "").replace(/,$/, "");
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

const adminApp =
  getApps()[0] ||
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId:
      serviceAccount?.projectId || cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || undefined,
  });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminFieldValue = FieldValue;
