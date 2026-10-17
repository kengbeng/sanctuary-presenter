# U6.2: Section and slide structure editing

17 October 2026. Local implementation; not deployed.

Collapsed Section options and Slide options now provide structural editing in Library, the create-song/slide-set drawer and service-copy preparation. Sections can be duplicated and moved up/down. Slides can be duplicated, reordered within their section/set, or moved to another song section. Moving the last slide out of a section is disabled with an explanation; add or duplicate a slide first. No drag interaction is required.

A duplicated section receives a new section ID and new page IDs, with a distinct copy label. A duplicated slide gets a new page ID. Both language channels, deliberate line breaks, media references, styles, language modes and background settings are copied. Original pages and designs remain independently editable. Movement preserves existing IDs and references.

Automatic arrangements follow the updated section order. Custom arrangements retain their exact sequence and repeated references; copied sections are available for an explicit append rather than silently changing a custom song order. Service item song orders remain independent of snapshot section order. Prepare offers Edit section, including sections outside the current service song order, so a new service-copy section can be edited before the operator chooses to append it. New slides in a repeated section remain shared across that section's occurrences, as before.

Library writes retain the existing explicit save, revision and legacy-repair guards. Create-and-add retains its atomic transaction. Service-copy changes retain the existing local save queue and remain staged during a presentation. Structural edits do not apply to live output automatically. No schema/archive version or projection protocol change was needed.

Four new unit cases check fresh duplicate identities, original lyric/design preservation, custom repeat order, automatic synchronization, source-copy independence, safe slide transfer, boundary no-ops and flat slide sets. A browser workflow checks bilingual duplication and transfer, independent section edits, custom repeats after reordering, persistence after reload, service-only slide edits, editing an omitted duplicated section and standalone Library duplication. Final results are in VERIFICATION.md.

Whole-song paste staging, read-only running-order review and source comparison/refresh remain separate increments. These controls do not claim those features or physical/participant acceptance. Production is unchanged.
