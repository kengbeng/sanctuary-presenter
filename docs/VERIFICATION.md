# Verification — 16 October 2026

## Scope

Phase 0 discovery documentation and Phase 1 sample-only PWA proof of concept. No v1 source was supplied. No full library, user-media, backup/restore or migration functionality is claimed.

## Passed locally

- Clean `npm ci` using committed npm lockfile; dependency audit: 0 known vulnerabilities at verification time. A transitive glob deprecation notice remains; macOS optional fsevents install script was not required for production build/tests.
- Strict TypeScript typecheck and ESLint.
- Vitest: 4 tests, covering malformed/wrong-session protocol payloads, stale/duplicate sequences, safe state transitions, startup/recovery blank and stop across named states.
- Vite production build and asset/PWA validation for both `/` and `/sanctuary-presenter/`: script/style paths, existing icons, manifest id/start_url/scope and service worker prompt-update generation.
- Playwright Chromium 156 (headless, macOS host), 5 integration tests:
  1. Blank startup, output acknowledgement, Show, navigation, Blank, Restore, output refresh, disconnect, blank reconnect and Stop. No captured output-page runtime errors.
  2. Cached app reload with network disabled; offline output popup, deliberate test pattern, content isolation, Blank and test-window close recovery.
  3. Direct output URL remains black; simulated popup blocking produces actionable disconnected status.
  4. Simulated multiple secondary screens require operator selection; selected-screen session starts blank.
  5. Replaced output is blanked/quarantined; wrong-session messages cannot reveal it; blank plus pending navigation remains black.
- Operator screenshot inspected at 1280px width (`operator-preview.png`).

## User-reported physical checks

On 16 October 2026, the user confirmed the five guided Safari/macOS extended-display startup steps: Manual output opens, starts completely black, can be moved to the second display, enters fullscreen using the in-window control, and leaves the operator accessible. Browser/OS versions were not supplied. The user subsequently confirmed Show → Next → Blank → pending Next → Restore, including invisibility while blank and revealing the pending slide on Restore. The user also confirmed that output refresh while live and close/reconnect recover to black and require Show. These are user-reported results; remaining physical tests stay open.

## Not verified / gate still open

- Real Windows 11 Chrome/Edge display permissions, physical placement, hardware hotplug, fullscreen and extended-projector operation.
- Remaining real macOS Safari recovery, live controls, offline cold restart, installed app behavior and codecs. Manual startup/fullscreen was user-reported as passing above.
- Full browser/process cold restart without network (automated offline test reloads within a browser context).
- Real service-worker version update during multiple active tabs, suspension and rollback; coordination limits are documented in DECISIONS.md.
- Live GitHub Actions execution and deployed GitHub Pages URL. No Git remote is configured. Actions workflow and repository setup instructions are prepared.
- Future-phase library persistence, backup/restore, rich media and migration acceptance.

Run MANUAL_TESTS.md on the target systems before Phase 2 or live service use. Results must record actual pass/fail evidence rather than treating automation or capability detection as hardware proof.

## Workflow versions

Official action release pages checked at implementation: [checkout v7](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node v7](https://github.com/actions/setup-node/releases/tag/v7.1.0), [configure-pages v6](https://github.com/actions/configure-pages/releases/tag/v6.0.0), [upload-pages-artifact v5](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), [deploy-pages v5](https://github.com/actions/deploy-pages/releases/tag/v5.0.1). Workflow pins these major versions and uses Node 24 LTS.

## v1 discovery follow-up

The correct v1.0.0-rc2 archive was supplied after the initial Phase 1 build. Static ZIP/source/AST inspection establishes database schema 15, service schema 9, library export format 1, and 201 test methods in `tests/test_core.py`. No bundled user database or service archive was present. Source hashes and inventory are in `V1_SOURCE_INVENTORY.json`; parity and migration documents have been replaced with source-grounded findings. v1 tests were not executed. Only documentation/inventory changed in this follow-up, so application tests/build were not repeated.

## Safari acceptance and fullscreen correction

User-reported Stop, black-first Test Output/explicit test pattern/Blank, and Safari cold restart with Wi-Fi disabled passed. A raw fullscreen activation TypeError appeared on presentation startup. The application now checks `navigator.userActivation.isActive` before any mount-time request and defaults to the in-window button when activation is absent/unknown. Rejected user-triggered requests display friendly guidance. Real Safari retest of this correction remains pending. Long-running and Windows physical checks remain open.

Fullscreen fix validation: typecheck, ESLint, 4 unit tests, production build/PWA path checks and all 7 Chromium integration tests pass. New browser regressions verify no automatic request without activation, explicit button invocation, and friendly rejection while remaining black. Initial regression mocks were corrected to attach before HTML creation; final results are passing. Safari confirmation of the fix remains pending.

## Safari cached-build diagnosis and update verification

The user reported the raw TypeError persisted. Direct inspection found the localhost server serving the corrected `index-CVsqzUo5.js` build while Safari's existing output still displayed the old raw error. Safari's operator showed a downloaded update with Apply disabled during the active output session. The agent stopped that test session, waited for active-session leases to expire, applied the waiting update through the app's own control, and started a fresh output. Safari then displayed `Connected · Click Enter Fullscreen in this window to enable fullscreen.` with no projected slide or raw TypeError. This directly verifies the corrected startup guidance in real Safari. No site data/cache was cleared and no application code changed in this diagnosis. Fullscreen entry itself and long-running/display checks retain their existing separate acceptance scope.

## 0.2.0 local library/planner verification

Implemented the next authorized increment: Dexie schema 1, local Songs/Slides/Media and service planner, stable bilingual section slides/repeated arrangements, independent editable service snapshots/notes/item design, media reference protection, compact prepared-frame output, local full ZIP backup and validated transactional replacement. Phase scope, limits, files and parity backlog are in PHASE_2.md. Windows/long-running checks remain open; the earlier Safari results cover the prior output engine, not all new editor/media functionality.

Passed strict TypeScript, ESLint, **11 Vitest tests** and **9 Chromium integration tests**. New repository tests verify reopen persistence, preserved repeated bilingual sections and text numbers, source/service independence, media deletion protection, notes-free prepared frames, ZIP roundtrip including media blobs, checksum tampering, unsafe traversal, duplicate IDs and rollback after a deliberately failed table replacement. Browser tests verify end-to-end song/arrangement/service editing, notes/design persistence after reload, source independence, no notes on congregation output, clean-profile full restore, local image preparation/readiness and deletion protection, persisted service/image output following an offline page reload, and invalid restore leaving stored media intact. All seven prior output/fullscreen/offline regressions pass. A library screenshot was inspected at 1280px width; real Safari editing, ZIP export/restore and video codec checks are still pending.

Tests caught field-label ambiguity and reload-before-save-completion in the new editor flow; labels and save-status checks were corrected. Final results above are passing. Video baseline code has not been verified using representative videos or real Windows/Safari hardware, and no migration test against user data is claimed.

## 0.3.0 rendering/media verification — 16 October 2026

Implemented the authorized Phase 3 increment described in PHASE_3.md: copied/inspectable output profiles, service/item/slide design inheritance, local/CJK typography, outlines/safe margins/Auto Fit, fixed 1920×1080 shared rendering, scoped image/video backgrounds and posters, actual media metadata inspection, cancellation, retained-source pause/restore, and version-2 backup compatibility. No destructive database migration occurs; existing records retain legacy design behavior where modes are absent.

Passed strict TypeScript, ESLint, **17 Vitest tests**, production build and asset/manifest/worker validation at both `/` and `/sanctuary-presenter/`. **16 Chromium integration tests** pass, comprising all prior library/output/offline cases plus: identical fitted font values in preview/output and after viewport resize; minimum-size overflow remaining black; a locally generated VP8/WebM imported through the real UI with 160×90 metadata, same-element background continuity, pause while black and resume on Restore; corrupt-video colour fallback without notes; profile inspection/custom persistence/factory preservation; cancelling in-flight image preparation; and corrupt-video fallback to a prepared local poster. Unit additions verify inheritance/legacy precedence, media ownership/reference checks, profile/background ZIP roundtrip and version-1 backup acceptance. Normal interrupted play promises are ignored rather than mislabeled as codec failures.

An operator screenshot (`design-preview.png`) was inspected at 1280px width. This demonstrates shared fitting, not projector readability approval. No actual user video/lyrics were embedded in tests or production; the synthetic WebM is generated inside the test browser and not shipped as an app dependency.

Real Safari/Windows media codec matrices, local CJK font rendering, new library/backup acceptance, physical output resolutions, long-running resource use and service-worker multi-tab/suspension hardening remain unverified. v1 conversion still needs representative backups/service/media inputs. No live GitHub Pages deployment is claimed without a configured remote and Actions run.


## 0.3.1 maintenance coordination — 16 October 2026

Passed strict TypeScript, ESLint, 22 unit tests and 17 Chromium integration tests. Five new unit tests cover multiple shared leases, exclusive maintenance rejection, presentation rejection during maintenance, cancelled asynchronous acquisition, unsupported-browser fallback, and update exclusivity through pagehide (some cases share one test). The additional browser case uses the native Web Locks API across actual operator/output windows, verifies maintenance denial during presentation, and verifies release after Test Output closure and Stop. Existing library, ZIP restore, media, black-first output, fullscreen and offline cases pass.

No actual browser/OS suspension or real two-version service-worker transition was exercised. These remain manual release checks. No v1 converter or data migration is delivered in this safety increment; actual user-data migration remains pending.

## 0.4.0 library-export conversion — 16 October 2026

Implemented the standalone format-1/schema-15 `.splibrary` converter, provenance-preserving backup version 3, additive Dexie schema 2 and operator conversion reports. Scope and limitations are in V1_CONVERSION.md. No real v1 user database, library, service or media was converted.

Passed 13 Python tests covering preserved source hashes, stable identifiers, repeated section occurrences, bilingual hard breaks, alias deduplication/fallback, packaged-media hashes, provenance, deterministic missing page IDs, output overwrite refusal, unknown versions, missing/changed media, duplicate labels/IDs/ZIP members, missing arrangement references, inconsistent Auto arrangements, traversal/symlinks and nonfinite JSON. Passed 25 application unit tests, including schema-1 upgrade without content rewrites, provenance backup/replacement, malformed report refusal and version-1/2 compatibility.

Typecheck, ESLint, production builds and PWA path validation pass at `/` and `/sanctuary-presenter/`. The production-browser migration test restores Python-generated output through the real UI, checks bilingual text and text catalogue number, three projected occurrences from repeated arrangements, local media listing, then exports and restores in a clean browser profile and downloads retained original JSON. Full browser suite: 18 tests. A pre-existing image-cancellation test exposed a 500 ms timing assumption under additional parallel load; it now explicitly holds and releases image loading before checking that Blank prevents late reveal.

Real user-library acceptance, Safari conversion/backup rehearsal, full SQLite and service-file migration, OS suspension and actual worker-version transition remain open. GitHub Actions includes Python conversion tests but has not run on GitHub because no remote is configured.

## 0.4.1 SQLite conversion — 16 October 2026

Added explicit schema-15 SQLite backup input to the standalone converter. It opens only a temporary immutable copy, checks migration history/columns/integrity/ownership, resolves media through explicit roots or prefix maps and rechecks source/media hashes before writing. Full table rows and schema definitions remain inert provenance; only active library content/media becomes editable. Source files and media remain unchanged. Service-file conversion remains pending.

Passed **34 Python tests** (13 existing library-export cases plus 21 SQLite cases), **25 application unit tests**, strict TypeScript and ESLint. SQLite cases cover stable song/section/page/arrangement identities, repeated bilingual sequences, deterministic legacy prayer-slide IDs, source/media nonmutation, complete archive-only history/deleted/settings/catalogue rows, BLOB preservation, Windows prefix mapping, relative media roots, root/symlink/traversal restrictions, missing/changed media, sidecar rejection, closed WAL-mode input, mismatched versions/history, missing columns/unknown tables, parent/position/section ownership, changes during conversion and output overwrite refusal. Synthetic test databases use the inspected schema columns; bundled v1 code is not imported or executed.

Both production builds and PWA asset/manifest/worker checks pass at `/` and `/sanctuary-presenter/`. **19 Chromium integration tests pass**. The additional SQLite test invokes the converter, restores through the production UI, verifies the text catalogue number and repeated projected count, downloads the retained history/table snapshot, and starts black before explicitly revealing bilingual output. Historical title text does not appear in output. Existing library export, backup, media, output safety, fullscreen, cancellation, locking and offline regressions pass.

No actual user database or service/media collection has been supplied for data-level acceptance. Safari/Windows physical and media acceptance, service-file conversion, active history/Trash feature parity and real worker-version/suspension checks remain pending. No live GitHub deployment is claimed.

## 0.5.0 service conversion — 16 October 2026

Added schema-9 JSON/portable-service input, repeatable services and combination with one library/database. Saved service snapshots remain independent, sections are non-presenting, notes stay operator-only and per-slide language selection/fallback survives. Original service/manifest JSON and path/asset hashes remain provenance. Effective v1 whole-scope styles/backgrounds become explicit slide designs; editable inheritance parity and Qt layout parity are not claimed. New optional fields do not rewrite existing database records; version-4 backups prevent older apps from ignoring their semantics. Versions 1–3 remain readable.

Passed **56 Python tests** (34 prior cases plus 22 service cases), **27 application unit tests**, strict TypeScript and ESLint. Service cases cover packaged/plain JSON input, explicit media roots, library/database combinations, independent edited text, media deduplication, repeatable services, stable IDs, original hashes, sections, notes, language modes, whole-scope/profile fallback, video-background reference/inheritance mapping, unknown schemas/themes, invalid typography/fonts, invalid/duplicate/empty items, missing media/manifest status, duplicate/traversal ZIP entries, output overwrite refusal and source changes during conversion. Synthetic video bytes used in the Python reference-mapping test are not a playable codec fixture; browser playback remains covered separately by the existing generated-WebM test. The shared synthetic PNG fixture was corrected to contain a valid IDAT checksum before testing projected image output.

Passed production builds and asset/manifest/worker checks for both `/` and `/sanctuary-presenter/`. **20 Chromium integration tests pass**, including all previous output/fullscreen/offline/media/locking/migration cases. The new portable-service test converts a library plus package, restores through the UI, verifies library/service text independence and section exclusion, then projects bilingual text, secondary-only text without primary leakage, primary fallback, and a local image without stored media text. Private notes/item/section titles do not appear on output. Reload/restart starts black. A missing accessible label on the new language selector was found and corrected during this test.

Current implementation acceptance remains synthetic. Actual user database/library/services/media, Safari/Windows physical and media checks, long-running behavior and true multi-version worker/suspension scenarios remain pending. No live GitHub Pages deployment is claimed without a configured remote and Actions run.

## Initial GitHub Pages publication — 16 October 2026

Created the public repository https://github.com/kengbeng/sanctuary-presenter and pushed initial commit `64925cf2de7da51e643c29a95878cda84803c0ed` on `main`. Enabled repository Actions and selected GitHub Actions as the Pages source. The first workflow run passed both build and deployment: https://github.com/kengbeng/sanctuary-presenter/actions/runs/38919472587. CI ran the lockfile install, typecheck, lint, 56 Python tests, 27 application unit tests, production build/PWA validation and 20 Chromium integration tests before uploading/deploying the Pages artifact.

Production URL: https://kengbeng.github.io/sanctuary-presenter/ . A clean Chromium context tested the actual HTTPS deployment using `node scripts/smoke-deployed.mjs`: HTTP 200 at the repository subpath, manifest scope/start path, cached app shell, network-disabled page reload, output opening offline and black, explicit Show, immediate Blank, Stop and no page errors, third-party app requests or write requests. This is an automated offline reload, not an OS/browser cold restart or physical projector acceptance. The visible in-app browser also loaded the hosted app and showed its offline-ready status.

Git's normal HTTPS/SSH authentication was absent on this machine. Initial setup used a temporary repository-scoped write deploy key after user-completed GitHub access verification. Actions deployment itself uses the workflow's built-in token and does not need that key. Future local pushes require the user's ordinary GitHub Git authentication. Repository `origin` is HTTPS and local `main` tracks `origin/main`.

This supersedes earlier no-remote/no-live-deployment limitations. User-library storage remains local to the browser profile and origin; the hosted app has its own storage context, separate from localhost. Physical Safari/Windows acceptance, real media readability/codec rehearsal and actual multi-version/suspension behavior remain open.

## 0.6.0 presenter UX fixes — 16 October 2026

Resolved the six findings in UX_REVIEW.md. B/Escape now blank from focused buttons; native editable fields/selects/dialogs, composing input and modifier shortcuts are protected. A persistent control strip keeps output state, navigation, Show/Blank/Stop visible while content panes scroll independently. Raw phase codes and the static black illustration are replaced with plain-language output state and live/pending labels. Setup collapses after connection, recovery is contextual, and Start cannot replace an active session. Direct saved-service selection blanks first; first-service creation opens the planner without unmounting library drafts. Empty/end-of-service states no longer display misleading sample/next frames. Service title saves now provide feedback.

Passed strict TypeScript, ESLint, 27 application unit tests, 56 converter tests, root/subpath production build and PWA checks, and **28 Chromium integration tests**. Eight new UX checks verify B/Escape after normal focused-button interactions, uppercase B, modifier/native editing protection, control bounds at 1280×720, 1440×900, 1024×768 and 640×480, collapsed/contextual controls, live/pending/end labels, first-service creation and empty service selection, 100-slide scrolling and a live service switch remaining black until explicit Show. Existing black-first/recovery, fullscreen, offline, locking, migration, design, media/fallback and cancellation checks pass. Preview screenshots were regenerated and the operator layout inspected at laptop size.

The initial regression run caught warning-message selectors affected by moving the notice and absent service-title save feedback; both were corrected before the passing full run. Local preview retains the repository subpath. These checks do not substitute for physical Safari/Windows/projector rehearsal.

## 17 October 2026: U1 song-integrity foundation

See [U1 implementation and evidence](UPDATE_U1.md). Local checks passed: strict types/lint, 37 unit tests, 56 converter tests, 30 Chromium integration tests and repository-subpath build/PWA validation. New tests cover occurrence identity, legacy preservation/recovery, supported archive-version reads and empty-song black output. No schema/backup/protocol version change; no deployment or new physical-display validation. Preview → Take and staged Apply are confirmed follow-on requirements, not claimed implemented by this increment.


## 17 October 2026: U4 Services/Prepare foundation

See [U4 scope and evidence](UPDATE_U4.md). The default root now opens Services and supports real atomic song creation and saved preparation. Full Chromium suite: 39 passed; the final draft-guard/compact-layout changes were followed by four passing affected preparation tests. Strict types, lint, unit suite (43), production build and Pages PWA/subpath validation passed. Old operator/planner regressions use the explicit #/app compatibility route; new workflow tests cover the default root. Real Preview → Take/staged Apply remains U5 work. No deployment or new physical-display/participant acceptance is claimed.

## 17 October 2026: U5 real Preview → Take presenter

See [U5 implementation and limitations](UPDATE_U5.md). The new root presenter separates Preview, Take and staged Apply, uses acknowledged live frames and dual output buffers, pins session assets, supports repeated and omitted song sections, and moves display configuration into a focused dialog. The installed-app manifest now launches Services. The #/app compatibility route retains its former behavior.

Final local checks passed: strict TypeScript, ESLint, **49 unit tests**, **56 Python converter tests**, **46 Chromium integration tests**, and production build/PWA validation at both `/` and `/sanctuary-presenter/`. The restored local dist uses the repository subpath. Vite reports a non-failing main-chunk size advisory (approximately 549 kB before gzip); no build errors occurred.

Six new presenter tests cover a real saved service, Preview without reveal, explicit Take, live-preserving Apply, new-version Take, repeated Blank acknowledgement, output reload, global Blank outside Present, offline output startup, hidden live setup controls with explicit operator access, repeated-chorus selection, two-page omitted Bridge/resumption, composite keyboard focus, and essential-control reachability at 1280×720, 1024×768 and 640×480. A new modern-renderer variant delays image loading, requests Blank, releases the image and verifies that it cannot reveal later. Unit additions cover temporary paths, cancellation-message validation, stale transactional pin replacement, private-field exclusion and pin protection for arranged and omitted-section media after source deletion. Existing converter, migration, backup, rendering, fullscreen, locking and old-workflow tests remain passing.

The updated release smoke script passed against the local subpath: manifest scope, cached shell, offline reload, output startup black, explicit Take, Blank, End and no page errors, third-party app requests or write requests. This is local evidence, not a new production deployment. Screenshot: [real presenter](presenter-preview.png).

Physical Safari/second-display rehearsal, projector readability, 200% browser zoom, screen readers, sustained media sessions, participant review and production publication remain outstanding. No new live-service acceptance is claimed.

## 17 October 2026: U6.1 song search

See [search implementation](UPDATE_U6_SEARCH.md). Passed strict TypeScript, ESLint, **54 unit tests**, production build/repository-subpath PWA validation and the complete **47-test Chromium suite**. Seven affected Library/Prepare/search cases also passed before the final full run. The converter implementation was unchanged; its last 56-test pass remains U5 evidence. New coverage verifies normalized all-term search, accents/punctuation/whitespace, string song numbers, both lyric channels, exact language/tag filters, matching original-language excerpts, long Unicode excerpt offsets, independent duplicate saves and a synthetic 5,000-record lookup. The new screenshot is [Prepare song search](song-search-preview.png).

A local synthetic Node benchmark (5,000 songs, approximately 1,800 characters per song) measured roughly 95 ms indexing and 31 ms querying. This is development-machine evidence, not a browser latency guarantee. No new database/search stores, schema changes, backend or upload behavior were introduced. Publication and physical/participant acceptance remain pending.

## 17 October 2026: U6.2 structural authoring

See [authoring implementation](UPDATE_U6_AUTHORING.md). Passed strict TypeScript, ESLint, **58 unit tests**, production build/repository-subpath PWA validation and the complete **48-test Chromium suite**. The affected seven authoring/Library/Prepare tests passed before the final full run; the final run also included the omitted duplicated-section editing case. Converter code is unchanged, with the last 56-test pass recorded under U5.

New unit checks cover duplicate IDs, preserved bilingual text/design/media references, original-copy independence, automatic song-order synchronization, unchanged custom repeats, slide transfer without empty sections, movement boundaries and flat slide-set validity. The browser workflow creates and duplicates bilingual slides, transfers between sections, duplicates and independently edits a chorus, reorders sections while retaining custom repeats, saves/reloads, edits service-only pages, edits a copied section outside the service order, and duplicates a standalone Library section. Existing Preview/Take/Apply and offline/output safety tests remain passing. No schema/archive/protocol change or production deployment occurred.

## 17 October 2026: U6.3 paste staging and read-only review

See [paste and review implementation](UPDATE_U6_PASTE_REVIEW.md). Passed **63 unit tests**, strict TypeScript, ESLint, production build/repository-subpath PWA validation and a complete **50-test Chromium run**. The final compact-review centering/scroll-padding refinement was followed by all **seven affected paste/review/authoring/Prepare tests passing**. Those checks assert a nonzero uncropped review preview at desktop and compact sizes and confirm it sits above the sticky navigation after scrolling. Screenshots were inspected at 1280×720 and 640×480; the desktop artifact is [service review](service-review-preview.png). Converter code remains unchanged; the last 56-test pass is U5 evidence.

New parser/unit evidence covers explicit section/page markers, bilingual structure matching, Unicode punctuation and deliberate blank lines, secondary-only text within marked structure, empty/malformed/overlong input rejection, unchanged source records before Apply, safe empty-starter replacement, new IDs, append collision labels, retained custom repeats and customized starter designs. Browser evidence covers cancel without changing lyrics, disabling Save while text is staged, a stale preview requiring re-preview, explicit Apply/Save and reload persistence. Review tests include songs, repeated-page-capable sequence construction, private notes, operator headings, exact item/page return, byte-for-byte equality of saved service JSON before/after review, unchanged live output during review, and active-session Blank. Existing repeated-section presenter tests remain passing.

A review screenshot exposed initial preview cropping and compact zero-height behavior. The preview now fits its desktop container; compact review content scrolls with sticky navigation and scroll padding. The selected preview can be brought fully above that navigation. Technical render metrics and duplicate Blank controls were removed from the review itself; the shared output strip retains safety controls. Confirmed-black acknowledgement also replaces the pending-blank notice.

No schema/archive/protocol change, backend, content upload or production deployment was introduced. Browser-restart paste-draft recovery is not implemented. Physical Safari/second-display, 200% zoom, screen-reader/participant review and publication remain pending. Source comparison and explicit refresh are the remaining U6 increment.

## 17 October 2026: U6.4 source comparison and refresh

See [source comparison implementation](UPDATE_U6_SOURCE_REFRESH.md). Passed strict TypeScript, ESLint, **69 unit tests**, production build/repository-subpath PWA validation and the complete **52-test Chromium suite**. After strengthening the source workflow to disable networking, all **six affected source/Prepare tests** passed again. The offline case covers output startup black, current service words on Take, comparison, explicit replacement, saved-service Apply and a separate Take revealing refreshed words. Converter code was unchanged; its last 56-test pass remains U5 evidence.

Six new unit cases check baseline states, exact retention of service-item fields, whole snapshot/order replacement, explicit arrangement selection, flat slide sets, other-copy/source independence, stale source/service rejection, deleted and missing-media sources, rollback without advancing supplied drafts, and known/unknown provenance through backup/restore. Two browser workflows check Cancel without any service write, changed Library versions, retained custom item title/notes/appearance, current-versus-new previews, stale comparison after another window saves/deletes the source, and a deleted source leaving the copy usable. The live workflow verifies replacement and Apply both leave the acknowledged old frame visible until a separate Take. Desktop previews were checked above the replacement control; compact modal Cancel and Blank remain reachable.

The snapshot's existing captured revision/token supplies the version baseline; absent legacy provenance remains unknown. Restore can change the Library token without changing words, so status uses version differs rather than claiming newer lyrics. No new persisted baseline fields, schema/archive increment, automatic merge or backend was introduced. Screenshot: [source comparison](source-comparison-preview.png), inspected visually. Local preview was restarted for this run; production remains unchanged. Physical Safari/second-display, 200% zoom, screen-reader/participant review and U7 publication/acceptance remain pending.

## 0.7.0-rc.1 rehearsal candidate — 17 October 2026

TypeScript and ESLint pass; 69 unit tests, 56 Python converter tests and 54 Chromium integration tests pass. Clean npm lockfile installation passes (0 reported audit vulnerabilities). Root and `/sanctuary-presenter/` builds pass PWA path validation. Local version-aware production smoke passes cached offline reload, black output startup, Take/Blank/End and absence of third-party/write requests.

The new real-upgrade fixture verifies 0.6.0/schema-2 → candidate/schema-3, including waiting service-worker activation while live and exact saved-content preservation. Controls remain visible at 640×360 CSS pixels; physical zoom and Safari/second-display rehearsal remain pending. See RELEASE_ACCEPTANCE.md for all 70 UI scenario coverage entries and outstanding gaps. GitHub upload and hosted verification are recorded separately after deployment; these local results do not establish publication.


## 0.7.0-rc.3 publication — 18 October 2026

PR #3 (https://github.com/kengbeng/sanctuary-presenter/pull/3) merged the verified 22-file candidate. GitHub Actions run 39091786981 (https://github.com/kengbeng/sanctuary-presenter/actions/runs/39091786981) completed successfully: build 1m31s, deploy 8s. Public release.json confirmed version 0.7.0-rc.3, database schema 3, backup format 5, rehearsal channel. The deployed smoke script passed subpath load, metadata/manifest, cached shell, offline reload/new black output, Show/Blank/Stop and absence of page errors or third-party/write requests in an isolated Chromium profile.

The existing hosted Safari profile exported a full backup before update. It applied the previously waiting rc.2 shell and then the downloaded rc.3 shell; the UI confirmed 0.7.0-rc.3 and offline-ready status, with the saved “REHEARSAL — section navigation” service retained. No output session is active. Full network-disconnected Safari cold restart is awaiting user observation; these deployment/smoke results do not replace it. Four additional generated regression screenshots remain local and were not included in the release.


Hosted offline follow-up: the user reported that the app and saved rehearsal service opened after disconnecting internet and fully quitting/reopening Safari according to the supplied procedure, then reconnecting. This is user-confirmed cold-start/service-access evidence for 0.7.0-rc.3, not agent-instrumented network verification or a full imported-media/output rehearsal.


19 October: the user reported the full hosted two-item synthetic-media rehearsal passed after disconnecting internet and restarting Safari: cached app/service, black windowed Acer output, PNG reveal, moving MP4, Blank and End. Connected output/preview isolation was separately observed with physical user confirmations. This covers the specific silent synthetic PNG/MP4 setup, not all codecs, audio, real-service media or fullscreen reliability.


## Direct control candidate — 19 October 2026 (local, unpublished)

Present now keeps Direct control, Preview only, Return to live, Show slide, navigation and Blank together. Live destination activation uses the existing preparation and acknowledgement flow. Startup/Blank selection stays local; Apply enters Preview only. Mode changes and Blank cancel pending direct reveals.

TypeScript, ESLint and production build pass. All 55 Chromium integration tests pass, including direct live navigation, explicit reveal while black, optional preview isolation, Return to live, arrow navigation, repeated chorus positions and multi-page bridge navigation. These automated results do not establish physical Safari/Acer acceptance of the new interaction. Production remains 0.7.0-rc.3.
