"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { localizePath } from "@/lib/i18n/routing";
import { getClientId } from "@/lib/sync/client-id";
import { toMillis } from "@/lib/utils/timestamp";
import LogoutIcon from "@/icons/logout_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import u from "@/components/ui/shared.module.css";
import ConfirmDialog from "../ui/ConfirmDialog";

type LogoutButtonProps = {
  uid: string;
  className?: string;
};

type StateVersionResponse = {
  updatedAt?: number;
  lastWriter?: string;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return (
    iosStandalone || window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function LogoutButton({ uid, className }: LogoutButtonProps) {
  const router = useRouter();
  const locale = useAppLocale();
  const messages = useMessages();
  const clientIdRef = useRef("");
  const initializedRef = useRef(false);
  const lastRemoteTsRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshAtRef = useRef(0);
  const pollInFlightRef = useRef(false);
  const [logoutPending, setLogoutPending] = useState<boolean | null>(false);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastRefreshAtRef.current < 1200) return;
      lastRefreshAtRef.current = now;
      router.refresh();
    }, 250);
  }, [router]);

  const maybeApplyVersion = useCallback(
    (remoteTs: number, lastWriter: string) => {
      if (!remoteTs || remoteTs <= lastRemoteTsRef.current) return;
      lastRemoteTsRef.current = remoteTs;
      if (
        lastWriter &&
        clientIdRef.current &&
        lastWriter === clientIdRef.current
      )
        return;
      scheduleRefresh();
    },
    [scheduleRefresh],
  );

  const pollStateVersion = useCallback(async () => {
    if (!uid || pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      const response = await fetch("/api/state-version", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "cache-control": "no-cache",
        },
      });
      if (!response.ok) return;
      const payload = (await response.json()) as StateVersionResponse;
      const remoteTs =
        typeof payload.updatedAt === "number" ? payload.updatedAt : 0;
      const lastWriter =
        typeof payload.lastWriter === "string" ? payload.lastWriter : "";
      maybeApplyVersion(remoteTs, lastWriter);
    } catch {
      // noop
    } finally {
      pollInFlightRef.current = false;
    }
  }, [uid, maybeApplyVersion]);

  useEffect(() => {
    if (!uid) return;
    clientIdRef.current = getClientId();
    const userDocRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() || {};
        const remoteTs = toMillis(data.updatedAt);
        const lastWriter =
          typeof data.lastWriter === "string" ? data.lastWriter : "";
        if (!initializedRef.current) {
          initializedRef.current = true;
          lastRemoteTsRef.current = remoteTs;
          return;
        }
        maybeApplyVersion(remoteTs, lastWriter);
      },
      () => {
        // Listener can be unreliable in some PWA contexts. Poll fallback below stays active.
      },
    );

    const pollMs = isStandaloneMode() ? 4500 : 12000;
    const pollTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void pollStateVersion();
    }, pollMs);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void pollStateVersion();
    };
    const onFocus = () => {
      void pollStateVersion();
    };
    const onOnline = () => {
      void pollStateVersion();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    void pollStateVersion();

    return () => {
      unsubscribe();
      clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [uid, maybeApplyVersion, pollStateVersion]);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      // noop
    }
    await fetch("/api/session", { method: "DELETE" });
    router.replace(localizePath(locale, "/login"));
    router.refresh();
  }

  return (
    <>
      <button
        className={
          className ? `${u.logoutButton} ${className}` : u.logoutButton
        }
        onClick={() => setLogoutPending(true)}
      >
        {/* <span>{messages.nav.logout}</span> */}
        <LogoutIcon
          fill="currentColor"
          alt={messages.nav.logout}
          height={24}
          width={24}
        />
      </button>
      <ConfirmDialog
        isOpen={Boolean(logoutPending)}
        title={messages.common.areYouSure}
        cancelLabel={messages.common.cancel}
        confirmLabel={messages.nav.logout}
        onCancel={() => setLogoutPending(null)}
        onConfirm={() => {
          handleLogout();
          setLogoutPending(null);
        }}
      >
        {messages.auth.logoutConfirmation}
      </ConfirmDialog>
    </>
  );
}
