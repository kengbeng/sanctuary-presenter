# Release acceptance — 0.7.0-rc.2

Rehearsal candidate, 17 October 2026. This release introduces Services → Prepare → Present, structured song authoring, bilingual search, read-only review, source comparison and explicit staged Apply/Take. It is not a claim that every interface acceptance scenario is complete.

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

Manual Acer B247Y results cover windowed black startup, preview/Take separation, hidden-output blocking, restoration guidance and a user-confirmed deliberate reveal. The hidden caption and stale restore guidance were corrected and manually rechecked. See MANUAL_TESTS.md for exact observations and limitations. TypeScript and production bundling pass locally. Required GitHub Actions checks remain the deployment gate; the earlier baseline counts above must not be read as new evidence for this candidate until CI completes.

Pending timeout expiry and late-acknowledgement behaviour have not been exercised manually. Browser visibility does not prove physical placement. The Safari/iPad fullscreen and desktop-visibility failures remain unresolved. The candidate is for rehearsal; unchanged physical, participant, media and offline acceptance gaps remain open.
