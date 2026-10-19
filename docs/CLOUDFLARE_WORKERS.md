# Cloudflare Workers static hosting

GitHub Pages remains the primary production host. Cloudflare Workers can serve the same client application at a separate origin using Workers Static Assets. No Worker script, server database, content upload endpoint or Cloudflare Vite plugin is required.

## Git-connected Workers build settings

- Repository: kengbeng/sanctuary-presenter
- Production branch: main
- Root directory: repository root
- Build command: `npm run build:cloudflare`
- Deploy command: `npx wrangler@4.151.1 deploy --config wrangler.jsonc`
- If a non-production branch deploy command is configured: `npx wrangler@4.151.1 versions upload --config wrangler.jsonc`

The version above is the Wrangler release shown in the supplied deployment log. The explicit configuration prevents automatic framework setup from attempting to install project dependencies during deployment. Review the Wrangler pin when upgrading the deployment tool.

The assets directory is `dist-cloudflare`, never the repository root. The application uses hash-based navigation, so no catch-all HTML fallback is needed. Missing asset, release metadata and service-worker URLs retain normal missing-file behaviour.

`npm run build:cloudflare` forces its build base to `/`, and writes to a separate output folder. The build base must be `/` for a normal workers.dev hostname or root custom domain. Otherwise Vite emits `/sanctuary-presenter/` URLs while the Worker serves files at `/`, causing asset and service-worker failures. The named Cloudflare build command sets the root base; the named Pages build command retains its repository subpath. GitHub Actions runs `npm run check:hosting`, checking both outputs before publishing `dist`. Do not change the application's default base to make one host work.

## Reported deployment failure

The supplied log shows dependency installation and `npm run build` succeeding. Without a committed Wrangler configuration, `npx wrangler deploy` attempted framework auto-setup, including installing Wrangler and the Cloudflare Vite plugin; npm then failed with `Cannot read properties of null (reading 'edgesOut')`. The log does not identify the underlying npm graph defect. Explicit static-assets deployment avoids the failing auto-setup step; a successful Cloudflare deployment still needs verification.

## Verification and local data

After deployment, check release.json, manifest scope/start URL, cached reload, new black output, Show slide, direct navigation, Preview only and Blank. Perform a disconnected browser restart on the intended device after the first successful online visit.

A Cloudflare hostname has separate browser storage from the GitHub Pages hostname. Songs, services and media do not automatically appear on the other host. Export a full backup from the existing site and deliberately restore it on the new host if moving your library. This transfers content through a local file; application content is not uploaded to Cloudflare.

Sources:
- https://developers.cloudflare.com/workers/static-assets/get-started/
- https://developers.cloudflare.com/workers/static-assets/binding/
