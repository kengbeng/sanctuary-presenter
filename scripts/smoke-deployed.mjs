import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const target = new URL(
  process.argv[2] || "https://kengbeng.github.io/sanctuary-presenter/",
);
assert(
  target.protocol === "https:" || target.hostname === "127.0.0.1",
  "Use HTTPS or local preview",
);
assert(
  target.pathname.endsWith("/"),
  "Include the repository's trailing slash",
);
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const errors = [],
    remoteRequests = [],
    writes = [];
  context.on("page", (page) =>
    page.on("pageerror", (error) => errors.push(error.message)),
  );
  context.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      url.origin !== target.origin
    )
      remoteRequests.push(request.url());
    if (!["GET", "HEAD"].includes(request.method()))
      writes.push(request.method() + " " + request.url());
  });
  const page = await context.newPage();
  const response = await page.goto(target.href);
  assert.equal(response.status(), 200);
  await expect(
    page.getByRole("heading", { name: "A time to gather", exact: true }),
  ).toBeVisible();
  const manifest = await context.request.get(
    new URL("manifest.webmanifest", target).href,
  );
  assert.equal(manifest.status(), 200);
  const metadata = await manifest.json();
  assert.equal(new URL(metadata.scope, target).pathname, target.pathname);
  assert.equal(new URL(metadata.start_url, target).pathname, target.pathname);
  await expect(
    page.getByText("● App shell cached · offline ready", { exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A time to gather", exact: true }),
  ).toBeVisible();
  const popup = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await popup;
  await expect(page.getByText("READY_BLANK", { exact: true })).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(
    output.getByRole("heading", { name: "Welcome", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
  await expect(page.getByText("STOPPED", { exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  assert.deepEqual(remoteRequests, [], "Unexpected third-party app requests");
  assert.deepEqual(writes, [], "Unexpected write requests");
  console.log(
    JSON.stringify(
      {
        url: target.href,
        status: "passed",
        checks: [
          "HTTPS/subpath app load",
          "manifest scope",
          "cached app shell",
          "offline reload",
          "offline output startup black",
          "Show and Blank",
          "Stop",
          "no page errors or third-party/write requests",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
