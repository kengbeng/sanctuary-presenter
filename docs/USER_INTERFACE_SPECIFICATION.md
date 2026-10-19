# Sanctuary Presenter v2: User interface specification

**Version:** 1.8 draft  
**Date:** 17 October 2026  
**Status:** Design specification for review; not a statement of implemented functionality  
**Baseline:** Sanctuary Presenter 0.6.0 and [project specification](../Sanctuary_Presenter_v2_Codex_Specification.md)

## 1. Purpose and requirement language

Organise the application around preparing and operating a church service. Each workspace must make clear what the operator is doing, what is selected, what an action changes, and what the congregation can actually see.

“Must” denotes an acceptance requirement. “Should” denotes a preferred design with a documented alternative permitted. Proposed decisions in section 15 require review before changing established presentation behaviour. The original output, storage, privacy and data compatibility requirements remain applicable. This document specifies the intended interface; it does not claim that new capabilities already exist.

This revision has undergone workflow, interaction-state, acceptance-coverage, novice-user, church-worker, congregation-experience, live-operator, pastoral-workflow and UX-engineering reviews. These are document reviews, not observed usability tests. See [review record](UI_SPECIFICATION_REVIEW.md) for findings and changes.

The user specifically requires direct navigation within songs to verses, choruses, bridges and other sections during presentation. Section 7 defines this as a core presenter capability.

## 2. Workflow and navigation

The primary workflow is:

**Services → Prepare → Connect output → Present → Finish**

These are workspaces and transitions, not a compulsory wizard. A returning operator must be able to open an existing service and enter Present without revisiting every preparation step. Opening a workspace must never open an output window or reveal content automatically.

| Destination | Operator task | Primary action |
| --- | --- | --- |
| Services | Choose, create or duplicate a service | Open service / Create service |
| Prepare | Build the order and edit service copies | Add item; Present when ready |
| Output setup dialog | Connect, position and test the congregation window | Open output |
| Present | Follow the service and control congregation content | Next, section jump, Show or Blank |
| Library | Maintain reusable Songs, Slides and Media | Create / Save library content |
| Settings dialog | Manage application, local data and maintenance | Context-specific action |

Application navigation must expose Services and Library. Settings must open directly as a dialog. A selected service must expose Prepare and Present as clear workspace choices. The service name must remain visible in both workspaces.

When a presentation exists outside Present, a persistent output indicator must offer Return to presentation and immediate Blank. Returning to Prepare must not stop or reveal output. Active-session edits are staged separately from the committed presentation snapshot. The user superseded preview-first navigation on 19 October 2026: direct one-click navigation is the default while live, with an optional Preview only mode on the same Present screen. Editing, saving and Apply never reveal a slide. Apply enters Preview only; the corrected content needs an explicit Show slide. See section 16.7 for the staged-apply contract.

## 3. Services workspace

### 3.1 First use

Show a concise empty state with Create service as the primary action. Offer Try demo and Import backup as secondary actions. Demo content must remain separate from the user's saved service list unless explicitly saved as a service.

Creating a service must request a name, allow an optional date and open Prepare. A service with no items must show Add first item, with no sample-slide fallback.

Offer a short explanation: “A service is the running order of songs and slides you will present.” Do not require importing data or visiting Library first. Try demo must allow a safe local practice walkthrough without opening a congregation window until an explicit connection action.

Give the name field a useful editable suggestion such as Sunday service, with focus placed in the field. Date is optional and must not delay creation. Do not require output profiles, media, song numbers or copyright fields to create a service.

### 3.2 Returning use

Show saved service names, optional dates, last modified dates and item counts. Provide Open and contextual Duplicate, Rename, Export where supported, and Delete. Delete requires confirmation identifying the service. Distinguish service export from Export full backup.

Offer the last selected service as a convenient continuation without automatically launching output. Duplicate must create an independent service. Browsing service summaries is permitted during presentation. Activating a different service for output requires ending the session first; provide Cancel / End presentation and open service. Cancelling preserves the current session and cursor. A service chooser must not silently replace live content.

### 3.3 Weekly preparation

The routine route must be Services → Duplicate previous service → change name/date → revise order → check slides → Present. Duplication must preserve the content, song orders, item-specific appearance and useful notes, while giving the new service its own identity. Prompt the worker to review copied announcements and notes; do not silently reset or certify them. The original service remains unchanged.

Service date is optional; services on the same date remain distinguishable by name, such as Sunday morning and Sunday evening. Search saved services by name and sort by date or last modified. Do not require creating a reusable template before duplication is useful.

## 4. Prepare workspace

### 4.1 Layout

At 1280 × 720, use an approximately 56 px application header, 48 px service toolbar and the remaining height for content. The left service-order panel starts near 270 px and is resizable. The main editor uses the remaining width. Do not reserve a permanent display-setup or library-management column.

Service toolbar: service name, local save state, Appearance, service options and Present. Appearance is the user-facing entry to service design. Service options contain less frequent operations such as duplicate, export and delete. Add item belongs above the service order.

The order panel lists service items such as songs and slide sets. Each entry shows title, type, slide count and arrangement where applicable. Expand the selected item to show its slides. Distinguish the selected item from the selected slide. Non-presenting headings must be recognisable and excluded from projected slide counts.

Provide drag handles and accessible Move up / Move down alternatives for item reordering. Preserve selection and scroll position after edits and reordering.

### 4.2 Item editor

Show the item title, its type and a Service copy scope label. Use a compact slide selector and a large shared-renderer preview. Content and Design controls must be contextual. Operator notes must occupy a distinct labelled region and never appear inside the congregation frame.

Song editing must expose labelled sections, their pages and the chosen arrangement. Repeated arrangement entries must remain visible. Slide-set editing must expose its page order. Media selection must use a local asset picker with preview and format feedback.

Appearance must initially show a preview and a small set of useful controls: text size, text alignment, text colour and background. Use the default Projector profile unless another saved profile was explicitly selected. Put detailed font, outline, spacing, safe-area, secondary-language and profile controls under More options. Do not require visiting Appearance for a normal text song.

The detailed Design controls must expose service defaults, item overrides and slide overrides. Display the effective value and its source in plain language, such as “Using service settings”. Use Reset to service settings or Reset to song settings rather than Reset to inherited. Use technical inheritance terminology only in documentation. Output profile values must be inspectable. Font-fit diagnostics belong in advanced details, except actionable overflow errors, which must be visible next to the affected slide.

Service edits must not modify a library master. Open library source and Replace from library must be explicit actions with clear scope. Replacing a service copy must warn about overwritten service-specific changes.

### 4.3 Add item drawer

Add item opens a drawer containing Songs, Slides and Media tabs, search, results and a selected-result preview. The primary action is Add to service. Repeated additions may keep the drawer open; show a quiet confirmation and provide Done. New content creation must state whether it creates reusable library content and a service copy.

When a library master has unsaved changes, offer Save and add, Add saved version, or Cancel. Add saved version is available only when a saved version exists and must retain the unsaved draft. A new unsaved item offers Save and add or Cancel. A failed save must not add a stale or partial copy.

### 4.4 Creating the first song or slide set

An empty Songs tab must show “No songs yet” and Create song. A failed search must show “No songs match this search”, Clear search and Create song, with the search text offered as an editable title. Do not direct a new user to find an export or open a separate workspace.

Create song from the add drawer opens a focused editor within the service workflow. Initially show Title, labelled lyric sections and preview. Provide Add verse, Add chorus and Add other section, with Add slide within a section. Start with one editable Verse 1; labels and types can be changed. A second page in the same verse must be distinct from a new verse. Show “Use another slide when the words do not fit comfortably”. Do not guess section boundaries from unstructured pasted lyrics or silently split a song.

Default playback order follows section creation order. Label its editor Song order, with a concise explanation “The order used by Next during presentation”. Provide Add section to order for repeats and accessible reorder controls. A song must be usable without creating a named arrangement; advanced named arrangements remain under More options. The current order is previewed as full labels, for example Verse 1 → Chorus → Verse 2 → Chorus.

The primary action is Save song and add to service. Explain “Saved in Library for reuse; a separate copy is added to this service”. Save and add must complete without leaving an orphaned or duplicated service item after retries. On success, close the editor, select the new service item and show “Song added. Changes here affect this service only.” Cancel in a dirty editor opens the normal Save / Discard / Keep editing choice; it must not imply durable startup draft recovery. Keep editing retains the in-memory draft. Closing/reloading the browser uses the available unsaved-change warning; cross-reload draft recovery is deferred until explicitly implemented. Detailed authorship, rights, language, tags and song-number fields remain available under Song details; optional metadata must not block saving ordinary user-authored content.

For a new slide set, show Title, slide text, preview and Add slide. Use Save slides and add to service with the same scope and persistence rules. Adding Media directly must create a clearly previewed media-backed service item using existing supported content types; do not introduce a second unexplained kind of media library.

### 4.5 Song-entry productivity and bilingual content

The same section/page editor must serve standalone library creation and service creation. In Library, the primary action is Save song; do not force a destination service or create a service copy. In a service's Add item flow, the primary action remains Save song and add to service. Keep the save scope visible beside the action.

Provide text paste into each lyric field, preserve deliberate line breaks and Unicode punctuation, and support native text undo/redo. Provide an optional Paste lyrics entry that accepts a whole song as an editable staging area. The worker explicitly marks sections and page breaks, previews the result, then applies it; Cancel leaves the song unchanged. Do not silently infer structure, rewrite lyrics or retrieve words online. Implementing this staging tool is a separate authoring increment, not a dependency for basic manual entry.

The basic editor must support section/page creation, labels, edits and explicit song order. Section/slide duplication and moving a page between sections are authoring enhancements after the core workflow; when implemented they must not require recreating a song. Repeated choruses in Song order must reference one section; editing that section updates its repeated appearances within that same song copy. Duplicating a section creates an independent section with distinct identity. Removing a section must identify affected song-order entries and require an explicit choice to remove those entries or cancel. Never leave dangling references. Keep destructive controls away from normal text-entry actions.

A second-language option must be directly discoverable beside lyrics, even when other metadata is collapsed. Show primary and secondary text fields together for the same slide, with language names and one shared preview. Support primary-only, secondary-only and both display modes using the existing rendering model. Do not translate, align, duplicate or overwrite either text channel automatically. Changing display mode must retain both stored texts. Allow sections with only one language and show the actual existing fallback behaviour in preview. Long text must lead to a clear overflow warning and Add slide, rather than silent lyric loss. Rehearse CJK text with locally available fonts.

### 4.6 Saving and readiness

Service changes save locally. Show Saving, Saved locally or Save failed according to actual persistence. Library master drafts retain explicit Save and unsaved-change protection. Closing or navigating away from an unsaved master must offer Save, Discard or Cancel. Cancel returns to the intact editor. Discard restores its saved version or removes a never-saved draft; it must not delete a saved song.

Before presentation, show actionable checks for empty content, missing media, unsupported media and text overflow. Include the congregation readability review in [Congregation experience and validation](USER_INTERFACE_VALIDATION.md#c-congregation-experience-and-validation); fitting inside the frame is not evidence of readable projection. Identify affected items and link to them. Label untested media support as unknown rather than ready. Browser connection checks must not claim physical projector verification.

An empty service or a service containing only non-presenting headings cannot Show. Readiness checks must not introduce an unnecessary multi-step approval process for a valid service.

Classify readiness results by effect:

| Result | Effect |
| --- | --- |
| No presenting pages or failed service persistence | Block starting this service; retain editing and export recovery where possible |
| Selected page cannot render safely | Block revealing that page; permit navigation to another valid page |
| Missing background with a validated poster/colour fallback | Identify fallback and permit presentation using it |
| Unknown codec support, unknown placement or windowed output | Show a warning and the relevant check; do not claim verification or block all text slides |

A failure in one later item must not prevent connecting a black window or presenting another valid item. Output tests remain available without a service. Save completion must precede construction of the session snapshot.

### 4.7 Service review and operator handover

Provide Review slides as a read-only preview route within Prepare. It follows the saved service's projected sequence, including repeats, without opening an output window or sending presentation commands. Show item title, section/page position, next destination and operator-only notes. Allow direct return to the affected editor. A compact review summary links to content, overflow and media issues; completion does not certify theological accuracy, rights clearance or physical projector readiness.

Notes should support concise cues such as “Repeat chorus after prayer” and “Wait for speaker”. Separate service-level operational guidance from per-item notes where the model supports it; do not duplicate a new notes store solely for this redesign. If service-level notes need a model change, defer that field and use existing item notes in the initial increment. Notes and non-presenting headings must never become congregation text implicitly. Use notes for operational cues, not confidential counselling or pastoral case details. Local-only storage is not a confidentiality or access-control guarantee; see [Pastoral workflow and service intent](USER_INTERFACE_VALIDATION.md#e-pastoral-workflow-and-service-intent).

If review tracking is implemented later, changing reviewed content must mark the affected review as stale. Do not add mandatory approval roles or a reviewed badge without a persisted definition and invalidation rules. Previewing pages alone is not an approval workflow. Pastoral/content review follows [Pastoral workflow and service intent](USER_INTERFACE_VALIDATION.md#e-pastoral-workflow-and-service-intent) and remains distinct from technical readiness. Do not label a technically renderable service Approved or Pastor reviewed.

Service handover must state its scope. On the same device/browser profile, another operator can open the saved service. On another computer or browser profile, nothing syncs automatically. The initial supported route is Export full backup and validated replace restore, with a prominent warning that restore replaces the destination's local library and services. Do not describe this as merging, sharing a single service or cloud collaboration. Portable service-only packages, a printable running order and selective merge remain separate future features until their formats and conflict rules are implemented. Never require an export from the user to test this design.

## 5. Output setup dialog

Use the title Connect congregation display and state “The congregation screen stays black until you click Show slide”. Explain that the current window contains operator controls and a second window contains congregation content. Include:

- Automatic positioning by default, with actual runtime-discovered display choices only.
- Manual positioning always available.
- Request fullscreen enabled by default.
- Open output as the primary action and Test output as a separate secondary action.
- Independent connection, placement, fullscreen and media-readiness indicators.
- Reposition, manual placement confirmation and inspectable connection details.

Open the output window directly from the operator's click. Display discovery requiring permission may use a separate Configure display gesture. Do not await work that prevents the opening gesture from reaching the browser.

Give capability-specific instructions as short numbered steps beside the action that needs them. Do not ask a novice to choose a browser adapter. For the manual path:

1. Click Open congregation window.
2. Move the new black window to the projector or second display.
3. In that window, click Enter fullscreen.
4. Return to the operator window. Confirm placement if checked, then click Show slide when ready.

If both windows appear on the laptop, explain which one to move and retain a Return to operator cue in the output controls. If no external screen is available, offer clearly labelled Practice on this screen without claiming that the projector is connected.

Safari and other manual paths must instruct the operator to move the output window, then click Enter fullscreen inside that window. Rejected fullscreen must show friendly recovery guidance while retaining windowed, black output. Do not display raw transient-activation exceptions as the connection status.

Multiple secondary displays require a deliberate choice. Unknown placement must remain unverified. Fullscreen success must come from observed output status. Actual projector visibility remains a physical check.

### 5.1 Test output

Test output uses the real output adapter but an isolated test session. It starts black. Show test pattern is an explicit action; Return to black must be immediate. No service slide may enter test mode. End test returns to setup. Test completion must never automatically show service content.

### 5.2 Dialogs during an active session

Opening setup must not blank, stop or replace the session implicitly. Show the existing connection and provide Reposition plus a visible Blank button. Disable Open output and Test output while an active service session exists. Reconnect is available only after loss and opens a replacement black session. Closing setup leaves the session unchanged. Confirmed placement is an operator assertion, not hardware detection.

The modal must contain its own reachable Blank control while a session exists. The background control strip alone is insufficient because it may be inert under modal focus containment. Nonessential destructive dialogs must not open during live operation. Any other permitted modal must provide an accessible Blank action or return immediately to the presenter without obstructing it.

### 5.3 Connection completion

An acknowledged output enters Present with Congregation screen is black. The connection may be ready while the selected page is still preparing; show those statuses separately. Connecting alone does not enable Show. Required frame preparation must also complete. Setup remains accessible through the output indicator but must not occupy a permanent presenter column.

## 6. Present workspace

### 6.1 Layout and priorities

The presenter must support following a planned sequence and responding to an unplanned song section jump without opening an editor.

| Region | Required content |
| --- | --- |
| Header | Service title, Prepare, output status, Output setup, End presentation |
| Left order panel | Service items, current item expanded, on-air and selected markers |
| Song navigation area | Arrangement occurrences, direct section controls and individual slide choices |
| Main preview area | Selected/current preview with truthful state label; acknowledged output reference during transitions |
| Supporting area | Next slide preview and operator-only notes |
| Fixed control strip | Previous, slide position, Next, contextual Show slide, prominent Blank screen |

The song navigation area must be adjacent to the preview and remain reachable without scrolling the service list. Current, Next and essential controls must fit at 1280 × 720. Notes may scroll internally. Avoid enlarging the current preview so much that Next and song controls disappear below the fold.

Do not place library editing, typography controls, test-output actions or routine diagnostics in the live control strip. End presentation must be visually separated from Blank.

Suggested desktop composition, measured within the CSS viewport:

```text
Service title      Prepare          Output: black       Setup       End
──────────────────────────────────────────────────────────────────────
Service order      Song title / section / page       Next slide
                   Song order / quick sections       Operator notes
                   Section controls
                   Page previews
                   Selected/current 16:9 preview
──────────────────────────────────────────────────────────────────────
Previous  Position  Next             Show slide          Blank screen
```

At 1280 × 720, budget approximately 56 px for the presenter header and 80 px for the fixed strip, leaving 584 px for content. The order panel starts at 240 px; the supporting column starts at 240 px. Reserve at least 96 px in the centre for compact section/page navigation before sizing the 16:9 preview to the remaining space. Section/page lists may scroll inside that reservation; their headings and active destination must stay visible. The preview must shrink before controls are pushed off-screen. This is a sizing rule, not a promise that every section thumbnail is simultaneously visible.

### 6.2 Browsing, focus and activation

Expanding a service item, moving keyboard focus, switching song-navigation detail views, opening notes and scrolling are browsing actions. They must not change the runtime cursor or congregation content. In Direct control while live, clicking a destination slide, activating a labelled section button, or pressing Previous/Next shows the selected destination after preparation. In Preview only, these actions change preview alone. When black, hidden, disconnected or newly started, navigation cannot reveal output; Show slide remains explicit. Give these controls clear destination labels and show the current live-navigation policy nearby.

Expanding another song may show its sections without replacing the active song cursor. Keep the active item marked and offer Return to current song. That action restores the navigation/preview view of the runtime-selected song without sending a reveal or restarting its page. If requested and acknowledged destinations differ, retain their separate labels. Activating a destination follows the visible Direct control / Preview only policy; browsing alone never reveals anything. Do not use an entire expandable item row as an immediate-live activation target.

A song with a single section may omit redundant navigation detail controls when the destinations are identical. Slide sets use page navigation without fabricated Verse/Chorus controls. Non-presenting headings may be inspected but cannot be activated for output.

### 6.3 Preview and output truth

Track selected content independently from output-acknowledged content.

| Situation | Preview label / output indication |
| --- | --- |
| Connected and black | Ready to show / Congregation: black |
| Frame acknowledged visible | On congregation display / Live |
| New frame requested | Preparing selected slide; retain last acknowledged output reference |
| Output lost | Disconnected; do not claim that physical output is black without confirmation |
| No active session | Output closed |

“On-air” identifies only the latest acknowledged visible destination. After acknowledged Blank, clear its on-air badge; a retained thumbnail must be labelled Last shown. During a transition, indicate Requested destination separately from Last acknowledged. Connection loss invalidates claims about current physical visibility.

The renderer frame must contain only congregation content. Labels, selection borders, slide numbers, notes and diagnostics must remain outside it. A prepared request is not evidence of rendered output. Show slide must remain unavailable until the connection is acknowledged and the selected frame has completed preparation. Present/Connect display is not a reveal action and remains available subject to service validity.

### 6.4 Sequential navigation

Previous and Next follow the active service arrangement, including repeated sections and all pages within each section, then the next presenting service item. Non-presenting headings are skipped. Next preview must show the actual next destination under the current navigation context.

At the first slide of the current effective navigation path, disable Previous; a temporary section with a captured prior cursor follows section 7.3 instead. At the last slide, show End of service and disable Next. Do not repeat the final slide as Next, loop automatically, stop automatically or blank automatically.

Confirmed behaviour, 19 October 2026: Direct control is the default for live navigation. Previous/Next, direct section buttons, repeated occurrences, individual pages and global arrow keys show the selected prepared destination without a second click. Startup/recovery/Blank navigation stays local until explicit Show slide. All controls remain on Present. A compact, labelled Preview only toggle lets an operator inspect any destination without changing output; Show slide reveals it while leaving Preview only enabled. Return to live restores the acknowledged destination and Direct control without a reveal. Turning Preview only off never reveals its current selection by itself. Apply enters Preview only and keeps acknowledged live words unchanged. Media preparation, hidden/disconnected guards, latest-request identity and black intent must apply equally to direct and explicit reveal. Blank, mode changes, Apply and session changes cancel queued direct reveals. The last acknowledged frame remains distinct from the requested destination.

## 7. Song section navigation

### 7.1 Section controls

For a selected song, show named controls such as Verse 1, Verse 2, Chorus, Bridge, Intro, Ending and any custom labels stored with the song. Do not assume every song has standard English labels. Preserve multilingual names.

Keep two complementary controls visible in the same song area:

1. **Song order:** the ordered occurrences used in this service, for example Verse 1 → Chorus → Verse 2 → Chorus → Bridge → Chorus. Highlight the current position. Repeated sections remain separate entries.
2. **Jump to section:** a compact row of distinct section buttons, including Chorus and Bridge when present. Include sections omitted from the planned order. This row must not require changing tabs or opening a menu for a typical song.

Song order is the user-facing label for an arrangement. Do not make novice operators learn two competing modes before they can repeat a chorus. With many sections, give the quick row its own labelled scrolling region and keep the active section in view; controls must not shrink to unreadable abbreviations. Switching advanced detail views must preserve page selection, live output, keyboard focus where practicable and the arrangement cursor. The implementation rules below apply to the Jump to section controls.

Controls must identify a destination by service item, section, arrangement occurrence where applicable and page. A repeated Chorus must not be collapsed into one indistinguishable arrangement entry. Use an accessible label such as Chorus, occurrence 2, arrangement position 4 of 6. Visible repeat badges may be compact.

### 7.2 Pages within a section

Selecting a section starts at its first page. Show its pages as readable thumbnails or compact text previews with page numbers, for example Chorus 1/2 and Chorus 2/2. Clicking an individual page selects that exact destination. Previous and Next move through the pages in order. A section button must not conceal which page is currently visible.

Use separate selected and on-air markers. While black, the selected section and page may differ from the last visible frame. The chorus or bridge control must be available without stepping through intervening verses.

### 7.3 Repeated sections and spontaneous jumps (implementation rules)

Selecting a specific arrangement occurrence establishes that occurrence as the navigation cursor. After its last page, Next proceeds to the following arrangement occurrence. Previous reverses that sequence. Example: select the second Chorus in V1, C, V2, C, B, C; after its final page, Next goes to Bridge.

Using Jump to section, a quick section jump resolves to the current occurrence if that section is currently active; otherwise it resolves to the next matching occurrence after the arrangement cursor, wrapping to the first matching occurrence if none remains. Show the resolved arrangement position before activation through its accessible label and visible destination cue. Activating the current section deliberately restarts its first page; focus or view changes must not restart it. To select a particular repeat, use Song order. Show the resolved destination on or beside its button, not only in a hover tooltip.

If the selected section is omitted from the arrangement, enter a temporary section run. Do not modify or save the arrangement. Complete that section's pages, then resume at the arrangement page that would have followed the prior cursor. If no arrangement page has yet been selected, resume at the first arrangement page. At the service end there is no automatic wrap. Use the plain-language label Extra section and show the next destination, for example “Next: Verse 1, slide 2”. Temporary section run is an internal term, not the primary operator label. Previous within the temporary run moves back through its pages; from its first page it returns to the prior cursor if one exists. The resume destination is captured once when entering the temporary run. A jump to another omitted section replaces that run but retains its captured resume destination; do not build a hidden stack. A jump to an arrangement occurrence exits temporary mode and establishes the chosen cursor. At the end of the temporary run, Previous reverses to its last page only while that run remains the immediately preceding runtime path; an explicit arrangement jump discards that transient path. This path is runtime-only and is cleared when the service session ends.

Examples use V1 with two pages, then C, V2, C, B, C:

| Starting cursor and action | Result | Following Next |
| --- | --- | --- |
| V1 page 2; activate Jump to section → Chorus | First Chorus, page 1 | Continue that Chorus, then V2 |
| Second Chorus; activate Jump to section → Chorus | Restart second Chorus, page 1 | Continue that Chorus, then B |
| Final Chorus; explicitly activate Verse 1 | V1 page 1 | V1 page 2, then first Chorus |
| V1 page 1; activate omitted Ending | Temporary Ending, page 1 | Finish Ending, then V1 page 2 |
| Temporary Ending; activate omitted Intro | Temporary Intro, original resume retained | Finish Intro, then V1 page 2 |
| Temporary Ending; activate second Chorus occurrence | Exit temporary run; second Chorus | Continue Chorus, then B |

The operator must not need to understand cursor or occurrence terminology. Keep resume wording concrete, for example “After Ending: Verse 1, slide 2”. A temporary section is not automatically appended to the saved arrangement.

These cursor rules are proposed detailed interaction decisions and must be reviewed under section 15 before implementation. Their purpose is to avoid losing the operator's position when a worship leader repeats or skips material.

### 7.4 Invalid and legacy song structures

Duplicate section labels must remain distinguishable using an ordinal and text excerpt; navigation identity must never depend on the label string. Repeated song items must use their own service-item identity. Repeated occurrences need a runtime key that includes item, arrangement position and page identity.

An empty section has a disabled destination with “No slides”; it must not create an empty on-air step. A missing section reference must produce an actionable preparation error and must not be silently replaced by another section. Existing flat-page content must remain navigable as pages with no invented musical labels. When an arrangement has no valid occurrences but snapshot sections have valid pages, block sequential song activation until an explicit arrangement is chosen in Prepare; do not invent an order during a service. Page and section counts must describe actual usable destinations and separately identify invalid entries.

### 7.5 Output and safety during jumps

Section/page jumps always select preview only. Rapid Next presses advance from the latest preview cursor, not from the acknowledged live frame. Show slide captures an immutable destination/frame for that reveal request; later preview changes do not retarget it. A newer explicit Show slide supersedes an older in-flight Show slide, and Blank cancels every pending reveal. Media preparation may happen for preview without permission to reveal. An obsolete preparation completion must never become a Show slide implicitly. On failure keep the selected preview context and follow the black/error policy.


Jumping changes the runtime cursor only. It must not reorder sections, modify the library master, alter the service arrangement or create saved duplicates. Song navigation labels and operator annotations must never enter the projected content.

### 7.6 Keeping position during a live service

Show song title, full section label and page position near the navigation controls, for example “Amazing Grace · Chorus · slide 2 of 2”. Also show the service item position separately, such as “Item 4 of 12”. A global slide counter alone is insufficient. For repeats, add a concise song-order position cue. Next preview must name its destination and visibly identify a change to another song/item.

Keep distinct cues for the browsed item, requested destination and last confirmed visible destination. Do not create three equally prominent selection colours. Give acknowledged live output the strongest status cue; show requested content as Preparing only during a transition. If the operator browses away, retain a persistent Return to current song action beside the browsed title. It must never be confused with Show slide.

Auto-scroll the active destination into view after a presentation action, but do not seize scroll or focus while the operator is deliberately browsing elsewhere. Blank, heartbeat and background media events must not move focus, change the page layout or scroll the service list. Return to current song restores the view on demand. When a song is repeated as a separate service item, identify the service position so the operator can distinguish the copies.

### 7.7 Keyboard access

All section and page controls must be reachable by keyboard, with visible focus and descriptive names. Enter or Space activates a focused destination. Use a documented roving-focus pattern for composite section controls; internal focus navigation must not also trigger global slide navigation.

Do not add ambiguous global V/C/B single-letter shortcuts. B remains Blank. Optional section shortcuts may be designed later with conflict-free mappings and an inspectable shortcut guide.

## 8. Output states and recovery

Connection, physical placement, fullscreen, visibility and media state are separate dimensions. Use plain-language primary status with inspectable details mapped to the existing protocol state machine.

| State | Main action and constraint |
| --- | --- |
| Output closed / stopped | Open output; no automatic window opening |
| Connecting | Blank available; Show disabled until acknowledged and prepared |
| Connected, black | Show selected ready slide |
| Live | Blank; sequential and direct navigation |
| Preparing | Blank remains immediate; distinguish selected from acknowledged content |
| Disconnected | Reconnect; replacement starts black |
| Media error | Explain the affected slide and available fallback; no stale reveal |

A disconnected or unresponsive output must not be labelled confirmed black merely because a command was sent. Reconnect and output reload always initialise black and require explicit Show. Reconnection must not replay a prior LIVE state. Stale output windows remain quarantined.

Popup blocked must provide Retry opening. Fullscreen denied must provide in-window fullscreen guidance. Missing media must identify the affected service item and page. Errors must remain near the resolving action and must not compete with duplicate global notices.

Blank cancels any pending reveal and requests the independent black overlay immediately. Until acknowledgement, show Blanking rather than confirmed Congregation: black. If the command cannot be acknowledged, show Output state unconfirmed with reconnect/physical-check guidance. Black must never depend on media preparation finishing.

A failed selected page must not silently reveal its predecessor. Retain a clearly identified Last acknowledged reference; the output error path must apply the safety policy rather than claim the failed page is Live. A validated background fallback is permitted; missing foreground content and unsafe text overflow must remain black with an operator error. After such a black/error result, require explicit Show for a valid selected destination. Blank during preparation must defeat every late completion.

End presentation is an immediate safety action and must not wait for a confirmation dialog. Label it End presentation with explanatory text “Blank and close output”. It sends immediate blank, ends the session and closes output where permitted. Failure to close must retain black output when the output is reachable; unreachable output must be reported as unconfirmed. Return to the selected service. Do not force a backup prompt after every service; keep Export full backup discoverable.

### 8.1 Slow output and recovery guidance

When a request is awaiting acknowledgement, show Preparing with the requested destination and retain the last confirmed output reference. Continue accepting navigation and Blank. Do not open a modal or spin the entire console into a disabled state. A persistent delay may add “Still waiting for the congregation window” and Details; it must not declare a disconnect before the existing heartbeat policy does. Reuse the established timeout rather than adding conflicting UI timers or claiming an unmeasured response guarantee.

On loss, retain the selected service and a pending destination with a readable item/section/page label. Offer Reconnect display as the primary recovery action. After reconnect acknowledgement, show Congregation screen is black and the pending destination; Show slide is explicit. Clear transient temporary-run history as specified in section 12 and explain the resulting Next destination. A reconnect cannot silently preserve a temporary return path that has been discarded.

If physical placement or browser fullscreen becomes uncertain, report that dimension separately without presenting an extra service slide, running a test pattern or claiming successful repair. When the app is not focused, its keyboard shortcuts may not run; visible help must say “Click the operator window to use shortcuts”. Do not imply global operating-system hotkeys. The dedicated output must retain its own black-first/disconnection safeguards even when the operator tab is hidden.

## 9. Library and settings

Library must use consistent Songs, Slides and Media tabs, search, sort, a result list and one contextual editor. Preserve explicit master Save and draft protection. Adding saved content to the active service must give a clear confirmation. Do not place the entire service planner beside the master editor.

Media deletion must show reference checks and prevent breaking referenced content. Import must report supported formats, size limits and actionable failures. No network media search or upload is introduced.

Settings must group Output preferences, Data and backups, Storage, and Application information/update where implemented. Full backup export must be easy to find. Restore must retain validation, replace confirmation and cross-window maintenance protection. Do not offer unsupported merge behaviour. Downloaded updates must not activate during a presentation.

### 9.1 Song database management

Library → Songs must support creating and maintaining reusable songs without opening a service. “Library” is the user-facing name for the local song database. Keep search and Create song visible. Results show title, church song number where supplied, language and a short first-line excerpt; a selected result exposes details and preview. Do not require the worker to remember an exact title.

Search must match title, church song number, lyric phrases across both text channels, author and tags. Case differences and repeated whitespace must not prevent a match; preserve original stored text. Identify why a lyric match was returned. Exact song-number/title matches should precede broader matches, with stable ordering. A numeric-looking song number remains text, including leading zeros and prefixes such as 001 or CH-12. Give church song number and CCLI number different labels; neither is the internal record identity. Do not invent transliteration or silently treat Simplified and Traditional Chinese as interchangeable.

Offer language/tag filters and title/song-number/last-modified sorting without making classification mandatory. Clear filters must be obvious when they hide results. Keep search/filter/scroll context when returning from a song editor. Song-number sorting must be deterministic without coercing stored numbers or rejecting duplicate church numbers.

Before saving a new song, show possible duplicates based on an exact normalised title, church number or an exact normalised lyric match. These are suggestions, not proof of identity. Show title, number, language and first-line excerpts, with Open existing, Save as separate song and Cancel. Retain the draft while inspecting a candidate. A title match must not block legitimate alternate versions or translations. Repeated Save clicks must not create duplicate records.

Keep authorship, source, copyright, CCLI and licence details available in Song details and preserve existing values. Do not add online rights checks, automated reporting or required rights fields as part of this interface revision. Title, usable lyric content and valid song structure are the basic save checks; metadata completeness is a separate concern.

### 9.2 Correcting songs and maintaining service copies

A lyric correction saved in Library updates that reusable song only. Existing service copies, including future prepared services, remain unchanged until the worker explicitly replaces an individual copy. Explain this after a correction when relevant: “Saved in Library. Existing service copies have not changed.” Provide a route back to the previously selected service.

In Prepare, Replace from library must show the selected source song and a before/after preview of lyrics, section/page structure and song order. List which item text, order, notes and appearance settings will be retained or replaced before applying. The conservative initial action replaces the whole content snapshot and section order, retains the service item's identity, notes and item-level appearance overrides, and replaces slide-level settings with those of the new snapshot. Label this consequence plainly. Offer Cancel; do not implement an implicit partial merge. This replacement policy is a proposal in section 15 and requires verification against existing APIs before implementation. A removed library source leaves an independent service copy usable, with Source no longer in Library rather than a broken item.

Duplicate song creates an independent reusable song with new identities and an editable suggested name. Explain when shared media assets remain referenced. Deleting a reusable song must identify any service copies that will remain and must not cascade-delete them or their referenced media. Do not promise Trash or cross-session undo until those recovery features are implemented; the destructive confirmation must state the actual behaviour. Removing an item from a service is a separate action and must not delete its library source.

### 9.3 Data protection for new users

Use a short first-run notice: “Songs and services are saved in this browser on this device. Export a backup to keep a copy.” Do not repeat it at every launch. Settings → Data and backups must explain that clearing browser data can remove local content. Backup export produces a file; it does not upload data. Do not label ordinary automatic local saves as a backup.

After the first successfully saved service, show a dismissible Export full backup suggestion in Services, outside live operation. Restore must explain what will be replaced before the confirmation step, using actual validation counts. Cancel returns to the prior workspace without losing content.

## 10. Visual, responsive and accessibility requirements

Use a restrained dark interface, readable type hierarchy, neutral surfaces and one consistent selection accent. Use text and icons alongside state colours. Selected, on-air, pending and disabled must be distinguishable without colour alone.

Primary live controls must offer at least 44 × 44 px targets. Normal operator-interface text contrast must meet WCAG AA. Congregation content additionally follows the room-specific readability requirements in [Congregation experience and validation](USER_INTERFACE_VALIDATION.md#c-congregation-experience-and-validation); operator-interface compliance alone does not verify projection quality. Controls require accessible names, visible focus and logical tab order. Dialogs must manage and restore focus. Announce significant output state changes without announcing every heartbeat.

At 1280 × 720 and 1440 × 900, essential presentation controls, section access and status must remain visible without page scrolling. At 1024 × 768, reduce order-panel width and supporting preview size while retaining readability. At narrower widths, the order may become a drawer. At 640 × 480, keep Blank, Show, connection and sequential navigation reachable; content may scroll. This does not establish mobile live-service support.

Use internal scrolling for long lists, notes and editors. Show usable dark scrollbars and prevent nested scroll traps. Resizable panes must have keyboard alternatives and sensible size limits. At browser zoom, controls must reflow instead of overlapping. Verify 200% zoom at a 1280 × 720 physical browser window using the reduced CSS viewport; supporting content may collapse, but the safety controls remain reachable. Respect reduced-motion preferences and avoid animated layout shifts during operation.

### 10.1 Plain-language controls and help

Use one canonical visible label per action. The terms in the left column below remain valid in technical documentation; the right column specifies novice-facing wording. Existing keyboard mappings remain unchanged.

| Technical concept | Default interface wording |
| --- | --- |
| Open output | Open congregation window |
| READY_BLANK / acknowledged black | Congregation screen is black |
| Reveal selected preview / Show / Restore | Show slide, with supporting text “Show selected slide” |
| Blank | Blank screen, with “Hide slide immediately” as supporting help |
| Arrangement | Song order |
| Snapshot / library master | Copy for this service / Saved song in Library |
| Occurrence | Position in song order, with repeat number when necessary |
| Temporary run | Extra section, followed by its Next destination |
| Media decode / render failure | “This slide could not be displayed”, followed by a specific useful reason |

When no session exists, the primary action is Connect display. While connected, Show slide is available for a valid prepared preview in both black and live states. Blank screen remains prominent and immediate. Do not offer competing Show, Restore and Show slide buttons. While disconnected, show Reconnect display. Disabled actions must explain what to do next in visible text, not a hover-only tooltip. Do not display both Show and Restore as competing buttons.

Provide a small How to present link beside the first Present entry. It opens a short guide containing Connect display → Show slide → Next or section jump → Blank screen → End presentation. Help is optional, dismissible and must not open over an ongoing live session automatically. Show shortcut hints beside controls or in an optional guide; every routine action must work with a mouse alone. Use full section names before abbreviations.

Errors should state what happened, its effect and one useful next action. Example: “The congregation window was blocked. Allow pop-up windows for this site, then click Try again.” Keep raw browser errors and protocol details under Details. Avoid simultaneous success banners, tutorial overlays and diagnostics competing with the next action.

## 11. Keyboard and focus contract

| Input | Behaviour outside protected editing contexts |
| --- | --- |
| B or Escape | Immediate Blank from ordinary operator controls, including outside Present |
| S or existing Shift+B | Show slide selected preview subject to readiness, in Present only |
| Existing previous/next arrow keys | Navigate in Present when not owned by a composite control |
| Enter / Space on destination | Activate the focused slide or section |
| Tab / Shift+Tab | Move focus in logical order |

Inputs, text areas, native selectors, contenteditable fields, composing text and modal dialogs retain their native/contextual keyboard behaviour. A dialog may consume Escape to close; emergency Blank remains available through the global visible control. Respect defaultPrevented and modifier combinations. Show slide and previous/next shortcuts must not run in Library or Prepare. B/Escape are global safety exceptions outside protected contexts. Modal Escape closes the dialog and does not also trigger Blank; its explicit Blank button remains available. Ordinary button focus must not disable Blank. Ignore held-key auto-repeat for slide navigation and Show so one held arrow cannot race through the service; repeated Blank is harmless and may remain idempotent. Separate intentional key presses still advance from the latest requested cursor. Native held-key editing and composite focus navigation retain their expected behaviour. A handled key must not also scroll the page or activate a second destination. Avoid keyboard handlers that activate a focused control and global navigation together.

## 12. Persistence, privacy and compatibility

All user content and media remain local. Interface changes must preserve existing stable IDs, independent service snapshots, media references and backup compatibility. Navigation and layout alone must not require a schema change. New authoring capabilities must first use existing model fields; any genuinely new persisted state requires an explicit migration and backup compatibility review. Runtime song-jump cursors and LIVE state must not be restored as active presentation state on reload. An idle reload may restore a selected service/page as preparation context only. A lost or ended session clears temporary runs and requested/acknowledged state; reconnect may retain the pending destination but cannot reveal it automatically.

The application must work beneath the GitHub Pages repository subpath, including routes, output windows, media references, manifest and service worker scope. After initial caching and local content preparation, the complete service workflow must operate offline. No runtime CDN, analytics or content-upload requests are introduced.

Saved pane preferences must not expose content from a previously selected service. Local storage failures must remain visible, with export/recovery options where available. Maintain the shared renderer and existing output protocol safety boundaries.

## 13. Acceptance scenarios

| ID | Scenario | Required result |
| --- | --- | --- |
| UI-01 | First visit | Create a service without demo content entering saved user data |
| UI-02 | Repeat service | Duplicate a service, change one item, reload; original remains unchanged |
| UI-03 | Add content | Search and add several library items without losing service context |
| UI-04 | Scope and save | Service edit leaves master unchanged; save failures and unsaved master navigation are explicit |
| UI-05 | Setup | Automatic/manual paths, popup failure and fullscreen denial remain recoverable; output starts black |
| UI-06 | Live basics | Show, Next, Previous, Blank, Restore and End behave correctly with acknowledged status |
| UI-07 | Blank navigation | Select another item, verse, chorus or page while black; nothing reveals until Show |
| UI-08 | Repeated chorus | In V1, C, V2, C, B, C, select second C; complete its pages; Next reaches B |
| UI-09 | Multi-page bridge | Jump directly to bridge page 2; selected/on-air markers and Next are correct |
| UI-10 | Unplanned section | Jump to omitted section; complete temporary run; resume indicated arrangement destination without saved edits |
| UI-11 | Rapid jumps | Slow video preparation followed by another section and Blank never reveals stale content |
| UI-12 | Recovery | Close/reload output while live; replacement stays black until explicit Show |
| UI-13 | Long service | Navigate 100 slides and a song with many/repeated sections without losing position or live controls |
| UI-14 | End of service | Next disabled with explicit end state; no duplicate next preview or automatic stop |
| UI-15 | Keyboard | Button focus allows Blank; editing/native/composite controls retain their input behaviour |
| UI-16 | Responsive | Required viewport sizes and zoom do not hide or overlap emergency controls |
| UI-17 | Output privacy | Notes, metadata, section controls and technical labels never project |
| UI-18 | Offline/subpath | Cold restart offline beneath repository base, open output, navigate songs and Show/Blank successfully |
| UI-19 | Maintenance | Active sessions block unsafe restore/update activation across app windows |
| UI-20 | Physical rehearsal | Mac Safari and second display: placement, fullscreen gesture, section jumps, recovery and black startup verified |
| UI-21 | Browse without revealing | Expand another song, change navigation view, move focus and inspect notes; cursor and output unchanged |
| UI-22 | Temporary-run boundaries | Chain two omitted sections, resume mid-verse, step backward and explicitly exit to an occurrence; no hidden stack or saved changes |
| UI-23 | Invalid song structure | Empty/missing sections, duplicate labels, repeated song items and flat legacy pages have deterministic identities and explicit errors |
| UI-24 | Dialog safety | Open/close output setup while live; no implicit state change; keyboard-accessible Blank inside modal |
| UI-25 | Request ordering | Several rapid Next actions advance the requested cursor; stale acknowledgements cannot overwrite current status |
| UI-26 | Failure truth | Failed foreground page goes black; unacknowledged Blank/End never claims confirmed physical black |
| UI-27 | Save-before-session | Failed/pending save cannot create a misleading session; unrelated library drafts remain intact |
| UI-28 | Session edit scope | Active service and referenced assets protected; unrelated safe work remains available |
| UI-29 | Readiness severity | A failed later item does not block a valid earlier page or black display connection; unsafe selected page cannot reveal |
| UI-30 | Zoom and focus | At 200% zoom, essential controls remain reachable; composite focus does not accidentally project a destination |
| UI-31 | Empty-library creation | Create a service, write a new multi-section song and add it without exports, library preconfiguration or optional metadata |
| UI-32 | Default appearance | Present a readable text song without opening design/profile settings |
| UI-33 | Visible repeat controls | While live, find Chorus and Bridge without changing tabs; full labels and multi-slide pages remain clear |
| UI-34 | Plain-language state | Without protocol knowledge, identify whether content is hidden, visible, loading or unconfirmed and find the next action |
| UI-35 | Mouse-only operation | Complete connect, Show, Next, chorus jump, Blank and End without shortcuts |
| UI-36 | New-user walkthrough | Meet the unassisted task and safety criteria in [Novice-user validation](USER_INTERFACE_VALIDATION.md#a-novice-user-validation); record failures and revise before claiming ease of use |
| UI-37 | Weekly reuse | Duplicate last week's service; revise date, announcements and song order; original remains unchanged |
| UI-38 | Standalone library work | Create, save, edit and duplicate a song without creating a service; draft survives cancelled navigation |
| UI-39 | Find a known song | Search by lyric fragment, bilingual text and text song number; clear filters; select the intended version |
| UI-40 | Duplicate suggestion | Same-title translations remain saveable; opening a candidate preserves the draft; repeated Save does not duplicate it |
| UI-41 | Structured lyric entry | Paste and preserve line breaks; split pages, reorder sections and edit repeated chorus once without unintended changes |
| UI-42 | Bilingual authoring | Edit both channels, preview three display modes, retain hidden language text and handle overflow without data loss |
| UI-43 | Library correction | Save corrected master; existing service unchanged; explicit replacement previews precise effects and retains promised item fields |
| UI-44 | Delete scope | Remove service item without deleting master; delete master without damaging independent service copies or shared media |
| UI-45 | Review without output | Walk all planned pages/repeats and notes without opening or controlling a congregation window |
| UI-46 | Handover scope | Worker distinguishes same-profile handover from full-backup replacement on another device; cancelled restore leaves destination intact |
| UI-47 | Rear-seat readability | Actual projected primary and secondary text, punctuation and public slide headings can be read from the defined rear/side seating positions |
| UI-48 | Meaningful lyric pages | Multi-page verses and choruses preserve complete intended phrases and exact words; no ellipsis, silent truncation or unapproved rewriting |
| UI-49 | Motion and contrast | Busy images, bright/dark video frames and poster fallback do not obscure text; static alternatives remain usable |
| UI-50 | Audience continuity | Sequential navigation and chorus/bridge jumps show the intended complete page without intermediate wrong sections, flashes or decorative transitions |
| UI-51 | Language continuity | Both-language output remains readable and consistently positioned; changing display mode retains content and does not silently suppress a language |
| UI-52 | Clean congregation output | Startup, test, fullscreen, reconnect and errors expose no notes, filenames, library metadata, diagnostics, pointer-triggered controls or automatic audio |
| UI-53 | Readability failure correction | An unreadable but technically fitting page can be revised, split and rechecked without lowering the agreed room minimum to hide the issue |
| UI-54 | Audience rehearsal | Record congregation-side observations in the actual room and lighting, including unresolved limitations; do not substitute laptop preview for physical evidence |
| UI-55 | Live orientation | Distinguish browsed, requested and confirmed output; Return to current song changes the view without revealing or restarting a slide |
| UI-56 | Held keys and focus | Hold Next/Show keys without runaway activation; intentional repeated presses work; native editing remains intact |
| UI-57 | Prayer and resumption | Blank while media prepares, browse another item, return to the runtime-selected song and deliberately Show; no late or implicit reveal |
| UI-58 | Unexpected item change | Browse and activate a prepared later song; skip headings and identify next-item transitions without accidentally activating the browsed item |
| UI-59 | Recovery position | Reconnect after a temporary section; clear transient history, keep pending words visible to operator and show the actual Next destination while output stays black |
| UI-60 | Stable live controls | Preparing, long titles, warnings and status changes do not move Blank or steal focus/scroll during navigation |
| UI-61 | End versus Blank | Operator chooses Blank for a pause and End for session closure; labels and placement distinguish consequences without a blocking safety dialog |
| UI-62 | Staged live content | Add/edit in staging; Save does not change the active snapshot; validated Apply updates the sequence without a reveal; Show slide explicitly reveals a selected prepared slide |
| UI-63 | Ministry flow | Build prayer, reading, song, message and response using headings and common Slides; no forced service template, duplicate content category or automatic timing |
| UI-64 | Public/private review | Distinguish audience wording from operator cues throughout preparation and preview; copying or duplicating a service does not silently publish notes |
| UI-65 | Scripture and quotation fidelity | Preserve supplied quotation, reference and version text across page breaks; public references appear only when deliberately authored |
| UI-66 | Human versus technical review | Successful rendering, completed preview and repeated use never imply pastoral approval; copied/changed content remains available for human checking |
| UI-67 | Prayer and response | Blank remains black until explicit Show; pauses, skipped items and return to prepared response do not trigger automatic content |
| UI-68 | Sensitive-data handling | Notes/help and backup handover do not imply encryption, restricted access or automatic redaction; synthetic private cues never project |
| UI-69 | Pastoral changes | Stage an unplanned reading, validate and Apply deliberately, then Show slide; existing live words remain unchanged by editing or Apply |
| UI-70 | Pastoral walkthrough | Review the intended public sequence and cues together; revise ambiguous transitions, quotation changes or misleading approval language before acceptance |

Use synthetic services containing bilingual pages, repeated sections, omitted sections, empty items, headings, images and delayed/failed video. Existing user exports are not a prerequisite. Browser automation does not replace actual Safari/Spaces/display rehearsal. Record unperformed Windows physical checks explicitly.

## 14. Incremental implementation plan

Use the [next updates plan](NEXT_UPDATES_PLAN.md) for the integrated execution order, database dependencies and phase gates. The UI-only stages below remain the scope outline; data-integrity prerequisites now come first.

1. **Application shell and Services.** Introduce workspace navigation and service landing. Verify creation, duplication, persistence, empty/demo separation, dirty-state protection and existing presenter access.
2. **Prepare and add drawer.** Reorganise item navigation and reuse existing editors. Verify arrangements, snapshot independence, design inheritance, notes separation, reordering and reload persistence.
3. **Presenter and song navigation.** Implement dedicated console, occurrence-aware section/page navigation and truthful previews. Resolve the proposed rules in section 15 before implementing them. Test section cursor rules as pure logic, then integration-test live/blank jumps, rapid media cancellation and recovery.
4. **Output setup and visual refinement.** Isolate display configuration, consolidate library/settings, implement accessible resizing and responsive layouts. Re-run output protocol and fullscreen-fallback checks.
5. **Release verification.** Run type checks, lint, unit/integration tests, production build and PWA validation; rehearse Safari with second display and perform the congregation-side room checks in [Congregation experience and validation](USER_INTERFACE_VALIDATION.md#c-congregation-experience-and-validation); deploy through GitHub Actions and smoke-test production subpath/offline operation when implementation and publishing are authorised.

Authoring/search/duplicate suggestions and lyric staging require separate increments within phase 2; verify their data and interaction contracts before adding them. The read-only review route can follow once service sequence navigation is stable. Portable handover packages, printing, review signatures, Trash and selective merges remain outside this redesign unless separately scoped.

Keep the application runnable after every phase. Record changed files, verification evidence and remaining manual checks. Do not combine this interface redesign with unrelated data migration or unsupported parity features.

Before presenter acceptance, run the operator stress walkthrough in [Live-service operator workflow and validation](USER_INTERFACE_VALIDATION.md#d-live-service-operator-workflow-and-validation) and pastoral walkthrough in [Pastoral workflow and service intent](USER_INTERFACE_VALIDATION.md#e-pastoral-workflow-and-service-intent) alongside the safety suite. Test slow-media, held-key, focus-loss and disconnect cases separately from ordinary successful navigation.

## 15. Decisions for review

| Decision | Proposed baseline | Reason |
| --- | --- | --- |
| Live selection behaviour | Confirmed: one-click Direct control while live; optional Preview only on Present; black requires explicit Show slide | Superseding explicit user choice, 19 October 2026 |
| Repeated-section quick jump | Resolve current, then next occurrence, then first | Gives direct section access while retaining arrangement position |
| Section outside arrangement | Temporary run with an explicit resume destination | Supports spontaneous worship-leading changes without rewriting service data |
| Editing during presentation | Confirmed: allow staged edits with explicit Apply; Show slide remains a separate reveal | Explicit user choice, 17 October 2026; replaces proposed immutable-session restriction |
| Replacing a service copy | Replace snapshot/order; retain item identity, notes and item-level appearance; preview all effects | Corrects a chosen copy without an undefined merge or changes to other services |
| Output setup toolbar during LIVE | Hide on pointer movement; expose through deliberate accessible setup action | Avoids controls appearing over congregation lyrics while retaining fullscreen fallback |

Direct control with optional Preview only (19 October 2026) and staged editing with explicit Apply are confirmed. Detailed occurrence/resume rules, source replacement and output setup access still require concrete design review. Resolve those interaction choices before implementing behaviour changes. Layout, information hierarchy and existing safety requirements can be reviewed independently. This specification does not authorise deployment or claim implementation acceptance.

## 16. UX implementation contract

### 16.1 Authority and delivery scope

The core specification is sections 1–16. The [validation companion](USER_INTERFACE_VALIDATION.md) contains the role-based walkthroughs and rehearsal evidence requirements. The [review record](UI_SPECIFICATION_REVIEW.md) records rationale and history; it does not override the core contract. User instructions and the original project safety/data requirements take precedence. For interface wording, section 10.1 is authoritative; internal technical terms elsewhere are not additional button labels.

The design remains a draft. Requirements marked Must are intended acceptance requirements, not proof of completed implementation or separate user approval of the proposals in section 15. Resolve those proposals before implementing affected behaviour. Reuse existing behaviour while a proposal remains unresolved; do not disable working features solely because this draft describes a stricter proposed policy.

| Delivery group | Included scope | Acceptance treatment |
| --- | --- | --- |
| Core redesign | Service landing, Prepare/editor/add flow, basic manual song creation, bilingual pages, song order, persistent saves, dedicated Present, direct section/page navigation, setup/recovery, Direct control with optional Preview only, staged Apply and safety controls | Required for the first redesigned workflow; sequence rules remain gated by section 15 |
| Authoring enhancements | Whole-song paste staging, expanded lyric search/duplicate suggestions, structural duplication/moving pages, before/after source replacement, focused review route | Separate increments with their own applicable scenarios; omission must be documented, not presented as core completion |
| Deferred parity/product work | Durable draft recovery, Trash, formal review signatures, portable service packages/merge, printing, No Words, automatic public overlays, reporting | Not implied by this redesign; preserve the parity inventory and scope separately |

Classifying a feature as later work does not remove an original project requirement or mark parity complete. Report core completion and remaining scope separately. Existing privacy, backup integrity, black-first operation and keyboard safety apply to every increment.

### 16.2 Interaction-state contract

Use one source of truth for each dimension: browsed item, requested destination, acknowledged output destination, output visibility and session connectivity. A destination includes service item, section/occurrence if applicable and page. Never infer acknowledged state from local selection.

| Action | Browse/view state | Requested cursor | Congregation effect |
| --- | --- | --- | --- |
| Expand item, inspect notes, focus control | May change | Unchanged | None |
| Return to current song | Returns to requested song/page | Unchanged | None |
| Previous/Next or activate section/page while black | Follow destination | Changes | Remains black |
| Previous/Next or activate section/page while live | Follow preview destination | Preview cursor changes only | Live output unchanged |
| Show slide selected prepared preview while black or live | Unchanged | Capture selected destination as immutable Show slide request | Explicit reveal request; report visible only after acknowledgement |
| Apply validated staged service | Refresh committed navigation version | Remap preview by source identity or choose a safe pending destination | Live frame unchanged; Show slide required to change it |
| Blank screen from any reachable safety control | Preserve useful selection | Retained, pending reveal cancelled | Independent black request; show Blanking until acknowledged |
| Close setup | Restore prior focus/view | Unchanged | None |
| Reconnect | Preserve labelled pending destination | Re-established without old temporary history | New window black; explicit Show required |
| End presentation | Return to service context | Clear session cursor | Blank and close where reachable |

Show slide is disabled while disconnected, connecting, blank acknowledgement is pending, no valid destination exists, or frame preparation has not finished. Do not accept a hidden queued Show click during these states. While live, Show slide remains available to replace the live slide with the selected preview; Blank remains the immediate hide action. Repeated clicks while revealing do not create new sessions. A later explicit Blank always defeats an earlier Show completion. From the moment Blank is accepted, visibility intent is black: subsequent navigation may prepare a pending destination but cannot reveal it, even before black acknowledgement arrives. Only a later eligible explicit Show can restore reveal intent.

When navigating during preparation, operate from the latest requested destination. Ignore obsolete preparation/acknowledgement results when updating current UI. Keep an error associated with the request that caused it; a stale error must not replace the status of a newer valid destination. An individual command acknowledgement is not a hardware or physical-screen verification.

### 16.3 Component, focus and overlay behaviour

Implement shared ServiceOrder, SongNavigation, SlidePreview, OutputStatus and SafetyControls components with a consistent state contract. Prepare and Present can have different actions but must not invent different labels for the same item/section/page. Shared preview means the rendering rules match, not that operator annotations become public content.

Use at most one modal layer. Add item may be a modal drawer; opening Create song temporarily replaces its drawer body with the editor and a Back to results action, preserving search and selection. Do not stack a second modal over the drawer. Back from a dirty editor follows the draft rule. After successful add, focus the added item or the visible continuation action and announce the result once.

Nonmodal drawers must not trap focus. Modal drawers/dialogs must contain focus, provide an accessible name and visible close action, and restore focus to their invoking control when closed. Any permitted live modal contains Blank screen within that focus scope. Escape has one outcome: close the top dialog or blank from the ordinary console, never both. Where the invoker no longer exists, restore focus to a logical stable heading or task control.

Use standard buttons for actions and disclosure controls for expansion with an explicit expanded state. Section/page activation requires Enter/Space; arrow movement within a composite moves focus only. Use Left/Right and Home/End for section focus within its row, without also navigating slides. A single Tab stop may enter a roving composite, but it must have clear instructions and an exit by Tab. Native selects and text composition must not be overridden.

Announce output changes once on acknowledgement using a restrained status region. Do not announce every heartbeat, prepared thumbnail or auto-scroll. A disconnect uses a prominent inline alert without moving focus. Form errors remain linked to fields and preserve entered content. Keyboard focus, selected destination and on-air state must remain visually distinct.

### 16.4 Save, cancellation and destructive actions

The UI must distinguish in-memory drafts from committed records. Show Saved locally only for the newest completed revision. Serialize writes per record or reject stale completions so rapid edits cannot make an older revision appear saved. A failed save retains entered values and offers Retry; do not require retyping. Prevent source replacement, deletion or presentation construction from using an uncommitted draft without an explicit choice.

Save song and add to service is one logical transaction: either the saved song and service copy both commit, or neither commits. A retry must preserve identities and must not create duplicates. If existing APIs cannot provide that contract, use a repository transaction before exposing the combined action. A warning that a song was saved but not added is not a successful completion of this action.

Confirmation text must name the target, scope and actual recovery capability. Cancel must be non-destructive. Undo must be shown only when a real tested undo operation exists. Delete and End presentation are different classes of action: deletion may require confirmation; immediate black/End safety actions must not wait for it.

### 16.5 Responsive and empty/error state precedence

On constrained layouts, preserve fixed safety controls and truthful output status first, then the current destination and section shortcuts, then Next preview, then notes and the complete order. Collapse supporting regions to labelled controls before allowing overlap. The desktop requirement that Current, Next and section access coexist applies at 1280 × 720 at normal zoom. At 200% zoom, supporting regions may collapse; the user must still reach them and all safety actions by keyboard without horizontal page scrolling.

An empty state, blocked action and error must not occupy the same region with conflicting guidance. Show the most actionable state: missing service → create/open; empty service → add item; invalid page → fix/select another page; no session → connect; loss → reconnect. Preserve destination context alongside an error. Do not hide an error solely in a short-lived toast. Routine success messages must not push controls around or require dismissal.

### 16.6 Test coverage and sign-off evidence

The 70 scenarios in section 13 are traceable acceptance cases, not 70 completed tests. For each delivered increment, record scenario IDs, applicable delivery group, verification method, result and evidence location. Use Pass, Fail, Not run or Not applicable with reason. Do not mark an unimplemented enhancement Not applicable merely to claim full scope completion; list it as deferred/not run. Reuse a single rehearsal for overlapping role scenarios, recording the applicable IDs rather than conducting duplicate tests solely because the personas differ.

Test interaction-state rules with unit/component coverage where meaningful; use browser integration for focus, navigation, real two-window acknowledgements, save failures and subpath/offline behavior. Use actual people for discoverability and physical rooms/displays for projection claims. Include keyboard-only operation, mouse-only operation, 200% zoom and an accessible screen-reader walkthrough of the operator console. Do not claim a standard's full conformance from this checklist alone.

Before implementation sign-off, produce a runnable low-detail prototype for the core Create service → Create/add song → Connect → Show → Chorus jump → Blank journey. Check discoverability and layout before extensive visual styling. This may use a mock output during early UX testing, but a mock cannot satisfy protocol/physical safety acceptance. Do not publish a prototype as production or overwrite user data during testing.

### 16.7 Staged Apply contract (confirmed workflow)

Maintain separate saved working service, committed presentation snapshot and acknowledged live frame. Edits and local saves affect the working service only. Show an unapplied-changes indicator; Cancel staging/discard choices must describe which saved version is being restored. Neither browsing nor local Save may refresh the presentation snapshot automatically.

Apply validates the staged service/media and commits one complete new navigation version. A failed Apply retains both the old committed presentation version and the staged work. Do not partly update text, ordering or references. Apply is not a Show slide: a currently live frame stays pinned with its assets, even if its source page was edited/deleted. Label it “Live: previous version” while applicable. Keep those assets protected from deletion until they are no longer held by the session.

Map preview identity to the applied version when possible. If its destination was removed, select a deterministic valid pending destination, show what changed and require Show slide. Never substitute a different destination into an already accepted Show slide request. Cancel in-flight reveal work during Apply and reject stale completions; changes to the active snapshot must not permit an old request to reveal after Blank. Blank remains independent throughout validation/commit.

A deliberate Show slide after Apply reveals the chosen prepared slide from the new committed version. Reconnect still starts black. Presentation snapshot versions and staged changes must not be reconstructed as LIVE on reload. Extending the snapshot/asset-reference model requires repository, media-deletion, protocol and integration tests before this feature is claimed complete.
