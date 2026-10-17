# U5: Real presenter integration

17 October 2026. Local implementation; not deployed to GitHub Pages.

## Operator workflow

The default Present destination now uses the dedicated console. Selecting a slide, song-order position or direct section changes Preview only. Take is the sole reveal action. Previous/Next select previews; the console separately shows the last acknowledged congregation frame and the actual next preview. Browsing another service item leaves selection and output unchanged. Operator notes remain private.

Song order retains repeated occurrences and page position. Quick section buttons include omitted sections. An omitted section creates a temporary path that resumes after the prior arranged page, without changing the saved song order. Its pages support Previous/Next; an explicit arranged-position selection discards the temporary path. Recovered sessions clear temporary history and remap the pending preview to an arranged destination. A new or recovered output remains black until Take.

Prepare continues saving independent service copies. Returning to Present stages the saved version; Apply validates its media and saved revision before replacing navigation. Apply requires output cancellation acknowledgement when connected and preserves the actual visible frame, even if its source was removed or changed. The console labels a retained frame from an earlier presentation version. A separate Take displays the new selection. Pending local saves disable Apply.

## Output and persistence

The new output route uses two render buffers. A replacement prepares while the current slide stays visible. Only a ready current-generation buffer becomes visible. Blank independently cancels pending work. Repeated Blank requests are acknowledged even when already black. The operator displays BLANKING until acknowledgement rather than claiming confirmed black immediately.

Presentation pins protect all arranged and omitted-section media for the session. Old version pins remain until End, so deleting or changing saved source records cannot remove assets used by the retained live frame. Pinning and source-version verification use an IndexedDB transaction; failed replacement does not retire prior pins. Render records exclude private notes and source metadata. End clears session pins. Interrupted browser/process termination may leave protective pins, as with earlier prepared output records; automatic abandoned-session cleanup remains follow-up work.

Cancellation and setup-control messages are additive to protocol version 1. The new operator requires the output cue capability before Take or Apply; older output clients cannot silently receive the new behavior. The explicit #/app compatibility entry retains its prior immediate-navigation behavior for regression coverage. It is not the default service workflow.

Display setup is a focused native dialog. Popup opening remains synchronous with the user action; automatic discovery, manual placement, a fresh fullscreen click and isolated test output remain supported. Pointer movement does not expose controls over live lyrics. The operator can explicitly show output setup controls. B/Escape remain safety actions outside protected editing/modal contexts; composite arrows move focus without also moving the preview. Held navigation/Take shortcuts are ignored.

## Evidence and remaining acceptance

Automated checks passed: 49 unit tests, 56 Python converter tests, 46 Chromium integration tests, TypeScript, ESLint, root/subpath production builds and PWA validation. The local release smoke check also passed with no third-party app requests or write requests. Detailed evidence is recorded in VERIFICATION.md. Tests use synthetic songs and media. The UI screenshot is presenter-preview.png.

Physical Safari with the second display, projector placement/readability, 200% browser zoom, screen-reader use, long-session video playback and participant usability checks remain unperformed. Automated viewport checks are not a substitute for these. The production site remains 0.6.0. U6 search, authoring restructuring and explicit source comparison/refresh, followed by U7 release acceptance and publication, remain separate work.

## Compact navigation refinement

Following user feedback, removed the duplicate Song order row above the preview. Repeated positions remain in the left service list with accessible position labels and selected-state feedback. The centre uses one compact Jump to toolbar; numbered slide controls appear alongside it only for multi-slide sections. On narrow screens the slide group may use a second line. Full section names and keyboard focus navigation remain available. The 1280×720 example recovers approximately 110 pixels of preview height. TypeScript, ESLint, production build and all six affected presenter browser tests passed; presenter-preview.png was refreshed and visually inspected.
