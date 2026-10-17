# U1: Song-integrity foundation

**Date:** 17 October 2026  
**Status:** Implemented and verified locally; not deployed  
**Plan:** [Next updates](NEXT_UPDATES_PLAN.md)

## Delivered

- Added PresentationPage with unique item/occurrence/page runtime identity, original sourcePageId and section/page context. Updated the planner's source-page lookup. Source records and repeated lyrics are not rewritten.
- Canonical new-write validation separates song sections/arrangements from slide-set pages and checks automatic arrangement consistency at the repository boundary.
- Backup versions 1–4 retain previously accepted ambiguous records and return compatibility warnings. The restore UI reports retained legacy issues. Invalid archive structure, missing media, broken references and other prior validation remain rejected.
- An explicit Create editable copy path retains the saved original and its hidden branches. The new copy uses the visible hierarchy, fresh IDs and unchanged custom/repeated order. Contradictory automatic order becomes Custom. Legacy library originals are guarded against editing/saving through the ordinary editor; deletion retains the existing explicit destructive confirmation.
- Existing services may save notes/order while preserving legacy snapshots exactly. A new or changed ambiguous snapshot is rejected rather than silently rewritten. A later source-replacement UI remains separate scope.
- Empty working songs remain saveable. An attempted reveal of a wholly empty selected public page requests black and gives an operator explanation. Visible language selection, public title and intentional media determine this preliminary readiness check; media validity still uses existing repository/renderer checks.

No database-schema, backup-version or protocol-wire change is required. The output still receives an independent prepared-frame ID; occurrence context and private notes are stripped by the existing prepared-frame whitelist. Repository revision tokens and source-baseline metadata remain U2/later work. Existing UI live navigation is unchanged in this foundation update; the confirmed Preview → Take workflow must be implemented together with its UI/keyboard/test changes in the presenter phase.

## Compatibility policy

Never delete a hidden branch or synchronise a contradictory saved auto arrangement during load/restore. Retain and report the original, then allow deliberate recovery into a separate editable record. Creating a copy is not a merge and does not update prepared services. Converter source inspection confirms the library converter already rejects inconsistent auto sequences; existing converter integration fixtures remain accepted. Legacy archive fixtures cover versions 1–4 without pretending those fixtures prove every possible historical archive.

DB-07 is addressed by separating structural storage validation and reveal readiness. Additional identity/count/field bounds are not tightened in this increment because they need a separate legacy compatibility policy. No fabricated data repair, source-baseline inference or automatic service refresh is introduced.

## Files and verification

Implementation: model.ts, repository.ts, backup.ts, Library.tsx and main.tsx. Added song-integrity unit and browser suites. Existing snapshot/media/backup tests remain applicable.

| Check | Result |
| --- | --- |
| TypeScript and ESLint | Passed |
| Vitest, including occurrence/legacy/recovery/readiness fixtures | 37 passed |
| Python converter tests | 56 passed |
| Chromium production-build integration suite | 30 passed |
| GitHub Pages subpath build and PWA validation | Passed |
| New Safari/second-display physical rehearsal | Not run |
| New production deployment or production smoke | Not run; changes remain local |

Browser cases include deliberate legacy-copy recovery with hidden source text retained, empty-song black output, repeated bilingual songs, converter restores, output reload/reconnect, fullscreen fallback, media cancellation, offline output and maintenance locks. Existing browser tests refreshed the library-preview image; that image is test evidence, not a redesigned interface mockup.

## Confirmed follow-on decisions

The user confirmed Preview first with explicit Take, and staged edits with explicit Apply. Core UI specification 1.8 records these decisions and the Apply contract. No active-service editing lock is introduced here. Next implementation stage is U2 revision-aware persistence and atomic save/add, followed by the runnable workflow prototype and new workspaces.
