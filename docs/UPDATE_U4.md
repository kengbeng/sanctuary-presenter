# U4: Services and Prepare foundation

**Date:** 17 October 2026  
**Status:** Implemented locally and browser-tested; not deployed

## Working interface

The default operator landing is now Services. Create, find, open, duplicate and delete saved orders using the real revision-aware repository. A new service opens Prepare; no source export or existing library is needed.

Prepare offers an item-based running order, selection of individual content pages, item move/remove actions, an adjustable order-panel width, service date/profile/background settings, bilingual page editing, notes and a shared-renderer congregation preview. Names, notes and design settings are disclosed contextually rather than occupying a permanent setup column. Service-copy edits autosave through a local revision-aware queue; errors retain working data and offer Retry or explicit reload. Invalid intermediate service names remain recoverable without poisoning the save queue.

Add item is a native modal drawer containing Songs, Slides and Media search. Add existing saved content or create a song/slide set within the same flow. Song authoring supports labelled verses/choruses/bridges, multiple pages, both text channels and repeated section references. Save and add calls the U2 atomic transaction. Draft fields are disabled during commit, duplicate submissions are guarded, and cancel does not save a partial record. Local media import reuses the existing validation/repository. Operator-only headings are service items excluded from projection, not a new library category.

The Library destination in the new root workflow shows reusable content management without the old parallel service-planner column. Add saved songs/media to a service from Prepare. The explicit #/app compatibility entry retains the old operator/planner layout and regression workflows while the presenter replacement is being built. #/workflow-prototype remains practice-only.

## Safety and boundaries

New workspaces do not open output or reveal slides. Existing presentations retain their loaded snapshot while working copies are saved. Applying those edits to a real live session is not implemented in U4; the current interface says so rather than silently replacing it. Preview → Take and staged Apply remain demonstrated in the prototype and are the U5 integration requirements. The real existing presenter still uses its prior immediate navigation.

Hash navigation between operator/output/prototype now mounts the proper route, rather than retaining the previous page until reload. Native modal dialogs own Escape; they do not accidentally invoke the global Blank shortcut. When an output session exists, the drawer includes a reachable Blank action. Restore resets the new workspace's local editing context after the validated transaction. Source library records and service snapshots remain independent.

## Verification

- TypeScript, ESLint and production build passed.
- Existing unit suite: 43 passed. Python converter suite was unchanged; the last 56-test pass remains the U2 evidence.
- Full Chromium suite passed 39 tests after the root/routing and preparation changes. After the final draft guards and compact notes layout, the affected four preparation tests passed again.
- Build/PWA repository-subpath validation passed; no runtime hosting/backend change introduced.
- New tests cover real atomic bilingual/repeated-song creation, queued service-copy edits and reload, independent source content, service duplication, cancelled authoring, reusing saved slides, item reordering, modal Escape, intermediate empty names, adding service-copy pages and exclusion of private headings.
- Physical Safari/second-display, participant usability and screen-reader checks for this interface have not been run. No production deployment occurred.

## Remaining scope

This is the working Services/Prepare foundation, not a claim that the full UI specification is complete. Drag reordering, remembered pane preferences, deeper section restructuring, improved search/duplicate comparison, dedicated read-only review and full Settings consolidation remain follow-on work. The new authoring form exposes basic metadata; the reusable Library retains the fuller existing fields. Source replacement remains a separate explicit enhancement.

Next: integrate real Preview → Take, occurrence-aware song controls, acknowledged live preview, staged Apply with pinned live frame/assets and focused display setup under U5. Preserve black-first recovery and offline/subpath behavior throughout that change.
