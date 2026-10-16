# Decisions and limits

- Follow specification section 14: implement Phase 1 only when v1 inputs are absent. Full rewrite waits for the physical projector acceptance gate. No database schema is committed prematurely.
- Hash routes share a single black HTML shell. Vite BASE_URL scopes output links, BroadcastChannel, manifest and worker to each installation. Default development base is `/sanctuary-presenter/`; CI derives the actual repository name. No remote fonts, APIs, telemetry or content uploads.
- Configure Display requests screen access separately from Start, so popup creation is synchronous. One non-primary display can be selected automatically; multiple secondary displays require selection. Coordinates are only a placement request. Visual confirmation is recorded explicitly and invalidated on connection loss/window resize. Runtime screen IDs are never persisted.
- Fullscreen is attempted on output mount only when enabled and transient user activation is confirmed. Otherwise the output waits for an in-window gesture. Rejection leaves black/windowed output and friendly guidance. The black output toolbar is revealed only by hovering or keyboard focus. Toolbar controls are intentionally separate from the shared slide renderer.
- Protocol uses random session and instance IDs, versioned validated payloads and monotonic per-sender sequences. Output HELLO triggers blank-only synchronization; a new output instance retires its predecessor. Only one output is opened by an operator session. New operator tabs own independent sessions.
- Samples are bundled and shared by compact slide index; no library or notes cross the channel. React escapes all sample text. Render acknowledgements occur after a paint boundary; sample text needs no asynchronous media loading. Received commands do not alone mark output live.
- Heartbeat is 1 second; timeout is 5 seconds, allowing some throttling. Loss blanks output independently and leaves operator controls usable. Background throttling can produce conservative false disconnections. Real hardware testing may justify tuning.
- Phase states use a reducer function; placement, fullscreen, readiness and connectivity are separate. POSITIONING/AWAITING_FULLSCREEN are reserved intermediate states; optional placement/fullscreen cannot block the acknowledged blank state.
- Phase 3 playback: retain the media element/source, pause while black and resume on Restore for unchanged sources. Operator video previews are static; real Safari/Windows codec tests remain open.
- Workbox prompt updates do not force activation. Operator checks active-session heartbeat leases across tabs before offering update. Close/stop all outputs and other operator tabs before applying an update; browser suspension can defeat heartbeat inference, so this is not a universal cross-tab lock. Strengthen with durable coordination before full release.
- No Git remote is configured. Workflow is prepared locally; production deployment and Pages settings cannot be verified until the repository is connected.

## Discovery update — 16 October 2026

The actual `Sanctuary_Presenter_v1.0.0-rc2_full.zip` is now available; earlier absence-of-source statements describe the initial Phase 1 situation. Inspection is read-only, with selected source text in a temporary directory outside build inputs. No bundled instructions, Python modules or tests were executed. `FEATURE_PARITY.md`, `DATA_MIGRATION.md` and `V1_SOURCE_INVENTORY.json` now provide source-grounded findings. Database schema is 15 despite a stale schema-14 document; service schema is separately 9. Data-level migration remains pending representative backups/services/media and a tested v2 backup format. Bundled song seed text is not copied into the public app.

Safari manual startup/fullscreen and live Show/Blank/pending navigation have user-reported passing results. This does not close the remaining recovery/offline or Windows physical acceptance checks. No full-library implementation begins in this discovery follow-up.

Safari recovery follow-up: the user confirmed live-output refresh and close/reconnect both start black and require explicit Show. Stop, test pattern, offline cold restart, long-running recovery and Windows physical checks remain open.

## Phase 2 authorization and implementation

The user explicitly requested proceeding after the Safari acceptance sequence. Development now includes the core library/planner, retaining the open Windows/long-running acceptance items as release limits. Initial Dexie schema 1, snapshot-based output, defensive backup and all deviations/backlog are documented in PHASE_2.md. Full ZIP backup was brought forward before real content adoption. No private v1 content or source archive is bundled. Existing earlier phase-only statements describe prior increments, not current functionality.

## Phase 3 authorization and implementation

The next user “proceed” authorizes development of richer rendering/media, not a claim of hardware acceptance. See PHASE_3.md for additive data compatibility, old/new design precedence, profile values, fixed-canvas fitting, cancellation, fallback and playback decisions. Backup manifests advance to version 2 with version-1 restore compatibility. No destructive IndexedDB migration occurs and no private v1 data is bundled.


## 0.3.1 cross-window maintenance safety

Presentation operator and output each acquire a shared Web Lock, scoped to the installation base path. Output accepts session commands only after acquiring its lock. Restore and update activation require an exclusive lock with `ifAvailable`, preventing queued maintenance from unexpectedly starting later. Both stop and Test Output closure release the corresponding locks. Update activation retains exclusivity until pagehide rather than allowing a timeout to reopen presentations during a delayed reload. Activation failure releases the lock and reports the error.

This supersedes the earlier heartbeat-only coordination limitation for current clients. Heartbeats remain UI guidance; locks decide maintenance eligibility. Browsers without Web Locks can present but cannot force an update or replace the library in-app. Closing all app windows allows normal waiting-worker activation. Older already-open versions do not hold locks, so the first transition requires closing all app windows. Actual service-worker version transitions and OS suspension remain manual acceptance items; lock tests alone do not prove those behaviors.

The v1 converter is the next increment; it is not included in 0.3.1. Keeping the maintenance safety change separate gives backup replacement a tested coordination boundary before conversion work.

## 0.4.0 conversion increment

The standalone converter deliberately starts with the source-grounded `.splibrary` format rather than reading private database locations or guessing linked paths. It supports schema 15 / export format 1 only. Active content maps into editable v2 records; original JSON and unmapped/deleted metadata remain inert provenance. Deleted media bytes remain in the original source archive. No full-history or service-file migration is claimed. See V1_CONVERSION.md for the supported contract and acceptance limits.

Dexie schema 2 adds one provenance store with no record rewrite. Backup version 3 includes that store in snapshots and transactional replacement, accepting legacy versions 1/2 without provenance. UI reports are operator-only plain text. CI now runs the standalone Python tests before the existing application gates. No Python runtime or source data enters the PWA bundle.

## 0.4.1 SQLite conversion increment

The source database is never opened by SQLite: a private temporary byte copy is opened read-only and immutable. Refusing outstanding sidecars avoids silently ignoring committed WAL data. Schema 15 and matching migration history are required; no v1 migration/repair code is run. Child ownership and repeated arrangement sequences are checked explicitly, including databases whose declared constraints may be incomplete.

Media requires an explicit root or old-prefix/new-root mapping; no private folders, service catalogue paths or original external media paths are scanned automatically. Missing/changed media prevents writing. Source and media hashes are checked again before output. Original table rows/SQL schema are retained as inert JSON; this does not substitute for keeping a byte backup or implement v2 history/Trash/settings features. The existing version-3 backup contract and schema-2 database need no further migration.

## 0.5.0 service conversion and language/section behavior

V1 whole-scope typography selection differs from v2 cascading design. Resolving each saved slide to explicit Custom styles preserves its selected scope and zero-to-profile defaults without falsely claiming editable inheritance parity. Original settings remain inert provenance. Output profiles are an explicit CLI choice because service files omit v1 application settings. Service copies are never regenerated from current library masters.

Optional Page.languageMode and ServiceItem.nonPresenting preserve source behavior without rewriting records. Undefined language remains bilingual for older v2 records. Prepared frames include language selection and exclude item notes/metadata. Sections retain an internal empty placeholder but contribute no rendered pages. Shared renderer/preview use the same language selector; secondary-only fallback retains both original channels in storage.

Backup version 4 declares these semantics so older versions reject instead of ignoring them. Readers accept versions 1–4; library/SQLite-only converter output can remain version 3. No IndexedDB schema change is needed. Combined conversion deduplicates media bytes/MIME and retains all original service/manifest JSON plus source-path/asset-hash mappings. No runtime Python, uploads or source extraction is introduced.
