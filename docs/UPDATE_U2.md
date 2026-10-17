# U2: Revision-aware persistence

**Date:** 17 October 2026  
**Status:** Implemented and verified locally; not deployed

## Changes

- Database schema 3 assigns existing library/service records revision 1 and an unpredictable revision token. Existing IDs, lyrics, timestamps, media references and embedded service copies remain unchanged apart from top-level editing metadata.
- Save/delete operations compare the incoming revision and token inside their transaction. Stale edits are rejected with the draft retained; updates cannot silently recreate a deleted record.
- Successful saves advance the revision and renew the token. Restore replaces top-level editing tokens even when numeric revisions coincide, preventing a pre-restore draft from overwriting restored content.
- Backup format 5 declares editing metadata; readers accept versions 1–5. Converters can continue producing their supported legacy formats. Earlier readers reject format 5 rather than silently ignoring its semantics.
- saveSongAndAdd provides a single transaction for the saved master and service copy with a retry-stable item ID. A failed service write rolls back the master write. The combined UI action belongs to the new Prepare flow; the current interface still exposes its existing separate save/add buttons.
- Existing authoring uses revision-aware deletes/saves. Local service changes are queued without bypassing cross-tab conflict checks. Newer lyric edits are not marked clean by completion of an older save. A rejected master draft may be preserved as an independent copy rather than force-overwriting another worker's changes.

## Verification

TypeScript/lint, 43 unit tests, 56 Python converter tests, production build and Pages-subpath PWA checks passed. The complete Chromium suite passed 31 tests, including a real two-tab lyric conflict and copy recovery. Rapid profile editing exposed a local queue issue with legacy test fixtures; it was fixed and the complete browser suite rerun successfully.

Coverage includes schema-1/schema-2 upgrade, two repository clients, stale save/delete, deletion resurrection prevention, same-revision restore invalidation, atomic rollback, repeat-safe successful add, and retained legacy content through fresh restore tokens. No user database was inspected or modified during automated tests.

## Upgrade and remaining checks

Before production deployment, export a backup and close all existing operator/output windows. Test the supported app/service-worker transition on the actual target browser. Old JavaScript must not continue writing a schema-3 database as if it had no editing revisions; the version upgrade closes older Dexie connections. Never clear browser data as an update procedure.

A previous JavaScript deployment is not a safe database downgrade. Preserve the previous deployment artifact and original exported archive, use a compatible current reader/forward repair, and verify any restore choice before release. New physical Safari/Windows upgrade checks and production deployment remain unperformed. Source comparison metadata remains a later authoring increment.
