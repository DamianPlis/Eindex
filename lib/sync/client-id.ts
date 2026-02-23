"use client";

const CLIENT_ID_KEY = "eindx:client_id";

function createFallbackId() {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getClientId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof window.crypto !== "undefined" && "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : createFallbackId();

  window.localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}
