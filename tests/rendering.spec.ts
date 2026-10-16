import { test, expect, type Page as BrowserPage } from "@playwright/test";
import {
  newContent,
  makeItem,
  id,
  now,
  outputProfiles,
  defaultBackground,
  type ServiceOrder,
} from "../src/model";
async function seed(
  page: BrowserPage,
  order: ServiceOrder,
  assets: {
    id: string;
    title: string;
    kind: "video" | "image";
    mimeType: string;
    bytes: number[];
  }[] = [],
) {
  await page.evaluate(
    async ({ order, assets }) => {
      const request = indexedDB.open("sanctuary:" + location.pathname);
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(
          ["services", "media", "settings"],
          "readwrite",
        );
        tx.objectStore("services").put(order);
        tx.objectStore("settings").put({
          key: "selectedService",
          value: order.id,
        });
        for (const asset of assets)
          tx.objectStore("media").put({
            ...asset,
            bytes: undefined,
            size: asset.bytes.length,
            hash: "synthetic-fixture",
            blob: new Blob([new Uint8Array(asset.bytes)], {
              type: asset.mimeType,
            }),
            createdAt: new Date().toISOString(),
          });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    },
    { order, assets },
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: order.title, exact: true }),
  ).toBeVisible();
}
function order(title: string, text: string): ServiceOrder {
  const c = newContent("slides");
  c.pages[0].text = text;
  c.pages.push({
    ...structuredClone(c.pages[0]),
    id: id(),
    text: "Next slide",
  });
  return {
    id: id(),
    title,
    date: "2026-10-16",
    createdAt: now(),
    updatedAt: now(),
    items: [makeItem(c)],
    profile: { ...outputProfiles[0] },
  };
}
async function start(page: BrowserPage) {
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await promise;
  await expect(page.getByText("READY_BLANK", { exact: true })).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  return output;
}
test("Auto Fit is identical in preview/output and stable across projector sizes", async ({
  page,
}) => {
  await page.goto("./");
  const service = order(
    "Layout rehearsal",
    Array.from({ length: 18 }, (_, i) => `Line ${i + 1} · Readable text`).join(
      "\n",
    ),
  );
  service.style = {
    fontSize: 100,
    minFontSize: 20,
    autoFit: true,
    outlineWidth: 2,
    outlineColor: "#000000",
    fontWeight: 600,
  };
  service.items[0].snapshot.pages[0].secondary = "雙語文字";
  await seed(page, service);
  const preview = page.locator(".editor>.projection-frame");
  await expect(preview).toHaveAttribute("data-ready", "true");
  const expected = Number(await preview.getAttribute("data-font-size"));
  expect(expected).toBeLessThan(100);
  expect(expected).toBeGreaterThanOrEqual(20);
  const output = await start(page);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await expect(output.locator(".projection-frame")).toHaveAttribute(
    "data-font-size",
    String(expected),
  );
  await output.setViewportSize({ width: 1024, height: 768 });
  await expect(output.locator(".projection-frame")).toHaveAttribute(
    "data-font-size",
    String(expected),
  );
  await expect(output.locator(".projection-primary")).toHaveText(
    service.items[0].snapshot.pages[0].text,
  );
  await expect(output.locator(".projection-secondary")).toHaveText("雙語文字");
  await expect(output.locator(".render-info")).toHaveCount(0);
  await page.screenshot({ path: "docs/design-preview.png", fullPage: true });
});
test("unfittable text stays black with an actionable operator error", async ({
  page,
}) => {
  await page.goto("./");
  const service = order(
    "Overflow rehearsal",
    Array(100).fill("Line").join("\n"),
  );
  service.style = { fontSize: 100, minFontSize: 80, autoFit: true };
  await seed(page, service);
  const output = await start(page);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(
    page
      .locator(".notice")
      .getByText("Text exceeds the safe area at the minimum font size.", {
        exact: false,
      }),
  ).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".projection-primary")).not.toBeVisible();
});
test("background video retains its source, pauses under black and resumes on Restore", async ({
  page,
}) => {
  await page.goto("./");
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8",
    });
    const chunks: BlobPart[] = [];
    return await new Promise<number[]>((resolve) => {
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        resolve(
          Array.from(
            new Uint8Array(
              await new Blob(chunks, { type: "video/webm" }).arrayBuffer(),
            ),
          ),
        );
      };
      recorder.start();
      let frame = 0;
      const timer = setInterval(() => {
        ctx.fillStyle = frame % 2 ? "#123456" : "#26443a";
        ctx.fillRect(0, 0, 160, 90);
        if (++frame === 20) {
          clearInterval(timer);
          recorder.stop();
        }
      }, 100);
    });
  });
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("tab", { name: "Media", exact: true }).click();
  await page.getByLabel("Import media", { exact: true }).setInputFiles({
    name: "synthetic.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  await expect(
    page.getByText("Media stored locally.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".media-row")).toContainText("160 × 90");
  const assetId = await page.evaluate(async () => {
    const open = indexedDB.open("sanctuary:" + location.pathname);
    const db = await new Promise<IDBDatabase>(
      (r) => (open.onsuccess = () => r(open.result)),
    );
    const assets = await new Promise<Array<{ id: string }>>((r) => {
      const get = db.transaction("media").objectStore("media").getAll();
      get.onsuccess = () => r(get.result);
    });
    db.close();
    return assets[0].id;
  });
  const service = order("Video rehearsal", "First slide");
  service.backgroundDesign = {
    ...defaultBackground,
    mode: "video",
    mediaId: assetId,
    darken: 30,
  };
  await seed(page, service);
  await expect(page.locator(".editor video")).toHaveCount(0);
  const output = await start(page);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  const video = output.locator("video.background-media");
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((v) => (v as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0.05);
  await video.evaluate((v) => {
    v.setAttribute("data-retained", "yes");
  });
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(output.getByText("Next slide", { exact: true })).toBeVisible();
  await expect(video).toHaveAttribute("data-retained", "yes");
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect
    .poll(() => video.evaluate((v) => (v as HTMLVideoElement).paused))
    .toBe(true);
  const paused = await video.evaluate(
    (v) => (v as HTMLVideoElement).currentTime,
  );
  await output.evaluate(() => new Promise((r) => setTimeout(r, 200)));
  expect(
    await video.evaluate((v) => (v as HTMLVideoElement).currentTime),
  ).toBeCloseTo(paused, 1);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await expect(video).toHaveAttribute("data-retained", "yes");
  await expect
    .poll(() => video.evaluate((v) => (v as HTMLVideoElement).paused))
    .toBe(false);
});
test("failed background uses its configured colour and does not leak operator notes", async ({
  page,
}) => {
  await page.goto("./");
  const service = order("Fallback rehearsal", "Visible fallback text");
  service.items[0].notes = "PRIVATE";
  const assetId = id();
  service.backgroundDesign = {
    ...defaultBackground,
    mode: "video",
    mediaId: assetId,
    color: "#123456",
  };
  await seed(page, service, [
    {
      id: assetId,
      title: "Broken fixture",
      kind: "video",
      mimeType: "video/webm",
      bytes: [1, 2, 3],
    },
  ]);
  const output = await start(page);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(
    output.getByText("Visible fallback text", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".notice")).toContainText(
    "configured colour fallback",
  );
  await expect(output.locator(".projection-frame")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  await expect(output.getByText("PRIVATE", { exact: false })).toHaveCount(0);
});
test("profile controls are inspectable and custom values persist without changing factory presets", async ({
  page,
}) => {
  await page.goto("./");
  await seed(page, order("Profile rehearsal", "Short text"));
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  const design = page.locator(".service-design");
  await design
    .getByText("Service design & output profile", { exact: true })
    .click();
  await design
    .getByRole("combobox", { name: "Output profile", exact: true })
    .selectOption("LED wall");
  await expect(
    design.getByText("Safe margins:", { exact: false }),
  ).toContainText("4.5% horizontal / 5.5% vertical");
  await design
    .getByLabel("Custom horizontal margin (%)", { exact: true })
    .fill("12");
  await expect(
    page.getByText("Service changes saved locally.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await design
    .getByText("Service design & output profile", { exact: true })
    .click();
  await expect(
    design.getByLabel("Custom horizontal margin (%)", { exact: true }),
  ).toHaveValue("12");
  await design
    .getByRole("combobox", { name: "Output profile", exact: true })
    .selectOption("LED wall");
  await expect(
    design.getByLabel("Custom horizontal margin (%)", { exact: true }),
  ).toHaveValue("4.5");
});

test("Blank cancels an in-flight image preparation and cannot reveal it later", async ({
  page,
}) => {
  const delayImages = () => {
    const original = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    )!;
    const pending: Array<() => Promise<void>> = [];
    (
      window as unknown as { releaseImages: () => Promise<void> }
    ).releaseImages = async () => {
      await Promise.all(pending.splice(0).map((release) => release()));
    };
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      ...original,
      set(value: string) {
        if (value.startsWith("blob:")) {
          pending.push(
            () =>
              new Promise<void>((resolve) => {
                this.addEventListener("load", () => resolve(), { once: true });
                this.addEventListener("error", () => resolve(), { once: true });
                original.set!.call(this, value);
              }),
          );
        } else original.set!.call(this, value);
      },
    });
  };
  await page.goto("./");
  const { readFileSync } = await import("node:fs");
  const service = order("Loading rehearsal", "Do not reveal automatically");
  const mediaId = id();
  service.items[0].snapshot.pages[0].mediaId = mediaId;
  await seed(page, service, [
    {
      id: mediaId,
      title: "Synthetic image",
      kind: "image",
      mimeType: "image/png",
      bytes: Array.from(readFileSync("public/icon-192.png")),
    },
  ]);
  const output = await start(page);
  await output.evaluate(delayImages);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(
    page.getByText("Preparing slide", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await output.evaluate(async () => {
    await (
      window as unknown as { releaseImages: () => Promise<void> }
    ).releaseImages();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(
    output.getByText("Do not reveal automatically", { exact: true }),
  ).not.toBeVisible();
  await expect(page.getByText("LIVE", { exact: true })).toHaveCount(0);
});
test("broken video uses its prepared local poster fallback", async ({
  page,
}) => {
  await page.goto("./");
  const { readFileSync } = await import("node:fs");
  const service = order("Poster rehearsal", "Poster fallback text");
  const videoId = id(),
    posterId = id();
  service.backgroundDesign = {
    ...defaultBackground,
    mode: "video",
    mediaId: videoId,
    posterId,
  };
  await seed(page, service, [
    {
      id: videoId,
      title: "Invalid video",
      kind: "video",
      mimeType: "video/webm",
      bytes: [1, 2, 3],
    },
    {
      id: posterId,
      title: "Local poster",
      kind: "image",
      mimeType: "image/png",
      bytes: Array.from(readFileSync("public/icon-192.png")),
    },
  ]);
  const output = await start(page);
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await expect(output.locator("img.background-media")).toBeVisible();
  await expect(page.locator(".notice")).toContainText(
    "configured poster fallback",
  );
});
