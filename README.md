# Eindex

A Next.js App Router school planner with Czech, English and Polish interfaces.
Convex is the only runtime database and authentication provider. Google sign-in
uses Convex Auth. Firebase Admin is a development dependency used only by the
offline legacy migration tools.

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

See [.env.example](.env.example) for variable names. Never commit deploy keys,
OAuth secrets, or Firebase credentials.

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

## Legacy data cutover

The merge changes application code; it does not automatically copy live Firebase
data or change production secrets. Old Firebase session cookies are no longer
accepted; users sign in again with Google. A verified, normalized Google email
links to an imported Convex user and preserves that user's data.

Before switching a live Firebase installation:

1. Back up both databases and stop Firebase writes during the final import.
2. Select the target deployment explicitly. Configure the matching
   `CONVEX_DEPLOY_KEY` and Firebase Admin credentials for the offline tools.
3. Run `npx tsx scripts/migrate-firestore-to-convex.ts <convex-url>`.
4. Run `npx tsx scripts/verify-parity.ts <convex-url>`. It actually reads both
   systems and exits unsuccessfully on missing users or differing emails,
   settings, subjects, groups, deadlines, or timetable slots.
5. Resolve any stale rows or duplicate accounts reported by verification before
   opening the Convex version to users. The importer upserts; it does not delete
   extra Convex rows or merge conflicting accounts.
6. Verify Google sign-in using an imported account and a fresh account.

Do not rerun the importer over accounts already using Convex: it can overwrite
newer data. Legacy import functions are `internalMutation`/`internalQuery` only,
so an unauthenticated browser cannot impersonate a Firebase UID. The
`firebaseUid` field is retained as migration metadata, not authentication.
