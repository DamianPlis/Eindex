"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import styles from "@/css/Topbar.module.css";

export default function OnlineStatusBanner() {
  const isOnline = useOnlineStatus();
  const messages = useMessages();

  if (isOnline) {
    return null;
  }


  return (
    <div className={styles.onlineStatusBanner} role="status" aria-live="polite">
      <span className={styles.onlineStatusDot} aria-hidden="true" />
      <span>{messages.network.offline}</span>
    </div>
  );
}
