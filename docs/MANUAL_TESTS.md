# Physical acceptance gate — PARTIALLY COMPLETE

## 0.7.0-rc.1 Safari and second-display rehearsal — pending

Use the deployed candidate at https://kengbeng.github.io/sanctuary-presenter/. Earlier confirmations below are historical; they do not certify the redesigned presenter. Record actual results rather than inferring success from automated Chromium checks.

Before starting, export any existing library backup outside browser storage. End presentations, close other output/operator windows and apply a waiting update. Confirm the displayed version is 0.7.0-rc.1. Keep the original backup: schema 3 must not be recovered by loading older schema-2 JavaScript.

Record macOS and Safari versions, browser/Add to Dock mode, display model, extended-display arrangement and date. Use rehearsal content with a verse, repeated chorus and a two-page bridge; identify it clearly so it cannot be mistaken for a real service. Keep private test cues synthetic.

| Step | Action | Required observation | Result |
| --- | --- | --- | --- |
| 1 | Open the candidate in Safari with the second display extended. Open a rehearsal service and choose Present service. | Correct version; operator remains usable. | Pending |
| 2 | Choose Connect display / Display setup, then Open congregation window. Manually move it if automatic discovery is unavailable. | Congregation window starts completely black; intended physical screen confirmed. | Pending |
| 3 | Request fullscreen using its explicit output-window control. Return to the operator. | Fresh gesture works or gives recoverable guidance; no raw transient-activation TypeError; no unintended reveal. | Pending |
| 4 | Select a verse, then Take. Select another page without Take. | First page appears; selecting a preview alone leaves projected words unchanged. | Pending |
| 5 | Select the second chorus occurrence, Take, then preview its next page and the bridge. Test a direct bridge-page jump. | Occurrence/page markers and actual Next destination are clear; only Take reveals. | Pending |
| 6 | Blank screen, navigate to another section, then Take deliberately. | Black persists during navigation; only the deliberate Take reveals the new selection. | Pending |
| 7 | Stage a word correction in Prepare and save. Apply saved changes in Present, then Take. | Save and Apply preserve the existing live frame; Take reveals the correction. Master and service-copy scopes remain clear. | Pending |
| 8 | Close/reconnect and refresh the congregation window. | Each recovery stays black until Take; the operator can identify its pending destination. | Pending |
| 9 | End presentation. Repeat with test output. | End blanks/closes output; test output starts black and shows only an explicitly requested pattern. | Pending |
| 10 | After offline-ready, end sessions and quit Safari completely. Disable networking, reopen the saved service and congregation window. | Saved text/media remain usable; output starts black; Take/Blank work offline. | Pending |
| 11 | Check 200% zoom, keyboard focus and actual rear/side seating readability. | Essential controls remain reachable; both languages are readable; private notes never project. | Pending |

Keep long-running sleep/wake, codec/media continuity, update coordination and participant walkthroughs as separate pending checks. An operator status message cannot prove the physical projector is black.

### Preparation observed — 17 October 2026

The user reported that the second display was unavailable and requested checklist preparation. In the existing Safari profile, the agent observed the older cached shell, an empty song library and no saved service selected. Export full backup reported success. Applying the waiting update loaded the Services landing with version 0.7.0-rc.1 and offline-ready status. The new landing reported no saved services. No rehearsal content was created and no congregation window was opened. These observations verify update preparation only; all physical rehearsal rows above remain pending. The exported archive was not independently opened or restored during this preparation.

### Display rehearsal started — 17 October 2026

The user subsequently connected the second display and asked the agent to operate the setup. Safari's Configure Display selected Manual. The agent opened the bundled Demo service's congregation window, observed its black output state, moved it through macOS Window → Move to KB’s iPad Air, clicked the in-window Enter Fullscreen control and returned to the operator. No raw fullscreen TypeError appeared. The operator reported OUTPUT BLACK and acknowledged connection. The user confirmed that the iPad showed a completely black fullscreen display while the operator remained accessible. This confirms the manual-positioning/fullscreen/black-startup portions of steps 1–3 on this setup; automatic placement is not certified. OS/Safari version details remain unrecorded.

The agent then took the bundled Welcome slide and selected Together as the next preview. The operator's last confirmed live frame remained Welcome. The user confirmed that the iPad continued showing Welcome while the operator previewed Together. This confirms step 4 on this setup. The agent then blanked output, received a confirmed-black acknowledgement and selected Peace without Take. The user confirmed that the iPad went black and stayed black while Peace was selected in preview. The agent then pressed Take; the operator acknowledged Peace as live. The user confirmed that the iPad then showed Peace (“Go in peace. Serve with love.”). Step 6 is confirmed for the bundled demo slides. The agent then chose End presentation; the operator returned to the connection setup. The user confirmed that End closed the congregation window with no lyrics left showing. Normal session closure is confirmed. The agent next opened Test output, moved it to KB’s iPad Air and requested fullscreen. The operator acknowledged black test output; physical black-startup confirmation and deliberate pattern reveal remain pending. Song-section, staged-edit, recovery, offline and readability checks remain pending.

## User-reported Safari check — 16 October 2026

User reports that all five guided startup steps worked on a Mac with Safari and a second display: extended-display setup, Manual positioning and Start Presentation, completely black initial output, moving output to the second display and entering fullscreen, and continued access to the operator window. This is user-reported evidence, not agent-observed testing. OS/Safari versions and display model were not supplied.

The user subsequently confirmed Show → Next → Blank → Next while blank → Restore works, including invisible pending navigation and restoring the pending slide.

The user also confirmed that refreshing live output and closing/reconnecting output both recover to black and require explicit Show before revealing content.

The user also confirmed Stop, Test Output (black start, explicit pattern and Blank), and a Safari cold restart with Wi-Fi disabled all worked. Startup displayed a fullscreen transient-activation TypeError; this is tracked below.

Still pending on this hardware: long-running recovery, update coordination and remaining detailed checklist items. The fullscreen fix retest is recorded below. Windows Chrome/Edge checks remain pending. The full physical acceptance gate is not yet passed.

## Remaining checklist

Record date, OS/browser version, installation mode, monitor arrangement, action, actual result, evidence and pass/fail for every row. Chromium automation is not evidence of Safari Spaces or physical screen placement.

Run on Windows 11 Chrome and Edge, and real macOS Safari, with an extended display/projector:

- Fresh visit under `/repository/`; inspect icons, manifest scope, worker scope and hash output refresh. Install where supported; document Safari Add to Dock differences.
- Configure automatic display access: grant, deny, unsupported, one screen, multiple secondaries. Only real discovered screens appear. Multiple secondaries require selection. Confirm projected window coordinates visually; manually reposition in every case.
- Allow and block popups. Retry must work from a new click. Test with fullscreen enabled and disabled; reject fullscreen and recover using output button. Safari Spaces: verify intended display and retain a usable operator window.
- At startup, reload, output crash/reconnect, operator reload, slow loading and fullscreen transition: observe black continuously; no previous slide may flash. Direct `#/output` without session stays black.
- Explicit Show; previous/next; pending change while blank; Restore; immediate Blank; Stop. Operator notes never project. Verify keyboard focus and shortcuts, including output keyboard access.
- Test Output starts black, Show Test Pattern shows boundaries, Blank is instant; no selected service text leaks. Closing test output must return to a non-live operator state without changing selection.
- Close output, disconnect projector, sleep/wake, background both windows for 30 minutes. Observe timeout warnings and conservative black recovery. Never assume heartbeat proves physical projector connection.
- Wait for offline-ready; close browser completely, disable network, reopen installed app and output. Check no runtime third-party requests. Rehearse before live use.
- Deploy a new version with two operator tabs and an active output. No active presentation reloads. Stop all sessions before explicitly applying update. Test cache recovery after interrupted update. Retain an external backup and the previous artifact; only redeploy code compatible with the database schema already opened. Use a compatible reader or forward repair after a schema upgrade; never clear site data as an update procedure.
- Accessibility: tab through all controls at laptop size, 200% zoom, confirm focus/contrast; resizable editor remains usable.

Further physical acceptance: storage persistence/eviction, backup/restore on a clean profile, invalid archive handling, videos/codecs per browser and converted source content still need real-device rehearsal. Automated implementation evidence is recorded separately in VERIFICATION.md and RELEASE_ACCEPTANCE.md.

## Fullscreen startup fix

Startup now checks transient user activation before requesting fullscreen. When activation is absent or its API is unavailable, output stays black and asks for an in-window Enter Fullscreen click. A rejected click gives friendly guidance rather than exposing a raw TypeError. Retest in real Safari after applying the updated app shell; do not mark that fix physically verified until confirmed.

Safari fix retest: agent observed the old raw error in a cached output, stopped the test session, applied the waiting app update, and opened new output. The new output showed the fresh-gesture instruction rather than the TypeError and stayed unrevealed. Startup correction verified in Safari; no data clearing required.

## 0.2.0 library/planner acceptance — pending on real Safari/Windows

- Create a bilingual song with a leading-zero/alphanumeric number, several slides per section and a repeated chorus arrangement. Save, reopen and check order and metadata.
- Create/rename/duplicate/reorder a service, add the song and a slide set. Change service notes and item design, switch selections, quit/reopen, and verify persistence and unchanged library masters.
- Import a local image and representative video. Verify thumbnails/preview, output readiness/error handling, reference-protected deletion and no notes on output. Blank immediately during loading; reconnect/refresh must remain black.
- Cache the shell and import media, quit browser, disable network and reopen the service and output. Never assume the earlier sample-only cold-start result covers this new storage/media workflow.
- Export a full ZIP; restore on a clean profile and compare text, media, arrangements, service order, notes and item designs. Test malformed archive rejection without altering current data. Keep an external backup.
- Stop all outputs before applying the new worker update. Verify the Library & planner navigation appears; a cached older shell can otherwise hide the new phase.

## 0.3.0 rendering/media acceptance — pending on real Safari/Windows

- Export an external backup, stop all outputs, then apply the waiting app-shell update. Check Service design & output profile, item and slide settings are available.
- Compare primary/bilingual text, explicit blank lines, outlines, safe margins, vertical/horizontal alignment and Auto Fit in preview/output at different physical resolutions. At minimum-size overflow, output must remain black with actionable guidance. Verify local CJK font fallbacks.
- Confirm service inheritance, item Custom, slide Custom and resetting to Inherit. Switch selection/restart; verify settings persist and source masters stay unchanged. Old 0.2 records must retain their established precedence.
- Import representative MP4/H.264, WebM and MOV files on each browser. Check dimensions/duration, actual decode, muted loop, image/video fit and darkening. No codec is considered supported merely because its extension/MIME is recognized.
- Navigate with an unchanged background and observe continuity. Blank must be instant and pause motion; Restore resumes. Changing sources, non-looping end, fullscreen transitions and display sleep/wake require separate evidence.
- Interrupt loading with Blank, Stop, navigation and reconnect. No delayed load may auto-reveal after Blank. Break a background and verify configured poster/colour warning; break foreground media and verify black/error. Notes and preview labels must never project.
- Backup/restore profiles, all three background scopes and posters on a clean profile. Verify reference-protected media deletion and version-1 compatibility. Reopen with network disabled after caching/import.

### Safari test-output fullscreen failure and recovery — 17 October 2026

The user reported a white screen with “click to exit full screen” during test-output startup. The agent inspected the output window and observed Safari's light-grey “Click to Exit Full Screen” placeholder instead of web content. The operator still reported acknowledged black, so that status did not establish physical black output. Test-mode webpage fullscreen startup fails acceptance on this attempt; earlier normal-mode confirmations remain scoped to those attempts.

The agent clicked Safari's exit placeholder, verified the output page still reported black, then used the native macOS window fullscreen control. The captured output was completely black. The agent returned to the operator, which remained connected and black. The user confirmed that the iPad was completely black with the exit message gone after this recovery. The agent then explicitly selected Show test pattern; the operator acknowledged the test pattern as live. The user confirmed that the iPad showed “Sanctuary · Test output” with the safe-area boundary and no Peace lyrics. The agent then selected Blank screen and received confirmed-black acknowledgement. The user confirmed that the test pattern disappeared immediately and left the iPad completely black. The agent then ended test mode; the operator returned to connection setup. Physical confirmation of this final test-window closure has not been separately requested. Pattern isolation and blanking pass on this attempt after the native-fullscreen workaround; webpage fullscreen startup remains a recorded failure. This is an operational workaround, not an application code fix or proof of the underlying Safari/Sidecar cause. Do not mark repeated webpage fullscreen reliable on this setup.

### Song-section rehearsal prepared — 17 October 2026

At the user's request to proceed, the agent created a clearly labelled local service “REHEARSAL — section navigation” and reusable song “REHEARSAL — verses chorus bridge” in Safari. Synthetic text identifies each section. The saved order is Verse 1 → Chorus → Verse 2 → Chorus → Bridge → Chorus; the bridge has two distinct pages (seven runtime pages total). Creation used staged whole-song paste, explicit Apply, repeat controls and Save song and add to service. This is rehearsal data, not approved worship content.

The agent disabled webpage Request fullscreen for this session, opened black output, moved it to KB’s iPad Air and used native macOS window fullscreen. Selecting Chorus at position 4 selected page 4/7 and showed Bridge page one as the next destination. Take was requested; confirmation of the displayed chorus and subsequent bridge navigation remains pending.

The first chorus Take remained PREPARING during repeated operator observations. On selecting the output window through Safari's Window menu, the agent observed “REHEARSAL — CHORUS”; returning to the operator showed LIVE with the chorus acknowledged. The delay/focus relationship needs further investigation; do not count this as responsive background-output acceptance. Physical confirmation is still pending.

### Rehearsal halted at user request — 17 October 2026

The user reported that the iPad did not show the chorus and clarified that it showed the desktop or another app. The operator's acknowledged chorus therefore did not establish visible physical output. Song navigation acceptance remains incomplete. The agent requested Blank, inspected the output (black), exited native fullscreen and began inspecting windowed placement. Before completing that recovery, the user requested that testing halt. The agent closed the black congregation window and ended the presentation session. No further test or reveal was performed. The labelled rehearsal song and service remain saved locally for later investigation. Native fullscreen worked in the earlier confirmed test-pattern attempt but did not establish reliable physical placement/visibility in this later song attempt.

## Local follow-up manual testing on Acer B247Y — 17 October 2026

The user requested manual testing of the skipped changes and specified the secondary monitor instead of the iPad. The agent started the local production preview at http://127.0.0.1:4174/sanctuary-presenter/ in Safari; this is the un-deployed follow-up build, not the GitHub Pages release. The local origin initially had no saved services. No automated suite was run.

Observed manual setup: Manual selected, automatic discovery disabled, Request fullscreen unchecked, recovery guidance visible. The output opened black with fullscreen=0. macOS Window → Move to Acer B247Y placed it on the secondary monitor. The user confirmed a visible black content area while the operator remained usable on the Mac.

The agent took Welcome and selected Together without Take. Live acknowledgement remained Welcome, and the user confirmed Welcome still appeared on the Acer. The agent then blanked output and received a black acknowledgement.

Minimising the output window caused OUTPUT HIDDEN and a disabled Take button. An S key press did not reveal content or change that state. A wording issue was observed: the preview caption still said Preparing while visibility blocked Take. Restoring the output window through Safari's Window menu showed black content; physical confirmation after restore remains pending. Additional manual checks remain in progress.

The user confirmed that restoring the congregation window left the Acer black with no Together slide. Restoration was not immediately clean in the operator: the Take button looked enabled, but clicking it still returned the hidden-output guidance without revealing content. The agent used Display setup → Reposition Output, returned to the operator and closed setup. Take then acknowledged Together, and the user confirmed Together on the Acer. Record this as successful recovery through Reposition Output, with an unresolved interim status/control consistency issue, not seamless minimise/restore acceptance.

The agent blanked and ended the session. For a manual timeout attempt, another disposable demo output was opened. Safari's popup did not expose an editable address through Open Location. Closing the output and immediately inspecting the operator showed DISCONNECTED with Reconnect display, so no Take request was accepted and the 15-second timeout was NOT exercised. This verifies closed-window detection, not timeout expiry. The disconnected session was ended and no output window remains open.

| Local follow-up check | Manual result |
| --- | --- |
| Unsupported automatic display selection and windowed defaults | Pass in Safari |
| Black startup on Acer while operator remains usable | Pass, user-confirmed |
| Welcome Take and preview-only Together selection | Pass, user-confirmed |
| Blank acknowledgement | Pass, operator-observed; restored black user-confirmed |
| Minimise: OUTPUT HIDDEN and disabled Take | Pass, operator-observed |
| S while hidden | No reveal or state change observed |
| Restore without automatic reveal | Pass, user-confirmed |
| Restore status/control consistency | Issue: stale hidden guidance / enabled Take mismatch |
| Reposition Output then deliberate Together Take | Pass, user-confirmed |
| Caption while hidden | Issue: incorrectly says Preparing |
| Output closed → disconnected/reconnect state | Pass, operator-observed |
| 15-second pending Take timeout | Not exercised; disconnect prevented request |
| Pending Take becomes hidden; late acknowledgement rejection | Not exercised manually |
| Fullscreen/Spaces on Acer, song repeats/bridge, staged edits and offline cold restart | Not covered by this focused follow-up run |

No automated suites were run. These results cover the un-deployed local follow-up only; they do not certify all UI scenarios or resolve the earlier Safari/iPad failures.

### Corrected caption and visibility-state retest — 17 October 2026

The local follow-up was rebuilt and applied through Safari's waiting-update control with output stopped. Build asset: index-BONZLPOD.js. No automated suite was run.

The agent opened black demo output, moved it to Acer B247Y and minimised it. The operator showed OUTPUT HIDDEN, disabled Take and the corrected caption “Preview stays local. Bring the output window into view before Take.” Restoring through Safari's Window menu and returning to the operator showed OUTPUT BLACK, enabled Take and “Output page visible again. Verify the physical display; Take is still a separate action.” The earlier stale hidden notice was absent on this attempt. The output remained black until Take.

An initial tool click did not change output; a subsequent click with operator focus acknowledged Welcome. The user confirmed Welcome on the Acer. Native input focus remains a limitation when interpreting non-acting tool clicks; the retest does not establish the cause of every earlier click/paint mismatch. End presentation returned to connection setup and closed output. This confirms the corrected caption and consistent visible-state guidance in this manual run, not universal Safari/Spaces reliability. Timeout expiry and pending-Take/late-acknowledgement cases remain unverified manually.


### Timeout and native-fullscreen closure checks — 17 October 2026

Hardware: Safari on the Mac with Acer B247Y, selected by the user instead of iPad/Sidecar. The initial webpage Enter Fullscreen attempt used the previously cached local candidate labelled 0.7.0-rc.1. After returning to the operator, the operator reported OUTPUT HIDDEN and disabled Show test pattern; the user confirmed a white/grey “Click to Exit Full Screen” placeholder on the Acer. This is a failed webpage-fullscreen attempt, not a pass. The session was ended.

With output stopped, Safari applied the waiting update and visibly identified 0.7.0-rc.2. Black test output was opened, moved through Window → Move to Acer B247Y, and expanded with the native macOS window fullscreen control, without the webpage Enter Fullscreen button. After returning to the operator, the app reported OUTPUT BLACK and enabled Show test pattern. The user confirmed completely black output with no placeholder and a usable operator. An explicit Show test pattern produced LIVE and the user confirmed the correct fullscreen pattern and safe-area boundary. Blank received a black acknowledgement, and the user confirmed immediate removal of the pattern and completely black output. The session was ended. Native window fullscreen is a verified fallback for this attempt on the Acer; it does not certify webpage fullscreen, repeated Spaces transitions, or iPad/Sidecar.

A local-only manual transport-fault fixture served the unchanged 0.7.0-rc.2 production bundle on 127.0.0.1:4180, with an injected output-side BroadcastChannel wrapper. It held rendered nonblank OUTPUT_STATUS confirmations while continuing heartbeats and black confirmations. No timeout duration, operator logic or render logic was changed. The fixture exposed visible buttons; the agent operated Safari manually. This used the bundled Demo service on a separate local origin, with no imported user content and no external server.

Take entered PREPARING while one rendered-frame confirmation was held. After a real wait longer than the 15-second deadline, the operator showed OUTPUT BLACK and “Take timed out; the output window has now confirmed black.” Observation occurred approximately 23 seconds after the Take action; exact callback timing was not instrumented. The user confirmed the Acer content was black, with only the deliberately visible local fault-controls box remaining. This exercises timeout expiry rather than closed-window detection. It covers a withheld confirmation after rendering, not a stalled database preparation or suspended browser.

The agent then released the held nonblank confirmation with a fresh, monotonic sequence number, so rejection did not depend only on an old sequence. The output remained black and the operator retained OUTPUT BLACK, no live frame and timeout guidance. After removing the test box and unblocking confirmations, a fresh explicit Take received LIVE. The user confirmed Welcome (“A place to gather. A moment to be still.”) on the Acer with the box gone. Blank was acknowledged and End returned the operator to connection setup. No output session remained active.

| Focused check | Result |
| --- | --- |
| Safari webpage fullscreen after return to operator | Fail on this cached-candidate attempt; Acer placeholder confirmed |
| Native macOS window fullscreen, current candidate, Acer | Pass for black start, deliberate pattern, operator usability and Blank |
| Pending Take confirmation timeout with heartbeats continuing | Pass using local manual fault fixture |
| Late confirmation after timeout, with fresh sequence | Pass, operator/output observed; no live transition |
| Fresh Take after recovery | Pass, user-confirmed Welcome |
| iPad/Sidecar fullscreen and placement | Not retested; earlier failure remains open |

Reproduce the manual fault check after building: run `python3 tools/manual_fault_server.py`, open `http://127.0.0.1:4180/sanctuary-presenter/` in Safari, select Present and open normal congregation output. The output starts with confirmation holding enabled and a clearly labelled local controls panel. Move it to the test monitor, return to the operator and Take the bundled Welcome slide. Wait beyond 15 seconds, inspect the timeout and black state, release the old confirmation, verify no LIVE transition, hide the panel and retry Take. Blank and End before stopping the server. Use this dedicated local origin only; never deploy the injected fixture. No new automated test suite was run in this session.


### Song navigation on Acer — 17 October 2026

Safari 0.7.0-rc.2 at localhost:4174. Created labelled local Library song “REHEARSAL — verses chorus bridge” and service “REHEARSAL — Acer song navigation”. The separate service copy uses Verse 1 → Chorus → Verse 2 → Chorus → Bridge → Chorus, seven slides including two Bridge pages. No existing user song was edited. Output was moved to Acer B247Y and expanded with native window fullscreen. The user confirmed black startup and a usable operator.

Take Verse 1 received LIVE. Direct Chorus jump selected page 2/7 while the last-confirmed frame stayed Verse 1; the user confirmed Verse 1 remained physically visible. Take Chorus received a Chorus acknowledgement. Selecting Chorus occurrence position 4 showed page 4/7 and Bridge page one next; the user confirmed Chorus physically visible and the correct operator position. A Take of this visually identical repeat produced no distinct AX change, so its acknowledgement cannot be separately inferred from that action. Direct Bridge jump selected Bridge slide 1, page 5/7, exposed Slide 1/Slide 2 controls and showed Bridge page two next. The user confirmed Chorus remained on the Acer while Bridge page one was previewed. Take Bridge page one updated the last-confirmed frame to Bridge page one. Selecting the section’s Slide 2 control previewed Bridge page two at 6/7, with the final Chorus next; the last-confirmed frame remained Bridge page one. The user confirmed Bridge page one remained physically visible while Bridge page two was previewed. Take Bridge page two updated the last-confirmed frame to page two. Next preview selected the final Chorus occurrence (position 6), page 7/7, displayed End of service and disabled Next; the last-confirmed frame remained Bridge page two. The user confirmed Bridge page two remained visible while the final Chorus was previewed. Take final Chorus updated the acknowledged frame to Chorus. A direct backward Verse 2 jump selected page 3/7 and kept Chorus as the live frame; the user confirmed Chorus remained on the Acer. Take Verse 2 then updated the acknowledged frame to Verse 2; the user confirmed Verse 2 physically visible. Blank received a black acknowledgement. A direct Chorus jump selected the next Chorus occurrence (position 4, page 4/7) while output stayed blank. The user confirmed the Acer turned completely black and stayed black during this preview change. End returned the operator to connection setup and closed the output session.


This focused song-navigation rehearsal passes black startup, direct section jumps, correct repeated-Chorus position/next destination, separate Take, two-page Bridge navigation, final-slide boundary, backward jump to Verse 2 and preview navigation while blank. Physical confirmations cover the specific observed frames above. The visually identical repeated-Chorus Take was not independently distinguishable in AX; do not infer an additional unique reveal from it. Staged corrections, service-copy/source isolation and offline cold restart were not exercised in this navigation phase. Labelled practice data remains saved locally for those checks.


### Staged lyric correction — 18 October 2026

Local 0.7.0-rc.2 with the unpublished Show slide wording update, Safari and Acer B247Y. User confirmed black native-fullscreen output with a usable operator. Show slide acknowledged the practice Verse 1 original words. Prepare / stage edits initially opened “Choose a service” instead of the active service; reopening the labelled rehearsal service through Services allowed editing. This navigation issue remains open.

Changed only the service-copy Verse 1 second line from “First verse words.” to “Corrected verse words.” The saved correction appeared as waiting to Apply. The user confirmed the Acer still showed original words after saving. Apply saved changes updated the presenter preview to corrected words and retained the original acknowledged live frame, labelled “Live: previous version.” The user confirmed original words physically remained on the Acer after Apply.

Before the corrected Show slide action could be accepted, Safari reported OUTPUT HIDDEN and the button was disabled. No corrected reveal was claimed. Display setup → Reposition Output and returning to the operator did not clear the hidden state on this attempt. Physical display state is being checked. The staged-correction phase is partial: Save/Apply isolation passed this attempt; corrected reveal and source-Library isolation remain pending. Session remains active.


The user subsequently confirmed the Acer showed its desktop or another app during the hidden-output state. Thus native fullscreen did not remain physically visible throughout this staged-edit rehearsal, despite earlier successful pattern/song checks. The cause of the macOS/Safari Space change is not established. Blank was requested and operator showed BLANKING until the output was brought forward through Safari's Window menu. Output inspection then showed black. Exiting native fullscreen with Control–Command–F restored a windowed output on the Acer (Window menu offered Move to Built-in Retina Display). Returning to the operator showed OUTPUT BLACK, black acknowledgement and enabled Show slide. Physical confirmation of windowed black recovery is pending. This narrows native-fullscreen acceptance: the earlier passes apply only to their observed attempts, not reliable visibility through all editing/window transitions.


Windowed recovery and correction completed: the user confirmed a visible black congregation window on the Acer with a usable operator. Show slide then acknowledged corrected Verse 1, and the user confirmed “Corrected verse words.” physically visible. Blank was acknowledged, End closed the output session, and the operator reported OUTPUT STOPPED. Inspection of the saved Library master showed original Verse 1 “First verse words.”, confirming the service-copy edit had not changed the reusable source. No Library save or source refresh was performed.

Save/Apply isolation, deliberate corrected reveal after windowed recovery and Library-source isolation pass for this practice song. Native-fullscreen visibility through the full workflow does not pass; the output became hidden and recovery required exiting fullscreen. Prepare / stage edits routing also needs correction. No offline cold restart was performed in this phase.


### Active-service Prepare routing fix — 18 October 2026

Prepare / stage edits now sends an explicit saved-service request to ServiceWorkspace. It loads the saved active presentation service after pending saves settle, preserves an already-open working copy/draft, and reports a missing service rather than silently selecting another. Safari applied the local update with output stopped. After reload, Present → Close setup → Prepare / stage edits opened “REHEARSAL — Acer song navigation” directly with its seven-slide order and saved “Corrected verse words.” The previous Choose a service detour was absent. No congregation session was opened for this routing retest.

TypeScript, ESLint, production bundling and all seven presenter Chromium checks passed. The presenter regression now reloads after service creation to exercise the missing-workspace-selection case, then edits and applies during presentation while preserving live output. Updated Safari setup guidance recommends windowed output and records that both webpage and native fullscreen lost physical visibility in rehearsal. This is guidance around an observed browser/Spaces limitation, not a browser fullscreen fix. These changes and Show slide wording remain local and unpublished. Offline cold restart remains pending.


### Safari cached cold restart with origin unavailable — 18 October 2026

Local 0.7.0-rc.2 with unpublished Show slide wording, Prepare routing fix and windowed-Safari guidance. Confirmed App shell cached · offline ready and no active presentation. Stopped the local Vite server on 127.0.0.1:4174; an independent curl request failed with connection refused. Quit Safari using Command–Q, reopened it to Start Page, then entered the exact /sanctuary-presenter/ URL. The app loaded from cache and listed the saved rehearsal service. Opening it showed its seven slides and preserved “Corrected verse words.”

While the server remained stopped, Present opened a new black output window from cache. It was moved to Acer B247Y and kept windowed. The user confirmed black output and a usable operator. Show slide acknowledged corrected Verse 1. Selecting Chorus changed preview only, and the user confirmed the Acer retained corrected Verse 1. Blank was acknowledged. Selecting Bridge page one changed preview to page 5/7 while the user confirmed the Acer went black and stayed black. End returned the operator to connection setup and closed the output session. The local preview server was restarted afterward.

Pass for this Safari profile and local origin: browser cold startup with the app origin unreachable, persisted service content, fresh black output, deliberate reveal, preview separation and blank navigation. The Mac’s internet/Wi-Fi remained enabled; this was not a full network-disconnected test or a hosted GitHub Pages cold restart. The rehearsal used synthetic text, not imported audio/video/images or a full real service. Those broader offline acceptance cases remain open.


### Hosted Safari offline cold restart — 18 October 2026

After hosted Safari visibly activated 0.7.0-rc.3, reported App shell cached · offline ready, retained “REHEARSAL — section navigation”, and exported a full backup, the user followed the requested procedure: disconnect internet (Wi-Fi and Ethernet if connected), quit Safari completely, reopen https://kengbeng.github.io/sanctuary-presenter/, open the saved rehearsal service, then reconnect. The user reported “App and saved service opened offline.”

Pass, user-confirmed, for cached hosted application startup and saved-service access after a full network-disconnected Safari restart in this profile. Network state and restart were performed/reported by the user, not instrumented by the agent. This does not separately establish physical output, imported media playback, editing persistence or a complete service while fully disconnected. Local-origin-unavailable output and automated hosted offline output evidence remain separately scoped above and in VERIFICATION.md.


### Hosted synthetic media rehearsal — 19 October 2026

Prepared synthetic files locally: REHEARSAL-image.png and REHEARSAL-video.mp4 (960×540, 12 seconds, moving bar/timer, silent). PNG generated with Pillow; MP4 converted by macOS avconvert from generated MJPEG frames. Imported both through hosted Safari's Library media picker, which confirmed local storage and parsed the video dimensions/duration. Files remain in /private/tmp/sanctuary-media-rehearsal and hosted-origin IndexedDB; no user media was used.

Created a separate hosted service “REHEARSAL — local image and video” with the image first and video second. Present opened a new windowed black output with image preview ready and Show slide enabled. The output Window menu offered Move to Built-in Retina Display, indicating it was already on an external display; user confirmation of physical Acer placement is pending. No reveal or offline media pass has been claimed. Session active for manual checks.


Media follow-up: user confirmed black output physically visible on Acer while Mac operator usable. Show slide revealed the local PNG; Next preview selected the MP4 at 2/2. The user confirmed the Acer retained the LOCAL IMAGE/teal-border image during video preview. A deliberate Show slide then revealed the MP4, and the user confirmed the yellow bar moving and timer changing. Blank received a black acknowledgement; Previous preview selected the PNG. Physical black persistence at this final boundary is pending. These checks were connected-network rehearsal; no fully disconnected media result is claimed yet.


The user confirmed the video disappeared immediately and the Acer stayed black while the PNG was selected in preview. End returned OUTPUT STOPPED. A full backup including the new media/service was exported before the disconnected run.

For the fully disconnected check, the user was instructed to disconnect internet, quit/reopen Safari, open the hosted app and “REHEARSAL — local image and video”, start windowed output on Acer, verify black startup, show the PNG, preview then show the MP4 with motion, Blank and End, then reconnect. The user reported “All passed offline, including moving video and Blank.” This is user-confirmed evidence for hosted cold startup, persisted imported synthetic image/MP4, new black output, deliberate media reveal/playback and blanking on Safari/Acer with internet disconnected. Network disconnection, physical observations and final closure during that run were user-performed/reported, not instrumented by the agent.

The two-item synthetic-media offline rehearsal passes for this profile/setup. It does not certify other codecs, audio (the sample is silent), long/large media, real-service assets, storage eviction, every browser or fullscreen reliability. Labelled practice content and source files remain available; no user content was uploaded.
