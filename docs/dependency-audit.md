# Dependency audit — 4 October 2026

Audited all 27 direct dependencies on `master` using the local graph, source
imports, configuration, npm scripts, package peer requirements, and the lockfile.
The completed Firestore migration tooling was retired with the owner's approval.
The project now declares 24 direct dependencies. No remaining package versions
were changed, and 143 package entries were removed from `package-lock.json`.

## Changes

| Package          | Result                         | Evidence                                                                                                                |
| ---------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `firebase-admin` | Removed                        | Used only by the retired Firestore importer and parity scripts.                                                         |
| `dotenv`         | Removed                        | Used only to load environment files in those scripts.                                                                   |
| `tsx`            | Removed as a direct dependency | Its only documented project command ran the retired scripts. Vite still retains it as an optional peer in the lockfile. |
| `@svgr/webpack`  | Moved to `devDependencies`     | The SVG loader in `next.config.ts` runs during development and builds.                                                  |

Deleted `scripts/migrate-firestore-to-convex.ts`, `scripts/verify-parity.ts`, and
their otherwise unused `scripts/convex-admin.ts` helper. Updated the README and
removed the obsolete Firebase credentials from `.env.example`. Git history
retains the retired tools.

## Retained dependencies

| Packages                                                        | Current use                                                                                                                                    |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `next`, `react`, `react-dom`                                    | Application framework, components, and server rendering.                                                                                       |
| `convex`, `@convex-dev/auth`, `@auth/core`                      | Database, reactive clients, authentication, and Google provider in `convex/auth.ts`.                                                           |
| `@leeoniya/ufuzzy`                                              | Fuzzy search in `lib/i18n/search.ts`.                                                                                                          |
| `cheerio`                                                       | Lunch scraper in `lib/lunch/server.ts` and rendering tests.                                                                                    |
| `@svgr/webpack`                                                 | Turbopack SVG loader in `next.config.ts`.                                                                                                      |
| `babel-plugin-react-compiler`                                   | Required by `reactCompiler: true` in `next.config.ts`.                                                                                         |
| `tailwindcss`, `autoprefixer`, `postcss`                        | Tailwind directives in `css/globals.css`, plugins in `postcss.config.mjs`, and Autoprefixer's PostCSS peer. Tailwind is retained as requested. |
| `typescript`, `@types/node`, `@types/react`, `@types/react-dom` | Type checking and application type definitions.                                                                                                |
| `eslint`, `eslint-config-next`                                  | Lint script and `eslint.config.mjs`.                                                                                                           |
| `prettier`                                                      | Project formatter and `format:check` script.                                                                                                   |
| `vitest`, `convex-test`                                         | Existing test suite and Convex test harness.                                                                                                   |
| `@edge-runtime/vm`                                              | Vitest's configured `edge-runtime` environment.                                                                                                |
| `happy-dom`                                                     | Explicit test environment in `tests/login-panel.test.ts`.                                                                                      |

The Convex migration metadata, internal functions, existing tests, and
`scripts/legacy-slots.ts` helper remain. The helper is imported by an existing
regression test and requires none of the removed dependencies.

## Validation

- `npm run typecheck` and `npm run build:frontend` passed after the cleanup.
- `npm run lint` passed before and after with the same four existing warnings.
- `npm test` produced the same results before and after: 39 passed and three
  failed. All three failures are in `tests/schedule-defaults.test.ts` and concern
  the existing `allowTopic` expectation. No tests were edited.
- Prettier formatted the changed JSON and Markdown files.
- The local graph was refreshed with an AST-only update.
