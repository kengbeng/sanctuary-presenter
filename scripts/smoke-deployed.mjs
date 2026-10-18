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
const expectedVersion = process.argv[3];
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
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll("h1,h2")).some((node) =>
      ["Your services", "A time to gather"].includes(node.textContent),
    ),
  );
  const modern = await page
    .getByRole("heading", { name: "Your services", exact: true })
    .isVisible();
  async function enterPresenter() {
    if (modern)
      await page.getByRole("button", { name: "Present", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: modern ? "Demo service" : "A time to gather",
        exact: true,
      }),
    ).toBeVisible();
  }
  assert.equal(response.status(), 200);
  if (expectedVersion) {
    const metadataResponse = await context.request.get(
      new URL("release.json", target).href,
    );
    assert.equal(metadataResponse.status(), 200);
    const release = await metadataResponse.json();
    assert.equal(
      release.version,
      expectedVersion,
      "Unexpected deployed version",
    );
    assert.equal(release.databaseSchema, 3);
    assert.equal(release.backupFormat, 5);
  }
  await enterPresenter();
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
  await enterPresenter();
  const popup = page.waitForEvent("popup");
  await page
    .getByRole("button", {
      name: modern ? "Open congregation window" : "Start Presentation",
      exact: true,
    })
    .click();
  const output = await popup;
  await expect(
    page.getByText("OUTPUT BLACK", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame:visible")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: modern ? "Show slide" : "Show / Restore",
      exact: true,
    })
    .click();
  await expect(
    output.getByRole("heading", { name: "Welcome", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: modern ? "Blank screen" : "Blank",
      exact: true,
    })
    .click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame:visible")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: modern ? "End presentation" : "Stop Presentation",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("OUTPUT STOPPED", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  assert.deepEqual(errors, []);
  assert.deepEqual(remoteRequests, [], "Unexpected third-party app requests");
  assert.deepEqual(writes, [], "Unexpected write requests");
  console.log(
    JSON.stringify(
      {
        url: target.href,
        expectedVersion,
        status: "passed",
        checks: [
          "subpath app load",
          ...(expectedVersion ? ["expected release metadata"] : []),
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
