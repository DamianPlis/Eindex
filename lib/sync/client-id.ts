"use client";

const CLIENT_ID_KEY = "eindx:client_id";

/**
 * Generates a fallback client identifier using the current timestamp and a random string.
 * Used when crypto.randomUUID is not available.
 * 
 * @returns A unique string starting with "client_".
 */
function createFallbackId() {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Retrieves the client ID from localStorage, generating and saving a new one if it doesn't exist.
 * Returns an empty string on the server side.
 * 
 * @returns The unique client identifier.
 */
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
