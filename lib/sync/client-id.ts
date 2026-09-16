"use client";

// Each tab needs its own writer ID so another tab's updates are not ignored.
let clientId = "";

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
 * Retrieves a stable identifier for this tab's lifetime.
 * Returns an empty string on the server side.
 *
 * @returns The unique client identifier.
 */
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  if (clientId) return clientId;

  clientId =
    typeof window.crypto !== "undefined" && "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : createFallbackId();

  return clientId;
}
