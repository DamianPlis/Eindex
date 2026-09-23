"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import LoginLocaleSwitcher from "@/components/auth/LoginLocaleSwitcher";
import { localizePath } from "@/lib/i18n/routing";
import s from "./LoginPanel.module.css";
import u from "@/components/ui/shared.module.css";

export default function LoginPanel() {
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const locale = useAppLocale();
  const messages = useMessages();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const checking = isLoading || isAuthenticated || loading;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(localizePath(locale, "/"));
    }
  }, [isLoading, isAuthenticated, locale, router]);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { redirectTo: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : messages.auth.signInFailed);
      setLoading(false);
    }
  }

  return (
    <div className={s.loginScreen}>
      <div className={`${u.container} ${s.loginCard}`}>
        <h1 className={s.loginTitle}>Eindex</h1>
        <p className="mt-2 mb-2">{messages.auth.signInPrompt}</p>
        {error ? <p className={s.loginError}>{error}</p> : null}
        <button
          className={u.primaryButton}
          onClick={handleGoogleSignIn}
          disabled={checking}
          aria-busy={checking}
        >
          {checking ? messages.auth.checking : messages.auth.signInWithGoogle}
        </button>
        <div className={s.aboutContainer}>
          <Link
            href={localizePath(locale, "/about")}
            className={u.inlineLink}
            id="login-about-link"
          >
            {messages.auth.aboutLink}
          </Link>
        </div>
        <div className={s.localeContainer}>
          <LoginLocaleSwitcher />
        </div>
      </div>
    </div>
  );
}
