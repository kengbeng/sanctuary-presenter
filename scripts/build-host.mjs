import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const target = process.argv[2];
if (!["pages", "cloudflare", "check"].includes(target)) {
  throw Error("Choose pages, cloudflare or check");
}
function run(file, args, env) {
  const result = spawnSync(process.execPath, [file, ...args], { stdio: "inherit", env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("node_modules/typescript/bin/tsc", ["--noEmit"], process.env);
for (const host of target === "check" ? ["cloudflare", "pages"] : [target]) {
  const base = host === "cloudflare" ? "/" : process.env.VITE_BASE_PATH || "/sanctuary-presenter/";
  const directory = host === "cloudflare" ? "dist-cloudflare" : "dist";
  const env = { ...process.env, VITE_BASE_PATH: base };
  if (host === "cloudflare") {
    const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
    if (config.assets?.directory !== "./dist-cloudflare")
      throw Error("Cloudflare assets must point to ./dist-cloudflare");
  }
  console.log(`Building ${host}: ${base} → ${directory}`);
  run("node_modules/vite/bin/vite.js", ["build", "--outDir", directory], env);
  run("scripts/validate.mjs", [directory], env);
}
