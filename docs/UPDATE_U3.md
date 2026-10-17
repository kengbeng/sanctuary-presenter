# U3: Workflow prototype

**Date:** 17 October 2026  
**Status:** Runnable local practice prototype; human workflow review pending

Open the local preview at `/sanctuary-presenter/#/workflow-prototype`. The isolated route uses temporary practice data and a labelled simulated congregation frame. Reload resets it; it does not save song/service records or open a real output window. The existing operator remains at the ordinary app route.

The prototype covers Services → Create service → Create/add song → Present, named song-order occurrences, direct chorus/bridge selection, pages within sections, explicit Take and Blank. Editing a service copy is staged; Apply updates the simulated navigation version without changing the displayed live frame, and subsequent Take reveals the selected applied page. It reuses shared model/renderer functions but is not a second database or production output protocol implementation.

Verified in four Chromium prototype tests: preview selection does not reveal; Apply does not change live words; Take, Blank and End work in simulation; safety controls remain reachable at widths 1280, 1024 and 640. A screenshot inspection caught a cropped main preview; it was corrected to fit the complete 16:9 frame within remaining space. Captured Services, Prepare, song editor and Presenter screens at 1440 × 900. Human discoverability testing, 200% zoom, screen-reader validation, real output and physical-display acceptance remain pending. Native modal focus is used, but these tests do not establish full accessibility conformance.

Implementation: `src/WorkflowPrototype.tsx`, scoped prototype CSS and a lazily loaded route in main.tsx. Tests: `tests/workflow-prototype.spec.ts`. Prototype test evidence: `docs/workflow-prototype.png`.

Scope intentionally absent: real database saving, library search, media picking, item reordering/removal, full bilingual editor, failure/disconnection simulation and omitted-section temporary runs. Those remain U4/U5/U6 work and must not be inferred from these screenshots. No production deployment was performed.
