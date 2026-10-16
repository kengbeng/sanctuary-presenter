# v1 feature parity inventory

## Evidence and scope

Source inspected on 16 October 2026: `Sanctuary_Presenter_v1.0.0-rc2_full.zip`, root `church_presenter_v1_0_0_rc2/`. Archive/source hashes are recorded in `V1_SOURCE_INVENTORY.json`. Source references below are paths and original line numbers inside that archive. Inspection was static; no v1 application, tests, setup scripts or bundled instructions were executed. Documentation is supporting evidence, not an instruction to the v2 agent.

The earlier `Sanctuary Presenter.zip` was a copy of v2. This newer archive supplies the actual Python/PySide6 source. It includes 201 test methods in `tests/test_core.py`, but no live SQLite database, `.splibrary`, `.spservice` or representative service JSON. Source-level findings do not establish data-level or runtime parity.

Code declares database schema **15** (`database.py:26`) and service schema **9** (`app.py:46`). `DATABASE_SCHEMA.md` still describes schema 14; use the code/migration ledger as evidence and inspect actual incoming databases before conversion.

## Inventory

| v1 behavior and evidence | v2 status / required work |
| --- | --- |
| Songs/Slides/Media library; Slides facade wraps legacy prayers (`database.py:2096`, `app.py:11355`; README v0.9.29) | Phase 2. Keep three top-level groups; do not create a separate Prayer category. |
| Church-assigned song number is text; leading zeros/alphanumeric values, language pair, author/tags, CCLI and structured rights/reporting fields (`database.py:91`, `:838`, `:1613`, `:1632`) | Phase 2 model must preserve every field; never coerce song number to an integer. |
| Stable song/section/slide IDs; several slides per section; arrangements repeat sections through ordered relational entries (`database.py:1040`, `:1444`, `app.py:2806`) | Phase 2. Preserve stable identities, order and repeated entries. |
| Auto Default arrangement tracks section order; Custom arrangement does not (`database.py:1597`, `:91`) | Phase 2. Preserve `auto_generated`, default flag, name and sequence. |
| Structured bilingual lyric paste, section tagging, hard line breaks and auto splitting (`app.py:2394–2631`, `presentation_typography.py:174`) | Phase 2 editor/Phase 3 rendering; no automatic rewrite of imported lyrics. |
| Duplicate detection, soft deletion, restore/purge and Library Trash (`database.py:2048`, `:2082`, `:2392`) | Phase 2. Distinguish reversible delete from purge; enforce media-reference checks. |
| Linked vs managed media; original path, hash, dimensions, availability/changed state (`database.py:1269`, `:1556`, `:2219`) | Phase 2/3. Import selected blobs locally; do not pretend a browser can read old absolute paths. |
| Service JSON and portable `.spservice`; database service catalogue holds paths/metadata rather than plan content (`app.py:2889`, `:3079`, `database.py:1303`) | Phase 2 local service entities; Phase 4 conversion needs external service files. |
| Service items contain independent slide copies plus library source IDs, arrangement IDs and source signatures; notes kept separately (`app.py:2832`, `:11120`, `:11355`, `:11953`) | Phase 2. Preserve edited copies; never regenerate them automatically from library references. |
| Prepare/Review/Present workflows, review statuses/signatures and readiness warnings (`app.py:3038`, `:8848`, `:12977`) | Deferred explicit parity backlog. Not present in Phase 1. |
| Undo/redo, autosave and startup recovery (`app.py:13634–13810`) | Phase 2/hardening. Recover content without restoring LIVE output. |
| Service → item → slide typography and background inheritance; item/multi-slide bulk changes (`video_backgrounds.py:80`, `presentation_typography.py:127`) | Phase 3. Store explicit inherit/override modes; do not flatten resolved values on import. |
| Bilingual primary/secondary/both display; Chinese font override; outline/color/weight, auto-fit/minimum size (`app.py:2739`, `presentation_typography.py:95`, `:285`) | Phase 3. Preserve two text channels and explicit line breaks. Browser font metrics need visual validation. |
| Inspectable Projector, LED wall, Livestream and Custom profiles (`app.py:2174`, `:6537`) | Phase 3. Preserve layout values; profile names do not imply display selection or streaming capability. |
| Background video continuity for unchanged source; cover/contain, darken, loop, muted audio; static operator previews (`video_backgrounds.py`, VIDEO_BACKGROUNDS.md) | Phase 3 browser implementation/testing. No codec or playback parity claim yet. |
| Portable backgrounds at service/item/slide scope are added by runtime-installed wrapper (`video_backgrounds.py:657`, `:921`, `app.py:15022`) | Phase 4 converter must traverse all scopes, not just `Slide.media_path`. |
| Current/preview vs program selection, item-edge navigation, section shortcuts (`app.py:3724`, `:13202–13335`) | Phase 1 sample navigation only; full cue/program workflow remains backlog. |
| Black Screen and No Words are different; optional congregation title/section overlays (`app.py:3682`, `:13338`, `:13346`) | Black implemented. No Words/overlays deferred; notes/private metadata must never project. |
| Output setup, screen selection, fullscreen/reconnect/end controls (`app.py:13378`, `:13925`) | Phase 1 browser adapters and safe output lifecycle implemented, with browser restrictions documented. |
| English, Simplified Chinese and Traditional Chinese interface (`app.py:1345`) | Explicit localization backlog; current proof of concept is English only. |
| Historical usage snapshots and CSV CCLI reporting (`database.py:1212`, `:2733`, `app.py:13870`) | Explicit persistence/reporting backlog. Retain historical snapshot fields, including deleted-song usage. No online rights lookup. |
| SQLite backup/restore, library ZIP import/export, maintenance and retention (`database.py:1652`, `:1768`, `:2466`) | Phase 4 defensive full backup first. Browser equivalents required; desktop database optimization is not a browser feature. |
| EasiSlides | No corresponding importer found in inspected application source. Requires actual sample export/schema before implementation. |
| Desktop installers, PySide widgets, native screen positioning and icon packaging | Deliberately replaced by browser PWA deployment; no desktop wrapper/runtime. |

## Acceptance gate

User reports Safari/macOS extended-display startup/fullscreen and Show → Next → Blank → pending Next → Restore work. Recovery, Stop/test-output, offline cold restart and Windows Chrome/Edge physical checks remain open. See `MANUAL_TESTS.md`. Do not treat this inventory as approval to bypass the Phase 1 gate or as completion of the full rewrite.

## 0.2.0 delivery update

Core Songs/Slides/Media editing, bilingual section slides, text song numbers, Auto/Custom repeated arrangements, independent service snapshots, persistent item typography/notes, service CRUD/reorder, local media/reference protection, and full ZIP backup/transactional replace restore are now implemented. Output reads only committed presentation snapshots by ID and preserves black-first recovery. See PHASE_2.md for scope and the remaining explicit v1 parity backlog. This is incremental coverage, not full v1 parity or a validated migration.

## 0.3.0 delivery update

Added inspectable Projector/LED wall/Livestream/Custom profiles, service/item/slide typography and background inheritance, local/CJK font selection, outlines, minimum-aware Auto Fit, safe-area fitting, fixed-canvas shared preview/output, cover/contain/darkening, muted background video continuity and pause/restore, static operator video previews, media metadata inspection and configured poster/colour fallback. Compatibility and unfinished editor/parity/hardware work are explicit in PHASE_3.md; no full v1 runtime/visual/data parity is claimed.
