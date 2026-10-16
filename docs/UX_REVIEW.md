# Main-interface UX review — 16 October 2026

Reviewed the deployed 0.5.0 app at https://kengbeng.github.io/sanctuary-presenter/ in a 1280 × 720 in-app browser viewport. Inspected the operator screen, startup, live, blank/pending, stop and empty-library states, with supporting source inspection at commit d39c15a. This is an expert review and targeted interaction check, not a usability study, accessibility certification or physical Safari/projector test. No application code or production settings were changed. The review session used sample content and was stopped afterwards.

## Priority 1: safety and operational access

1. **Blank shortcuts fail after clicking a control.** Reproduced Start → Show → Next → B: status stayed LIVE. Escape with Next still focused also stayed LIVE. `src/main.tsx:684` excludes button targets from every shortcut. Most mouse operations leave a button focused, making the advertised shortcuts unavailable during ordinary use. Allow emergency blanking from focused buttons; continue protecting editable fields from accidental character commands. Decide Escape behavior for native controls deliberately. Verify B/Escape after Start, Show, Next and service-list clicks, plus text-entry and modifier-key regressions.

2. **Critical output controls are below the visible screen.** At 1280 × 720, Show/Restore and Blank occupied document y=942–977; Stop was y=1049–1097. The page extended to roughly 1222 px. Output setup fields, a large startup-black illustration and diagnostics precede those buttons. Keep Show, Blank, Next and output status visible in a persistent live-control area. Bound the layout to the viewport and scroll the service list/setup independently. Test representative laptop viewports and browser zoom; the operator should never need to scroll to blank output.

## Priority 2: clear state and workflow

3. **Selected content and congregation output are not clearly separated.** The main label remains CURRENT / PENDING in every phase. The black panel is a constant startup illustration (`src/main.tsx:849`), not a live monitor; it stays black when actual output is LIVE. The smaller status block explains output state but is below the fold. Recommendation: clearly label the main pane Pending while blank and Live while transmitting; show an always-visible congregation state, e.g. OUTPUT BLACK / LIVE / DISCONNECTED. Remove the startup illustration after connection or replace it with an accurately labelled acknowledged-output view. Never imply a preview is proof of physical placement.

4. **Setup, recovery and live actions compete.** Configure Display, Test Output, Start, Show, Blank, placement confirmation, reconnect, reposition and Stop remain together. Start stays available during LIVE and starts a replacement session, so an ordinary-looking setup action can interrupt a service. Recommendation: separate Setup from Live controls, collapse setup after connection, present reconnect prominently only on loss, and guard a deliberate restart while active. Use plain-language state text instead of READY_BLANK/BLANKED as the main operator message. The notice can also remain “verify placement before Show” after Show, so make guidance phase-specific.

5. **First use explains the system more than the task.** The default screen presents a usable sample service, but preparing a real service requires discovering Library & planner, creating/selecting a service, creating content, adding it and returning through Present this service. Technical/privacy prose and font measurements occupy high-attention space. Recommendation: label the sample clearly as a demo and offer a visible Choose service / Create first service entry point. Move font diagnostics, storage detail and longer privacy explanations into secondary panels. Keep a concise offline-ready indicator visible.

6. **End-of-service preview is misleading.** The next-preview code clamps to the final slide (`src/main.tsx:798`), so the last slide is displayed again under NEXT SLIDE. Recommendation: show End of service instead. Use the same explicit empty-state treatment when a saved service contains no presenting slides rather than displaying sample content in the central preview.

## What works well

The dark palette is calm, the primary slide preview is easy to read, service navigation is understandable, operator notes are visibly separated, and the privacy/offline message builds confidence. Startup was black; explicit Show and clicked Blank worked. Navigating while blank preserved the blank state. Those behaviors should remain unchanged while simplifying the interface.

## Recommended implementation order

First repair and regress keyboard blanking. Next keep essential controls and output state visible at laptop heights. Then clarify live versus pending state, simplify setup/recovery controls and add the first-service/end-of-service states. Preserve the existing black-first, explicit reveal, notes exclusion, focus visibility and offline behavior throughout.


## Resolution — 0.6.0

Implemented the six findings: keyboard blanking from focused buttons, persistent viewport-level controls, plain-language output and live/pending labels, removal of the static black illustration, collapsible setup and contextual recovery, direct service selection/creation, and explicit empty/end states. Active-session Start is guarded; switching services blanks first. Native text entry/selects/dialogs and modifier shortcuts are protected. Independent scrolling keeps the controls fixed when selecting from long services. See VERIFICATION.md for final automated results; physical Safari/Windows validation remains separate.
