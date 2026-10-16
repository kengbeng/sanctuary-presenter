# v1 library, SQLite and service conversion — 0.5.0

`tools/convert_v1.py` is a standalone Python 3 standard-library tool. Python is not part of the runtime PWA. The tool performs no network requests, imports no v1 application code, extracts no source archives and reads no private application folders. Supply an explicit `.splibrary` and a new output filename:

```sh
python3 tools/convert_v1.py --library /path/to/export.splibrary --output /path/to/new-v2-backup.zip
```

## Supported input and mapping

Supports `sanctuary-presenter-library` format 1 with database schema 15, as emitted by the inspected v1.0.0-rc2 `database.py:2466`. Unknown versions are rejected. This format is a library export, not a complete v1 backup. SQLite database support is described below. Schema-9 service conversion is described below.

- Active Songs become library Songs with original content/section/page/arrangement IDs. Text catalogue numbers, bilingual hard line breaks, metadata, rights/reporting flags and ordered repeated section occurrences survive. Missing reusable page IDs receive deterministic UUIDs. The converter rejects ambiguous case-insensitive section labels, duplicate IDs, missing section references, inconsistent Auto sequences and invalid default arrangements.
- Reusable Slides use `slides` when it is an array; otherwise `prayers`. These aliases are never concatenated. Invalid entries are rejected rather than skipped.
- Active packaged media is copied as local bytes with supported MIME metadata and verified SHA-256 when the source supplies a hash. Available width/height/duration values are retained. Linked media absent from the export causes refusal; no external paths are followed and no placeholders conceal missing assets. Browser decoding and codec support still require rehearsal.
- The complete original `library.json` is retained as inert JSON in a migration record, including source fields not exposed by v2. Deleted content is excluded from the active library and retained in that original JSON. Deleted media metadata is retained there; deleted media **bytes are not copied** into the v2 backup. Keep the original `.splibrary` to preserve them.
- No service, usage-history or settings records are invented. Those are not supplied by a v1 library export. Source review signatures are retained only as original data; imported material requires review.

## Safety and output

Checks ZIP names, duplicate members, symlinks, encryption, entry/expanded/total sizes, unreferenced packaged media, JSON duplicate keys/nonfinite values, versions, identifiers and arrangement ownership. Input limit 256 MB; expanded total 512 MB; media file 200 MB; structured data 16 MB, including retained source JSON. Output uses stored ZIP entries and v2 checksums. Large libraries may exceed these limits after retaining the original JSON; conversion refuses them.

The source is hashed before conversion and checked again before writing. Output uses exclusive creation and cannot overwrite an existing file or symlink. Failed input validation writes no output. Conversion and v2 restore have independent validation; v2 does not trust a converter-generated archive merely because its extension is ZIP.

Backup manifest version 3 adds migration records. Current app exports use version 4 for language selection and non-presenting sections; versions 1, 2 and 3 remain accepted. Library/SQLite-only converter output remains version 3. Dexie schema 2 adds only the provenance table; existing content is neither rewritten nor cleared during the schema upgrade. Full backup snapshots and replacement transactions include provenance. The operator can inspect a plain-text report and download original JSON; it is never executed or projected.

## Restore and acceptance

Export the existing v2 library first. Stop all output sessions. Restore the converted ZIP through Library & planner and confirm replacement. A clean browser profile is preferable for rehearsal. Check song/slide/media counts, repeated choruses, number strings, bilingual text and target-display readability. Start output black and reveal deliberately. Test actual media codecs and an offline restart.

Synthetic tests demonstrate conversion, production-UI restore, arrangement/bilingual/media mapping, clean-profile backup roundtrip and retained provenance. They do not establish migration acceptance against a real user library. Representative user `.splibrary`, SQLite backups, services and associated media remain required for that acceptance. No actual user migration or GitHub deployment is claimed.


## SQLite schema-15 backup input (0.4.1)

Requires Python 3.11 or newer with SQLite. Use an explicit, consistent backup from a closed v1 application. The converter refuses nonempty `-wal` or `-journal` sidecars; it does not checkpoint or repair the source. A closed WAL-mode database without outstanding sidecars is supported.

```sh
python3 tools/convert_v1.py --database "/path/to/library.db" --media-root "/path/to/media" --output "/path/to/new-v2-backup.zip"
```

`--media-root` resolves relative paths beneath that directory. Absolute stored paths must already resolve inside it. To move a media folder or read Windows paths on macOS, explicitly map the original prefix to the copied directory:

```sh
python3 tools/convert_v1.py --database "/path/to/library.db" --path-map "C:/old/media=/path/to/copied-media" --output "/path/to/new-v2-backup.zip"
```

Path maps can be repeated; the longest matching prefix wins. Prefix comparison is case-sensitive. Backslashes in stored Windows paths are normalized. Traversal and symlinks escaping the authorized root are refused. The tool never guesses by filename, downloads content, follows original media paths outside these roots, or opens service-catalogue paths. Missing/changed/unsupported active media prevents output. Deleted media records do not require resolving their files, and their bytes are not copied.

The source database is read as bytes and copied into a temporary directory. Only that copy is opened by SQLite, using read-only immutable mode, query-only mode and untrusted-schema restrictions. The tool checks user version and migration history (both must be 15), expected tables/columns, quick integrity, declared foreign keys and explicit parent/position/arrangement ownership. Unknown tables and virtual tables require review rather than silent omission. Existing extra columns are retained in the inert snapshot. A query instruction budget, 100,000-row limit, structured-data limit and the existing ZIP/media limits bound processing. The source and resolved media are rehashed before creating output; validation failures leave no output. Temporary copied databases are cleaned up.

Active Songs and reusable Slides map as in the library-export conversion. SQLite song/section/slide/arrangement IDs remain stable. Integer legacy prayer-slide IDs become deterministic namespaced UUIDs incorporating their owner and original ID. Original IDs remain visible in the retained table rows.

Every table row, including usage snapshots for missing songs, deleted records, service catalogue entries, library settings, seed state and migration history, is retained in `originalJson` as a `sanctuary-presenter-sqlite-snapshot`. SQL schema definitions are retained as inert strings; BLOB cells use `{ "$sqlite_blob_base64": "..." }`. Resolution paths/hashes are included. This is an inspectable JSON snapshot, not a byte-for-byte SQLite backup and not a replacement for keeping the original database and folders.

Only active library content and media become editable v2 records. History, deleted records, settings and service catalogue entries remain archive-only. They do not gain v2 history/Trash/settings/service UI behavior. The operator report lists source row counts and these limitations. Use **Download retained v1 data** to inspect the JSON. Neither that data nor its SQL is executed or projected.

No actual user database has been supplied or migrated. Synthetic tests and production-browser restore/output checks establish the implementation path, not acceptance of the user's library.


## Service JSON and portable service input (0.5.0)

Supports service schema 9 only. Supply one or more `--service` paths. Each input may be plain service JSON or a `.spservice` ZIP with `service.json`, `manifest.json` and packaged media. The manifest must declare schema 9 and mark its media copied; missing assets cause refusal. ZIP paths, duplicate entries, links, encryption and size limits are checked before reading. Nothing is extracted or executed.

```sh
python3 tools/convert_v1.py --service "/path/to/sunday.spservice" --output "/path/to/services-v2.zip"
python3 tools/convert_v1.py --library "/path/to/library.splibrary" --service "/path/to/sunday.spservice" --service "/path/to/evening.spservice" --output "/path/to/combined-v2.zip"
python3 tools/convert_v1.py --database "/path/to/library.db" --media-root "/path/to/media" --service "/path/to/sunday.json" --output "/path/to/combined-v2.zip"
```

Plain JSON media uses the same explicit `--media-root` / repeatable `--path-map` rules as database conversion. Paths are relative to the supplied root, never implicitly to the input file's folder. Portable package references are resolved strictly inside the ZIP; original manifest source paths are retained but never followed. All saved foreground/video-background references are copied, including overrides not currently effective. Packaged unused supported media is retained. Duplicate media bytes/MIME pairs share one v2 media asset. Combined database/library input and service media share this deduplication. Missing/unsupported assets, ambiguous versions, duplicate service/item identifiers and invalid designs are refused without writing the destination. Sources and external media are rechecked before final output.

Service order/item IDs and item ordering remain unchanged. Each item's saved slides become an independent Slides snapshot with deterministic page IDs. Current library masters never regenerate those slides, even when source IDs/signatures are present. Original service JSON, package manifest and path-to-v2-asset hash mapping are retained in provenance. Metadata, church/language details and v1 review signatures not represented by active v2 fields remain inspectable there. The service date, title and operator notes are mapped to v2. Slide labels are retained in original JSON; they are not turned into projected headings.

Section items remain in the planner as **Section heading · not projected** and contribute no output frames. Internally they have an empty placeholder page so the existing snapshot model remains valid, plus a non-presenting flag. The placeholder is hidden from the slide editor. Empty presenting items and section items unexpectedly containing slides are refused. Imported section headings are visible in the planner; the current operator navigation remains a list of projected slides.

Projected language is editable per slide: primary only, both, or secondary with primary fallback when secondary is empty. Both original text channels remain stored. Existing v2 slides without this field retain bilingual behavior. Media slides do not project their stored text fields. Notes, source metadata, section names and item titles are never copied into projected headings.

V1 picks the first **whole** Custom typography scope (slide, item, then service), while v2 supports cascading fields. Conversion resolves the effective v1 scope and background for each slide into explicit Custom slide designs; it does not claim to preserve editable inheritance chains. Original scope definitions remain in retained JSON. To use v2 service/item inheritance after conversion, review the design then switch the relevant slide to Inherit. This is particularly relevant when later changing the service output profile or master background.

Choose `--profile Projector` (default), `--profile "LED wall"` or `--profile Livestream` for service conversion. V1 output profile selection lives in external application settings and is not contained in service files. A zero font size maps to that profile's preferred/minimum values. Local font names, supported colours, line spacing, weights, outline settings, video fit/darken/loop and the four inspected themes are mapped. Unknown themes or unsupported values are refused. Qt font metrics, theme effects, exact visual fit, browser codecs and projector readability still require rehearsal. Background video source IDs remain shared across slides that reference the same asset.

Service-containing converter archives and all current app exports use backup **version 4**. Older v2 releases reject version 4 rather than silently losing language or section behavior. Current v2 accepts versions 1–4. The IndexedDB schema remains 2 because the new fields are optional and existing records retain their behavior.

Restore replaces the whole local library. A service-only converted archive contains no library masters; do not restore it over your working library without an external backup. Prefer combining your v1 library/database and services in one conversion or rehearsing in a clean browser profile. Combining with an existing v2 backup or merging into an existing browser library is not implemented.

Synthetic Python and production-browser tests cover service/library independence, repeatable inputs, media deduplication, section exclusion, language fallback, notes exclusion, image output, saved service reload and black-first startup. No actual user service or portable package has been converted. Target-browser media/layout and representative data acceptance remain pending.
