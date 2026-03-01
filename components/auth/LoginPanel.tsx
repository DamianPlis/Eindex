"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

async function establishSession(user: User) {
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
        if (active) setError(err instanceof Error ? err.message : "Authentication failed.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

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
        setError(err instanceof Error ? err.message : "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <section className="auth-panel page-enter">
        <p className="page-kicker">Welcome back</p>
        <h1 className="auth-title">Eindx</h1>
        <p className="auth-copy">Sign in with your Google account.</p>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="btn-primary auth-button" onClick={signInWithGoogle} disabled={loading}>
          {loading ? "Checking..." : "Sign in with Google"}
        </button>
      </section>
    </div>
  );
}
