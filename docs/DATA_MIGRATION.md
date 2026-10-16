# v1 → v2 migration plan

## Inspected source

`Sanctuary_Presenter_v1.0.0-rc2_full.zip` was read without executing application code. Code versions: SQLite schema 15 (`database.py:26`), service schema 9 (`app.py:46`), library archive format 1 (`database.py:2466`). Bundled `DATABASE_SCHEMA.md` is stale at schema 14. No actual user database, service/package exports or media library were bundled, so conversion counts and representative rendering cannot yet be validated.

## Source locations and acquisition

v1 declares `~/.sanctuary_presenter/library.db`, managed `media/`, database `backups/`, `settings.json` and `autosave_v0_4.json` (`database.py:22–25`, `app.py:43–45`). Services live in separately saved JSON or `.spservice` files; `service_catalog` only indexes them. Linked media may live anywhere. No private home-directory data has been inspected automatically.

For validation, obtain a v1-created database backup or a consistent copy made with v1 closed, a representative service JSON/`.spservice`, a `.splibrary` export including media, and settings if profile migration is wanted. A standalone SQLite copy made while v1 is writing may omit WAL state; prefer its verified backup/export. Preserve originals. Do not seed any personal/copyrighted content into the public repository or build output.

## Mapping requirements

| Source | Planned v2 mapping / preservation rule |
| --- | --- |
| `songs` | Song identity; `song_no` → text index number; retain language pair, tags, author, rights, reporting flag, timestamps and trash state. |
| `song_sections`, `song_slides` | Stable section and slide IDs; ordered multi-slide sections with primary and secondary text. Keep both channels, including intentionally empty secondary text. |
| `arrangements`, `arrangement_entries` | Arrangement IDs/name/default/Auto-vs-Custom; ordered section references including repeats. Never deduplicate repeated choruses. Validate section ownership. |
| `prayers`, `prayer_slides` | Common Slides/SlideSet entities. Preserve legacy source IDs and ordered bilingual text. Reusable slide IDs may need deterministic namespaced IDs because the v1 facade does not export them. |
| `media_assets` | MediaAsset + local Blob storage; preserve legacy ID/path/hash/type/metadata/trash state. Resolve selected files explicitly and verify hashes. Missing media remains an explicit warning, not a successful import. |
| `song_usage` | Historical usage records with title/author/copyright/CCLI/arrangement/service snapshots. Preserve records whose song is now missing/deleted. Do not recompute snapshots from current song metadata. |
| `service_catalog` | Rebuild links to successfully imported service entities; preserve legacy path provenance. Catalogue rows alone cannot reconstruct plans. |
| ServicePlan schema 9 | Service identity/date/title/languages/items, service-level settings and metadata. Preserve section-only/non-presenting items and item order. |
| ServiceItem/Slide snapshots | Keep independent content and style overrides, notes, source IDs and review data. A library song reference is not sufficient to reconstruct service edits. |
| `settings.json` | Whitelist portable preferences/output profile values. Exclude window geometry, desktop absolute paths, screen identity and transient LIVE state from active settings. Unknown keys can be retained as inert migration provenance. |
| `library_settings`, `app_seed_catalog`, `schema_migrations` | Keep source provenance where useful; do not apply desktop migration ledgers, seed installers or database maintenance actions in the browser. |

Background and typography inheritance must remain explicit at service/item/slide levels. Current source includes full `Slide` and `ServiceItem` data definitions (`app.py:2739`, `:2832`) and runtime wrappers (`app.py:15022–15025`); inspecting only the base file's portable exporter would miss background media.

## Supported source archive shapes to implement later

- `.splibrary`: `library.json` with `format: sanctuary-presenter-library`, `format_version: 1`, `database_schema`, songs, slides, legacy prayers and media (`database.py:2466`). `slides` and `prayers` duplicate the same reusable content for compatibility; use `slides` when valid, otherwise `prayers`, never concatenate them. Media records point to `archive_member`. This library export does not include complete services, settings or historical usage; it is not a complete v2 backup.
- `.spservice`: `service.json`, `manifest.json`, `media/`. Base exporter collects foreground media (`app.py:3079`); installed background wrapper additionally collects background videos at all three scopes (`video_backgrounds.py:657`). Manifest missing entries must remain visible as missing, not silently dropped.
- Raw SQLite: standalone converter opens supplied backup read-only, checks actual tables/columns, schema version, foreign keys and integrity. Preserve every row not explicitly mapped in inert provenance until supported. Do not run v1's mutating `initialise()` against source data.

## Implementation and validation sequence

1. Complete Phase 1 physical gate; acquire representative data. Decide unresolved compatibility questions before schema lock-in.
2. Design the Dexie model to support the fields above and a versioned full-backup format. Create synthetic bilingual/repeated-arrangement fixtures with no private lyrics.
3. Implement transactional/staged v2 full backup and replace-with-confirmation restore before per-item or legacy imports.
4. Build a standalone read-only converter outside the PWA runtime. Emit only the validated v2 format plus migration report; no Python dependency in the installed app.
5. Validate archive names, duplicate members/IDs, symlinks, traversal, expanded/per-file/total sizes, supported versions, metadata, checksums and reference ownership before writing. Treat all input text as plain text.
6. Verify counts for songs/sections/slides/arrangements/entries/repeated occurrences/reusable slides/services/items/media/usage/trash; compare hashes and representative bilingual layout, local service edits and inheritance. Report missing or changed media and all unmapped fields.
7. Restore onto a clean browser profile, restart offline, confirm all sessions start black and originals retain their hashes. Keep export/rollback recovery documented.

## Open compatibility decisions

- Migration scope: complete history and Trash versus active library only. Default proposal is to preserve all source data, not silently discard it; final behavior must be agreed before importing user data.
- Review signatures are algorithm-specific; preserve their source values but mark imported items as needing review instead of claiming unchanged readiness without verification.
- Optional congregation title/section overlays versus the v2 prohibition on leaking library metadata: any future projection needs explicit presentation-content settings, with private fields excluded.
- Exact Qt font/Auto Fit parity is not guaranteed by copying numeric values. Browser renderer needs visual fixture comparison, especially bilingual/CJK typography.
- EasiSlides still requires a representative export; the supplied v1 source provides no verified importer schema.

No converter or migration support is claimed as implemented at this stage.

## 0.2.0 format available

The initial version-1 v2 backup format is now implemented for content/media/services/settings stored by this increment, with clean-profile restore and defensive validation tests. See PHASE_2.md for its exact limits. The standalone v1 converter is still not implemented; real database/service/media samples, history/trash preservation and the source mapping above must be validated before migration is offered.

## 0.3.0 design contract

The current additive model now supports inspected profile values, explicit service/item/slide design inheritance, media/poster references and legacy 0.2 precedence without mutating stored records. New exports use backup manifest version 2; current restore retains version-1 compatibility. These are v2 implementation checks, not proof that v1 Qt font metrics, all historical source fields or real user data have migrated. A converter remains pending.

## 0.4.0 standalone library-export converter

The earlier converter-pending statements describe previous increments. `tools/convert_v1.py` now supports format-1/schema-15 `.splibrary` only. See V1_CONVERSION.md for exact scope, strict refusal behavior, original-JSON retention and deleted-media limitations. Backup version 3 retains conversion provenance; versions 1/2 remain restorable. Dexie schema 2 adds provenance without rewriting existing content. Full SQLite, service-file, usage/history/Trash UI parity and representative user-data validation remain pending.

## 0.4.1 SQLite conversion

Explicit schema-15 SQLite backup conversion is now available through `--database`, with media limited to explicitly supplied roots or prefix maps. It reads a temporary immutable copy, refuses outstanding WAL/journal state, validates schema/integrity/ownership and verifies source/media hashes before writing. Complete table rows and schema SQL remain inert provenance, including archive-only usage, Trash, catalogue and settings. Only active library content/media becomes editable. See V1_CONVERSION.md for Python requirements, commands and exact limitations. Service-file conversion and representative user-data acceptance remain pending.

## 0.5.0 service conversion

Schema-9 JSON and `.spservice` conversion now supports repeatable inputs, alone or combined with one v1 library/database. Saved snapshots remain independent from masters; notes stay operator-only, sections do not project, and language selection/fallback is retained. Effective typography/background scopes become explicit per-slide designs; original inheritance definitions remain in provenance. Service-containing archives use backup version 4 to prevent older readers ignoring new language/section fields. See V1_CONVERSION.md for exact scope, commands, profile choice and replacement/merge limitations. Representative real-data and physical/browser acceptance remain open.
