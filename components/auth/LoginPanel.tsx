"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/components/i18n/LocaleProvider";
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

async function establishSession(user: User) {
  console.log(user)
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      idToken,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "Failed to establish server session.");
  }
}

export default function LoginPanel() {
  const router = useRouter();
  const messages = useMessages();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const redirectResult = await getRedirectResult(auth);
        const user = redirectResult?.user || auth.currentUser;
        if (user) {
          await establishSession(user);
          router.replace("/");
          router.refresh();
          return;
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : messages.auth.authenticationFailed);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [messages.auth.authenticationFailed, router]);

  async function signInWithGoogle() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await establishSession(result.user);
      router.replace("/");
      router.refresh();
      return;
    } catch (err) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch {
        setError(err instanceof Error ? err.message : messages.auth.signInFailed);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="container" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <h1 style={{ marginTop: 0 }}>Eindx</h1>
        <p>{messages.auth.signInPrompt}</p>
        {error ? (
          <p style={{ color: "var(--danger-text)", fontSize: 13, marginTop: 8 }}>{error}</p>
        ) : null}
        <button className="add-button" onClick={signInWithGoogle} disabled={loading}>
          {loading ? messages.auth.checking : messages.auth.signInWithGoogle}
        </button>
      </div>
    </div>
  );
}
