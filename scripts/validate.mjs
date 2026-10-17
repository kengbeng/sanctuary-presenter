import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
const base = process.env.VITE_BASE_PATH || "/sanctuary-presenter/";
const release = JSON.parse(readFileSync("dist/release.json", "utf8"));
const packageInfo = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(release.version, packageInfo.version);
assert.equal(release.databaseSchema, 3);
assert.equal(release.backupFormat, 5);
const html = readFileSync("dist/index.html", "utf8");
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (url.startsWith("/")) {
    assert(url.startsWith(base), `Wrong base: ${url}`);
    assert(existsSync("dist/" + url.slice(base.length)), `Missing ${url}`);
  }
}
const manifest = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"));
assert.equal(manifest.scope, base);
assert.equal(manifest.start_url, base);
assert.equal(manifest.id, base);
for (const icon of manifest.icons) assert(existsSync("dist/" + icon.src));
assert(existsSync("dist/sw.js"));
assert(readFileSync("dist/sw.js", "utf8").includes("release.json"));
assert(readFileSync("dist/sw.js", "utf8").includes("SKIP_WAITING"));
assert(!readFileSync("dist/sw.js", "utf8").includes("clientsClaim()"));
console.log(
  "Pages asset paths, manifest scope, icons and prompt-update worker verified:",
  base,
);
