import {
  getFunctionName,
  type FunctionReference,
  type FunctionArgs,
  type FunctionReturnType,
} from "convex/server";
import { convexToJson, jsonToConvex } from "convex/values";

/** Offline migration tools only. Admin credentials are never imported by the application. */
export function migrationClient(url: string) {
  const key = process.env.CONVEX_DEPLOY_KEY;
  if (!key)
    throw new Error(
      "CONVEX_DEPLOY_KEY is required for internal migration functions",
    );
  return {
    async call<F extends FunctionReference<"query" | "mutation", "internal">>(
      ref: F,
      args: FunctionArgs<F>,
    ): Promise<FunctionReturnType<F>> {
      const response = await fetch(new URL("/api/function", url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Convex " + key,
        },
        body: JSON.stringify({
          path: getFunctionName(ref),
          args: convexToJson(args),
          format: "convex_encoded_json",
        }),
      });
      if (!response.ok)
        throw new Error("Convex migration request failed: " + response.status);
      const result = await response.json();
      if (result.status !== "success")
        throw new Error(result.errorMessage ?? "Migration failed");
      return jsonToConvex(result.value) as FunctionReturnType<F>;
    },
  };
}
