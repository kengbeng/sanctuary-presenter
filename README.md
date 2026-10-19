# Sanctuary Presenter v2 — 0.7.0-rc.5

A local-first church presentation application for GitHub Pages. Services → Prepare → Review → Present provides independent service copies, bilingual songs, repeated sections, local media and a separate congregation window. This release candidate is for rehearsal. Automated checks do not replace the outstanding Safari/second-display, room-readability and participant checks listed in [release acceptance](docs/RELEASE_ACCEPTANCE.md).

## Prepare and present

1. Open Services and create or open a service. Add saved content or create a song without an existing library or export.
2. Enter verses, choruses and bridges, including multiple slides and both language channels. Optional whole-song paste uses explicit `[Section]` lines and `---` slide breaks, followed by Preview and Apply. Save song and add creates a reusable Library song and a separate service copy atomically.
3. Prepare saves service-copy changes locally. Duplicate/move sections or slides under their options. Custom song orders and notes remain distinct from source Library content. Review service walks the saved public sequence and private cues without changing output.
4. Choose Present service, open Display setup and open the congregation window. Automatic discovery is available where the browser supports it; manual positioning is always available. New and recovered output starts black. Visually verify the projector.
5. Select the first slide and press **Show slide**. Once live, use Next/Previous, a song-order position or a section jump to show a slide in one click. Turn on Preview only to inspect selections without changing output. While black, selection stays local until Show slide. **Blank screen** hides content; **End presentation** closes the session. Arrows navigate according to the visible mode, S or Shift+B shows the selected slide, and B/Escape blanks outside protected editing/modal contexts. Click the operator window to use shortcuts.
6. During presentation, Prepare edits remain staged. Apply saved changes in Present replaces the navigation version while keeping the acknowledged live frame; a separate Show slide reveals new words. Library corrections never silently refresh service copies. Library source → Compare with Library shows the consequences before explicitly replacing one copy.

The operator can deliberately expose output setup controls for an Enter Fullscreen click. Fullscreen may require a fresh gesture; manual positioning, browser fullscreen or windowed output remain available. Pointer movement does not expose controls over live lyrics. Safari Spaces, codecs, projector placement and room readability require actual hardware rehearsal.

## Upgrade and backups

Before upgrading an existing installation, export a full backup from Library (Library & planner in older versions), save the ZIP outside browser storage, end all sessions and close every other operator/output window. Apply the downloaded update only after that. Never clear site data as an update procedure.

This candidate uses **database schema 3** and **backup format 5**; restore accepts supported formats 1–5. Schema-2 records receive editing revision/token metadata without rewriting IDs, lyrics or embedded copies. Stale saves are rejected with drafts retained. Restore is validated, transactional and replace-only; it does not merge. Export before replacing data. Archive size is limited to 256 MB and structured JSON to 16 MB.

Older JavaScript is not a safe database downgrade. Retain the original external backup and previous deployment artifact; use a compatible current reader or forward repair. A browser that has opened schema 3 must not be pointed back at older schema-2 JavaScript as a recovery procedure. See [U2 compatibility](docs/UPDATE_U2.md) and [release acceptance](docs/RELEASE_ACCEPTANCE.md).

## Offline and privacy

First load requires connectivity. Wait for **App shell cached · offline ready**, then rehearse a complete browser restart with networking disabled. App-shell assets are cached by the service worker; songs, services and imported media stay in IndexedDB on this browser profile and origin. No content upload, synchronization, runtime CDN, analytics, remote fonts or backend is used. GitHub receives ordinary static-site requests. Local storage can be cleared or evicted; keep external backups. Local storage and notes are not encrypted or access-controlled by this application.

Updates download without forced activation. Presentation shared locks block unsafe update activation and restore. Without Web Locks, stop sessions and close all app windows so the downloaded update can activate naturally. Separate profiles, origins and devices have separate storage; exporting/restoring a full backup is the supported cross-device transfer, with explicit replacement at the destination.

## Development

Use Node 24 and npm:

```sh
npm ci
npm run typecheck
npm run lint
npm test
python3 -m unittest discover -s tools/tests
npm run build
npm run validate:pwa
npx playwright install chromium
npm run test:e2e
npm run preview
```

Open the printed URL including `/sanctuary-presenter/`. Service workers need localhost or HTTPS. `npm run dev` supports normal development. The default route uses the new workflow. `#/app` retains the prior compatibility operator, with its former immediate live navigation; `#/workflow-prototype` uses temporary practice data; `#/output` is the dedicated output route. These entries do not need server rewrites.

## GitHub Pages

Repository: [kengbeng/sanctuary-presenter](https://github.com/kengbeng/sanctuary-presenter). Hosting target: [Sanctuary Presenter](https://kengbeng.github.io/sanctuary-presenter/). The local candidate is not evidence of deployment; see [verification](docs/VERIFICATION.md) for actual publication results.

The existing Actions workflow installs from the lockfile, runs strict types/lint, application/converter/browser tests, builds and validates the PWA, then deploys the official Pages artifact. Set Settings → Pages → Source to GitHub Actions. A push to main starts this workflow. Git push needs repository authentication; deployment uses the built-in Actions token.

The default base is `/<repository>/`. Set repository Actions variable `VITE_BASE_PATH=/` for an owner site/custom domain, or use `VITE_BASE_PATH=/your-repository/ npm run build` locally. The base must start and end with `/`. Rebuild when changing the base or repository name. Manifest identity/scope/start URL, worker, assets, output URLs and release metadata follow the base. `release.json` identifies the built version, database schema and backup format.

After deployment, verify the expected release:

```sh
node scripts/smoke-deployed.mjs https://kengbeng.github.io/sanctuary-presenter/ 0.7.0-rc.3
```

This checks deployed version metadata, subpath loading, manifest, offline reload, black-first dual-window Show slide/Blank/End and absence of third-party app requests or write requests. It does not certify physical placement or cold-start behavior on every browser.

## v1 conversion

A standalone Python converter supports v1 format-1/schema-15 Library exports, consistent schema-15 SQLite backups, schema-9 service JSON and portable service packages. It leaves source files untouched and refuses existing output paths. Example:

```sh
python3 tools/convert_v1.py --library library.splibrary --service sunday.spservice --output converted.zip
python3 tools/convert_v1.py --database closed-backup.sqlite --media-root /path/to/media --output converted.zip
```

See [conversion scope](docs/V1_CONVERSION.md) for exact formats, media mapping and retained provenance. Export the destination's backup, stop all output, then use Library → Restore backup to replace local data with the converted archive. Conversion is not a merge; EasiSlides and unsupported history/settings activation remain outside scope. Rehearse actual user media and text after conversion.

See [implementation plan](docs/NEXT_UPDATES_PLAN.md), [UI specification](docs/USER_INTERFACE_SPECIFICATION.md), [database review](docs/SONG_LIBRARY_DATABASE_REVIEW.md), [release acceptance](docs/RELEASE_ACCEPTANCE.md), [manual history](docs/MANUAL_TESTS.md) and [verification](docs/VERIFICATION.md).

## Display recovery follow-up

This candidate defaults browsers without automatic display selection to manual, windowed output. Hidden-page reporting blocks Show slide; pending slide requests have a 15-second confirmation timeout that requests black without claiming physical confirmation. The Acer manual rehearsal covered black startup, preview/Show slide separation, hidden-output blocking and restoration. Timeout expiry and rejection of a late confirmation passed a local manual transport-fault check. See [display follow-up](docs/UPDATE_SAFARI_DISPLAY_SETUP.md) and [manual results](docs/MANUAL_TESTS.md). Safari/Sidecar fullscreen and physical placement are not certified.


## Operator wording and rehearsal follow-up

The presenter uses **Show slide** instead of the broadcast term Take. **Apply saved changes** still updates the presentation without revealing new words. Prepare / stage edits opens the active saved service directly, including after a browser restart. Keep Safari output windowed: both webpage and native fullscreen lost visibility during different rehearsal attempts.

Manual Acer checks covered song sections/repeated choruses, a two-slide bridge, staged corrections with Library-source isolation, and cached Safari cold restart with the local app origin unavailable. Full network-disconnected hosted restart, representative media, iPad/Sidecar and the remaining participant/accessibility checks remain outstanding. See [manual results](docs/MANUAL_TESTS.md).


## Direct navigation

In Present, Direct control shows slide and section destinations in one click while live. Preview only keeps navigation local until Show slide; Return to live restores the acknowledged destination without revealing a new selection. Startup and Blank remain black until an explicit Show slide. Apply saved changes enters Preview only. Rehearse the new interaction on the actual display before service use.


## Hosting builds

- `npm run build:pages`: builds and validates the repository subpath into `dist`.
- `npm run build:cloudflare`: builds and validates `/` into `dist-cloudflare`.
- `npm run check:hosting`: checks both builds; GitHub Actions uses this before deploying Pages.

Cloudflare Workers settings and the explicit static-assets deployment configuration are documented in [Cloudflare Workers hosting](docs/CLOUDFLARE_WORKERS.md). The release metadata and header identify rc.5, including the matching wordmark, app icons, optional presentation guide and site-transfer help in Library. These local changes require publication and hosted verification.
