# Sanctuary Presenter v2 — Codex Project Specification

**Status:** Implementation baseline / requirements specification  
**Target:** PWA-only rewrite of Sanctuary Presenter v1 (Python/PySide6)  
**Platforms:** Windows 11 Chrome or Edge; macOS Safari  
**Deployment:** Static HTTPS hosting (GitHub Pages or Cloudflare Pages); installable PWA  
**Architecture:** Local-first, offline-capable, no mandatory server, no desktop wrapper

## 1. Instructions to Codex

Build Sanctuary Presenter v2 as a maintainable, production-quality, browser-based church presentation application. This specification is the baseline, but **do not invent details of existing v1 behaviour**. If the v1 repository, SQLite schema, screenshots, assets, or sample data are available, inspect them first and create a feature-parity inventory. Record any ambiguity in `docs/DECISIONS.md` and ask for clarification on choices that would materially affect data compatibility or live presentation safety.

Work incrementally, keeping the application runnable after each phase. Do not claim cross-browser features are verified without running or documenting appropriate tests. Prioritise live-service reliability over animation or visual novelty. Avoid adding a backend, authentication, cloud sync, Electron, Tauri, or Python runtime without explicit approval.

For each implementation phase: (1) describe scope and files changed, (2) implement, (3) run available tests/build/lint, (4) report results and remaining browser/manual checks, (5) document any trade-offs. Do not silently omit functionality from v1.

## 2. Product goals and non-goals

### Goals
- Prepare and operate church worship services from a single local-first PWA.
- Manage songs, arrangements, slides, images, video backgrounds, and service orders.
- Present to a congregation/projector in a separate output window while the operator retains full controls.
- Support reliable offline operation after first successful installation/cache and local asset preparation.
- Preserve user content through import/export, backup, and restore.
- Support Chrome/Edge on Windows and Safari on macOS with explicit feature detection and graceful degradation.
- Migrate existing Sanctuary Presenter v1 data, subject to actual schema and asset inspection.

### Non-goals for initial release
- Cloud accounts, multi-user real-time collaboration, cloud sync, remote control from another device, streaming, mobile live-service operation, or desktop wrappers.
- Guarantees that a browser can identify/position all external monitors or enter fullscreen without a user gesture.
- Automatic retrieval of scripture texts or copyrighted lyrics from online sources.

## 3. Functional scope

### 3.1 Content Library
- Three primary content groups: **Songs**, **Slides**, **Media**. Scripture, prayer, announcements, sermons, and custom material use the common Slides framework, not separate top-level categories.
- Songs: title, optional personally assigned index number, language, authors/copyright/source where present, lyrics, sections (verse/chorus/bridge/etc.), arrangements, search, sorting, editing, duplication, deletion with confirmation.
- Slides: reusable slide sets, multiple slides per item, editable text and formatting, background and layout settings, optional notes.
- Media: imported images and video, metadata, thumbnails where supported, supported-format feedback, reuse across content.
- Preserve references so deletion of shared media cannot silently break presentations; provide warnings and reference checks.
- EasiSlides import is a desired capability; implement only after examining actual export/database samples. Never assume its schema.

### 3.2 Service Planner
- Create, rename, duplicate, reorder, save, and delete service orders.
- Add songs, slide sets, and media-backed items from the library; support item-level overrides without inadvertently modifying the source library.
- Song arrangement and section ordering, individual slide navigation, and per-item typography/layout overrides.
- Selected item editor with appropriate space for slide selection and a compact Design panel; avoid excessive button/panel space.
- Notes must be visually distinct from slide content and not leak into congregation output.
- Changes to item-level typography and settings must persist correctly across selection changes and restarts.

### 3.3 Presentation Engine
- Render 16:9 congregation slides consistently at arbitrary projector resolutions, with scalable text and image/video backgrounds.
- Shared deterministic slide rendering for operator preview and congregation output, with operator-only overlays kept separate.
- Support typography, alignment, line spacing, margins/safe areas, colour, backgrounds, and output profiles/presets. Preset values must be inspectable and understandable.
- Background video: local playback, muted looping by default, format validation, preloading, fallback poster/background, and graceful error handling. Do not assume identical codec support across browsers.
- Operator: current slide, next-slide preview, service order navigation, slide selection, blank/show, stop presentation, keyboard controls when focused, and clear output status.
- Never render operator notes, hidden controls, or library metadata to congregation output.

## 4. Output Setup — mandatory detailed specification

### 4.1 Defaults and invariants
- Positioning mode: `automatic` with **manual fallback always available**.
- Preferred target: secondary display, when confidently identifiable.
- Request fullscreen: enabled, but success must be observed rather than assumed.
- **Every new or recovered output session starts with a completely black screen**. No previously selected content is automatically revealed.
- Revealing content requires an explicit operator **Show** action.
- The current/pending slide may change while output is blank; it remains invisible until Show/Restore.
- Never make presentation startup dependent on internet access.
- Never declare output ready merely because a window was opened; require an output-side acknowledgement.

### 4.2 User interface
`Output Setup` panel/dialog:
- Display positioning: Automatic (default) / Manual.
- Preferred display selector populated only from actual runtime-discovered screens; do not show fabricated screen names.
- Manual fallback instructions and access even after auto selection succeeds.
- Request fullscreen toggle (default on).
- Start blank shown as an enforced behaviour for v2 (not an option to disable).
- Test Output; Start Presentation; output status; Reposition Output; Enter Fullscreen guidance; Reconnect Output; Stop Presentation.
- 16:9 black output preview with a **preview-only** label or icon outside the actual congregation frame.
- Status distinguishes: window connected, correct screen placement confirmed/unknown, fullscreen active/inactive, blank/live, media ready/error. Do not conflate these dimensions.

### 4.3 Browser adapter design
Define an `OutputDisplayAdapter` interface and implementations:
- `ChromiumDisplayAdapter`: feature-detect `window.getScreenDetails` / Window Management API and browser permissions where available; enumerate screens only when permission is granted; attempt to choose a non-primary screen; place an output window with browser-permitted coordinates and dimensions. Never rely on display IDs remaining stable between sessions.
- `ManualDisplayAdapter`: open a separate output window using a direct user gesture; instruct operator to move it to the projector and use an in-window fullscreen button. Use this on Safari and whenever Chromium automatic mode is unavailable, denied, blocked, or unsuccessful.
- Do not UA-sniff as the primary detection method; detect capabilities, then apply platform-specific guidance as needed.
- Multiple secondary screens: require operator selection; do not silently choose arbitrarily.
- If only one screen is detected: explain the limitation and offer primary-screen/windowed operation or manual positioning.

### 4.4 Popup, permission, and user-activation constraints
- Open `window.open()` synchronously from a user click wherever possible. Avoid awaiting permission requests before opening unless a separate explicit **Configure Display** gesture is used.
- Initial output HTML/CSS must be black before any async loading, hydration, or content retrieval. Include a black `body` and root background in the output route.
- If a permission prompt or asynchronous work consumes user activation, do not presume `requestFullscreen()` can succeed afterward. Provide an **Enter Fullscreen** button inside the output window, requiring a fresh gesture.
- For Chromium, a two-step **Configure Display** then **Start Presentation** workflow is acceptable when permission has not yet been granted.
- Fullscreen and macOS Spaces behaviour must be validated on real systems; do not promise seamless automatic fullscreen on Safari.
- If popup blocked: show retry instructions and a button with a new user gesture.
- If fullscreen rejected: continue in windowed mode, show status and guidance, never auto-show content.

### 4.5 State model
Use a reducer/state machine with named states:
`IDLE`, `OPENING`, `POSITIONING`, `AWAITING_FULLSCREEN`, `READY_BLANK`, `LIVE`, `BLANKED`, `DISCONNECTED`, `STOPPED`.

Model placement and fullscreen as orthogonal status fields where necessary; do not pretend these linear states alone encode all conditions. Valid transitions must be tested. Startup and reconnect may only reach blank output until explicit Show. On disconnect, the operator remains usable and must see a warning.

### 4.6 Two-window communication
- Operator route: `/app` (or equivalent). Congregation route: `/output` (minimal UI, black background, no navigation chrome within page).
- Same-origin `BroadcastChannel` for commands and status; optionally direct `postMessage` for initial handshake. Do not rely on BroadcastChannel for cross-device control.
- Every session has an unpredictable `sessionId`; commands have monotonically increasing sequence numbers and a protocol version. Reject wrong-session, stale, and malformed messages.
- Message types: `HELLO`, `READY`, `HEARTBEAT`, `SYNC_STATE`, `SHOW_SLIDE`, `SET_BLANK`, `OUTPUT_STATUS`, `MEDIA_STATUS`, `STOP_PRESENTATION`, `ERROR`.
- Commands are idempotent or safely deduplicated; acknowledgements distinguish **received** from **rendered/ready**.
- On reconnection or output reload, initialize black and require explicit Show; never replay an old LIVE state automatically.
- Use heartbeat (initial suggestion: 1 s) and timeout (initial suggestion: 4 s), configurable internally after real-world testing; account for browser throttling and false positives.
- Output window loads slide data/media from same-origin local storage; send compact state/IDs, not full library on every slide change. Ensure IndexedDB transaction visibility and media readiness before reporting rendered.
- Handle multiple output windows deliberately: only one active output per session; identify and quarantine stale windows.

### 4.7 Blank semantics
- `READY_BLANK`: initial blank; no slide revealed yet.
- `BLANKED`: a previously visible slide was intentionally hidden.
- Black is rendered independently of slide media loading and overlays; no flash of old content during route load, reflow, reconnect, or fullscreen transition.
- `Show` reveals the current pending slide only after it is ready or provides an explicit error/fallback. `Blank` takes effect immediately even when video is loading.
- Video may be paused while blank; choose and document playback/resume semantics, including loop restart vs resume, after browser testing.

### 4.8 Test Output
- Opens the real congregation output window using the same placement/fullscreen logic as Start Presentation.
- Starts black; may show a test pattern only after a deliberate **Show Test Pattern** action.
- Test pattern should identify output target and safe-area boundaries, and support returning to black instantly.
- Test mode cannot leak the currently selected service slide.
- Closing test output returns to the prior non-live state without altering service order or content.

### 4.9 Recovery
- If output window closes or heartbeat fails, show `DISCONNECTED`; offer **Reconnect Output**.
- Replacement window always starts black, even if previous output was LIVE.
- If projector disconnects, browser may not expose a reliable hardware event; use available events/heartbeat, mark physical display placement as unverified when appropriate, and provide operator instructions.
- Browser reload of operator must not automatically open windows or expose slides.
- Stop Presentation sends stop, blanks output immediately where possible, then closes/ends session; failure to close a browser window must not reveal content.

## 5. Storage and offline architecture
- Use IndexedDB via Dexie for structured entities (songs, sections, arrangements, slides, service orders, settings, media metadata, references).
- Store media blobs in IndexedDB initially for portability; evaluate OPFS for large media only after confirming Safari support and backup behaviour. Hide storage differences behind a repository interface.
- Request persistent storage where supported and show storage-usage warnings; do not promise that browser-managed data cannot be cleared.
- Service worker with Workbox precaches the application shell and essential assets. Avoid caching imported media redundantly in Cache Storage; store local media explicitly in the media repository.
- Static hosting must support deep links to `/output` via suitable routing (hash routing or static-host fallback) and a correct scope/base path for GitHub Pages deployments.
- Offline validation must include cold restart after initial installation, with network disabled and required media already imported.
- Updates may download while idle but must not activate/reload during an active presentation. Show **Update available** after presentation ends and require a safe user action.
- No telemetry or upload of user content by default.

## 6. Backup, restore, and migration
- Full export to a versioned ZIP archive containing manifest, structured JSON, and referenced media. Include checksums, schema version, export timestamp, and content counts.
- Restore validates archive structure, limits and sizes, checksums, schema compatibility, and references before writing. Offer replace vs merge only with well-defined conflict handling; initial release may implement replace-with-confirmation first.
- Protect against ZIP traversal, decompression bombs, malformed metadata, duplicate identifiers, and partial restore. Use transactional/staged import where feasible.
- Provide export/import of individual songs or service orders only after full backup works.
- v1 migration: inspect actual SQLite schema and media paths; write a standalone conversion tool if needed (outside runtime PWA), produce versioned JSON/ZIP accepted by v2. Verify counts and samples. Preserve originals; never mutate source database.
- EasiSlides migration requires representative export/database and rights-aware import mapping.

## 7. Data model (conceptual; refine after v1 inspection)
- `Song { id, indexNumber?, title, language?, metadata, sections[], arrangementIds[], createdAt, updatedAt }`
- `SongSection { id, songId, label, content, order }`
- `Arrangement { id, songId, name, orderedSectionIds[], overrides }`
- `SlideSet { id, title, slides[], metadata, notes? }`
- `Slide { id, slideSetId, contentBlocks[], style, mediaRefs[], order }`
- `MediaAsset { id, kind, mimeType, size, hash, storageKey, metadata }`
- `ServiceOrder { id, title, date?, items[], createdAt, updatedAt }`
- `ServiceItem { id, contentRef, itemType, arrangementRef?, overrides, notes?, order }`
- `OutputProfile { id, name, aspectRatio, typography, layout, backgroundDefaults }`
- `AppSettings { schemaVersion, output, editor, library }`

Use stable IDs, explicit schema migrations, referential integrity checks, and no direct persistence of transient output-window state as LIVE.

## 8. Recommended technical stack
- React, TypeScript (strict mode), Vite.
- React Router or an equivalent simple route strategy compatible with static hosting.
- Dexie for IndexedDB.
- Workbox (e.g., vite-plugin-pwa) for installability/offline updates.
- CSS variables/design tokens and reusable components; avoid unnecessary UI libraries unless justified.
- BroadcastChannel for same-origin operator/output synchronisation.
- JSZip or comparable maintained ZIP library for backups with defensive validation.
- Vitest + React Testing Library for unit/component tests; Playwright for Chromium integration tests. Safari/macOS needs manual physical-display testing; WebKit automation is helpful but not a substitute for real Safari/Spaces/projector tests.

## 9. UI/UX principles
- Professional, restrained dark operator interface with readable hierarchy and consistent Songs/Slides/Media layouts.
- Preserve familiar v1 workflows where useful, but simplify cluttered controls and large panels.
- Resizable panels; responsive operator layout at laptop sizes; slide selector must remain usable on macOS.
- Selected slide preview uses available width; notes and settings do not dominate the editor.
- Settings opens a dialog directly, not a redundant dropdown.
- Output status is always visible while presenting. High-contrast Blank and Show actions must be unambiguous.
- Accessibility: keyboard focus, labels, contrast, confirmation for destructive actions, clear error text.

## 10. Security and privacy
- Content remains local to the browser unless the operator explicitly exports a file.
- No remote asset dependency at runtime once installed/offline.
- Sanitize imported text/HTML; do not render untrusted markup unsafely. Restrict local file parsing to documented formats.
- Do not include secrets in the frontend bundle. Use HTTPS for hosted deployment.
- Apply conservative Content Security Policy compatible with required media and PWA behaviour.

## 11. Delivery phases and gates

### Phase 0 — Discovery and parity inventory
Inspect v1 repository, UI/screenshots, SQLite schema, media conventions, output profiles, existing bugs. Produce `docs/FEATURE_PARITY.md`, `docs/DATA_MIGRATION.md`, `docs/DECISIONS.md`. Identify open questions before irreversible schema decisions.

### Phase 1 — Dual-window proof of concept (highest priority)
Implement app/output routes, black-first output, manual window placement, automatic placement where supported, fullscreen fallback, BroadcastChannel handshake, Blank/Show, current/next sample slide, status/heartbeat/reconnect, Test Output. Use sample content. **Gate:** pass browser and physical-projector acceptance tests before full application rewrite.

### Phase 2 — Core library and service planning
IndexedDB schema, Songs/Slides/Media, search, editing, service orders, arrangements, persistence and referential checks.

### Phase 3 — Full rendering and media
Slide editor, typography, profiles, images/video, operator previews, preloading and fallback behaviour.

### Phase 4 — Offline and data portability
PWA manifest/service worker, safe update handling, backup/restore, storage warnings, v1 import.

### Phase 5 — Hardening and release
Regression tests, performance, recovery, cross-browser tests, accessibility, deployment documentation, versioned release notes.

## 12. Acceptance criteria
1. Chrome and Edge on Windows: with screen-management permission, app attempts external-screen selection; if denied/unsupported, manual positioning works.
2. Safari on macOS: output opens separately and can be manually moved to extended display; fullscreen is requested only with valid user activation or via an in-window control.
3. Every start, refresh, reconnect and recovery opens with a black congregation output and **never** auto-reveals a slide.
4. Show, Blank, Restore, slide navigation and Stop work with operator controls; notes never appear on output.
5. Operator displays accurate connection, fullscreen, blank/live and media readiness status.
6. If fullscreen fails, presentation remains usable in windowed mode without revealing content.
7. Output receives no stale commands from previous sessions; sequence and session checks are tested.
8. After initial install and asset import, service can run with internet disconnected.
9. Local data survives normal application restart; full ZIP backup restores content and media on a clean profile.
10. Browser storage deletion is documented as a risk; backup is prominently accessible.
11. Video background behaviour is tested per supported browser and unsupported formats produce actionable feedback.
12. v1 migration is validated against supplied representative data, including arrangements and referenced media.
13. Automated tests and production build pass; physical dual-display tests are documented separately with pass/fail evidence.

## 13. Explicit browser and operating-system caveats
- Window Management API availability is browser/version/permission dependent; use runtime detection.
- Popup creation and fullscreen often require fresh user activation. Do not promise one-click automatic fullscreen in all environments.
- Safari on macOS may handle fullscreen through separate Spaces; test real hardware and allow windowed/manual fallback.
- Browser APIs cannot guarantee knowledge of physical projector connection or which screen the audience can see.
- PWA browser storage may be evicted or cleared; persistence requests and backup mitigate but cannot eliminate this risk.
- Video codecs, hardware acceleration and autoplay restrictions differ by browser.

## 14. First Codex task (copy into Codex after adding this file)

> Read `Sanctuary_Presenter_v2_Codex_Specification.md` in full. Begin with Phase 0 if the existing Sanctuary Presenter v1 repository or database is available; otherwise document assumptions and implement **Phase 1 only** as a runnable PWA proof of concept. Use React, TypeScript, Vite, and a minimal maintainable architecture. Implement black-first output, manual positioning, capability-detected automatic positioning, user-gesture-safe fullscreen fallback, BroadcastChannel synchronisation, Blank/Show, output status and reconnect. Do not build the full content library yet. Include README setup instructions, automated tests where possible, and a manual test checklist for Windows Chrome/Edge and macOS Safari with an extended display. Run build/tests and report what is verified versus what requires physical browser testing.

## 16. GitHub Pages deployment (mandatory)

GitHub Pages is the primary production hosting target. Cloudflare Pages may be supported later, but the application must be deployable to a GitHub repository project site without a server, runtime API, or paid service. The deployment URL is `https://<owner>.github.io/<repository>/` by default. Support an optional custom domain and an owner-site deployment (`https://<owner>.github.io/`) through build-time configuration.

### 16.1 Build and routing
- Use Vite and a configurable `VITE_BASE_PATH` or equivalent. Default to `/<repository>/` for project Pages, `/` for custom domains or owner sites. Use `base` consistently for bundles, media bundled with the application, icons, manifest, service-worker registration, and all navigation URLs.
- Use hash-based routing for operator routes and the congregation output route (`#/output`) so direct loads and refreshes work without a server rewrite. Avoid absolute root-relative asset paths that break under a project subpath.
- Generate a valid manifest with `name`, `short_name`, `id`, `start_url`, `scope`, `display: standalone`, theme/background colours, and 192px/512px icons (including suitable maskable assets). Derive `start_url` and `scope` from the configured base.
- Use `vite-plugin-pwa` with Workbox, or equivalent, and ensure the service worker is scoped to the repository path. Precache versioned app-shell assets only. Do not precache user-imported songs, media, databases, or ZIP archives. Never upload user data as part of the build.
- Ensure the output window URL is derived from the current deployment base and works both on GitHub Pages and localhost. All inter-window messages must use the same origin, scoped to the same installation and session.

### 16.2 Continuous deployment
- Add `.github/workflows/deploy.yml` using the official GitHub Pages Actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) and supported current Node LTS. Pin action major versions to current supported releases at implementation time.
- Trigger deployment on push to `main` and permit manual `workflow_dispatch`. Configure minimal permissions (`contents: read`, `pages: write`, `id-token: write`), `concurrency` to prevent overlapping deployments, and the `github-pages` environment with deployment URL output.
- CI must run dependency installation using lockfile, TypeScript typecheck, lint, unit tests, production build, and asset-path/PWA validation before deployment. Fail deployment on build or test errors.
- Document repository Settings → Pages → Build and deployment → Source: GitHub Actions. Document repository-name changes and custom-domain base-path changes.
- No production API keys, private content libraries, copyrighted media, or example personal data in the public repository or compiled `dist` directory.

### 16.3 Offline, updates and data protection
- First visit requires connectivity; offline launch is supported only after successful app-shell caching. Clearly show offline readiness and test it on Chrome, Edge and Safari.
- User libraries remain exclusively in local browser storage (IndexedDB/OPFS as supported), isolated per browser profile, origin and storage partition. GitHub Pages does not sync content between devices or browsers.
- Provide backup/restore of all songs, slides, service orders, settings and imported media. Prompt for backup before potentially destructive schema migrations; warn users that clearing site data or changing origin/domain can remove access to the existing library.
- Detect service-worker updates but never force `skipWaiting`, reload or activate a disruptive update during a presentation. Offer explicit application of a downloaded update when presentation has ended. Validate cross-tab coordination and rollback/recovery guidance.
- Support the deployed site being loaded and operated without external CDN requests, remote fonts, analytics, third-party APIs, or runtime network calls.

### 16.4 Security and content handling
- Use HTTPS and secure browser contexts; feature-detect display management and fullscreen APIs. Document browser permissions and fallback.
- Treat imported song metadata, slide HTML-like text, and archive contents as untrusted. Escape rendered text, validate MIME/types, archive paths and sizes, and avoid unsafe HTML execution. Avoid dynamic external resource URLs in presentation slides unless explicitly permitted.
- Public deployment is not a public content-sharing service: no automatic upload, sync, collection, or publishing of locally imported church content.

### 16.5 Deployment acceptance criteria
1. Fresh clone builds locally using documented commands and deploys via GitHub Actions to a repository Pages URL.
2. Root app, hash-routed output window, scripts, styles, icons, manifest and service worker all load correctly under `/<repository>/`.
3. PWA can be installed where browser support allows; Chrome/Edge Windows and Safari macOS are tested and any installation differences documented.
4. Following an online first load, operator and congregation windows open and work offline, using only previously stored local content/media.
5. Start Presentation opens blank output, uses automatic display selection where supported, falls back to manual positioning, and offers fullscreen with user-gesture fallback.
6. New deployment becomes detectable but does not interrupt an active presentation; activation is operator-controlled after presentation.
7. Library data is not transmitted to GitHub or a backend; backup/restore works and content persists across ordinary page reloads and app updates.
8. Directly opening or refreshing `#/output` never exposes a previously live slide; it starts blank and requires a valid session handshake.
9. No broken root-relative paths, uncaught browser API errors, or missing offline assets on the configured Pages subpath.
10. README documents deployment, local development, offline limitations, browser-specific fullscreen behaviour, backup practices and troubleshooting.

### 16.6 Suggested project scripts
- `npm run dev` — local development
- `npm run typecheck` — TypeScript verification
- `npm run lint` — static checks
- `npm test` — unit tests
- `npm run build` — production build
- `npm run preview` — local production preview

### 16.7 Codex implementation instruction
Treat GitHub Pages compatibility as a first-class acceptance criterion starting in Phase 1. Implement and test the correct base path, hash routing, output window URL, manifest scope and service-worker scope before adding the full content library. Create the deployment workflow early and maintain a working deployed preview throughout the project.
