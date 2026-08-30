"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAppLocale, useMessages } from "@/components/i18n/UserSyncProvider";
import { localizePath } from "@/lib/i18n/routing";
import LogoutIcon from "@/icons/logout_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import u from "@/components/ui/shared.module.css";
import ConfirmDialog from "../ui/ConfirmDialog";

type LogoutButtonProps = {
  uid?: string;
  className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const locale = useAppLocale();
  const messages = useMessages();
  const { signOut } = useAuthActions();
  const [logoutPending, setLogoutPending] = useState<boolean | null>(false);

  async function handleLogout() {
    try {
      await signOut();
    } catch {
      // noop
    }
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
        type="button"
        aria-label={messages.nav.logout}
      >
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
          void handleLogout();
          setLogoutPending(null);
        }}
      >
        {messages.auth.logoutConfirmation}
      </ConfirmDialog>
    </>
  );
}

