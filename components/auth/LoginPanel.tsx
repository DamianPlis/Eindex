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
  await fetch("/api/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      uid: user.uid,
      name: user.displayName || user.email || "User",
      email: user.email || "",
    }),
  });
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
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div className="container" style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <h1 style={{ marginTop: 0 }}>Eindx</h1>
        <p>Sign in with your Google account.</p>
        {error ? (
          <p style={{ color: "var(--danger-text)", fontSize: 13, marginTop: 8 }}>{error}</p>
        ) : null}
        <button className="add-button" onClick={signInWithGoogle} disabled={loading}>
          {loading ? "Checking..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
