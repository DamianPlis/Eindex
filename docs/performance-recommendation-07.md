# 7 — Sudoku and Mandala browser measurements

## What was tested

Date: 2026-09-27. Actual, unchanged game components were imported into an isolated Next.js **production** fixture with React Compiler and the application's SVG loader. The fixture has no authentication or backend. Its mount/unmount buttons exercise component lifecycle; unmount represents leaving a route, without measuring the real route's navigation or server work.

The in-app Chromium browser ran trusted clicks and wheel input. Page instrumentation used real `PerformanceObserver` entries, `performance.now()`, a DOM observer, a Worker wrapper, and canvas draw spans. Results are local lab observations, not production-user distributions or evidence of a before/after speedup.

- Windows, AMD Ryzen 5 6600H, 12 logical CPUs, 16,361,480,192 B RAM; Node 22.17.0; Next 16.3.4; browser UA Chrome/154.0.0.0.
- Ten fresh-document Sudoku mounts/exits; ten Mandala mounts/new puzzles; separate wheel and synthetic pinch/pan captures.
- The repeated batches reported a 1280 × 720 viewport, DPR 1, and a 510 px maximum-width fixture. The separate pinch/pan capture used an explicit 510 × 698 viewport. They are not pooled as identical conditions.
- No CPU/network throttling or browser HTTP-cache purge. Reload resets the JavaScript worker pool, but keeps HTTP cache and Mandala localStorage. Puzzle generation is random; there was no fixed random seed.
- Other builds were running during portions of collection. Machine scheduling, browser presentation, instrumentation, and automation are uncontrolled confounds. Timing precision is roughly 0.1 ms; reported zero spans are below that resolution.

## Observed component work

All values are milliseconds. p75 is nearest-rank, not an inferred population percentile.

| Measurement                                               |                   n | Median |  p75 |    Range |
| --------------------------------------------------------- | ------------------: | -----: | ---: | -------: |
| Sudoku mount → first playable grid DOM                    |                  10 |   9.25 | 19.4 | 7.3–28.7 |
| Sudoku mount → Worker construction                        |                  10 |   3.55 |  4.3 |  2.8–7.4 |
| Mandala initialization/regeneration draw JS               | 20 across 10 visits |    0.2 |  0.3 |  0.1–0.4 |
| Mandala wheel redraw JS, separate pilot                   |                   6 |    0.1 |  0.2 |  0.1–0.2 |
| Mandala draw JS during pinch/pan capture, including mount |                  33 |    0.1 |  0.2 |    0–0.5 |

Sudoku mount-to-playable samples: **19.4, 8.0, 8.8, 9.5, 7.3, 9.0, 19.4, 28.7, 7.8, 12.2**. This is DOM readiness, not a paint metric. The initial fallback precedes worker construction; these samples do not demonstrate a startup main-thread bottleneck on this machine. No >50 ms main-thread long-task entry was observed in the retained captures. Worker CPU time is outside that observer.

**Worker lifetime finding:** all ten workers had `terminated: null` at capture after unmount. Received-message counts after exit were **0, 2, 0, 3, 0, 0, 0, 0, 1, 0**: three runs demonstrably received generated puzzles after leaving. Two runs still had an outstanding worker request at capture. This is a bounded background pool (five puzzles per difficulty), not evidence of endless CPU consumption. A future lifecycle change can stop/refill the worker when the game mounts/unmounts; that would trade background work for fewer prewarmed puzzles on return.

Canvas spans start when the component resets its backing width and end at context restore. They include canvas command submission but **exclude GPU raster/presentation**, event-to-commit delay, and region generation before drawing. The pilot canvas was 800 × 800 backing pixels and 444 CSS px wide. The 30-step pinch/pan replay dispatched synthetic touch events into the actual handlers; it is not a physical-device gesture test. It completed, but took **26,174 ms** across animation-frame waits. That cadence makes this capture unsuitable for a smoothness/FPS claim even though individual draw calls were short.

## Paint, layout, and interaction timing

The APIs were available, but observation completeness was poor in this browser surface:

- None of the ten short Sudoku captures contained FCP/LCP entries. Nine of ten Mandala repeats also lacked them; one recorded FCP and LCP-at-capture of **152 ms** for the fixture shell. Missing entries are **unavailable**, not zero and not fast-page evidence.
- Longer pilot captures recorded FCP/LCP-at-capture of **2,500 ms** (Mandala), **1,988 ms** (Sudoku), and **1,768 ms** (pinch/pan fixture). They measure the fixture shell, not authenticated app routes or the later-mounted games.
- No layout-shift entries eligible for CLS (without recent input) were observed. This is not a claim of zero field CLS: captures are short and game insertion followed input.
- The Sudoku interaction pilot exercised mount, cell selection, number entry, candidates, Hard, and exit. Recorded click processing durations were **6.3, 1.7, 1.3, 4.3, 4.4, 4.6 ms**. Per-interaction maximum Event Timing durations were **280, 304, 1,272, 264, 40, 72 ms**. The worst total includes substantial presentation delay; the corresponding number-entry click handler itself was 1.3 ms. Cause was not isolated.
- Five Mandala repeat visits had observed interaction maxima of **16, 16, 16, 16, 48 ms**; the other five had no qualifying entry at capture. The observer threshold was 16 ms, and some presentation entries may not have been delivered before capture. Null entries must not be treated as sub-16 ms guarantees.

These are raw Event Timing observations, **not a validated INP result**. The capture does not implement the complete page-lifetime INP algorithm. INP includes input delay, processing, and presentation, and event observers have a minimum duration threshold. See [web.dev INP](https://web.dev/articles/inp) and [interaction breakdowns](https://web.dev/articles/optimize-inp).

## Decision and reproduction

No game optimization was applied: the task for #7 was to test, and these samples do not justify reducing canvas resolution or rewriting generation. Worker lifetime is the concrete follow-up finding. Retain the existing rendering until a foreground-device trace isolates slow frames.

Run `node scripts/performance-games.mjs build`, then `node scripts/performance-games.mjs start`; open `http://127.0.0.1:3107`. Use the mount/exit controls, real game controls, wheel over the canvas, or the explicitly labeled synthetic gesture button, then **Save measurement**. The server binds to loopback and appends only fixture telemetry locally. Stop it after use. The fixture lives under ignored `.data/`; it is not an application route or authentication bypass.

Raw [23 retained captures](performance-evidence/07-browser.jsonl), [computed summary](performance-evidence/07-summary.json), and `node scripts/summarize-game-profile.mjs` retain samples and calculation rules. JSONL rows 1–2 are pilots, 3–12 are Sudoku repeats, 13–22 are Mandala repeats, and 23 is pinch/pan (one-based numbering). Two initial fixture runs failed because its SVG loader was missing; corrected before the retained Sudoku batch, and those failed runs have no performance claim. A later automation timeout during the pan experiment is not an app-load timing.
