# Sanctuary Presenter: User interface validation companion

**Version:** 1.8 draft  
**Date:** 17 October 2026  
**Status:** Planned walkthroughs and rehearsal checks; not completed validation  
**Core specification:** [User interface specification](USER_INTERFACE_SPECIFICATION.md)

**Confirmed update, 17 October 2026:** selection now changes preview only; Take is explicit while live or black. Staged service edits require explicit Apply, which does not reveal content. Any earlier immediate-selection or stop/edit/reconnect wording below is superseded by core sections 6.4 and 16.7. Update the corresponding task scripts to include Take after preview selection and Apply before taking edited content.

This companion retains the role-based walkthroughs from drafts 1.2–1.6. Use them to test the core contract and proposed decisions. The core specification takes precedence on interface wording, interaction behaviour and delivery scope. The role headings are validation perspectives, not additional application workspaces or mandatory user journeys. Older inline terms such as arrangement and temporary run describe internal concepts; canonical visible labels are in core section 10.1.

## A. Novice-user validation

### A.1 Review persona and limits

Design for a church volunteer who understands verses and choruses but has not used presentation software, has no imported library and does not know browser display permissions. Assume a laptop, mouse and optional second display. Do not assume familiarity with arrangements, inheritance, snapshots, codecs, GitHub Pages or keyboard shortcuts.

The novice review of this document is a cognitive walkthrough. Actual ease of use remains to be checked with people using the implemented interface. Do not report document review or automated tests as observed novice success.

### A.2 Unassisted task script

Use original synthetic lyrics and a clean browser profile. Give tasks in ordinary language, without naming the buttons to click. Do not give the volunteer the technical specification.

| Task | Expected path and observable success |
| --- | --- |
| Prepare Sunday's service | Create a named service from the empty home screen; recognise the running order |
| Add a song that is not in the library | Create a title, two verses, chorus and bridge; split the chorus over two slides; save and add within the service workflow |
| Repeat the chorus in the plan | Add another Chorus entry in Song order without duplicating lyrics or changing the library unintentionally |
| Put an announcement after the song | Create a slide set, add it and move it after the song; order persists after reload |
| Put the service on the second display | Follow connection guidance; identify operator and congregation windows; confirm the congregation window starts black |
| Start the first song | Predict what Show slide will display, then deliberately reveal it |
| Follow an unexpected repeat | While on Verse 2, jump to Chorus; reach its second slide, then Bridge without editing or stepping through intervening verses |
| Hide the words immediately | Find Blank screen without being told a shortcut; recognise confirmed black versus an unconfirmed connection |
| Recover and finish | Close/reconnect the congregation window; recognise that Show is required again; end the session safely |
| Keep a copy | Locate Export full backup and explain that local automatic saving is different from a backup file |

### A.3 Release gate and iteration

Test with at least three first-time volunteers, including at least one mouse-only operator. Include a physical Mac Safari/second-display session; other browser coverage remains subject to the existing test plan. Record browser, viewport, task outcome, wrong turns, requests for help and accidental activations without collecting private service content.

Each participant must complete the safety tasks of deliberate first reveal, chorus jump, Blank, black-first reconnect and End without facilitator intervention or accidental reveal. Aim for at least 80% of preparation tasks completed unassisted across participants; report counts as well as the percentage because the sample is small. Record time and hesitation to identify friction, without imposing an arbitrary speed requirement on new volunteers.

A safety failure requires correction and retesting of the affected workflow with a new first-time participant. A repeated wrong turn by two participants requires a documented design revision or an explicit explanation of the retained trade-off. Recheck labels, defaults, control placement and the number of decisions before adding more tutorial text. Do not solve discoverability failures solely by telling users to learn shortcuts.

These criteria are proposed implementation acceptance gates. They do not claim that user testing has already occurred, and they do not require user-provided library exports or service packages.


## B. Church-worker workflow validation

### B.1 Persona and priorities

The preparer may maintain a growing reusable song database during the week and hand a service to a different volunteer on Sunday. They need accurate words, dependable search, predictable edits, a clear song order and confidence that saved work can be recovered. This is a design perspective, not evidence that every church has the same staffing or language needs.

Prioritise existing reusable songs over creating unnecessary duplicates. Allow direct library creation as well as creation while preparing a service. Keep routine authoring free of projector setup. Never require metadata classification, named arrangements or a backup import before ordinary work can begin.

### B.2 Practical review tasks

Use a synthetic library with similar titles, alternate versions, bilingual content, numbers 001 and CH-12, one multi-page chorus and two prepared services using independent copies of a song.

1. Create and proofread a reusable song in Library without opening a service.
2. Find a song by a remembered lyric line rather than its title; distinguish a translation from an accidental duplicate.
3. Duplicate the previous week's service, replace one song, add announcements and set a different song order without editing the master.
4. Correct a library lyric, demonstrate that both prepared copies remain unchanged, then refresh only one copy after checking its preview.
5. Prepare primary/secondary language slides, split a long verse and repeat a chorus without retyping its lyrics.
6. Review the complete running order and notes without opening the congregation window; fix a discovered overflow.
7. Explain how another operator opens the service on this device and what a full-backup restore would replace on another device.
8. Remove a service item and delete an unused library version, correctly predicting which data and media remain.

Record wrong turns, repeated text entry, search failures, scope misunderstandings and recoverability. Any unintended library overwrite, service-copy overwrite, lost bilingual text or destructive restore misunderstanding requires a specification or interface correction and retest. Reuse the novice safety tasks for the subsequent presentation handover. No new metadata or completed-review flags are required solely to conduct these tests.

### B.3 Scope and evidence

Sections 3.3, 4.5, 4.7, 9.1 and 9.2 specify proposed authoring and preparation improvements. Some extend current functionality and must receive implementation, compatibility and acceptance testing. The existing model already provides song metadata, sections, repeated arrangements, bilingual pages and independent service copies; this is not evidence that all proposed search, paste, comparison or handover interfaces exist. Additive data changes, if needed, require explicit migrations and backup compatibility checks. Actual worker testing and physical rehearsal remain unperformed by this document review.


## C. Congregation experience and validation

### C.1 Audience needs and scope

The congregation needs to find the right words quickly, read them at the actual viewing distance and follow the worship leader without distraction. Consider people at rear and side seats, people unfamiliar with the song, older readers and people using either displayed language. Do not assume that one font size or one participant represents every viewer.

This review is an audience-perspective assessment of the specification. It is not direct congregation feedback, a measured accessibility assessment or an actual room test. The interface must help preparers verify audience outcomes without adding new mandatory setup screens to every service.

### C.2 Readability on the real screen

Use a plain, high-contrast text-on-solid-background default with a locally available readable font. Keep typography, alignment and margins consistent across a song unless explicitly changed. Avoid narrow, decorative or all-capital defaults for body lyrics. Preserve author-entered case, accents, punctuation and Chinese characters; style controls must not rewrite text.

The minimum text size and safe area must be inspectable in Appearance. Their software values are preparation controls, not a guarantee of legibility. Before first use in a room, test the actual screen size, projector resolution, lighting and seating distance. Choose an appropriate minimum for that room and profile. Both primary and secondary text must meet that practical minimum. If text fits only by becoming unreadable, split or simplify the authored layout explicitly rather than silently reducing the minimum. An overflow or missing-glyph error must link back to the affected page.

Keep lyrics within safe areas so screen edges and ordinary overscan do not crop them. Verify the full page, not just the centre. Check punctuation, descenders, accent marks, Chinese strokes and any public slide heading from the agreed rear and side seats. A font fallback with missing glyphs or substantially different wrapping requires correction or rehearsal; it must not be reported as equivalent merely because the page rendered.

Do not impose a universal line count: long words, bilingual text, screen size and viewing distance differ. The default sample should demonstrate short, readable phrases rather than dense paragraphs. Display warnings for actual overflow and let the preparer assess comfortable reading with the room check.

### C.3 Words and page boundaries

A projected page should contain a meaningful phrase or group of lyric lines. In Prepare, page breaks are explicit and editable. Do not silently truncate, append ellipses, paraphrase words or omit a repeated line to make text fit. Preserve hard line breaks. Any optional automatic splitting must show an editable proposed result before application.

Review a verse/chorus across page boundaries, including repeated appearances, to avoid a missing line, a duplicated line or an isolated word on the next page. Repeating Chorus in Song order must show the same intended words and layout unless the preparer deliberately uses a separate section variant.

Audience headings such as a song title or scripture reference are projected only when deliberately authored as public slide content. Section buttons, repeat counters and private service-item titles remain operator-only. Existing public Page.title content must not be stripped by this distinction. Automatic song-title, section or copyright overlays remain separate parity work; this revision does not implement them or infer them from library metadata.

### C.4 Contrast, backgrounds and motion

A decorative background must not take priority over the words. Preparation must offer a solid colour background and a still-image/poster alternative using the existing design controls. A video background remains muted and must not start automatic audio. Its loop, bright areas and scene changes must be checked against lyric readability. Do not add flashing, zooming, scrolling lyrics, kinetic text or decorative slide-transition animations in this redesign.

A static preview cannot verify video contrast over time. Provide an explicit local background preview during preparation where playback preview is implemented, or direct the worker to a deliberate output rehearsal. Keep the operator's live slide previews static under the existing playback policy. Never start video on the congregation screen merely to generate a thumbnail. Check the selected poster/colour fallback as well as successful playback. A fallback that obscures lyrics is not a validated readable fallback.

For movement-sensitive viewers, recommend a static background for the service. Device reduced-motion preferences must govern operator animation; do not assume they represent the congregation or silently rewrite saved service designs. A static congregation design remains an explicit preparation choice. No separate live motion-control feature is introduced here.

### C.5 Bilingual consistency

Use a consistent placement and visual relationship for primary and secondary text throughout the song. Secondary text must remain legible from the audience seats, rather than becoming a decorative small subtitle. If both channels cannot fit at readable sizes, split the slide into additional explicitly paired pages or deliberately choose another supported language mode. Do not silently remove one language to satisfy fitting.

Show the actual fallback when one channel is empty in preparation and review. A deliberate language-mode change must preserve both stored texts and use the shared renderer. Do not promise translation quality or automatic line-by-line alignment. A preparer must proofread correspondence and page breaks using the provided text.

### C.6 Calm and timely presentation

The operator should be able to display the next complete phrase at the worship leader's cue. Keep Next preview, rapid section jumps and the latest-request-wins preparation policy. Do not advance slides automatically based on guessed singing duration. Preload upcoming local content where possible without activating it. A direct Bridge jump must not display intervening verses while finding the destination.

Keep the last acknowledged valid frame while a new frame is safely preparing, subject to Blank and the existing error policy. Never flash black or another section simply as a loading decoration. If the new foreground cannot render safely, follow the defined black/error path; no congregation-facing error text or loading spinner is permitted. Do not promise exact transition latency or uninterrupted output during browser/hardware failure. Blank must remain immediate and independent of media loading.

A restarted or recovered window remains black until explicit Show slide. Test patterns must only appear after deliberate activation before or outside service operation. Do not automatically project a welcome slide, logo, standby message or last-used song during startup, prayer or reconnection. Any intended public standby slide must be authored and shown explicitly.

### C.7 Clean output and setup controls

The congregation frame must never contain operator notes, song-database search results, media filenames, diagnostic errors, network/storage notices, progress indicators or technical connection status. Do not mirror the operator desktop as a substitute for the dedicated output route.

The output window needs accessible fullscreen and return-to-operator controls for setup. Keep these outside the content renderer and hide their visual toolbar while a valid service slide is live. Pointer movement alone must not expose a toolbar over live lyrics. A deliberate keyboard setup gesture or an operator setup request may reveal controls; any such reveal must be documented for the operator, remain keyboard accessible and not show private data. Preserve direct fresh-gesture fullscreen activation and black-first behaviour. Browser/OS chrome is outside application control; explain this limitation in setup rather than claiming a permanently chrome-free screen.

Test this toolbar rule against the existing hover/focus output implementation. It is a proposed output-shell refinement, not a claim that the present implementation already suppresses controls during LIVE. The refinement must not remove the manual fullscreen fallback.

### C.8 Room rehearsal and acceptance evidence

Use synthetic primary-only and bilingual song pages, a multi-page chorus, long text, a public slide heading, a static background and a moving video with validated fallback. Rehearse under typical service lighting at the actual front, rear and side seating positions. Invite feedback from viewers with different reading/language needs where available; do not collect medical details or claim that a small group establishes universal accessibility.

Record:

1. Which screen, profile, locally available fonts, lighting and seating positions were checked.
2. Whether each displayed language and page heading was comfortably readable, including the longest page.
3. Whether lines remained complete and song repeats/section jumps matched the intended words.
4. Whether moving backgrounds or transitions distracted from reading.
5. Whether startup, Blank, setup, recovery and media failure exposed any unintended content or audio.
6. What was changed and which pages or conditions remain unverified.

Unreadable text, missing words/glyphs, unintended private content or an unexpected reveal requires correction and retesting before acceptance for that room. The normal workflow should reuse the checked profile; recheck materially changed fonts, layouts, output equipment or room conditions. A room check is rehearsal evidence, not a permanent hardware-readiness certification or a new stored approval flag. Record these checks alongside the existing manual-test evidence; no new database schema is required solely to document the review.


## D. Live-service operator workflow and validation

### D.1 Operating priorities

During a service, the operator must be able to answer three questions at a glance: What is the congregation seeing? Where am I in the song? What will Next do? Keep those answers and Blank screen visible while selecting verses, responding to a worship leader or recovering output.

The normal console must not ask the operator to choose a profile, manage library data, dismiss routine success messages or interpret protocol details. Use persistent inline notices for actionable problems, not modal alerts over song navigation. Do not add audible notifications or automatic focus changes. Long song titles, bilingual labels and status messages must wrap or truncate with an accessible full label without moving the fixed safety controls.

### D.2 Routine and unexpected service actions

| Situation | Required operator route and outcome |
| --- | --- |
| Begin a song | Select its first intended page while black; confirm destination; Show slide explicitly |
| Repeat chorus or jump to bridge | Use visible Jump to section or a specific Song order occurrence; follow its page count and actual Next destination |
| Skip to a later prepared item | Browse its row without output changes, then deliberately activate the intended slide/section; no intervening items project |
| Pause for prayer or speaker | Blank screen; keep the session open and the selected destination available; no automatic timeout or reveal |
| Prepare another destination during a pause | Navigate while black; Show slide reveals the currently selected ready destination, not necessarily the words shown before the pause |
| Browse accidentally or lose the active row | Return to current song restores the view only; it does not restart the page or undo a presentation action |
| Select the wrong slide while live | Select the correct visible destination or Blank immediately; no confirmation blocks correction |
| Finish the service | End presentation blanks and closes the session; Blank alone does not close it |

Explain the pause rule beside Show slide: “Shows the selected slide”. Do not use Restore in a way that promises the pre-pause slide after the pending selection has changed. A caption for Last shown remains informational, not an automatic return command.

Previous means the preceding destination in the effective song/service path, including the documented temporary-run exception. It is not an undo stack of live clicks. Correcting an arbitrary jump must use a deliberate destination; do not advise the operator that Previous always undoes the jump. A future Return to last shown action would require an explicit interaction contract and is not introduced here.

### D.3 Unplanned content and editing limits

Direct jumps select preview only; Take changes output. Stage an unplanned song, announcement or correction in Prepare without altering the committed presentation snapshot. Local Save retains the working service; validated Apply commits its navigation version without changing the acknowledged live frame. Take then explicitly reveals the selected ready destination. Test failed Apply, removed live pages and pinned media references under core section 16.7.

### D.4 Avoiding accidental actions

Use separate hit targets for expanding an item and activating its content. Section buttons must name the section and target page. No routine navigation action requires a confirmation dialog. End presentation is visually separated from Next and Blank, with stable placement and “Blank and close output” help. A pause uses Blank; ending requires a new connection. Avoid generic unlabeled icon-only stop buttons.

One click or intentional navigation key press performs one navigation action. Show and End are idempotent while their request is pending; repeated activation cannot create a second window, duplicate session or unexpected reveal. Do not apply an arbitrary global click debounce that prevents deliberate rapid Next actions. Preserve the existing latest-request-wins rule and independent Blank cancellation.

### D.5 Operator stress walkthrough

Use the checked room profile and a synthetic service with similar song names, repeated song items, a two-page chorus, an omitted ending, a prayer heading, a slow video and a deliberately failed foreground asset. Let a second person call cues in an unexpected but realistic order.

1. Start black, reveal a verse, skip to Chorus page 2, then jump to Bridge.
2. Browse a later song without projecting it; return to the current view, then deliberately jump to the later song.
3. Hold a navigation key and release it; verify no runaway sequence, then use several deliberate key presses.
4. Blank during slow preparation, select another destination and wait for the old request to finish; nothing reveals until Show slide.
5. Resume after prayer and correctly predict which selected words Show slide will display.
6. Close the congregation window during an extra section, reconnect and identify the pending page and revised Next destination before showing anything.
7. Handle a render failure and a loss of keyboard focus without a misleading live status or blocked Blank control.
8. Finish with End presentation; confirm the session ends, then reconnect black to recover from an accidental end without replaying LIVE.

Record wrong activations, missed cues caused by the interface, loss of position, inability to find Blank, focus theft and misleading output claims. Any unexpected reveal, unsafe stale completion or inaccessible safety action fails acceptance and requires correction/retest. Measure transition timing during rehearsal if useful, but do not set a performance claim without evidence. A successful automated run does not replace this physical operator walkthrough. This revision is document review only; none of these stress tasks has been newly validated by it.


## E. Pastoral workflow and service intent

### E.1 Purpose and boundaries

Support the church's chosen service flow, accurate public words and a calm response to the leader's cues. The application must not prescribe theology, a liturgy, a song selection or a pastoral decision. Different churches may structure prayer, readings, a message, communion, announcements and response differently. Use the existing common Slides framework and non-presenting headings rather than adding mandatory ministry-specific content categories.

This is a pastoral-perspective document review. It does not claim consultation with a pastor, doctrinal assessment, approval of any supplied content or successful use in a church service.

### E.2 Service intent and cue clarity

In Prepare and Review slides, make the intended running order and transitions understandable to both the pastor and operator. Use item names and private notes such as “Wait for invitation”, “Blank during prayer” or “Return to prepared response song”. Any speaker name or cue remains operator-only unless explicitly authored in a public slide. No new required speaker, ministry-role or timing database fields are introduced.

Represent non-presenting elements as clearly labelled headings where supported. Distinguish “This heading has no projected slide” from an empty or broken slide set. Such a heading does not automatically blank, reveal or pause the output. Before the event, pastor and operator must agree on the corresponding action and cue. Add no automatic transitions based on guessed service timing.

The pastor must be able to review the public slide sequence on the local operator device without needing display-permission, media-library or design knowledge. Public preview is the main review content; private notes are labelled outside the frame and may be hidden for a clean content review. This is a view toggle, not redaction, deletion or a secure sharing mode. Formal signatures, approval roles and versioned review states remain deferred.

### E.3 Accurate scripture, quotations and public text

Readings, prayers, sermon points and quotations use ordinary slide sets. Preserve the words supplied by the preparer, including references, version labels, quotation marks and punctuation. Do not generate, retrieve, translate, paraphrase or complete scripture or quotations automatically. The reviewer checks accuracy against the church's intended source; the application cannot certify it.

Allow public references and source/version text to be authored visibly using supported slide content. A Page.title used for a scripture reference is public and must appear in preview. Operator item names, source filenames, library metadata and private notes are not a substitute for deliberately authored audience references. Do not invent a structured citation feature or automatic footer as part of this revision.

When a passage spans several pages, review start/end boundaries, sequence and deliberate omissions against the supplied text. Do not silently drop words to fit. If the pastor changes wording after a review, retain exact new words and require an ordinary content recheck; do not continue displaying an old approval badge. Bilingual theological and linguistic accuracy remains a human review task, separate from whether both channels render legibly.

### E.4 Sensitive material and public/private scope

Operational notes are for presentation cues. Avoid collecting confidential counselling, safeguarding case details or other private pastoral records in this tool. User content remains local, but another person using the same browser profile may be able to access it. Do not describe local storage as password-protected, encrypted or accessible only to authorised ministry staff unless such capabilities are actually implemented.

A full backup can include operator notes, source metadata and other stored records in addition to public slides. Explain this at export/handover with concise wording, rather than implying that a backup is a public-only service document. Backup transport and access are controlled by the person handling the exported file; no automatic sharing or content upload is introduced.

Sensitive names, prayer requests and personal details become public only through the deliberate authoring and Show path, not because they appear in private notes. The software does not determine consent or automatically redact content. Content review must let the preparer see the actual public frame. A private-notes toggle must never be mistaken for a mechanism that removes those notes from backups.

### E.5 Silence, changes and continuity

Blank screen means fully black congregation output, including the background. It is suitable for a deliberate pause when no projected words are wanted. It must not automatically become a logo, standby message, looping background or next item after a delay. A still image or public prayer prompt is a separate prepared slide shown deliberately. “No Words” with a retained background is a separate deferred feature, not another name for Blank.

The pastor may repeat a chorus, skip an item, return to a prepared response or extend a pause. Those actions must work through the documented section/item navigation and explicit Show/Blank controls without changing saved song order. No timer, review flag or service heading may overrule the operator's explicit visibility action.

For an unplanned reading, announcement or correction, use the confirmed staged workflow: edit/save → validate and Apply → preview → Take. Save and Apply do not reveal content. An edited or removed currently live page remains pinned as the prior acknowledged frame until Take or Blank. This replaces the earlier proposed stop/edit/reconnect limitation. Validate the staged transaction, pinned assets and failure recovery before claiming support.


Presentation failure must not force the pastor to wait for the application or project a technical explanation. Keep the console's failure/black recovery route clear so the ministry team can continue without projected content. This is an operational fallback, not a claim that the application controls service continuity or can recover disconnected hardware automatically.

### E.6 Pastoral review walkthrough

Use synthetic content and a service containing a reading over multiple pages, a prayer heading, a bilingual song, announcements, a message outline and a prepared response song.

1. Pastor and operator review the public sequence and distinguish private cues from public words without opening congregation output.
2. Check the supplied reading's reference/version and exact wording over page boundaries; correct an intentional test omission and recheck the result.
3. Duplicate the service and identify copied announcements, names and notes needing review; no technical success indicator implies pastoral approval.
4. Rehearse an extended black-screen prayer, an unexpected chorus repeat, a skipped item and a return to the prepared response.
5. Ask for a reading absent from the prepared service; rehearse staged Save, Apply and Take without changing output before Take.
6. Inspect what the full backup contains and explain why hiding operator notes in preview does not remove them from stored/exported data.
7. Simulate output loss and agree how the service continues while the operator reconnects a black window; no automatic reveal or projected error message is permitted.

Record ambiguous cues, quotation/wording discrepancies, public/private confusion and any operational limitation the pastor cannot accept. Correct unexpected publication or misleading approval language before acceptance. These are proposed review tasks, not evidence that a pastor has performed them. No new mandatory approval workflow, cloud role or sensitive-data collection is required to conduct the review.
