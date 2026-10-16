# Phase 3 rendering and media increment — 0.3.0

## Scope and implementation

The user requested proceeding after the Phase 2 delivery. This authorizes the next development increment; it does not certify the new library/editor/media workflows on Safari or complete Windows physical acceptance.

- `model.ts` resolves service → item → slide typography/background inheritance with explicit Inherit/Custom states. Old records without a mode retain 0.2 item-over-slide precedence. No records are rewritten automatically and IndexedDB remains schema 1; all new stored fields are additive/optional.
- Output profile values are copied from inspected v1 presets: Projector, LED wall and Livestream, plus editable Custom. Names describe layout defaults only. Values expose safe margins, preferred/minimum 1080p sizes and secondary scale; editing Custom does not modify factory presets.
- `DesignEditors.tsx` and `Library.tsx` expose profile/service, item and slide designs, local font/CJK font choices, weight, alignment, line spacing, colour, outline, safe margins and Auto Fit. Editing slide or item fields enables that scope's Custom override. Source masters and service copies remain independent.
- `SlideFrame.tsx` uses a fixed 1920×1080 logical canvas, then scales it to a 16:9 frame at arbitrary display sizes. Operator and congregation use identical markup, local font metrics and deterministic bounded binary-search fitting. Hard line breaks and bilingual channels are preserved. The minimum-size overflow case gives an operator error and stays black rather than silently clipping projected content. Preview fit information appears outside the congregation frame.
- Backgrounds support solid colour, local image/video, cover/contain, darkening, muted looping and optional local image poster. All scoped background/poster references participate in save, backup and deletion checks.
- Media import inspects dimensions and available duration before storing; foreground/background preparation checks actual decoding and times out with actionable feedback. MIME/type support alone is not treated as codec proof.
- `main.tsx` cancels superseded media preparations. Blank renders an independent black overlay immediately and hides the entire output surface. Rendered acknowledgement is separate from command receipt, media preparation and fullscreen status. Notes and source/library metadata are excluded from prepared frames.

## Playback decisions tested in Chromium

After a successful Show, the media surface stays mounted while black but is hidden and paused. Restore resumes an unchanged source. Slide navigation with the same background retains the same video element/source; changing the resolved background changes source normally. Normal play/pause interruption (`AbortError`) is not reported as a failed codec. Stop/session replacement ends the presentation; reload/reconnect starts black and requires Show.

Operator video previews are static (poster or configured fallback colour). They do not run background/foreground video decoders continuously. Only congregation output plays videos. For a preparation/decoder failure in a background, a validated configured poster is preferred, otherwise the configured solid colour is shown with an operator warning. Foreground media failure stays black. Backgrounds are always muted. Non-looping videos retain their last frame when ended; a deliberate new session starts playback from the beginning.

Decoded readiness is cached for immutable local media IDs within the page lifetime. Blob URLs are revoked on source replacement/unmount. Interrupted loads release their resources. Fallbacks, load cancellation and render-ready behavior are covered by browser tests; long-running hardware performance and full codec matrices remain manual acceptance work.

## Compatibility and data protection

Version-2 backup manifests now identify the richer design contract; current restore accepts versions 1 and 2, and preserves legacy design values. Current full backups include all profiles, scoped style/background settings, media and posters, plus content/services/settings from the previous increment. Old applications reject version-2 archives instead of claiming to restore newer design semantics. Do not roll back to older app code to edit richer designs; keep external backups before updates.

There is no destructive database migration or automated v1 conversion. Existing libraries are read in place with optional defaults. Every generated output frame contains only resolved presentation fields. No user content, media, fonts or analytics are fetched from or uploaded to remote services.

## Validation and remaining work

Automated cases compare fitted font size between operator/output and at different output viewport sizes; verify minimum overflow stays black; use a synthetic locally generated VP8/WebM through the actual import UI to verify dimensions, muted playback, same-source continuity and pause/restore; check configured colour/poster fallback; cancel an in-flight image decode; inspect profile values/persistence; check inherited media deletion protection and version-1/version-2 backup compatibility. See VERIFICATION.md for final results.

Not claimed: real Windows Chrome/Edge or Safari codec/Spaces/projector validation, native/Qt pixel equivalence, uninstalled font availability, long-running memory/performance, or v1 data migration. Review/readiness, No Words, optional presentation overlays, trash/undo/usage reports and localization remain explicit parity backlog. Multi-item/multi-slide design application and more complex content-block layouts also remain later editor work. Library/source import samples and remaining release checks are still needed before a production release.
