# Release acceptance — 0.7.0-rc.5

Local rc.5 candidate: dedicated Pages/Cloudflare builds, dual-path asset/PWA validation, matching wordmark and app icons, clearer selected/confirmed/pending navigation feedback, optional presentation guide and local-library host-transfer help. Publication and physical acceptance of these changes remain pending.

Rehearsal candidate history, 17 October 2026. This release introduces Services → Prepare → Present, structured song authoring, bilingual search, read-only review, source comparison and explicit staged Apply/Take. It is not a claim that every interface acceptance scenario is complete.

Baseline 0.7.0-rc.1 automated verification: TypeScript, ESLint, 69 unit tests, 56 converter tests, 54 Chromium integration tests and repository-subpath PWA validation pass. The browser suite includes an actual 0.6.0 service-worker upgrade: activation waits during presentation, saved schema-2 content survives schema-3 migration, and the new output starts black. Essential controls remain reachable at 1280×720, 1024×768, 640×480 and 640×360 CSS pixels. The smallest viewport is a zoom proxy, not a physical Safari zoom test.

Before upgrading, export a full backup outside browser storage. Stop all output windows before applying a downloaded update. Keep the original backup; browser storage is not a backup. Schema 3 writes backup format 5 and accepts formats 1–5. Do not assume an older application can read a newer backup.

Physical Safari/second-display rehearsal, actual room readability, participant walkthroughs, Windows/media compatibility and screen-reader acceptance remain pending. Earlier hardware confirmations do not certify the redesigned workflow. See MANUAL_TESTS.md and USER_INTERFACE_VALIDATION.md. Known scope limits include duplicate-candidate draft handover, learned pane preferences and full readiness-severity behaviour; a missing later asset can still prevent session readiness. Do not use this candidate for an unrehearsed live service.

Publication: the signed-in GitHub window is used to upload source changes. GitHub Actions must pass before Pages publication is considered verified. The hosted version and offline smoke check must be checked after deployment; local results alone do not establish deployment.

The table records coverage, not blanket acceptance. “Partial” means automated checks cover part of the scenario; remaining wording, human usability or device conditions require review. “Pending” means physical or participant evidence is required.

| Scenario | Coverage | Evidence or remaining work |
| --- | --- | --- |
| UI-01 — First visit | Partial | Automated: service-workspace. Review full scenario and physical conditions. |
| UI-02 — Repeat service | Partial | Automated: service-workspace. Review full scenario and physical conditions. |
| UI-03 — Add content | Partial | Automated: search. Review full scenario and physical conditions. |
| UI-04 — Scope and save | Partial | Automated: song-integrity. Review full scenario and physical conditions. |
| UI-05 — Setup | Partial | Automated: output. Review full scenario and physical conditions. |
| UI-06 — Live basics | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-07 — Blank navigation | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-08 — Repeated chorus | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-09 — Multi-page bridge | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-10 — Unplanned section | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-11 — Rapid jumps | Partial | Automated: rendering. Review full scenario and physical conditions. |
| UI-12 — Recovery | Partial | Automated: output. Review full scenario and physical conditions. |
| UI-13 — Long service | Partial | Automated: ux. Review full scenario and physical conditions. |
| UI-14 — End of service | Partial | Automated: ux. Review full scenario and physical conditions. |
| UI-15 — Keyboard | Partial | Automated: ux. Review full scenario and physical conditions. |
| UI-16 — Responsive | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-17 — Output privacy | Partial | Automated: rendering. Review full scenario and physical conditions. |
| UI-18 — Offline/subpath | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-19 — Maintenance | Partial | Automated: output. Review full scenario and physical conditions. |
| UI-20 — Physical rehearsal | Pending | Physical or participant rehearsal required. |
| UI-21 — Browse without revealing | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-22 — Temporary-run boundaries | Partial | Automated: navigation unit tests. Review full scenario and physical conditions. |
| UI-23 — Invalid song structure | Partial | Automated: song-integrity. Review full scenario and physical conditions. |
| UI-24 — Dialog safety | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-25 — Request ordering | Partial | Automated: protocol unit tests. Review full scenario and physical conditions. |
| UI-26 — Failure truth | Partial | Automated: protocol unit tests. Review full scenario and physical conditions. |
| UI-27 — Save-before-session | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-28 — Session edit scope | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-29 — Readiness severity | Deferred gap | Later missing assets can block session readiness; severity behaviour needs further work. |
| UI-30 — Zoom and focus | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-31 — Empty-library creation | Partial | Automated: service-workspace. Review full scenario and physical conditions. |
| UI-32 — Default appearance | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-33 — Visible repeat controls | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-34 — Plain-language state | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-35 — Mouse-only operation | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-36 — New-user walkthrough | Pending | Physical or participant rehearsal required. |
| UI-37 — Weekly reuse | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-38 — Standalone library work | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-39 — Find a known song | Partial | Automated: search. Review full scenario and physical conditions. |
| UI-40 — Duplicate suggestion | Partial | Suggestions do not block saving translations; opening candidates while preserving draft remains deferred. |
| UI-41 — Structured lyric entry | Partial | Automated: authoring and paste-review. Review full scenario and physical conditions. |
| UI-42 — Bilingual authoring | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-43 — Library correction | Partial | Automated: source-refresh. Review full scenario and physical conditions. |
| UI-44 — Delete scope | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-45 — Review without output | Partial | Automated: paste-review. Review full scenario and physical conditions. |
| UI-46 — Handover scope | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-47 — Rear-seat readability | Pending | Physical or participant rehearsal required. |
| UI-48 — Meaningful lyric pages | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-49 — Motion and contrast | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-50 — Audience continuity | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-51 — Language continuity | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-52 — Clean congregation output | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-53 — Readability failure correction | Pending | Physical or participant rehearsal required. |
| UI-54 — Audience rehearsal | Pending | Physical or participant rehearsal required. |
| UI-55 — Live orientation | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-56 — Held keys and focus | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-57 — Prayer and resumption | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-58 — Unexpected item change | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-59 — Recovery position | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-60 — Stable live controls | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-61 — End versus Blank | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-62 — Staged live content | Partial | Automated: presenter and source-refresh. Review full scenario and physical conditions. |
| UI-63 — Ministry flow | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-64 — Public/private review | Partial | Automated: paste-review. Review full scenario and physical conditions. |
| UI-65 — Scripture and quotation fidelity | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-66 — Human versus technical review | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-67 — Prayer and response | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-68 — Sensitive-data handling | Partial | Targeted automated coverage is incomplete; review against the interface specification. |
| UI-69 — Pastoral changes | Partial | Automated: presenter. Review full scenario and physical conditions. |
| UI-70 — Pastoral walkthrough | Pending | Physical or participant rehearsal required. |

## 0.7.0-rc.2 follow-up

Manual Acer B247Y results cover windowed black startup, preview/Take separation, hidden-output blocking, restoration guidance and a user-confirmed deliberate reveal. The hidden caption and stale restore guidance were corrected and manually rechecked. See MANUAL_TESTS.md for exact observations and limitations. TypeScript and production bundling pass locally. GitHub Actions run 39038605524 passed all required checks, including 54 browser integration tests, and deployed the candidate. The hosted release.json confirmed 0.7.0-rc.2, schema 3 and backup format 5.

The subsequent manual transport-fault rehearsal exercised timeout expiry, black recovery, rejection of a late confirmation with a fresh sequence number, and a successful fresh Take. Native macOS fullscreen passed the Acer black/pattern/Blank rehearsal on 0.7.0-rc.2. Safari webpage fullscreen reproduced the exit placeholder on the previously cached candidate and is not accepted on that attempt. Use the verified native-window fallback for this Acer setup. Browser visibility does not prove physical placement. iPad/Sidecar was not retested and its earlier failure remains open. See the dated closure checks in MANUAL_TESTS.md for exact scope. The candidate is for rehearsal; unchanged physical, participant, media and offline acceptance gaps remain open.


The subsequent Safari/Acer song-navigation rehearsal confirmed section preview isolation, Chorus selection at repeated positions, both Bridge pages, final-page boundaries, a backward Verse 2 Take and navigation while blank. The session was ended. These observations narrow the outstanding hardware gaps for this labelled seven-slide song; they do not certify all songs, staged corrections or the full service workflow. See the 17 October song-navigation entry in MANUAL_TESTS.md.


On 18 October, the staged-edit rehearsal confirmed Save and Apply leave original words live, but native-fullscreen output later became hidden and the user saw the Acer desktop/another app. Native fullscreen therefore remains a conditional workaround, not accepted as reliable across editing/window transitions. Windowed recovery and the final corrected reveal are being checked; see the dated manual entry.


The staged-correction rehearsal subsequently completed in windowed mode: the user confirmed black recovery and corrected words only after Show slide. The Library master retained the original words, and the session was blanked and ended. Save/Apply/reveal isolation and service-copy/source isolation pass for this practice song. The fullscreen/Spaces failure and Prepare routing issue remain open.


On 18 October, Safari cold restart with the local app origin unavailable passed for the saved synthetic service, cached operator/new output, explicit Show slide, preview isolation and blank navigation. The server was stopped during the check and restarted afterward. Network connectivity elsewhere on the Mac remained enabled. Hosted GitHub Pages cold restart with networking disabled and representative media is still outstanding; do not substitute this local-origin result for that broader gate.


## 0.7.0-rc.3 publication candidate — 18 October 2026

Includes Show slide terminology across the operator/practice UI, current instructions and test selectors; active-service Prepare routing after browser restart; windowed-Safari guidance; and the scoped manual results above. TypeScript, lint, bundling and seven presenter browser checks passed before the release-version bump. Required CI remains the publication gate for this candidate. Earlier local/unpublished statements describe their development checkpoints. The local manual fault server is a developer-only tool, excluded from the Pages artifact; it injects deliberately held confirmations and must never be used to host a real service.

This remains a rehearsal release. Safari fullscreen/Spaces reliability is not fixed. Hosted network-disconnected cold restart with representative media remains pending.


### Hosted cold-start follow-up — 18 October 2026

The user confirmed 0.7.0-rc.3 and the saved rehearsal service opened after the instructed full internet-disconnected Safari restart. Hosted cached startup and saved-service access now pass for this profile. Representative imported media and a complete physical-output service while fully disconnected remain unverified. Earlier statements that hosted cold startup was pending describe prior checkpoints; this result supersedes that narrow pending item, not broader offline acceptance.


### Imported-media offline rehearsal — 19 October 2026

Connected Safari/Acer rehearsal confirmed PNG display, image-to-video preview isolation, MP4 motion and immediate black output with preview navigation. The session ended and a full backup was exported. The user subsequently reported all steps passed after full network disconnection and Safari restart: hosted app/saved media service, black windowed output startup, image reveal, moving video, Blank and End. This closes the focused synthetic-image/MP4 offline output gate for this setup. Actual ministry media, audio, broader codec/browser coverage, long-service recovery, room readability, accessibility and participant acceptance remain open. Safari fullscreen reliability is not resolved.
