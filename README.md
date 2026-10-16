# Sanctuary Presenter v2 — 0.5.0

Local-first, dual-window church presentation proof of concept. React + strict TypeScript + Vite + Workbox. Phase 1 output safety is retained alongside the Phase 2 local library and service planner. Shared rendering, output profiles, scoped design inheritance and local video backgrounds are now available. Physical Windows checks and Safari validation of the new library/media workflows remain open; see docs/PHASE_2.md and docs/PHASE_3.md. A standalone v1 library-export converter is available; SQLite backups, service JSON and portable service packages can also be converted; representative user-data acceptance remains pending.

## Development

Use Node 24 LTS and npm.

```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run validate:pwa
npm run preview
```

Open the URL printed by Vite, including `/sanctuary-presenter/`. Production-preview service workers require HTTPS or localhost. Build tests with `npx playwright install chromium` then `npm run test:e2e`. Browser integration uses the production build on port 4173 and the default subpath.

## Output rehearsal

Configure Display to request automatic screen discovery where supported. Choose the desired screen when there are multiple secondaries. Start Presentation or Test Output opens a separate window synchronously. It starts black and must acknowledge before Show is enabled. Verify the actual projector, then confirm placement. Show/Restore reveals the pending slide; Blank hides immediately. Navigation while blank changes only the pending slide. Test mode only reveals a deliberate test pattern.

Manual positioning is always available: drag the output window to the projector, then hover its lower edge or tab into the output controls to click Enter Fullscreen. Fullscreen may be rejected without a fresh gesture; continue windowed or use browser fullscreen. Safari Spaces requires real-system rehearsal. If popups are blocked, allow them and click Start/Reconnect again. Reconnect always opens black. Stop blanks and closes output where browser policy permits. Keys in the operator: arrows navigate, B/Escape blank, S show.

## GitHub Pages

The deployment workflow runs lockfile install, typecheck, lint, unit tests, build, PWA path validation and Chromium integration tests before official Pages artifact/deployment actions. Connect this repository to GitHub, push to `main`, and set **Settings → Pages → Build and deployment → Source: GitHub Actions**. Repository: [kengbeng/sanctuary-presenter](https://github.com/kengbeng/sanctuary-presenter). Production target: [Sanctuary Presenter](https://kengbeng.github.io/sanctuary-presenter/). Deployment status is recorded in docs/VERIFICATION.md.

CI defaults to `/<repository>/`. For owner sites or custom domains set the repository Actions variable `VITE_BASE_PATH` to `/`. For local builds use `VITE_BASE_PATH=/your-repository/ npm run build`. The value must start and end with `/`. Rename repositories by rebuilding with the new base. Configure custom domains through GitHub Pages settings and DNS, then rebuild with `/`. Hash routes `#/app` and `#/output` need no server rewrites. All assets, manifest IDs/scope, output URLs and worker paths follow the base.

## Offline and privacy

First load requires connectivity. Wait for **App shell cached · offline ready**, then rehearse a cold restart with network disabled. Only app-shell files are cached; imported content and media are stored separately in IndexedDB. Sample text is bundled; no content is uploaded or synced. No runtime CDN, fonts, analytics or backend. GitHub receives ordinary static-site requests; user libraries remain local. Browser storage is isolated by profile/origin and can be cleared or evicted. A domain or origin change creates a separate storage context.

Updates download without forced activation. Stop all presentations and close other output/operator windows before applying a downloaded update. Browser-held shared locks protect presentation sessions, including silent/suspended tabs; applying an update or replacing the library requires an exclusive lock. Heartbeats provide additional guidance. Without Web Locks, close every app window so the downloaded update can activate naturally; in-app restore is unavailable. For the first upgrade from an older build without these locks, close all app windows before reopening. Do not apply updates during a service.

## Library, services and backups

Open **Library & planner**, create a service, then create a song or slide set. Songs support text song numbers, bilingual multi-slide sections, and arrangements with repeated sections. Save the library master before adding it to the service. A service item is an independent snapshot: notes, text and design changes do not alter the master. **Present this service** loads the saved service into the operator and keeps output black until Show. The selected service survives normal reloads; output never resumes LIVE automatically.

Import local images/video through Media; supported MIME types and a 200 MB per-file limit are shown in the app. Referenced media cannot be deleted. Video codec support varies; rehearse on the actual browser/projector. Backgrounds support image/video, cover/contain, darkening and poster/colour fallback. Blank pauses retained playback; Restore resumes an unchanged source. Operator video previews are static. Codec support and continuity still need real Safari/Windows validation.

Open **Service design & output profile** in the planner to inspect Projector/LED wall/Livestream values or edit Custom. Service settings are inherited by items/slides unless an explicit Custom override is selected. **Auto Fit** respects the minimum size and safe area; text that still overflows stays black with an operator error. Fonts are local to the device, so rehearse bilingual text on the actual projector.

Use **Export full backup** prominently in the planner. Keep the ZIP outside browser storage and export before destructive changes. **Restore backup** validates before asking to replace all local data; stop presentations and close other operator tabs first. Archive limit is 256 MB; structured JSON limit is 16 MB. Restore is replace-only and transactional. See [Phase 2 scope and limits](docs/PHASE_2.md) for security limits and remaining parity work. Current backup manifests use version 2 and restore accepts versions 1 and 2. v1/EasiSlides conversion is not yet available.

See [decisions](docs/DECISIONS.md), [parity inventory](docs/FEATURE_PARITY.md), [migration prerequisites](docs/DATA_MIGRATION.md), [physical acceptance checklist](docs/MANUAL_TESTS.md) and [verification record](docs/VERIFICATION.md). Remaining physical and cross-browser acceptance checks are required before release.


## v1 library, SQLite and service conversion (0.5.0)

Export a `.splibrary` from v1 with media included, then use Python 3 outside the PWA:

```sh
python3 tools/convert_v1.py --library /path/to/export.splibrary --output /path/to/new-v2-backup.zip
python3 -m unittest discover -s tools/tests
```

Only library format 1 / database schema 15 is supported. SQLite input requires Python 3.11 or newer and a consistent schema-15 backup. The tool leaves its source untouched and refuses existing output files. In v2, export your current full backup, stop presentations, then use **Library & planner → Restore backup**. This replaces the local library; it does not merge. Inspect the conversion report and rehearse text/media before use. Original export JSON is retained and downloadable from the report. Keep the original `.splibrary`, including any deleted media bytes.

See [conversion scope and limitations](docs/V1_CONVERSION.md). For a closed SQLite backup, use `--database` instead of `--library` and supply `--media-root` or `--path-map` for active media. See the conversion guide for examples. History/settings/deleted rows remain inspectable archival data. Add repeatable `--service` inputs for schema-9 service JSON or `.spservice` packages, either alone or alongside a library/database. For example: `python3 tools/convert_v1.py --library library.splibrary --service sunday.spservice --output converted.zip`. Service snapshots remain independent; converted designs are explicit per-slide values. EasiSlides and active historical-data migration remain pending.

Production smoke check (after deployment, with Chromium installed):

```sh
node scripts/smoke-deployed.mjs
```

This checks the live HTTPS subpath, manifest, offline reload and black-first dual-window Show/Blank/Stop flow in a clean browser context. The first GitHub Actions build and Pages deployment passed; see the verification record for immutable run details. Local Git pushes require GitHub authentication; Actions uses its built-in repository token.
