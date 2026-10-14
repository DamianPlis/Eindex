# Performance recommendation 5: client bundle boundaries

**Date:** 2026-09-27  
**Baseline:** `9fd6a1c8d7c1caca7e963615a62ac641cfcada26`  
**Result:** Removed the client directive from the five static settings skeleton components listed below.

## Production build comparison

I built the baseline snapshot and a variant with only those five directives removed, using `npm run build:frontend` (`next build`). Both builds completed successfully. The frontend build script was used directly, so no Convex deploy ran. Convex URLs were placeholder values set in the build process environment only.

The Next client-reference manifest no longer lists the five skeletons as client modules in any settings route: each route went from 30 client modules to 25. Their emitted bundle byte savings were small and mixed:

| Route         | Reachable JS chunks, before → after | Raw bytes, before → after | Gzip bytes, before → after | Gzip change |
| ------------- | ----------------------------------: | ------------------------: | -------------------------: | ----------: |
| Settings root |                               9 → 9 |         268,969 → 268,964 |            84,853 → 84,980 |      +127 B |
| Appearance    |                               9 → 9 |         240,592 → 235,452 |            76,832 → 76,116 |      −716 B |
| Language      |                               9 → 9 |         240,263 → 235,130 |            76,540 → 75,835 |      −705 B |
| Subjects      |                              9 → 10 |         261,425 → 259,083 |            82,641 → 82,576 |       −65 B |
| Statistics    |                               9 → 9 |         239,458 → 234,611 |            76,166 → 75,551 |      −615 B |
| Public About  |                               5 → 5 |         158,806 → 158,805 |            49,684 → 49,685 |        +1 B |

The settings subroutes save 65–716 gzip bytes per manifest graph; the settings root is 127 bytes larger after compression, and no route loses a chunk. Public About is effectively unchanged. I kept the five directive removals because the components are static and the client graph drops five modules on every settings route, with small measured savings on four of the five settings routes.

## Other bundle candidates

The three statically imported locale dictionaries total **34,212 source bytes** in this snapshot. `UserSyncProvider` imports `getMessages`; sample English, Czech, and Polish translation strings are present in the shared emitted root chunk `2ziixylg1arjs.js` (**112,418 raw / 33,793 gzip bytes**). Both `ConvexClientProvider` and `UserSyncProvider` are client modules in the public About route manifest. The chunk also contains other shared code, and it has no paired source map, so its full size cannot be attributed to the dictionaries or providers individually. I left provider placement and dictionary loading unchanged; the build evidence does not isolate a safe additional byte saving for either.

## Method and limits

The baseline was a Git archive of tracked app sources and root build configuration from the commit above, plus `hooks` and `icons` required by source imports. Its `node_modules` was a junction to the installed workspace dependencies. The only variant source edits were removal of the top-level directive from the five named files. Both builds used the same Next.js 16.3.4 version and configuration.

For each route, I counted the unique `.js` files named by `clientModules[*].chunks` in its `.next/server/app/**/page_client-reference-manifest.js`. Raw bytes are the file sizes; gzip bytes are the sum of per-file Python `gzip.compress` sizes at level 9 with `mtime=0`. These are manifest-reachable client graph totals, including loading/error/not-found boundaries that may not be requested on a successful initial navigation. They are not captured HTTP transfer sizes or Web Vitals. Next emitted the same Turbopack workspace-root warning for both builds because the isolated snapshot sat under the worktree with a second lockfile.

Raw per-build chunk lists, source and build metadata, dictionary probes, and per-route deltas are in [the JSON evidence](performance-evidence/05-client-boundaries.json).
