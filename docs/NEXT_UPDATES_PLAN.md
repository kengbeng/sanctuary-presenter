# Sanctuary Presenter: Next updates plan

**Date:** 19 October 2026
**Status:** U7 acceptance in progress; rehearsal release 0.7.0-rc.3 published; 0.7.0-rc.4 Direct control candidate prepared.
**Progress:** U1–U6 implemented. GitHub Actions validated and deployed 0.7.0-rc.3. Safari/Acer manual checks covered preview/reveal separation, section jumps and multi-page bridge, blanking, timeout/late-confirmation recovery, staged Save/Apply/reveal and Library-source isolation. Fullscreen did not remain reliable through all window/editing transitions; windowed Safari output is recommended. Show slide terminology and active-service Prepare routing are published in rc.3. The rc.4 candidate adds live one-click navigation and optional Preview only on Present; physical acceptance of that new interaction remains pending. A Safari cold restart with the local origin unavailable passed for saved synthetic text, new output, reveal and blanking. The user also confirmed hosted Safari cold startup and saved-service access after the instructed full network disconnection and browser restart. On 19 October the user confirmed the hosted synthetic PNG/MP4 service, windowed Acer output, moving video, Blank and End all passed after disconnected Safari restart. U7 still requires actual ministry-media/audio/codec coverage, long-service recovery and the remaining room, participant and accessibility acceptance. See MANUAL_TESTS.md and RELEASE_ACCEPTANCE.md for scoped evidence.

**Starting point:** Production application 0.6.0/schema 2; local development schema 3, backup 5, UI specification 1.8 draft

## 1. Objective and inputs

Deliver a coherent Services → Prepare → Connect → Present workflow, with dependable song creation and direct verse/chorus/bridge navigation. Correct the data contracts these workflows depend on before adding more UI around them.

Inputs:

- [Core interface specification](USER_INTERFACE_SPECIFICATION.md), including its scope and interaction-state contract.
- [Validation companion](USER_INTERFACE_VALIDATION.md), containing role-based walkthroughs and physical rehearsal requirements.
- [Database review](SONG_LIBRARY_DATABASE_REVIEW.md), findings DB-01–07.
- [Project baseline](../Sanctuary_Presenter_v2_Codex_Specification.md), output safety, offline/privacy and incremental delivery requirements.
- [Parity inventory](FEATURE_PARITY.md), retained as backlog rather than silently treated as complete.

This plan orders the work more precisely than the earlier UI-only phase list. It retains those requirements and brings data integrity forward. Existing tests and user-reported checks are baseline evidence, not acceptance of the redesign.

## 2. Sequence and dependencies

| Update | Deliverable | Depends on | Exit gate |
| --- | --- | --- | --- |
| U0 | Decision records and compatibility fixtures | Existing documents/source | Proposed behaviour distinguished from confirmed requirements; fixtures cover risks |
| U1 | Reliable song hierarchy and occurrence projection | U0 compatibility policy | DB-01–03 regression cases pass without data loss |
| U2 | Revision-aware persistence and atomic song/add | U1 validated contracts | Concurrent editing and migration/backup tests pass |
| U3 | Runnable workflow prototype | U0; use U1 destination shape | Core journey understandable and layouts feasible before styling |
| U4 | Services and Prepare workspaces | U1–U3 | Empty-library and weekly preparation journeys pass |
| U5 | Dedicated Present and focused output setup | U1–U4 and resolved navigation/session decisions | Live/blank section jumps, recovery and safety suite pass |
| U6 | Focused authoring enhancements | Stable core U4/U5; feature-specific contracts | Each enhancement passes its own scope-specific checks |
| U7 | Consolidated acceptance and Pages release | Applicable earlier gates | Automated, observed and physical checks reported; production smoke passes |

U3 can be built with synthetic data while persistence work proceeds, but it must not become a competing data model or claim real output validation. Do not introduce concurrency merely to accelerate the schedule; each update should remain independently reviewable and runnable.

## 3. U0: Decisions and representative fixtures

### Deliverables

Record the following in the decision log before implementing affected behaviour:

| Decision | Recommended starting position | Timing |
| --- | --- | --- |
| Live navigation | Confirmed Preview → Take in black and live states | Before U3/U5 interaction acceptance |
| Repeated/omitted sections | Prototype the specified occurrence resolution and single temporary resume destination, with visible Next cues | Before U5 cursor implementation is accepted |
| Live service edits | Confirmed staged edits with explicit Apply; preserve acknowledged live frame until explicit Take | Before U4 editing restrictions or U5 live workflow |
| Source replacement | Explicit whole-snapshot replacement with preview and documented retained fields; no implicit merge | Before that U6 enhancement |
| Output setup access | Test a deliberate keyboard/operator action that exposes setup controls without pointer-triggered overlays on live lyrics | Before U5 output-shell change |
| Working songs | Structurally valid incomplete songs may be saved, but readiness blocks unintended empty output | Before U1 validator/readiness separation |

These are recommendations for concrete review, not already confirmed decisions. Unresolved choices block their affected behaviour only; fixture work, repository hardening and layout exploration can continue. Do not ask for the same approval again once a choice is recorded.

Create synthetic fixtures for repeated choruses, two-page sections, omitted endings, repeated song items, bilingual pages, text song numbers, mixed hierarchy, inconsistent auto orders, empty lyrics, source deletion and shared media. Include currently supported legacy backup versions and converter outputs. The user does not need to provide exports or service packages.

### Likely files

`docs/DECISIONS.md`, model/repository test fixtures, backup/converter tests, and a scenario-to-evidence checklist. Record existing version boundaries before assigning a new database or archive version.

## 4. U1: Song integrity and occurrence-aware projection

### Scope

- **DB-01:** Introduce a typed presentation destination retaining original page identity plus item, section, occurrence and page position. Generate a unique runtime destination key for every arrangement occurrence. Do not change stored page IDs or flatten repeats into copied lyrics.
- Update all consumers that use flattened IDs, including selection, prepared-frame lookup and acknowledgement correlation. Audit protocol compatibility; version a changed wire contract if required rather than allowing mixed clients to misinterpret it.
- **DB-02:** Enforce canonical hierarchy for new writes. Audit legacy mixed records first; do not delete hidden text/media or rewrite existing stores as a side effect of opening the app. An ambiguous record needs a loss-preserving report and explicit repair path. Define that path before enabling strict restore rejection.
- **DB-03:** Enforce auto-order consistency at the repository/model boundary. Preserve imported custom/repeated sequences; do not normalise a contradictory auto flag silently.
- **DB-07:** Separate structural validation from presentation readiness. Explicitly distinguish incomplete song text, deliberate supported media-only pages and non-presenting headings. Define ID scope and practical bounds with legacy compatibility checks.

### Likely files

`src/model.ts`, `src/repository.ts`, `src/backup.ts`, presentation consumers in `src/main.tsx` and `src/Library.tsx`; relevant model/repository tests and converter fixtures. Keep shared rendering behaviour stable.

### Gate

Test unique destinations for repeated pages/items, exact Next/Previous context, rejected invalid new writes, accepted canonical legacy content and unchanged exact lyrics/media references through backup round trips. Legacy repair must never silently discard source branches. Run type/lint/unit checks, affected browser tests and build/PWA validation before continuing.

## 5. U2: Persistence, stale edits and combined operations

### Scope

- **DB-04:** Add revision-aware create/update/delete repository operations for library content and services. Compare an expected revision inside the write transaction, not in UI code before it.
- Give existing records an explicit initial revision through a tested additive schema migration. Do not regenerate UUIDs, reset source timestamps or turn service snapshots into live links.
- Reject stale saves/deletes and updates to deleted records. Preserve the rejected draft and explain the conflict; offer reload/compare or an explicit independent copy where supported. Do not silently overwrite or resurrect data.
- Serialize local save requests and ensure only the newest committed revision can produce Saved locally. Update all callers, including duplication and item changes, to use committed revisions rather than stale in-memory objects.
- Implement Save song and add to service in one transaction across the relevant stores, validating the expected service revision and media references. A failure rolls back both records; retries reuse operation identities.
- Update backup readers/writers and converters as necessary for new persisted semantics. Assign format versions after auditing older-reader behaviour. Restore creates a new editing context; old tabs must not overwrite restored records even if numeric revisions coincide. Use a repository generation token or an equivalent tested invalidation contract.

### Gate

Use two independent repository clients and real browser tabs for stale-save, stale-delete, delete/recreate and restore-versus-old-draft cases. Test migration from schema 2, failed-write draft retention, atomic rollback, retry without duplicates and supported archive round trips. Maintenance locks continue to protect presentation/restore/update independently of authoring revisions.

A downloaded app must not force a reload during output. Deploy schema changes only with a clear close-all-windows/export-backup upgrade procedure and tested supported-version transition. Retain the previous deploy artifact, but do not assume rolling back JavaScript can read a newer database; define forward-repair and restore compatibility before rollout.

## 6. U3: Runnable workflow prototype

Build a low-detail prototype within the existing app structure using synthetic data. It covers Create service → Create song → Add → Present → Connect → Show → Chorus jump → Blank. Include service-copy wording, song-order occurrences, visible section shortcuts and the distinction between browsing and activating.

Use the intended component boundaries: application shell, service order, song navigation, slide preview, output status and safety controls. Validate 1280 × 720 first, then 1024 × 768, constrained layouts and 200% zoom. Establish the fixed controls' space budget before colour and visual polish.

Review the prototype against the novice/operator tasks. Record misunderstandings and revise labels/layout. A mock output is acceptable for this UX step but cannot satisfy two-window, media or physical-display acceptance. Do not publish a mock as production or create test content in a user's real library.

## 7. U4: Services and Prepare implementation

Replace the mixed library/planner shell incrementally, keeping presentation accessible throughout:

1. Services landing, empty/demo separation, create/open/duplicate/rename and weekly reuse.
2. Item-based service order, independent item/page selection and reordering.
3. Contextual add drawer and shared song/slide editor, with one overlay layer and clear save scope.
4. Basic section/page creation, bilingual text, song order/repeats, local save feedback and appearance defaults.
5. Distinct Library workspace and Settings/Data entry, retaining backup and maintenance safeguards.

Suggested new UI components may be split out of `main.tsx` and `Library.tsx`; do not rewrite repository/protocol/rendering simply to match component boundaries. Define service/editor state ownership before moving handlers.

**Gate:** Complete the empty-library creation and weekly-reuse journeys; verify service-copy independence, no draft loss, persistence after reload, safe media deletion, keyboard/focus and small-screen controls. Map evidence to UI-01–04, UI-13, UI-15–19, UI-27–32, UI-35, UI-37–38, UI-42, UI-44 and applicable public/private scenarios. Scenario IDs indicate coverage targets, not an assertion that every enhancement in them is delivered at this stage.

## 8. U5: Present, song navigation and output setup

Implement the dedicated console using U1's destinations, not another flattening algorithm. Keep item/section/page position, actual Next, requested-versus-confirmed output and Return to current song visible. Implement the reviewed repeat/temporary-run rules. Separate item browsing from activating a song/page.

Move configuration into focused output setup. Preserve synchronous popup opening, actual screen discovery, manual positioning, fresh fullscreen gesture, test isolation and black-first startup/recovery. Keep Blank within permitted modal focus scopes. Make setup-toolbar changes only after testing the chosen accessible activation path.

Preserve latest-request-wins media cancellation, immediate independent black intent, truthful unconfirmed status and no automatic reveal after error/reconnect. Ignore held navigation keys while allowing deliberate rapid presses. Implement the confirmed staged Apply policy from core section 16.7, with pinned live frames, validated atomic sequence replacement and a separate explicit Take. This is now required presenter scope.

**Gate:** Run the output/protocol/media suite plus direct section jumps while live/black, multi-page/repeated/omitted sections, rapid navigation, stale acknowledgements, button/composite focus, prayer/resumption, output close/reload/reconnect, test output and End. Check applicable UI-05–12, UI-14–26, UI-33–35, UI-50–52 and UI-55–69. Complete Safari/second-display rehearsal before treating this console as operationally accepted.

## 9. U6: Authoring enhancements in separate increments

Order these by worker benefit, not by the length of the accumulated specification:

1. **Find the right song:** normalised lyric/title/text-number search, language/tag filters, match excerpts and non-blocking duplicate suggestions. Benchmark synthetic collections before adding search stores/indexes (**DB-06**). Exact stored lyrics/numbers remain unchanged.
2. **Prepare efficiently:** section/page duplication and movement, optional whole-song paste staging, read-only running-order review. Preserve explicit breaks and both language channels.
3. **Compare and refresh deliberately:** introduce source revision/arrangement baseline or a defined fingerprint with the before/after replacement UI (**DB-05**). Unknown legacy baselines remain unknown; refresh only the selected service copy. Complete the replacement-policy decision first.

Each increment gets focused failure, persistence and backup tests plus applicable UI-39–45, UI-48, UI-53 and UI-63–70 evidence. Do not add contributor normalisation, reporting, Trash or cross-device sharing merely to support these changes.

## 10. U7: Acceptance, deployment and follow-up

Use the existing GitHub Actions deployment workflow as the production gate throughout development. Validate repository-subpath routes/assets/manifest/output URLs, offline cold restart and no user-content uploads. Do not replace Pages hosting or introduce a backend.

For each releasable increment:

- Run typecheck, lint, relevant unit/integration/converter tests, production build and PWA validation. Expand testing when shared contracts change; avoid repeated full runs after documentation-only changes.
- Update the scenario checklist with Pass, Fail, Not run or deferred scope and evidence. Do not treat all 70 scenarios as automated tests or already passed.
- Run the planned novice, worker, operator and pastoral walkthroughs without duplicating equivalent tasks. Record unperformed participant checks explicitly.
- Perform congregation-side room/readability checks on actual output. Document Safari and second-display results separately from Windows Chrome/Edge checks. An unperformed Windows physical check remains a release limitation.
- Publish through the existing Actions workflow within the authorised release scope, confirm its successful deployment and run the HTTPS/subpath/offline dual-window smoke check. Confirm safe update behaviour without clearing user storage.

U7 is a final consolidated gate, not a reason to postpone all deployments until the end. Keep each intermediate release runnable and distinguish development verification from full live-service acceptance. GitHub authentication must be available for publishing; no temporary credentials remain from previous releases.

## 11. Immediate next update

U1–U5 are implemented locally. Rehearse the new Present workflow on Safari and the second display before treating it as operationally accepted. U6.1 normalised search is implemented locally. U6.2 structural duplication/movement is also implemented locally. U6.3 explicit whole-song paste staging and running-order review are also implemented locally. U6.4 source comparison and explicit whole-copy replacement are also implemented locally, with source/service revision guards and retained-field consequences shown before replacement. Continue with U7 acceptance and publication; outstanding physical/participant checks remain explicit.

No release dates or version numbers beyond the current baseline are promised. Assign them when each increment's final scope and evidence are known. This plan changes documentation only and does not start application implementation.
