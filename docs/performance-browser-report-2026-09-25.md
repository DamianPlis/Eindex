# Next.js performance investigation report

**Date:** 2026-09-25

**Scope:** Authenticated local Next.js routes, browser timing proxies, prior local HTTP/config experiments, and read-only source review.

## Executive summary

I tested the signed-in local app in the in-app browser across the dashboard, planning, deadlines, deadline detail, settings and its subsections, Sudoku, and Mandala. Login was skipped as requested. The application code was not changed for this report; this Markdown file is the only new artifact.

The browser environment did **not** expose usable Performance APIs or an attached DevTools Performance/Lighthouse trace. Therefore, this investigation has no valid FCP, LCP, CLS, INP, TTFB, or TBT values. I report browser navigation-call and DOM-marker times as automation proxies, not Core Web Vitals or paint times. The browser logs query returned zero warnings/errors.

On three sequential reloads per main route, median navigation-return / content-marker times were: dashboard 1,126 / 1,258 ms; planning 1,309 / 1,699 ms; deadlines 77 / 1,030 ms; deadline detail 966 / 1,092 ms; settings root 924 / 1,159 ms. These are local development observations with a warm same-session environment, not field metrics and not cold production timings.

The strongest experiment result was an isolated synthetic dashboard harness: a shared React request-cached loader reduced mocked Convex fetchQuery calls from 10 to 5 on a 501-slot fixture, while preserving reminder and schedule text. That is a call-count result, not a live Convex latency or browser speedup. The settings reduction from 6 to 3 calls is source-derived, not measured.

No “secret” config flag showed a verified user-facing speed improvement. Disabling inline CSS reduced combined HTML + CSS + JS response-body totals by 41,697 B (14.70%) for About and 41,414 B (14.15%) for Login in a corrected local HTTP capture. Those are public routes and byte totals, not paint results; external CSS is separately cacheable. Tested chunk flags did not reduce script request counts.

## 1. Browser method and validity

- Browser: Codex In-app Browser; the user had already signed in.
- App: localhost:3000, local dev server, Next.js 16.3.4, Turbopack.
- Viewport: 510 × 698 CSS px; document client width 495 px and height 698 px; DPR 1.
- Tests were sequential in one browser session. No CPU/network throttling or browser-cache reset was applied.
- “Navigation return” is wall time around the automation navigation/reload call returning.
- “Content marker” is elapsed time from operation start until a route-specific DOM marker appeared.
- These timers include automation and local dev-server effects. They are not FCP, LCP, INP, CLS, TTFB, or full page load.
- The browser evaluation scope did not expose usable window.performance or PerformanceObserver. DevTools shortcut did not open a Performance panel; Lighthouse/CDP trace wasn’t available in the authenticated browser.
- The visible development page had HMR and Next DevTools resources. The app’s current user data and backend/cache state were not reset.

Next.js recommends a production build for production-like performance checks; its CSS inlining and Link-prefetch behavior also differ in development. Lab data and field data answer different questions, and INP requires user interactions. See [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist), [Next.js Web Vitals reporting](https://nextjs.org/docs/app/guides/analytics), and [web.dev measurement guidance](https://web.dev/articles/vitals-measurement-getting-started).

## 2. Main authenticated routes: repeated reloads

Three sequential observations per route:

| Route              | Navigation-return samples (ms) |    Median | Content-marker samples (ms) |    Median | Final DOM observation                                                                                  |
| ------------------ | ------------------------------ | --------: | --------------------------- | --------: | ------------------------------------------------------------------------------------------------------ |
| /cs dashboard      | 1,132; 1,125; 1,126            | **1,126** | 1,253; 1,258; 1,261         | **1,258** | 212 nodes; main text 202 characters                                                                    |
| /cs/planning       | 1,325; 1,288; 1,309            | **1,309** | 1,724; 1,669; 1,699         | **1,699** | 898 nodes; main text 6,101 chars; main scroll height 1,330 px                                          |
| /cs/deadlines      | 81; 51; 77                     |    **77** | 1,030; 1,036; 982           | **1,030** | 274 nodes; 8 main buttons; 6 main inputs/selects; 3 detail links                                       |
| /cs/deadlines/[id] | 933; 966; 999                  |   **966** | 1,051; 1,092; 1,131         | **1,092** | 159 nodes; main text 76 chars                                                                          |
| /cs/settings       | 1,000; 901; 924                |   **924** | 1,271; 1,153; 1,159         | **1,159** | 640 nodes; 85 page buttons (82 in main); 35 main inputs; main scroll height 5,237 px; text 2,309 chars |

Deadlines illustrates why these are separate proxies: its reload call returned in a median 77 ms while the marker appeared at 1,030 ms. Neither time says when content was painted.

## 3. Direct visits, settings subsections, games, and route clicks

These are single observations unless noted:

| Route/action                 |                   Navigation return |                       Marker | Other observed details                                                                |
| ---------------------------- | ----------------------------------: | ---------------------------: | ------------------------------------------------------------------------------------- |
| First direct /cs             |                              749 ms |                     1,301 ms | 183 nodes; main text 231 chars                                                        |
| First direct /cs/planning    |                            2,568 ms |      No valid content marker | Initial accessibility snapshot was shell/fallback only: 363 nodes; 39 body-text chars |
| First direct /cs/deadlines   |                              668 ms |                     1,048 ms | 277 nodes; 11 total page buttons; 6 inputs; 3 detail links                            |
| First detail reload          |                            1,321 ms |                     1,472 ms | 159 nodes; 3 total page buttons; no inputs                                            |
| /cs/settings/appearance      |                              568 ms |                     1,088 ms | 193 nodes; 3 main buttons; 1 input; 2 headings; 43 main-text chars                    |
| /cs/settings/language        |                            2,148 ms |                     2,756 ms | 201 nodes; 4 buttons; 1 input; 2 headings; 64 main-text chars                         |
| /cs/settings/subjects        |                            1,708 ms |                     2,480 ms | 593 nodes; 77 buttons; 34 inputs; 4 headings; 2,114 main-text chars                   |
| /cs/settings/statistics      |                            1,869 ms |                     2,425 ms | 188 nodes; 1 button; 2 inputs; 2 headings; 115 main-text chars                        |
| /cs/mandala                  |                            2,495 ms |   2,782 ms to visible canvas | 159 nodes; 15 main buttons; 800 × 800 backing canvas displayed at 429 × 429 CSS px    |
| /cs/sudoku                   | Browser tool timed out after 16.1 s |              No valid timing | Later snapshot showed interactive page: 297 nodes, 81 grid cells, 18 main buttons     |
| Sudoku → dashboard           |                331 ms to URL change | 1,167 ms to main-text marker | One navigation                                                                        |
| Deadline list → detail click |                477 ms to URL change |    994 ms to #deadline-title | One navigation; not INP                                                               |

An earlier appearance observation used the incorrect criterion “main text > 60 characters”; it waited 4,702 ms without matching and was discarded. The corrected appearance result is the one above. The Sudoku browser-tool timeout is not evidence the app took 16.1 seconds to load.

The observed dashboard had 3 deadline-detail links and no schedule entries for its displayed day. Historical schedule-slot count was unknown. Data volume can change this app’s backend work and DOM.

## 4. Browser asset counts

Counts are from observed page assets and include HMR/Next DevTools resources. They are not production transfer sizes.

| Route           | Scripts | Stylesheets | Fonts | Images | Other | Total |
| --------------- | ------: | ----------: | ----: | -----: | ----: | ----: |
| /cs             |      20 |           5 |     1 |      0 |     1 |    27 |
| planning        |      21 |           6 |     1 |      1 |     1 |    30 |
| deadlines       |      22 |           5 |     1 |      0 |     1 |    29 |
| deadline detail |      20 |           6 |     1 |      1 |     1 |    29 |
| settings root   |      23 |           6 |     1 |      3 |     1 |    34 |
| appearance      |      23 |           5 |     1 |      0 |     1 |    30 |
| language        |      23 |           5 |     1 |      3 |     1 |    33 |
| subjects        |      23 |           6 |     1 |      0 |     1 |    31 |
| statistics      |      23 |           5 |     1 |      0 |     1 |    30 |
| Sudoku          |      22 |           5 |     1 |      0 |     1 |    29 |
| Mandala         |      21 |           5 |     1 |      0 |     0 |    27 |

## 5. Earlier local HTTP inline-CSS A/B

Separate from the signed-in browser run: local production-server HTTP requests on public About and Login routes. Corrected Capture B had 7 requests per route/config. Body sizes are HTML/CSS/JS response-body bytes; headers and image/font/other assets are excluded. Compression negotiation was not retained consistently enough to call these wire bytes.

| Route     | inlineCss | HTML B | Linked CSS count / B | JS count / B | Inline style chars | TTFB median; raw samples (ms)                         |
| --------- | --------- | -----: | -------------------- | ------------ | -----------------: | ----------------------------------------------------- |
| /en/about | true      | 63,360 | 0 / 0                | 12 / 220,320 |             50,234 | **28.84**; 19.46,25.28,28.19,28.84,32.10,38.82,361.59 |
| /en/about | false     | 11,060 | 3 / 10,603           | 12 / 220,320 |                  0 | **26.29**; 19.76,21.71,26.17,26.29,28.01,42.18,889.42 |
| /en/login | true      | 61,659 | 0 / 0                | 14 / 231,116 |             50,571 | **19.56**; 18.72,18.72,19.54,19.56,23.73,26.65,54.54  |
| /en/login | false     |  9,506 | 3 / 10,739           | 14 / 231,116 |                  0 | **17.18**; 15.44,15.76,17.04,17.18,23.11,28.03,150.28 |

Combined HTML + linked CSS + JS body totals:

- About: true 283,680 B; false 241,983 B; true is +41,697 B (+14.70% relative to false).
- Login: true 292,775 B; false 251,361 B; true is +41,414 B (+14.15%).

This is a payload result, not proof of a paint difference. Inline CSS removes separate stylesheet responses but repeats styles in HTML; external CSS can be cached separately. Next currently documents inlineCss as experimental, production-only, and a trade-off between first visits and returning visitors. [Next.js inlineCss docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss)

Other retained captures and limitations:

- Capture A About TTFB: true 16.96,17.07,18.42,20.38,30.91,32.76,36.30 ms (median 20.38); false 17.16,19.28,22.88,23.36,25.68,33.41,296.58 (median 23.36).
- Capture A Login TTFB: true 15.25,17.22,17.69,18.27,19.27,23.74,53.97 (median 18.27); false 12.64,13.49,14.99,15.24,21.80,23.68,45.33 (median 15.24).
- Capture A parser counted CSS-like URLs inside Flight payload as stylesheet links for inlineCss=true; those link counts are invalid. Capture B corrected it.
- Earlier seven-sample gzip response-only capture: About body 63,490 B; TTFB 357.9,32.9,32.0,25.4,34.3,24.0,20.1 ms (median 32.0). Login body 61,811 B; 39.1,24.0,33.4,18.1,17.7,18.0,19.6 (median 19.6). A zero script count in that report was a parser omission.
- Another five-request inline-CSS capture recorded gzip bodies 63,490 B / decoded 338,736 B About and 61,811 B / decoded 334,124 B Login; 12/14 scripts; median TTFB 22.1/17.3 ms. Raw per-request times were not retained.
- One-fetch inventory: About HTML 63,490 B, TTFB 25.3 ms, 12 JS / 220,686 B; Login 61,811 B, 19.2 ms, 14 JS / 231,482 B.
- Five-round external-CSS capture: About HTML body 11,062,11,063,11,063,11,063,11,063 B; Login 9,508,9,508,9,508,9,509,9,509 B. HTML chars 43,932/38,606; JS 12/14 at 220,329/231,125 B; CSS 3 at 10,603/10,739 B. No TTFB retained.

These were separate captures with different methods and must not be treated as one paired dataset.

## 6. Config and build experiments

Five-request-per-route HTTP comparisons where available:

| Variant                       |         Median TTFB About/Login (ms) | HTML B About/Login |  JS B About/Login |     JS request counts |
| ----------------------------- | -----------------------------------: | -----------------: | ----------------: | --------------------: |
| Baseline                      |                          36.3 / 27.4 |    63,358 / 61,658 | 220,330 / 231,126 |               12 / 14 |
| turbopackSharedRuntime=true   |                          33.4 / 21.4 |    63,452 / 61,752 | 220,198 / 230,994 |               12 / 14 |
| generateComponentChunks=true  | 25.3 / 19.2, one-response check only |    63,490 / 61,811 | 220,686 / 231,482 | No reduction observed |
| Both flags                    |                          36.8 / 26.2 |    63,637 / 61,964 | 220,518 / 231,314 |               12 / 14 |
| firstPageLoadPriority variant |                          37.0 / 27.9 |    63,361 / 61,661 | 220,331 / 231,127 |               12 / 14 |

No tested flag changed the observed 12/14 script request counts. Byte changes were small/mixed, and chunk-generation’s row was only one response per route, not a five-run comparison.

Isolated build wall times: baseline 28,461 ms; SharedRuntime 27,853 ms and another run 25,954 ms; chunking 28,177 ms and another run 27,307 ms; combined 27,679 ms; priority variant 27,341 ms. Some repeat-to-option mapping was not preserved; compile logs were 12.0–13.8 s. Too few controlled repeats to attribute build-time gains, and build time is not runtime page performance.

A separate diagnostic claimed first-load chunks 14 → 6 and home JS 648 KB raw / 197 KB gzip → 449 KB / 134 KB. Route details were missing and the numbers disagreed with served-script data, so this is unverified. A stale .next route-bundle file dated 2026-09-23 listed uncompressed first-load JS About 603,218 B, home 652,292 B, deadlines 699,538 B, settings 723,614 B; it is not current compressed transfer data.

## 7. Synthetic data-loader experiment

A scratch-copy RSC harness used 501 schedule slots and mocked Convex fetchQuery. Before sharing one React request-cached function across dashboard sibling loaders: 4 slot-page calls + 6 other Convex queries = **10**. After both branches used the same cache function/key: 2 slot-page calls + 3 other queries = **5**. Reminder and schedule text matched on the fixture.

This proves only that the harness deduplicated those mocked reads. It is not live Convex timing or a measured FCP/LCP improvement. The isolated variant passed Prettier, typecheck, and frontend production build; those are correctness/build checks. Settings’ 6 → 3 call estimate at 501 slots is source-derived.

## 8. Ranked recommendations

All items below are source-backed hypotheses, not measured speedups.

1. **Deduplicate dashboard full-state reads.** Reminders use raw getUserState while schedule uses getCachedUserState, so they do not share the same React cache entry. A full load pages schedule slots by 500 and also fetches deadlines, subjects, and groups. Source-derived total for both loaders is 6 + 2P calls, P = pages per state load (minimum 8 for P=1). The harness demonstrated 10 → 5 for 501 slots/P=2. First validate live Convex counts/durations, then test both branches using the exact same cached function and user key. React cache is request-scoped and deduplicates only the same cached function/arguments. [React cache docs](https://react.dev/reference/react/cache)

2. **Use route-specific indexed reads.** Dashboard reminders need deadlines; schedule needs the displayed date and subject metadata, not every saved week. An existing dashboard aggregate is not a drop-in because it selects exact-date deadlines while current UI also includes overdue/near-future items. Settings fetches full state but passes only subjects and groups; a 6 → 3 read count at 501 slots is inferred from source, not measured. Preserve UI behavior and authorization, then compare live Convex timings. Relevant files: [store.ts](../lib/schedule/store.ts), [dashboard.ts](../convex/dashboard.ts), [schedule.ts](../convex/schedule.ts), [deadlines.ts](../convex/deadlines.ts), [subjects.ts](../convex/subjects.ts).

3. **Profile deadline detail metadata/page reads.** Both generateMetadata and page call raw full-state loader to find one deadline. A user-scoped index exists. Trace actual request behavior, then compare a narrow authorized lookup while preserving ownership checks. File: [deadline detail page](../app/%5Blocale%5D/%28app%29/deadlines/%5Bid%5D/page.tsx).

4. **Profile planning before adding memoization.** Planning loads history for year-based subject ranking and maps the week’s topics/slots. It had the largest observed DOM (898 nodes), but DOM size is not proof of CPU time. Profile typing/interaction before changing state ownership or memoization; React Compiler is already enabled. File: [PlanningPageClient.tsx](../components/pages/PlanningPageClient.tsx).

5. **Measure client bundle boundaries.** Five settings skeleton components are client-marked despite static markup; three locale message dictionaries are statically imported (33,251 source bytes); root auth/sync providers wrap public About too. These are bundle-analysis candidates, not proven savings. Next recommends keeping Server Components by default and keeping Client Components at interactive boundaries. [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

6. **Treat inline CSS as a first-visit/repeat-visit trade.** Measured public pages had about 41 KB larger combined body totals with inlineCss=true. Test authenticated production routes, cold direct entry, repeat visit, and in-app navigation before touching the current setting. It is experimental and global. [inlineCss docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss)

7. **Profile Sudoku and Mandala interactions.** Sudoku’s main-thread puzzle-generation fallback may block startup before worker setup; the browser timeout cannot be attributed to it. Check whether worker work stops after route exit. Mandala’s 800 × 800 canvas is drawn at 429 × 429 CSS px; profile pan/zoom redraws before tuning. File: [useSudokuGame.ts](../components/sudoku/hooks/useSudokuGame.ts).

8. **Separate lunch scraping from the schedule critical path only if cold traces justify it.** Lunch upstream HTML is cached for 12 hours but Cheerio parsing runs per call. A cold/expired upstream response can delay the schedule Suspense section. Measure warm and cold cases. The service worker claims clients but has no fetch/cache handler. File: [lunch server](../lib/lunch/server.ts).

9. **Do not add a generic performance flag.** React Compiler is already on and does not persistently cache Convex reads. Tested chunk flags did not reduce served script request counts. Measure browser transfer, hydration/main-thread time, Convex read count, and backend duration to choose a mechanism.

## 9. Confounds and limits

- Development mode has HMR/devtools and differs from production. Next docs recommend next build + next start for production-like checks.
- No CPU/network throttling, clean browser-cache run, cold server run, or controlled machine-load comparison was retained.
- User’s personalized data, locale, selected date, schedule history, deadlines, Convex state, and lunch cache affect both route work and DOM.
- Convex initialization/subscription and backend latency were not separately timed.
- The lunch fetch may vary with upstream/cache; the PWA worker registers after hydration but has no fetch handler.
- UserSyncProvider can refresh or replace route when saved settings/locale differ.
- Route entry, reload, SPA click, and prefetched navigation are different cases.
- Asset counts include development files. HTTP byte captures do not include all assets and compression metadata was incomplete.
- Browser viewport was narrow; visible content and responsive layout can change LCP/prefetch behavior.
- The Sudoku worker may continue after leaving; not instrumented.
- Samples were small; some HTTP TTFB runs contain large outliers.
- next.config.ts was already modified in the working tree and treated as current. Other dirty paths were preserved.

Reference “good” Core Web Vitals thresholds are based on field visits at the 75th percentile, typically segmented by device; these local samples cannot classify the app. See [web.dev thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds).

## 10. Recommended next measurement pass

1. Use an isolated copy of the current working tree and run a production build/server, preserving current config.
2. Keep the authenticated account, locale, viewport, dataset counts, browser version, server state, and cache condition fixed and documented.
3. Use a browser with attached DevTools Performance/Lighthouse to retain traces for FCP, LCP, CLS, long tasks, and TBT. Perform representative interactions on planning, deadlines/settings, Sudoku, and Mandala. TBT is only an INP lab proxy; it is not measured INP.
4. Measure direct cold loads, direct warm loads, and in-app navigation separately. Gather at least 10 runs per case, retain raw values/traces, and report median plus p75/spread.
5. Capture Convex query count/duration and server render spans for dashboard, settings, deadline detail, and planning. Test one data-path change at a time and verify rendered semantics.
6. Once deployed, use a small isolated useReportWebVitals client component or existing RUM to collect real-user distributions. [Next.js analytics](https://nextjs.org/docs/app/guides/analytics) · [web.dev lab/field guide](https://web.dev/articles/vitals-measurement-getting-started)

## 11. Specialist coverage

Twelve specialist agents were launched in batches: eleven returned findings on measurement, Web Vitals, config/build options, caching, dashboard/data paths, benchmark tooling, and React/bundle review; one code-audit agent was interrupted. The runtime only allows four concurrent agents including the primary agent and refused another thread, so 15 simultaneous agents were not available here. Findings are labeled as browser observations, HTTP results, synthetic-harness results, source-derived estimates, or unverified artifacts rather than blended together.

## Sources

- [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js Analytics and useReportWebVitals](https://nextjs.org/docs/app/guides/analytics)
- [Next.js inlineCss option](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js fetching and streaming](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js Link navigation and prefetch](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [React cache](https://react.dev/reference/react/cache)
- [web.dev lab and field measurement](https://web.dev/articles/vitals-measurement-getting-started)
- [web.dev Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
