# Recommendation 08: stream lunch separately

The schedule now streams as soon as its dashboard data is ready. Its lunch subtitle keeps a small skeleton until the menu resolves; the existing “Menu unavailable” fallback remains in place.

Verification: `npx vitest run tests/dashboard-lunch-stream.test.ts` passed. The harness held the lunch promise unresolved, observed the schedule and skeleton in the server stream, then resolved lunch and observed the menu. This verifies stream ordering with controlled delay; it does not claim a browser latency or wall-clock improvement.
