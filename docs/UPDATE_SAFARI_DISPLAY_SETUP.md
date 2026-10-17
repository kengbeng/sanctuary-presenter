# Safari display setup follow-up — 17 October 2026

The Safari/iPad rehearsal exposed two physical-display failures despite output-window acknowledgements: Safari showed a “Click to Exit Full Screen” placeholder, and a later native-fullscreen attempt left the iPad showing its desktop or another app. A chorus Take remained preparing until the output window was selected. The underlying browser/Spaces/Sidecar behaviour has not been established or fixed.

The local follow-up defaults browsers without the automatic display-selection API to Manual and leaves webpage fullscreen unchecked. Automatic selection is visibly unavailable on those browsers. Supported browsers retain discovery and fullscreen opt-in. All browsers retain explicit black-first output, preview/Take separation and manual positioning.

Display setup explains moving the black window using macOS's Window menu, keeping it windowed until placement is verified, exiting Safari's fullscreen placeholder, and rechecking visibility after returning to the operator. The connection message explicitly distinguishes a connected window from physical display visibility. Connection details label the actual webpage fullscreen state, which cannot report native window fullscreen.

Production bundling succeeds. At the user's request, no unit, browser or hardware tests were run for this follow-up. It remains a local change and has not been deployed. Rehearsal results in MANUAL_TESTS.md remain scoped to actual observations; incomplete song navigation, staged-edit, recovery and offline checks have not been marked passed. The saved labelled rehearsal content remains in the user's Safari profile for later work.

## Pending Take recovery

The modern presenter now starts a 15-second confirmation timer for each Take, including local frame preparation. If it expires while that request/session is still current, it invalidates the preparation, requests black with a newer command and presents physical-display/reconnect guidance. It does not claim that the physical display is black. A later valid black acknowledgement updates the notice to distinguish confirmed black from the original timeout. Late acknowledgements of the cancelled frame cannot mark that Take live because the pending identity and visible intent were cleared.

Successful reveal, Blank, End, session replacement, Apply cancellation and component cleanup clear the timer. A newer Take supersedes the previous timer. Browser suspension can delay timer execution; the deadline is not a guarantee of physical display state. This is defensive recovery, not a fix for the Safari/Sidecar visibility issue.

The combined changes compile with TypeScript and production bundling. No automated or physical tests were run, as requested. Deployment remains unchanged.

## Browser-reported output visibility

Output messages now include the page's current visibility, and visibility changes send a separate OUTPUT_VISIBILITY notification. That notification contains no rendered-frame acknowledgement. The protocol validates its boolean field; the optional visibility field remains compatible with older messages, whose visibility stays unknown rather than being invented.

The modern operator labels a browser-reported hidden output as OUTPUT HIDDEN, displays persistent placement guidance and disables Take, including keyboard requests. If the page reports hidden while a Take confirmation timer is active, the pending reveal is cancelled and black is requested. Visibility becoming visible does not send a new Take or reveal content. Blank and End remain available. Disconnection status takes precedence over the hidden-page warning.

Page Visibility is a browser signal, not proof of a physical monitor, visible macOS Space, window placement or projector power. Missing/delayed notifications and browser suspension remain limitations. The underlying Safari/iPad issue remains unverified. No tests or physical rehearsal were run for these changes.

## Restoration wording and control consistency

The hidden-output caption now explains that preview remains local and the output must be brought into view; it no longer labels this state as preparation. Visibility transitions commit the external-window signal synchronously so the operator controls reflect it before another action. A return to visible output replaces stale hidden guidance, while still requiring a separate Take and physical placement check. The keyboard/action guard also synchronises the hidden state before refusing Take.

TypeScript and production build pass. The manual Acer minimise/restore retest in MANUAL_TESTS.md confirmed the new caption, disabled Take while hidden, visible-state guidance after restoration and a user-confirmed Welcome reveal after Take. No automated suites ran. This does not certify the remaining timeout or Safari/Sidecar scenarios, and the changes remain local.
