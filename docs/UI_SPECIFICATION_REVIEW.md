# User interface specification review

**Date:** 17 October 2026  
**Reviewed versions:** 1.0 through revised 1.7 draft  
**Scope:** Document review only. No application implementation or browser validation performed.

## Pass 1: Workflow and operator actions

| Finding | Revision in version 1.1 |
| --- | --- |
| Selecting, browsing and expanding were conflated, risking unintended live changes | Separated browsing/focus from destination activation; added Return to current song |
| Broad session editing ban exceeded the stated safety need | Limited proposed lock to active service/snapshot and referenced assets; retained safe unrelated library work |
| Readiness did not distinguish page errors from service-wide blockers | Added severity/effect table and save-before-session boundary |
| Dirty-master addition was ambiguous | Defined Save and add / Add saved version / Cancel, including new unsaved items and failed saves |
| Presenter fit requirement lacked a practical space budget | Added desktop composition, sizing priorities and zoom behaviour |

## Pass 2: Song navigation and output states

| Finding | Revision in version 1.1 |
| --- | --- |
| Repeated labels and repeated song instances lacked explicit identity | Defined occurrence/page/item identity and accessible destination cues |
| Temporary section chaining, backward movement and mid-section resume were undefined | Added single resume context, exit rules and six worked examples |
| Empty sections, broken references and legacy flat pages were omitted | Added explicit invalid/legacy handling without invented musical labels |
| Rapid Next could repeatedly advance from acknowledged output | Defined requested cursor separately from acknowledged frame |
| Black status and close-failure wording could overstate what is known | Added Blanking / unconfirmed states and reachable-output qualification |
| Media failure lacked a definite visible outcome | Defined safe black for foreground/overflow errors and explicit Show recovery |
| Output setup could reopen/test over a live session | Defined active-session dialog actions and disabled replacement/test paths |

## Pass 3: Internal consistency and verification coverage

| Finding | Revision in version 1.1 |
| --- | --- |
| Global Blank conflicted with the blanket prohibition on shortcuts outside Present | Made B/Escape explicit safety exceptions with protected-context rules |
| Modal focus containment could make background Blank inaccessible | Required a modal-local Blank action during active output |
| On-air badges could remain misleading after Blank | Distinguished On-air from Last shown and Last acknowledged |
| Proposed cursor rules could be implemented before review | Kept decision status explicit and added an implementation gate |
| Acceptance coverage missed key boundary cases | Expanded from 20 to 30 scenarios, including browse-only actions, invalid structures, modal safety and unconfirmed output |

## Remaining decisions

The immediate-live versus Preview/Take model, section-occurrence resolution, temporary-run resume semantics and active-service editing policy remain proposals requiring design review. The requirement for direct verse/chorus/bridge/page navigation is established by the user. The detailed proposals must not be presented as separately confirmed user instructions.

The revised specification is internally reviewed, not physically validated. Application tests, Safari/second-display rehearsal and deployment checks belong to implementation phases. No code or production state changed during this review.


## Pass 4: First-time volunteer cognitive walkthrough

**Method:** Read the proposed interface as a novice with an empty library and no browser/display knowledge. No participant testing or live application walkthrough was performed in this pass.

| Novice barrier in 1.1 | Revision in 1.2 |
| --- | --- |
| Add-from-library workflow stranded a new user with no library | Added in-context Create song / Create slides, useful defaults and explicit Save and add behaviour |
| Creating a song could require learning arrangements and metadata | Default section order, simple section creation and optional Song details; user-facing Song order label |
| Chorus/bridge quick access depended on switching navigation views | Made Song order and Jump to section complementary visible controls |
| Technical terms and competing Show/Restore labels increased uncertainty | Added canonical plain-language labels and one Show slide action while black |
| Styling exposed inherited settings too early | Default Projector appearance, small basic control set and More options |
| Display instructions assumed the volunteer knew which window to move | Added four concrete manual steps, operator/congregation explanation and practice path |
| Safety mechanics were precise but the user had no simple guide | Added optional five-action help and visible mouse-accessible controls |
| Local saving could be mistaken for a backup | Added concise local-storage explanation and a backup suggestion outside live operation |
| Ease of use lacked observable validation criteria | Added ten novice tasks, 36 total acceptance scenarios and an explicit participant test gate |

### Review outcome

The revised specification gives a novice a complete empty-library path and reduces prerequisite terminology. Detailed occurrence/resume rules remain proposals for review, with concrete Next destination cues instead of requiring volunteers to understand the internal rules. Actual novice usability remains unverified until implementation and participant testing.


## Pass 5: Church-worker preparation and song-database review

**Method:** Cognitive walkthrough of weekly preparation, standalone library maintenance, lyric correction and operator handover. Cross-checked existing model/repository boundaries and the v1 parity inventory. No interviews or application usability tests performed.

| Worker need missing or underspecified in 1.2 | Revision in 1.3 |
| --- | --- |
| Weekly reuse needed a complete route | Defined service duplication, stale announcement/note review and date/name distinction |
| Song creation was described chiefly as an Add item operation | Added standalone Save song and shared editor with explicit context |
| Finding the right song relied too heavily on titles | Specified lyric/bilingual/text-number search, candidate excerpts, filter reset and stable results |
| Growing libraries risked duplicate songs and number confusion | Added non-blocking duplicate suggestions, text church numbers and distinct CCLI labels |
| Lyric entry lacked efficient corrections and bilingual rules | Added explicit paste staging, structural operations, repeated-section editing and paired-language preview |
| Library corrections had no complete path back to prepared services | Defined unchanged copies, explicit before/after replacement and retained/replaced field policy |
| Service review and volunteer handover were unclear | Added read-only slide review, operator notes and honest local-only handover scope |
| Deletion could be confused with removing an item | Distinguished source deletion, independent copies, media references and actual recovery limits |
| Extra requirements could be mistaken for delivered features | Identified authoring increments, model compatibility checks and future handover/review features |

### Outcome and limits

Draft 1.3 adds a worker-focused preparation path and ten acceptance scenarios, bringing the total to 46. Eight practical tasks cover library maintenance and weekly preparation. The explicit service-copy replacement policy joins the outstanding design decisions; it is not an approved automatic update or merge feature. Portable service packages, printing, reporting, review signatures, Trash and cloud collaboration are not introduced by this review. Actual church-worker usability remains to be tested after implementation.


## Pass 6: Congregation-experience review

**Method:** Assessed the proposed output and preparation flows from the audience's reading and participation needs. This was document review, not consultation with a congregation or an actual projection test.

| Audience risk in 1.3 | Revision in 1.4 |
| --- | --- |
| Laptop fit could be mistaken for rear-seat readability | Added actual room, seating, lighting, font and per-language checks |
| Auto Fit could produce technically valid but unreadable words | Required room-appropriate minimums and explicit page splitting rather than hidden reduction |
| Lyric breaks and repeated sections could disrupt participation | Added meaningful phrase/page review and exact-word preservation |
| Busy video and unreadable fallback backgrounds were insufficiently assessed | Added temporal contrast rehearsal, static alternatives and muted background playback |
| Secondary language might become too small or silently disappear | Added bilingual readability and explicit language/layout choices |
| Public headings and private metadata could be confused | Preserved deliberately authored Page.title while excluding automatic metadata overlays |
| Audience distraction and setup toolbar behaviour were underdefined | Added calm transition rules and proposed suppression of pointer-triggered controls over live lyrics |
| Output failure could tempt a congregation-facing error or loading message | Reaffirmed clean black/error path and operator-only diagnostics |
| Audience acceptance lacked physical evidence | Added eight scenarios and a room-rehearsal record, bringing the total to 54 scenarios |

### Outcome and limits

Draft 1.4 treats readable participation as a separate acceptance outcome from successful rendering. It preserves manual fullscreen fallback and black-first recovery. Hiding the output setup toolbar during live content is a new proposed output-shell refinement that requires implementation testing. No fixed physical readability guarantee, audience feedback, clinical accessibility assessment or measured transition performance is claimed. Application code and production remain unchanged.


## Pass 7: Live-service operator review

**Method:** Walked through the specification as the operator responding to service cues, distractions, slow preparation and output loss. Checked keyboard handling references and earlier snapshot/recovery rules. No new browser or physical rehearsal performed.

| Operator risk in 1.4 | Revision in 1.5 |
| --- | --- |
| Browsing and returning could be confused with correcting live content | Defined Return to current song as view-only and Previous as sequence navigation, not undo |
| Long services and repeated songs lacked sufficient orientation | Required item, full section and page position, plus named next-item transitions |
| A pause could imply restoring the old page after selection changed | Standardised “Show slide shows the selected slide” and defined prayer resumption |
| Held navigation keys could race through the service | Added repeat suppression for navigation/Show while retaining idempotent Blank and deliberate rapid input |
| Slow media and focus changes could interrupt the operator | Added nonmodal delay guidance and stable focus, layout and scroll rules |
| Recovery retained unclear temporary context | Explicit pending destination, cleared transient history and truthful revised Next after reconnect |
| Broad “unexpected change” support could overpromise live editing | Distinguished prepared-song jumps from unplanned library additions and documented stop/edit/reconnect limitation |
| End/Blank consequences and rapid duplicate actions were underspecified | Added stable separated controls and idempotent session actions without blocking safety dialogs |

### Outcome and limits

Draft 1.5 adds eight acceptance scenarios, bringing the total to 62, and an eight-step operator stress rehearsal. Core presentation safety remains unchanged. The active-service read-only policy and resulting limitation on live additions remain proposed decisions requiring review. No implementation, physical verification or production change is claimed.


## Pass 8: Pastoral service-flow review

**Method:** Assessed service intent, public wording, ministry cues, prayer pauses and spontaneous changes from a pastor's perspective. Document review only; no pastor consultation, theological evaluation or live rehearsal performed.

| Pastoral gap in 1.5 | Revision in 1.6 |
| --- | --- |
| Service flow was described mainly as projected content | Added flexible ministry sequence, non-presenting cue handling and shared local review |
| Rendering success could be mistaken for approval | Explicitly separated human content/pastoral review from technical checks |
| Scripture references and wording lacked a review contract | Added supplied-text fidelity, public reference/version scope and cross-page checking |
| Private notes and backups could be misunderstood | Clarified same-profile access, backup contents and limits of hiding notes |
| Silence and background-only output could be confused | Distinguished black output from prepared imagery and deferred No Words behaviour |
| Immutable session policy could constrain spontaneous ministry changes | Elevated stop/edit/reconnect versus staged updates to a high-priority unresolved decision |
| Output failure lacked a ministry-facing rehearsal | Added a seven-step pastoral/operator walkthrough and eight acceptance scenarios |

### Outcome and limits

Draft 1.6 contains 70 acceptance scenarios and a dedicated pastoral review section. It supports human decisions without prescribing a theology or inventing approval/access-control capabilities. Active-service editing remains unresolved for churches requiring spontaneous additions. No features were implemented or deployed, and no pastoral acceptance is claimed.


## Pass 9: UX-engineering review

**Method:** Reviewed information architecture, interaction consistency, scope, save contracts, keyboard/focus behaviour and testability. Document review and source-boundary inspection only; no implemented prototype or usability test produced in this pass.

| Engineering finding | Revision in 1.7 |
| --- | --- |
| Successive persona reviews made a roughly 14,800-word specification difficult to navigate | Moved five role-based validation sections to USER_INTERFACE_VALIDATION.md; kept one core contract and explicit authority |
| Required scope and enhancement ideas had become interleaved | Added core/enhancement/deferred delivery matrix without dropping original parity requirements |
| Browse/request/acknowledgement rules were scattered | Added one action-state table and explicit Show eligibility, cancellation and stale-result rules |
| Draft retention could imply unimplemented restart recovery | Distinguished in-memory retention, Discard, browser warning and deferred durable recovery |
| Combined save/add success was underspecified | Required atomic commit and identity-preserving retry |
| Authoring drawer could create nested modals | Defined one overlay, editor replacement, focus restoration and modal-local Blank |
| Focus and selection could both trigger presentation | Defined focus-only composite arrows, explicit activation and shortcut precedence |
| Responsive priorities conflicted between normal layout and zoom | Specified content priority and collapsed supporting regions at reduced CSS viewport |
| Seventy scenarios could be mistaken for evidence or force duplicate rehearsals | Added scenario/result/evidence tracking and reuse of overlapping walkthroughs; kept count at 70 |

### Outcome and remaining risks

Draft 1.7 consolidates rather than adds another persona layer. Proposed live-selection semantics, temporary-section return rules, active-session editing, source replacement and output setup access still require review. The immutable-session policy may remain a significant workflow limitation for spontaneous services. A runnable prototype and observed user/room checks remain necessary; document review alone cannot establish usability. No application code, data schema or production state changed.
