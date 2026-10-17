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
