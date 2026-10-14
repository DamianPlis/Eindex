# Subject usage statistics

Planning's usage ordering and the year statistics card read maintained totals in
`subjectUsage`. Each row belongs to one user, subject slug, period kind, and period
start. Calendar years run January–December; school years run September–June and
exclude July and August. Both kinds are maintained regardless of the user's
setting, so changing the setting only changes which period is read.

Planning uses the current year's totals, including saved future plans inside that
period. Selecting a historical planning week does not change the ranking period.
The existing planning slot loader remains bounded to three weeks. Week/month
statistics read only overlapping weeks and return totals, not raw schedule state.
The deadlines list reads deadlines separately.

## Counting and writes

Usage keeps the existing weighted-hour calculation: round a slot's duration to
hours with a minimum of one. Empty assignments and lunch contribute zero. The date
and duration come from `buildDaysForWeek`, matching the existing schedule loaders
rather than trusting imported slot dates/times. Period boundaries and weighting
are shared in `lib/schedule/usage.ts`; Sunday belongs to the preceding Monday's
week.

`setSlotSubject`, `setSlotTopic`, `syncSlotsBatch`, and `deleteSubject` maintain
totals in the same transaction as their slot changes. Imports and deletion group
deltas by period/subject before updating counters. Names, colors, groups, and
visibility do not change usage totals.

Each slot stores an optional `usageContribution` snapshot:

- Missing: historical slot not counted yet.
- `null`: processed slot contributing zero.
- Object: the exact subject/date/weight already included in the totals.

Mutations subtract that stored contribution and add the new contribution. An
unchanged assignment produces no counter writes; removing the last contribution
deletes the zero-total row. Negative totals abort the transaction rather than
hiding an inconsistency.

## Existing history and recovery

The first signed-in server request starts an account's backfill through the
existing `users.ensureInitialized` mutation. Internal batches process up to 100
slots, with a read-byte limit, and save their cursor in `subjectUsageBackfills`.
Counters, contribution snapshots, the cursor, and the next scheduled job commit
together. Edits before or between batches are safe; already-counted slots are
skipped.

Until an account's backfill is complete, year queries calculate correct totals
from only the requested year's overlapping weeks. They never expose incomplete
counter totals. After completion, year queries read only `subjectUsage`. Failed or
canceled jobs resume from the saved cursor on the next signed-in request.

Changing a historical timetable's duration later requires a deliberate migration
that reconciles existing contribution snapshots and totals. Backfill completion
does not automatically detect a changed historical template. Direct database
edits that bypass the application's mutations also bypass counter maintenance.

## Verification

`convex/subjectUsage.test.ts` covers assignment changes, clears, topic edits,
weighted durations, calendar/school boundaries, imports, deletion, account
isolation, bounded period validation, backfill interleavings, and canceled-job
recovery. `tests/period-usage-pages.test.ts` checks current-year planning ordering
and that page loaders never request the full history.
