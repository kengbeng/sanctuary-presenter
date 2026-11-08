# Library navigation — local rc.6

Implemented 19 October 2026. Prepared for GitHub publication on 8 November 2026.

## Workflow

- Search and filter the persistent list; browse readable lyrics and compact section/page buttons alongside it. Slide appearance is optional.
- Choose Edit song to change saved content. Save and Cancel remain in the selected-item header; unsaved changes require an explicit decision before changing items.
- New song, Import and Add to service are primary actions. Backups, restore, migration and storage controls live under Library tools.
- Add to service uses the existing service-saving workflow and creates an independent copy. Selecting another destination opens that service; adding during presentation stays staged and never reveals content automatically.
- Back to service returns to the working service. Small screens use list/detail views with Back to songs preserving search and scroll.
- Live presentation safety controls remain available while using Library. Idle Library hides the inactive output toolbar.

## Song editing

The editor opens on **Lyrics**, with separate **Song order** and **Details** tabs. The song title is directly editable in the sticky header alongside Save song, Cancel and save status. Tabs support arrow keys and Home/End. Switching tabs preserves staged lyrics and other unsaved changes.

Compact section buttons and a single Add picker (Verse, Chorus, Pre-chorus, Bridge, Coda or Custom) sit beside large bilingual fields. A compact sticky slide toolbar shows section/slide position, page tabs, Add slide and a Slide options menu for duplicate/move/remove. First and second lyrics language dropdowns offer English and Chinese; the second also offers None. Existing imported language values and existing words are retained. Lyrics fields sit side by side on wide screens and stack on smaller screens. Optional preview is compact, shows an empty-state hint and can sit alongside lyrics on large screens. Slide appearance contains language projection, design and background controls. Manage [section name] contains rename, duplicate, move and delete controls without a redundant section picker. Whole-song paste opens a native modal dialog over a faded backdrop. Close, Escape and backdrop dismissal retain staged text; Cancel paste clears it. Preview and Apply remain explicit; saving still uses Save song. Focus returns to the paste trigger after dismissal. Slide design and preview remain optional. Song order has numbered entries with Move earlier, Move later and Remove actions; Add to order repeats a section without duplicating its lyrics. Existing service copies remain independent.

On small screens, secondary Library-level actions are hidden while editing to make more room for lyrics. Save/error messages remain visible. The title, Save/Cancel and editor tabs remain accessible while scrolling.

## Validation

- ESLint passed; 69 unit tests passed.
- Complete Chromium browser suite: 66 tests passed, including bilingual section/page editing and persistence.
- Library navigation coverage includes search/scroll retention, mobile navigation, independent service copies, live-output isolation and the song-writing workflow.
- Both GitHub Pages repository-subpath and Cloudflare root production builds passed hosting, manifest, icon and offline-cache validation.
- Inspected the generated Library screenshot. Automated checks use isolated browser data. No user content is uploaded.

Native Safari hardware rehearsal of rc.6 remains outstanding. Production deployment is tracked by the GitHub Pages Actions workflow.

## Drag navigation refinement

Separate section and slide navigation uses dedicated grip handles with insertion markers. Desktop HTML drag moves sections vertically and slides horizontally within their section. Alt + arrow keys on a focused handle also move an item; existing menu move controls remain available for keyboard/touch use. Dragging preserves the selected section/page by ID. Automatic song orders follow reordered sections; custom sequences keep their existing IDs and repetitions. Moves remain unsaved until Save song and do not refresh service copies or output.

Section rows display slide counts and a selected-row options menu. A single Add section button opens the type picker. Slide options float without changing toolbar height and close after an action, outside pointer click or Escape. Song order guidance discourages unnecessary duplicate choruses. Native Safari/touch dragging has not been manually rehearsed for this update.

## Header installation status

The shared header control shows Install, Installing…, Installed, Update or Updating…. A deferred browser install prompt is used only when offered; other browsers show manual install guidance in a modal. Confirmed installation or standalone display determines Installed. Accepting a prompt alone does not claim completion. Update takes priority and keeps the existing presentation/other-output maintenance locks. Updating stays visible and disabled until reload or error. Native installation was simulated in browser tests; no system installation was performed.
