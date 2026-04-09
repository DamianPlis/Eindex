"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OnlineStatusBanner() {
  const messages = useMessages();
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="online-status-banner" role="status" aria-live="polite">
      <span className="online-status-dot" aria-hidden="true" />
      <span>{messages.network.offline}</span>
    </div>
  );
}
