import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { FunctionArgs, FunctionReference } from "convex/server";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

/**
 * Safely mirror a write to Convex in the background without blocking Firebase operations.
 * If Convex experiences a temporary network error or is not yet configured, it logs
 * without throwing or impacting the primary Firebase user experience.
 *
 * @param mutationName - The Convex mutation name from api.sync
 * @param args - Arguments to pass to the mutation
 */
export async function shadowWriteToConvex<T extends keyof typeof api.sync>(
  mutationName: T,
  args: FunctionArgs<(typeof api.sync)[T]>
) {
  if (!convexClient) return;

  try {
    const mutationRef = api.sync[mutationName] as unknown as FunctionReference<
      "mutation",
      "public",
      Record<string, unknown>,
      unknown
    >;
    await convexClient.mutation(mutationRef, args as Record<string, unknown>);
  } catch (error) {
    console.error(
      `[Convex Shadow Write] Error executing ${String(mutationName)}:`,
      error
    );
  }
}
