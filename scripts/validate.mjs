import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const base = process.env.VITE_BASE_PATH || "/sanctuary-presenter/";
const directory = process.argv[2] || "dist";
assert(base.startsWith("/") && base.endsWith("/"), "Invalid hosting base");
const read = (file) => readFileSync(join(directory, file), "utf8");
const release = JSON.parse(read("release.json"));
const packageInfo = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(release.version, packageInfo.version);
assert.equal(release.databaseSchema, 3);
assert.equal(release.backupFormat, 5);
const html = read("index.html");
const origin = "https://hosting-check.invalid";
const precache = read("sw.js");
function asset(url) {
  const parsed = new URL(url, origin + base);
  assert.equal(parsed.origin, origin, `External asset: ${url}`);
  assert(parsed.pathname.startsWith(base), `Wrong base: ${url}`);
  const file = decodeURIComponent(parsed.pathname.slice(base.length));
  const path = resolve(directory, file);
  assert(path.startsWith(resolve(directory) + "/"), `Unsafe asset path: ${url}`);
  assert(existsSync(path), `Missing asset: ${url}`);
  assert(precache.includes(file), `Asset absent from offline cache: ${url}`);
  return path;
}
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) asset(url);
assert(html.includes('rel="icon"'), "Missing favicon");
assert(html.includes('rel="apple-touch-icon"'), "Missing Apple touch icon");
const manifest = JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.scope, base);
assert.equal(manifest.start_url, base);
assert.equal(manifest.id, base);
assert(manifest.icons.some((icon) => icon.purpose === "maskable"), "Missing maskable icon");
for (const icon of manifest.icons) {
  const png = readFileSync(asset(icon.src));
  assert.equal(png.subarray(1, 4).toString(), "PNG", "Expected PNG icon");
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
}
assert(precache.includes("release.json"));
assert(precache.includes("index.html"));
assert(precache.includes("SKIP_WAITING"));
assert(!precache.includes("clientsClaim()"));
console.log("Hosting paths, release, manifest, icon dimensions and offline cache verified:", base, directory);
