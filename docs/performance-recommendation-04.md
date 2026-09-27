# 4 — Planning week window

Planning previously paginated every saved `scheduleSlots` row before it could render one week. The route now requests only the selected Monday; Convex validates it and reads that week plus its two neighbors through `by_user_week`. The request remains user-scoped, and each week read is bounded to 100 slots. Subject loading retains the existing `.take(4001)` bound.

The planning store helper is cached with React `cache` for identical user/week inputs in one server request. It builds default days for all three weeks, then hydrates saved slots. The full-history loader stays in place for callers that need it.

Subject order now uses the selected week and its adjacent weeks. This replaces the former current-calendar-year ranking because the page no longer loads year-wide slot history. A year-wide ranking would need a separate indexed aggregate; add that only if the surrounding-week order proves insufficient.

`next.config.ts` already sets `reactCompiler: true`. The client uses one explicit `useMemo([days, locale, currentYear])` for the weekday formatters and labels, then reuses each label in both the tabs and day card; other pure derived values stay compiler-managed.

Validation: focused planning-window tests, both TypeScript project checks, and the frontend production build pass. No deployment or browser timing measurement was run.
