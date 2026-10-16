# Phase 2 core library and planner — 0.2.0

## Scope and architecture

The user explicitly requested proceeding after Safari manual startup, live controls, refresh/reconnect, Stop, test-pattern and offline cold-restart checks. Remaining Windows/physical-display, long-running and update-coordination acceptance work is still open; this increment is not a cross-platform release certification.

- `model.ts`: stable IDs, bilingual section slides, explicit Auto/Custom arrangements, text song numbers, rights metadata, service snapshots and validated basic design.
- `repository.ts`: Dexie schema 1 with content, media blobs, service orders, settings and transient prepared frames; transaction boundaries and media reference checks. Nested section/slide/arrangement records retain stable IDs; repository validation enforces ownership and order.
- `Library.tsx`: common Songs/Slides/Media library, search/title or number sort, song/slide editing/duplication/confirmed deletion, section and slide ordering, arrangement editing, media import/rename/reference-safe deletion, service create/rename/duplicate/reorder/delete, detached service-copy editing, operator notes and persistent per-item design.
- `SlideFrame.tsx`: shared plain-text/bilingual renderer, local image/video baseline, explicit media preparation and rendering readiness. No operator notes or source metadata are rendered.
- `main.tsx` and `protocol.ts`: load a saved service without revealing content; committed render snapshots are addressed by random ID, keeping whole libraries and notes out of commands. Blank cancels pending preparation; errors leave output black. Sample rehearsal remains available on clean profiles.
- `backup.ts`: full local version-1 ZIP export, staged validation and transactional replace restore, brought forward from Phase 4 to protect newly stored user content.

## Editing and persistence

Library masters use explicit Save. Switching master records asks before discarding changes; browser unload warns on dirty library edits. Switching Present/Library workspaces preserves the draft in memory. Service-copy edits save locally, with a saved/error status; service title commits on blur or Present this service. Present this service loads the saved snapshot into the operator and blanks output. Later library edits never regenerate existing service copies.

Repeated arrangement occurrences intentionally share the same section content within a service snapshot. Editing that section changes its repeated occurrences, while preserving their order. Adding a library item is disabled until its master is saved. Clearing an item design override returns to each slide's stored design.

Media is explicit local blob storage. Imports allow raster formats and MP4/WebM/MOV MIME types, up to 200 MB each; video MIME support is checked and actual decoding is checked before output reveal. Linked desktop paths and remote asset URLs are unsupported. Referenced assets cannot be deleted while used by a library master, service copy or prepared output. Prepared frames are omitted from backup and cleared for stopped/replaced sessions.

## Backup/restore contract

Export contains `manifest.json`, `data.json` and numbered `media/*.bin` entries. Manifest includes format/schema version, timestamp, entity counts and SHA-256 digests. A consistent Dexie read transaction snapshots all persistent tables. ZIP uses STORE to avoid producing high-compression archives that exceed conservative import-ratio checks. Limits: 256 MB archive, 200 MB per media file, 16 MB structured JSON, 1 MB manifest, 10,000 ZIP entries, 512 MB declared expanded total. Export may reject libraries exceeding these limits; keep original source files and separate backups. Large-library streaming/OPFS is future work.

Import inspects the central directory before decompression, rejects unsafe/duplicate paths, links, encryption, multipart/unsupported structures and declared size/ratio violations. Bounded decompression streams prevent forged sizes bypassing per-entry caps. Every data/media digest, entity identity, hierarchy and media reference is validated before confirmation or writes. Only replace-with-confirmation is offered. All table clearing/insertion runs in one IndexedDB transaction; failure rolls back. Restore is disabled during detected active presentations and checks eligibility again before writing. Close other tabs before restore; suspended-tab coordination remains a hardening item. No runtime LIVE state or prepared output is restored.

Export/restore covers all persistent data in this increment. v1 history/trash/migration metadata is not imported yet and therefore is not claimed in this backup format. Unknown later schemas are rejected.

## Deliberate limits / parity backlog

- No v1 SQLite, `.splibrary`, `.spservice` or EasiSlides importer yet. Conversion still needs representative user data and the mapping documented in DATA_MIGRATION.md.
- Advanced service/item/slide background inheritance, profile presets, CJK font selection, outlines, Auto Fit and faithful Qt visual parity remain Phase 3.
- Image/video slides have a baseline contained-media renderer. Muted video loops; blank unmounts playback and Restore starts again. Continuous shared background playback, video posters and physical Safari/Windows codec tests are not claimed.
- No Words, congregation overlays, section-only planner items, review/readiness workflow, undo/redo, trash recovery, CCLI usage history/reports and interface localization remain explicit parity backlog. Current destructive actions require confirmation and recommend exporting a backup.
- No automatic schema upgrades beyond initial schema 1. Future destructive changes must first require a backup.
- Multiple browser tabs can edit concurrently; repository transactions protect integrity, but collaborative conflict handling is not implemented. Use one operator tab for preparation and close other tabs before restore/update.

## Verification

See VERIFICATION.md for final counts and browser evidence. Unit tests exercise persistence/reopen, repeated bilingual sections, service independence, media references, clean output snapshots, full backup including blobs, malformed/tampered/traversal/duplicate archives, and rollback. Chromium tests exercise end-to-end editing/persistence, output privacy, clean-profile restore and imported-image output after an offline reload. Real Safari validation of the new editing/storage/media workflows remains required before live-service adoption.
