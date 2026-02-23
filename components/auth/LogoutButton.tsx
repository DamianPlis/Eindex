"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { getClientId } from "@/lib/sync/client-id";

type LogoutButtonProps = {
  uid: string;
};

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return ((value as { toMillis: () => number }).toMillis() || 0);
  }
  return 0;
}

export default function LogoutButton({ uid }: LogoutButtonProps) {
  const router = useRouter();
  const clientIdRef = useRef("");
  const initializedRef = useRef(false);
  const lastRemoteTsRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!uid) return;
    clientIdRef.current = getClientId();
    const userDocRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      console.log("snapshot", snapshot);
      if (!snapshot.exists()) return;

      const data = snapshot.data() || {};
      const remoteTs = toMillis(data.updatedAt);
      const lastWriter = typeof data.lastWriter === "string" ? data.lastWriter : "";
      if (!initializedRef.current) {
        initializedRef.current = true;
        lastRemoteTsRef.current = remoteTs;
        return;
      }

      if (!remoteTs || remoteTs <= lastRemoteTsRef.current) return;
      lastRemoteTsRef.current = remoteTs;
      if (lastWriter && clientIdRef.current && lastWriter === clientIdRef.current) return;

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        const now = Date.now();
        if (now - lastRefreshAtRef.current < 1200) return;
        lastRefreshAtRef.current = now;
        router.refresh();
      }, 350);
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRefreshAtRef.current < 1200) return;
      lastRefreshAtRef.current = now;
      router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [uid, router]);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      // noop
    }
    await fetch("/api/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="ghost-button" onClick={handleLogout}>
      Logout
    </button>
  );
}
