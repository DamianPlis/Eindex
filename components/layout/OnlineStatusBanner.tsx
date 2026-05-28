"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import s from "./OnlineStatusBanner.module.css";

export default function OnlineStatusBanner() {
  const isOnline = useOnlineStatus();
  const messages = useMessages();

  if (isOnline) {
    return null;
  }


  return (
    <div className={s.banner} role="status" aria-live="polite">
      <span className={s.dot} aria-hidden="true" />
      <span>{messages.network.offline}</span>
    </div>
  );
}
