# Eindex

A Next.js App Router school planner with Czech, English and Polish interfaces.
Convex is the only runtime database and authentication provider. Google sign-in
uses Convex Auth. The completed Firestore migration tools and their dependencies
have been retired.

## Local development

1. Install with `npm ci`.
2. Run `npx convex dev` to select a development deployment and generate
   `.env.local`. Both public Convex URLs must point to that deployment.
3. Configure Convex Auth on the same deployment: `AUTH_GOOGLE_ID`,
   `AUTH_GOOGLE_SECRET`, `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL`.
   Google must allow the callback at
   `https://<your-convex-site>/api/auth/callback/google`.
   Follow the [Convex Auth setup](https://labs.convex.dev/auth/setup).
4. `npm run dev` runs the backend watcher and frontend together.
   `npm run dev:frontend` and `npm run dev:backend` run them separately.

See [.env.example](.env.example) for variable names. Never commit deploy keys or
OAuth secrets.

## Architecture

- `proxy.ts` handles the Convex Auth callback, session refresh, protected routes
  and locale redirects. Next.js server actions forward the authenticated token
  to Convex; all ownership checks happen in the Convex functions.
- `convex/schema.ts` defines users, auth tables, settings, subjects, subject
  groups, timetable slots, deadlines, undo receipts and shared lunch data.
- `lib/schedule/store.ts` reconstructs the UI state from Convex, loading saved
  weeks in pages so historical statistics and planning sort remain complete.
- First sign-in saves editable default subjects and groups. Existing/migrated
  accounts keep their saved lists, including deliberately empty lists.
- `UserSyncProvider` subscribes to Convex settings and the mutation revision.
  Changes from another device refresh server-rendered pages; locale and theme
  preferences update directly. There are no Firebase listeners or polling routes.
- Deadline undo uses owner-bound, single-use server snapshots. Completion undo
  preserves subsequent text edits, and removal undo keeps the original order.
  Receipts expire and are cleaned up after 24 hours.
- The existing lunch scraper, CSS Modules, PWA, translations, planning scrolling,
  reminders and deadline UI remain in place.

## Validation and build

```sh
npm test
npm run typecheck
npm run lint
npm run build:frontend
```

`build:frontend` performs the production Next.js build without deploying Convex.
`npm run build` deploys Convex and then builds Next.js for hosting; its deployment
is determined by the hosting environment's `CONVEX_DEPLOY_KEY`.
Set the frontend URLs, Google callback and `SITE_URL` for that same environment.

## Migrated accounts

A verified, normalized Google email links to an imported Convex user and
preserves that user's data. The `firebaseUid` field is retained as migration
metadata, not authentication. Legacy import functions remain internal, and
existing migration regression tests and their slot conversion helper are kept.
The retired importer and parity scripts can be recovered from Git history.
