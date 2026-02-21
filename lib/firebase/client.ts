"use client";

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/^['"]|['"]$/g, "").replace(/,$/, "");
}

const firebaseConfig = {
  apiKey:
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ||
    "AIzaSyAcGIhuBtSsXAtvbCCfjRgxDTrKs45DtDM",
  authDomain:
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
    "eindex-fe0ae.firebaseapp.com",
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "eindex-fe0ae",
  storageBucket:
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
    "eindex-fe0ae.firebasestorage.app",
  messagingSenderId:
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "479220145537",
  appId:
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ||
    "1:479220145537:web:43079d6f870edc09e69c80",
  measurementId:
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || "G-0G4M4VD4VQ",
};

if (!firebaseConfig.apiKey.startsWith("AIza")) {
  throw new Error(
    "Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in env configuration.",
  );
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });
