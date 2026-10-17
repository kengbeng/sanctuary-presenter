import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import JSZip from "jszip";
import { id, newContent, makeItem, now } from "../src/model";
test("schema-2 shell keeps live output while update waits, then upgrades saved data after explicit activation", async ({
  browser,
}, testInfo) => {
  test.setTimeout(60000);
  const baseline = await JSZip.loadAsync(
      await readFile("tests/fixtures/previous-shell-0.6.0.zip"),
    ),
    oldFiles = new Map<string, Buffer>();
  for (const [name, file] of Object.entries(baseline.files))
    if (!file.dir) oldFiles.set(name, await file.async("nodebuffer"));
  let current = false;
  const root = resolve("dist"),
    base = "/sanctuary-presenter/";
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url!, "http://localhost");
      if (!url.pathname.startsWith(base)) {
        response.writeHead(404).end();
        return;
      }
      const name =
          decodeURIComponent(url.pathname.slice(base.length)) || "index.html",
        path = resolve(root, name);
      if (!path.startsWith(root + sep)) {
        response.writeHead(404).end();
        return;
      }
      const bytes = current ? await readFile(path) : oldFiles.get(name);
      if (!bytes) {
        response.writeHead(404).end();
        return;
      }
      const ext = name.split(".").at(-1),
        mime =
          ext === "js"
            ? "application/javascript"
            : ext === "css"
              ? "text/css"
              : ext === "html"
                ? "text/html"
                : ext === "png"
                  ? "image/png"
                  : "application/json";
      response.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control": "no-store",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port,
    url = `http://127.0.0.1:${port}${base}`,
    context = await browser.newContext({ acceptDownloads: true });
  try {
    const page = await context.newPage();
    await page.goto(url);
    await expect(
      page.getByText("● App shell cached · offline ready", { exact: true }),
    ).toBeVisible();
    const source = newContent("song");
    source.title = "Upgrade song";
    source.sections[0].pages[0].text = "Words preserved across upgrade";
    source.sections[0].pages[0].secondary = "升級後保留";
    const order = {
      id: id(),
      title: "Upgrade service",
      date: "",
      items: [makeItem(source)],
      createdAt: now(),
      updatedAt: now(),
    };
    order.items[0].notes = "Private upgrade cue";
    await page.evaluate(
      async ({ source, order }) => {
        const request = indexedDB.open("sanctuary:" + location.pathname);
        const db = await new Promise<IDBDatabase>(
          (resolve) => (request.onsuccess = () => resolve(request.result)),
        );
        await new Promise<void>((resolve) => {
          const tx = db.transaction(
            ["content", "services", "settings"],
            "readwrite",
          );
          tx.objectStore("content").put(source);
          tx.objectStore("services").put(order);
          tx.objectStore("settings").put({
            key: "selectedService",
            value: order.id,
          });
          tx.oncomplete = () => resolve();
        });
        db.close();
      },
      { source, order },
    );
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Upgrade service", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Library & planner", exact: true })
      .click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export full backup", exact: true })
      .click();
    await (
      await download
    ).saveAs(testInfo.outputPath("before-schema-upgrade.zip"));
    await page.getByRole("button", { name: "Present", exact: true }).click();
    const popup = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Start Presentation", exact: true })
      .click();
    const output = await popup;
    await page
      .getByRole("button", { name: "Show / Restore", exact: true })
      .click();
    await expect(
      output.getByText("Words preserved across upgrade", { exact: true }),
    ).toBeVisible();
    current = true;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update();
    });
    const update = page.getByRole("button", {
      name: "Apply update after stopping all output windows",
      exact: true,
    });
    await expect(update).toBeVisible();
    await expect(update).toBeDisabled();
    await expect(
      output.getByText("Words preserved across upgrade", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Stop Presentation", exact: true })
      .click();
    const apply = page.getByRole("button", {
      name: "Apply update after stopping all output windows",
      exact: true,
    });
    await expect(apply).toBeEnabled();
    await apply.click();
    await expect(
      page.getByRole("heading", { name: "Your services", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Presenter / v2 · 0.7.0-rc.1", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Open Upgrade service", exact: true })
      .click();
    await expect(
      page
        .locator(".sf-editor")
        .getByRole("textbox", { name: "Primary text", exact: true }),
    ).toHaveValue("Words preserved across upgrade");
    const saved = await page.evaluate(
      async ({ sourceId, orderId }) => {
        const request = indexedDB.open("sanctuary:" + location.pathname);
        const db = await new Promise<IDBDatabase>(
          (resolve) => (request.onsuccess = () => resolve(request.result)),
        );
        const tx = db.transaction(["content", "services"]);
        const read = (request: IDBRequest) =>
          new Promise<any>(
            (resolve) => (request.onsuccess = () => resolve(request.result)),
          );
        const [content, order] = await Promise.all([
          read(tx.objectStore("content").get(sourceId)),
          read(tx.objectStore("services").get(orderId)),
        ]);
        db.close();
        return { content, order };
      },
      { sourceId: source.id, orderId: order.id },
    );
    expect(saved.content.id).toBe(source.id);
    expect(saved.content.revision).toBe(1);
    expect(saved.content.revisionToken).toBeTruthy();
    expect(saved.order.items).toEqual(order.items);
    await page
      .getByRole("button", { name: "Present service", exact: true })
      .click();
    const newPopup = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Open congregation window", exact: true })
      .click();
    const newOutput = await newPopup;
    await expect(newOutput.locator(".blackout")).toBeVisible();
    await page.getByRole("button", { name: "Take", exact: true }).click();
    await expect(
      newOutput.getByText("Words preserved across upgrade", { exact: true }),
    ).toBeVisible();
    await expect(
      newOutput.getByText("Private upgrade cue", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Blank screen", exact: true })
      .click();
    await expect(newOutput.locator(".blackout")).toBeVisible();
  } finally {
    await context.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
