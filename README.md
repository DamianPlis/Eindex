# Eindex

## Convex migration: local authentication

The current login flow uses **Convex Auth with Google**. The Firebase sections
below describe the earlier architecture and migration dependencies.

Run `npm run dev` to sync the development Convex backend, then start Next.js
and keep both watching for changes. For separate terminals, use
`npm run dev:backend` and `npm run dev:frontend`.

Your `.env.local` must select the same development deployment in
`CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` (the `.convex.cloud` URL), and
`NEXT_PUBLIC_CONVEX_SITE_URL` (the `.convex.site` URL). On that Convex deployment,
configure `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `JWT_PRIVATE_KEY`, `JWKS`, and
`SITE_URL` (`http://localhost:3000` for local development). Google must allow
`https://<deployment>.convex.site/api/auth/callback/google` as a redirect URI;
use the full site hostname, including the region when present.

If login reports `NoAuthProvider` with **no providers configured**, confirm the
deployment URLs match and run `npx convex dev --once` to push
`convex/auth.config.ts`. Starting Next.js alone does not deploy this file, and
clearing cookies cannot register a missing backend token provider. See the
[Convex Auth setup](https://labs.convex.dev/auth/setup/manual).

**A server-first Next.js school planning application** built with React 19, Firebase, and internationalization support. Eindex helps students track their weekly schedule, manage homework deadlines, and view school lunch menus — all synced across devices in real-time.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Routing & Internationalization](#routing--internationalization)
- [Data Layer](#data-layer)
- [Real-Time Sync](#real-time-sync)
- [Authentication](#authentication)
- [Styling](#styling)
- [PWA Support](#pwa-support)
- [Scripts](#scripts)

---

## Features

- 📅 **Weekly Schedule Planning** — Manage your weekly timetable, assign subjects to time slots, add topics.
- 📝 **Deadline Tracking** — Create, view, mark-as-done, and delete homework deadlines with relative date labels.
- 📊 **Statistics Dashboard** — View subject frequency stats over configurable time periods (week, month, year, school year).
- 🍽️ **Lunch Menu Scraping** — Automatically fetches and displays today's lunch menu from [jidelna.cz](https://www.jidelna.cz).
- 🌍 **Internationalization** — Full support for English (`en`), Czech (`cs`), and Polish (`pl`) locales.
- 🔄 **Real-Time Sync** — Changes sync across devices via Firebase Firestore snapshot listeners and polling.
- 🔐 **Google Authentication** — Sign in with Google via Firebase Auth, secured with server-side session cookies.
- 📱 **PWA Support** — Installable as a Progressive Web App with service worker and offline fallback pages.
- 🌓 **Dark/Light Theme** — User-configurable theme preference persisted via cookie + Firestore for instant server-side rendering (no flash).

---

## Tech Stack

| Layer        | Technology                                                     |
| ------------ | -------------------------------------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org/) (App Router)                |
| UI           | [React 19](https://react.dev/)                                |
| Language     | TypeScript (strict mode)                                       |
| Auth         | Firebase Authentication + server-side session cookies          |
| Database     | Firebase Firestore (server: Admin SDK, client: Web SDK)        |
| Styling      | CSS Modules + Vanilla CSS + Tailwind CSS utilities              |
| i18n         | Custom locale-prefixed routing with compile-time message files |
| Bundler      | Turbopack (development)                                        |
| Deployment   | Node.js / Vercel compatible                                    |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- A Firebase project with **Authentication** (Google provider) and **Firestore** enabled

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd random-next-app-copy

# Install dependencies
npm install

# Copy environment template and fill in your Firebase credentials
cp .env.example .env

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                                 | Required | Description                                 |
| ---------------------------------------- | -------- | ------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`           | Yes      | Firebase Web API key                        |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`       | Yes      | Firebase Auth domain                        |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`        | Yes      | Firebase project ID                         |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`    | Yes      | Firebase storage bucket                     |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes    | Firebase Cloud Messaging sender ID          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`            | Yes      | Firebase App ID                             |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`    | No       | Firebase Analytics measurement ID           |
| `FIREBASE_ADMIN_CREDENTIALS`             | Yes*     | Full JSON service account credentials       |
| `FIREBASE_PROJECT_ID`                    | Yes*     | Firebase project ID (alternative to JSON)   |
| `FIREBASE_CLIENT_EMAIL`                  | Yes*     | Service account email (alternative to JSON) |
| `FIREBASE_PRIVATE_KEY`                   | Yes*     | Service account private key (alt. to JSON)  |
| `ENABLE_STATE_READ_CACHE`                | No       | Set to `1` to enable server-side state cache|
| `USER_STATE_CACHE_MS`                    | No       | Cache TTL in milliseconds (default: `0`)    |

> *Either `FIREBASE_ADMIN_CREDENTIALS` (full JSON) OR the three individual fields must be provided.

---

## Project Structure

```
random-next-app-copy/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (HTML shell, providers, global CSS)
│   ├── manifest.ts               # PWA manifest generation
│   ├── error.tsx                  # Root error boundary (unlocalized)
│   ├── global-error.tsx           # Critical error boundary (replaces entire HTML)
│   ├── not-found.tsx              # Root 404 page (unlocalized)
│   │
│   ├── (app)/                    # Non-localized route group (redirect stubs)
│   │   ├── layout.tsx            # Passthrough layout
│   │   ├── page.tsx              # Redirects → /[locale]/
│   │   ├── loading.tsx           # Fallback loading state
│   │   ├── error.tsx             # Error boundary for app segment
│   │   ├── not-found.tsx         # 404 for app segment
│   │   ├── actions.ts            # All server actions (schedule, deadlines, settings)
│   │   ├── deadlines/
│   │   │   ├── page.tsx          # Redirects → /[locale]/deadlines
│   │   │   └── [id]/page.tsx     # Redirects → /[locale]/deadlines/[id]
│   │   ├── planning/
│   │   │   └── page.tsx          # Redirects → /[locale]/planning
│   │   └── settings/
│   │       └── page.tsx          # Redirects → /[locale]/settings
│   │
│   ├── [locale]/                 # Localized route segment (en, cs, pl)
│   │   ├── layout.tsx            # Locale validation via generateStaticParams
│   │   ├── not-found.tsx         # Localized 404 page
│   │   ├── login/
│   │   │   └── page.tsx          # Login page (renders LoginPanel)
│   │   └── (app)/                # Protected app routes (require auth)
│   │       ├── layout.tsx        # App shell (topbar, nav, auth guard)
│   │       ├── page.tsx          # Home page (schedule + reminders)
│   │       ├── error.tsx         # Localized error boundary
│   │       ├── loading.tsx       # Localized loading state
│   │       ├── deadlines/
│   │       │   ├── page.tsx      # Deadlines list + stats
│   │       │   └── [id]/page.tsx # Single deadline detail view
│   │       ├── planning/
│   │       │   ├── page.tsx      # Weekly planning grid
│   │       │   └── loading.tsx   # Planning skeleton
│   │       └── settings/
│   │           └── page.tsx      # Settings page
│   │
│   ├── api/                      # API route handlers
│   │   ├── session/route.ts      # POST: create session cookie, DELETE: logout
│   │   ├── state-version/route.ts # GET: check Firestore doc version for sync
│   │   └── lunch/[weekStart]/route.ts # GET: scraped lunch menu data
│   │
│   └── login/
│       └── page.tsx              # Unlocalized login redirect stub
│
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   │   ├── LoginPanel.tsx        # Google sign-in UI + redirect flow
│   │   └── LogoutButton.tsx      # Logout button + real-time sync listener
│   │
│   ├── i18n/                     # Internationalization & user sync
│   │   ├── UserSyncProvider.tsx  # React context: locale + messages + live theme/locale sync from Firestore
│   │   └── UidSync.tsx           # Side-effect component: injects uid into UserSyncProvider
│   │
│   ├── layout/                   # App shell / layout components
│   │   ├── BottomNav.tsx         # Mobile bottom navigation bar
│   │   ├── NoScriptNotice.tsx    # Displayed when JavaScript is disabled
│   │   ├── OnlineStatusBanner.tsx # Offline indicator banner
│   │   ├── SettingsLink.tsx      # Settings icon link in topbar
│   │   ├── SlotBubble.tsx        # Schedule slot card on home page
│   │   └── TopbarProfileMenu.tsx # User profile dropdown in topbar
│   │
│   ├── pages/                    # Full page client components
│   │   ├── PlanningPageClient.tsx # Interactive weekly planning grid
│   │   └── SettingsPageClient.tsx # Settings form (theme, locale, subjects)
│   │
│   ├── deadlines/                # Deadline feature components
│   │   ├── AddDeadline.tsx       # Modal form to create a deadline
│   │   ├── DeadlinesList.tsx     # Scrollable deadlines list
│   │   ├── DeadlinesRefreshContext.tsx # React context for optimistic refresh
│   │   ├── MarkDeadlineDone.tsx  # Form to mark a deadline as done
│   │   ├── RemoveDeadline.tsx    # Form to delete a deadline
│   │   ├── StatsCard.tsx         # Subject frequency statistics card
│   │   ├── StatusPill.tsx        # Colored status badge (today/expired/done/upcoming)
│   │   └── SubjectsCombobox.tsx  # Multi-select subject filter dropdown
│   │
│   ├── planning/                 # Planning feature components
│   │   └── CustomSubjectModal.tsx # Modal to add/edit custom subjects
│   │
│   ├── settings/                 # Settings feature components
│   │   ├── SettingsNav.tsx       # Settings page tab navigation
│   │   ├── SettingsProvider.tsx  # Settings context provider (theme, locale, subjects, groups)
│   │   ├── SettingsRefreshContext.tsx # React context for settings optimistic refresh
│   │   ├── ThemeRootSync.tsx     # Syncs server-read theme to DOM on mount
│   │   └── sections/             # Individual settings sections
│   │       ├── AppearanceSection.tsx   # Dark/light theme toggle
│   │       ├── LanguageSection.tsx     # Locale picker with flag icons
│   │       ├── StatisticsSection.tsx   # Stats time period config
│   │       ├── SubjectGroupsSection.tsx # Subject group CRUD
│   │       └── SubjectsSection.tsx     # Subject CRUD
│   │
│   ├── pwa/                      # Progressive Web App components
│   │   └── PwaRegistrar.tsx      # Service worker registration
│   │
│   ├── skeletons/                # Loading skeleton components
│   │   ├── SkeletonLine.tsx      # Base skeleton primitive
│   │   ├── HomePageSkeleton.tsx
│   │   ├── RemindersListSkeleton.tsx
│   │   ├── ScheduleListSkeleton.tsx
│   │   ├── DeadlinesPageSkeleton.tsx
│   │   ├── DeadlinesListSkeleton.tsx
│   │   ├── DeadlineDetailPageSkeleton.tsx
│   │   ├── PlanningPageSkeleton.tsx
│   │   ├── SettingsPageSkeleton.tsx
│   │   └── StatsCardSkeleton.tsx
│   │
│   └── ui/                       # Generic reusable UI components
│       └── ConfirmDialog.tsx     # Confirmation modal dialog
│
├── lib/                          # Shared business logic & utilities
│   ├── session.ts                # Server-only session utilities (cookie auth)
│   │
│   ├── firebase/                 # Firebase initialization
│   │   ├── admin.ts              # Server-only: Firebase Admin SDK setup
│   │   └── client.ts             # Client-only: Firebase Web SDK setup
│   │
│   ├── i18n/                     # Internationalization system
│   │   ├── config.ts             # Locale constants, types, validators
│   │   ├── routing.ts            # Path localization/stripping utilities
│   │   ├── preference.ts         # Resolve user's preferred locale
│   │   ├── server.ts             # Server-side locale utilities
│   │   └── messages/             # Translation message files
│   │       ├── index.ts          # Message loader
│   │       ├── en.ts             # English translations
│   │       ├── cs.ts             # Czech translations
│   │       └── pl.ts             # Polish translations
│   │
│   ├── schedule/                 # Schedule domain logic
│   │   ├── types.ts              # TypeScript type definitions
│   │   ├── defaults.ts           # Default data, templates, migration, normalization
│   │   ├── store.ts              # Firestore CRUD (read, write, cache, transactions)
│   │   ├── selectors.ts          # Data selectors (date utilities, deadline splitting)
│   │   ├── labels.ts             # Display name resolution for subjects & slots
│   │   └── stats.ts              # Subject frequency statistics calculations
│   │
│   ├── settings/                 # User settings logic
│   │   ├── types.ts              # Settings type definitions (theme, locale, schoolYear)
│   │   ├── defaults.ts           # Default settings, normalization, merging
│   │   ├── constants.ts          # Shared cookie constants (no "use client" — safe for server + client)
│   │   ├── theme-cookie.ts       # Server-only: reads theme preference from request cookie
│   │   └── client.ts             # Client-side theme application + cookie persistence
│   │
│   ├── lunch/                    # Lunch menu scraping
│   │   └── server.ts             # Server-only: scrapes jidelna.cz, parses HTML
│   │
│   ├── sync/                     # Real-time sync utilities
│   │   └── client-id.ts          # Client-side device ID for conflict resolution
│   │
│   └── utils/                    # General utilities
│       └── css.ts                # CSS variable reader (client-only)
│
├── hooks/                        # Custom React hooks
│   ├── useMediaQuery.ts          # Reactive media query hook (useSyncExternalStore)
│   └── useOnlineStatus.ts        # Online/offline status hook (useSyncExternalStore)
│
├── icons/                        # SVG icon files (Material Symbols)
│   ├── add_24dp_*.svg
│   ├── arrow_left_24dp_*.svg
│   ├── calendar_month_24dp_*.svg
│   ├── check_24dp_*.svg
│   ├── checklist_24dp_*.svg
│   ├── close_24dp_*.svg
│   ├── home_24dp_*.svg
│   ├── logout_24dp_*.svg
│   ├── restaurant_24dp_*.svg
│   ├── search_24dp_*.svg
│   ├── settings_24dp_*.svg
│   ├── sort_24dp_*.svg
│   └── ... (keyboard arrows, dark/light mode, filter)
│
├── css/                          # Global stylesheet
│   └── globals.css               # Global styles, CSS variables, theme definitions
│   # NOTE: Component styles are co-located as CSS Modules (*.module.css)
│   # alongside their components (e.g., AppShell.module.css, BottomNav.module.css)
│
├── public/                       # Static assets
│   ├── sw.js                     # Service worker
│   ├── firebase-messaging-sw.js  # Firebase Cloud Messaging service worker
│   ├── offline-en.html           # Offline fallback (English)
│   ├── offline-cs.html           # Offline fallback (Czech)
│   └── flags/                    # Flag SVGs for locale picker
│       ├── en.svg
│       ├── cs.svg
│       └── pl.svg
│
├── middleware.ts                  # Next.js middleware (locale cookie from URL)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration (strict)
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── package.json                  # Dependencies and scripts
└── .env.example                  # Environment variable template
```

---

## Architecture Overview

### Server vs. Client Split

Eindx follows the **server-first** principle of the Next.js App Router:

- **Server Components** — All route pages (`page.tsx`) are async server components. They fetch data directly from Firestore via the Admin SDK, with no client-side data fetching.
- **Client Components** — Interactive elements (`"use client"`) are leaf components that receive data via props. They use server actions for mutations.
- **Server Actions** — All write operations go through `app/(app)/actions.ts`, which uses Firestore transactions for safe concurrent writes.
- **Streaming** — Key pages use `<Suspense>` boundaries with skeleton fallbacks to stream content as data loads.

### Dual Route Architecture

The app has two parallel route groups for internationalization:

| Path Pattern       | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `/(app)/...`       | Redirect stubs — detect locale and redirect to `/{locale}/...` |
| `/[locale]/(app)/...` | Actual page implementations with localized content |

This allows non-localized URLs (e.g., `/planning`) to work by auto-redirecting to the user's preferred locale (e.g., `/cs/planning`).

---

## Routing & Internationalization

### Locale Routing

- Supported locales: `en`, `cs`, `pl` (configured in `lib/i18n/config.ts`)
- Default locale: `cs`
- Locale is determined from: (1) URL path prefix → (2) user settings → (3) cookie → (4) default
- The **middleware** (`middleware.ts`) reads the locale from the URL path and sets a cookie for server-side access
- `UserSyncProvider` syncs locale and theme changes in real-time via Firestore snapshot listener

### Translation System

Translations are defined as typed TypeScript objects in `lib/i18n/messages/`:

```typescript
// Usage in server components
const messages = getMessages(locale);

// Usage in client components
const messages = useMessages();
```

All translation keys are type-safe — adding a key to `en.ts` requires adding it to `cs.ts` and `pl.ts` as well.

---

## Data Layer

### State Shape

All user data is stored in a single Firestore document per user (`users/{uid}`):

```typescript
type ScheduleState = {
  subjects: Subject[];         // Available school subjects
  subjectGroups: SubjectGroup[]; // Subject groupings for filtering
  weeks: Record<string, WeekSchedule>; // Weekly schedule data keyed by Monday ISO date
  lunches: Record<string, string>;     // Cached lunch data
  deadlines: DeadlineItem[];   // Homework deadlines
  settings: AppSettings;       // User preferences (theme, locale, schoolYear)
};
```

### Read Path

```
Server Component → getUserState(uid) → Firestore Admin SDK → migrateState() → ScheduleState
```

State is automatically migrated/normalized on every read to handle schema evolution.

### Write Path

```
Client Action → Server Action → updateUserState() → Firestore Transaction → migrateState() → Firestore
```

All writes use Firestore transactions with a `lastWriter` field for conflict-aware sync.

---

## Real-Time Sync

Real-time sync across devices uses a dual strategy (in `LogoutButton.tsx`):

1. **Firestore `onSnapshot`** — Primary: listens for document changes via the client-side Firestore SDK
2. **HTTP Polling** — Fallback: polls `/api/state-version` at intervals (4.5s in PWA mode, 12s in browser)
3. **Visibility/Focus Events** — Polls immediately when the tab becomes visible or gains focus

When a remote change is detected from a different `clientId`, the component calls `router.refresh()` to re-render server components with fresh data.

---

## Authentication

1. User clicks "Sign in with Google" → Firebase Auth popup
2. Client obtains an `idToken` and POSTs it to `/api/session`
3. Server creates a session cookie (`eindx_session`) via Firebase Admin SDK
4. All server components read the session cookie via `getSession()` / `requireSession()`
5. Protected routes redirect to `/login` if no valid session

---

## Styling

The project uses a hybrid approach:

- **CSS Modules** — Primary styling method. Component styles are co-located as `*.module.css` files (e.g., `AppShell.module.css`, `BottomNav.module.css`, `Deadlines.module.css`)
- **Vanilla CSS** — Global theming and CSS custom properties defined in `css/globals.css`
- **Tailwind CSS** — Utility classes for spacing, flexbox, and typography helpers
- **CSS Custom Properties** — Theme-aware colors defined in `[data-theme="light"]` and `[data-theme="dark"]`

### Theme Flash Prevention

The theme is persisted as a cookie (`eindx_theme`) so the server can read it during SSR:

1. **Inline script** in root layout reads the cookie and sets `data-theme` on `<html>` before first paint
2. **`getThemeCookie()`** reads the cookie server-side to pass the correct theme to `ThemeRootSync`
3. **`UserSyncProvider`** keeps the theme in sync from Firestore snapshots after hydration
4. **`applyTheme()`** writes the cookie client-side whenever the theme changes, so the next page load is instant

---

## PWA Support

- **Manifest** — Generated at `app/manifest.ts`
- **Service Worker** — Registered via `PwaRegistrar.tsx`, served from `public/sw.js`
- **Offline Fallback** — Static HTML pages in `public/offline-{locale}.html`
- **Firebase Messaging** — Service worker at `public/firebase-messaging-sw.js`

---

## Scripts

| Script          | Command           | Description                    |
| --------------- | ----------------- | ------------------------------ |
| Development     | `npm run dev`     | Start dev server (Turbopack)   |
| Build           | `npm run build`   | Production build               |
| Start           | `npm run start`   | Start production server        |
| Lint            | `npm run lint`    | Run ESLint                     |
