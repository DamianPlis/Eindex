"use client";

import { useEffect } from "react";

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!window.isSecureContext) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // noop
      console.warn("Failed to register service worker");
    });
  }, []);

  return null;
}
