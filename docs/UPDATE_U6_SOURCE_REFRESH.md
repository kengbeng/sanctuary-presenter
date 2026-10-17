# U6.4: Source comparison and explicit refresh

17 October 2026. Local implementation; not deployed.

Prepare now offers Library source for the selected presenting item. It reports whether the Library version matches the original copy, differs from it, is unknown, or has been removed. A missing source leaves the independent service copy usable. Nothing refreshes automatically.

Compare with Library opens a native modal with current and proposed public previews, complete section/page lyrics, song orders and saved-content details. Each column has an independent slide selector. For songs, the worker must explicitly choose a Library song order before replacement is enabled. This avoids guessing the intended arrangement from an edited service sequence. Flat slide sets use their saved slide sequence. Preview readiness/media errors are shown without redefining the existing ability to save unfinished content.

The explicit Replace this service copy action replaces the complete content snapshot, including words, languages, sections, saved-content metadata and individual slide designs, and replaces the service item's section order with the chosen Library order. It retains the service item's ID, source ID, custom service item name, private notes, item-level appearance/typography/background settings and other item flags. Service-wide settings, Library records and other service copies are unchanged. These consequences appear before the replacement action. Cancel and Escape write nothing; Blank remains available in the modal during a presentation.

Refresh is one transaction over Library content, services and media. It checks that the reviewed source still exists and matches its revision/token and reviewed body; service saving checks the expected service revision. Missing assets or invalid source structure reject the transaction. A failed refresh leaves supplied drafts and saved snapshots unchanged. A source/service change detected while the comparison is open disables the action and asks the worker to cancel and review fresh saved versions. There is no partial merge.

An active presentation retains its committed version and pinned live frame/assets. Refresh saves a staged service copy only. Applying the saved service in Present still preserves current congregation content; a separate Take reveals the refreshed selection. The existing Apply/Take safety contract is unchanged.

## Baseline and compatibility

U2 already placed the source's revision/token in newly captured content snapshots. Editing a service copy preserves that captured provenance, so it can identify the original Library save without adding persisted fields. Copies with no token/revision or inconsistent source identity remain unknown. Original arrangement provenance is not inferred; explicit Library-order selection is always required for song replacement.

A different token means a different editing context or save, including restore. It does not prove the words changed or require replacement. The interface therefore says version differs and provides the actual comparison. Restore intentionally regenerates top-level Library tokens while leaving embedded copy provenance intact. Source fingerprints/revisions are not invented for legacy snapshots. Database schema 3 and backup format 5 remain unchanged; readers retain their existing supported-version behavior.

## Evidence and limits

Six new unit tests cover known/unknown/missing source states, whole-copy retention/replacement, custom repeated order, explicit arrangement choice, flat slides, independent copies, stale source and service rollback, deleted/missing-media sources, and provenance through backup/restore. Two browser workflows cover Cancel without writes, retained fields, live refresh followed by separate Apply/Take, another window changing/deleting a source, and modal safety/layout at desktop and compact sizes. Final validation passed 69 unit tests, 52 Chromium tests, strict TypeScript, ESLint and production build/subpath PWA checks. Six affected tests also passed with the live refresh workflow running offline. Detailed results are recorded in VERIFICATION.md. Screenshot: source-comparison-preview.png.

This completes the planned U6 implementation increments, not every scenario or enhancement in the broader UI specification. Automatic merging, choosing a different source song, original-arrangement inference, semantic word-level diffing and durable undo history are not implemented. Physical Safari/second-display rehearsal, screen-reader and participant checks, final release acceptance and GitHub Pages publication remain outstanding.
