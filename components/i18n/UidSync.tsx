"use client";

import { useEffect } from "react";
import { useSetUserSyncUid } from "@/components/i18n/UserSyncProvider";

/**
 * Injects the user's uid into UserSyncProvider once the session has been
 * resolved by a server layout. Renders nothing — just a side-effect.
 */
export default function UidSync({ uid }: { uid: string }) {
  const setUid = useSetUserSyncUid();

  useEffect(() => {
    setUid?.(uid);
  }, [uid, setUid]);

  return null;
}
