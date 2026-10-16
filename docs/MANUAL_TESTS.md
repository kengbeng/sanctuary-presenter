# Physical acceptance gate — PARTIALLY COMPLETE

## User-reported Safari check — 16 October 2026

User reports that all five guided startup steps worked on a Mac with Safari and a second display: extended-display setup, Manual positioning and Start Presentation, completely black initial output, moving output to the second display and entering fullscreen, and continued access to the operator window. This is user-reported evidence, not agent-observed testing. OS/Safari versions and display model were not supplied.

The user subsequently confirmed Show → Next → Blank → Next while blank → Restore works, including invisible pending navigation and restoring the pending slide.

The user also confirmed that refreshing live output and closing/reconnecting output both recover to black and require explicit Show before revealing content.

The user also confirmed Stop, Test Output (black start, explicit pattern and Blank), and a Safari cold restart with Wi-Fi disabled all worked. Startup displayed a fullscreen transient-activation TypeError; this is tracked below.

Still pending on this hardware: long-running recovery, update coordination, remaining detailed checklist items and retesting the fullscreen fix. Windows Chrome/Edge checks remain pending. Windows Chrome/Edge checks remain pending. The full Phase 1 gate is not yet passed.

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
- Deploy a new version with two operator tabs and an active output. No active presentation reloads. Stop all sessions before explicitly applying update. Test cache recovery after interrupted update. Revert repository commit and redeploy to roll back; never clear site data casually once library storage exists.
- Accessibility: tab through all controls at laptop size, 200% zoom, confirm focus/contrast; resizable editor remains usable.

Future phases: local storage persistence/eviction, backup/restore on clean profile, transactional invalid archive rejection, videos/codecs per browser and source-backed migration remain untested/unimplemented.

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
