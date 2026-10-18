import { test, expect, type Page } from "@playwright/test";
import {
  newContent,
  newPage,
  makeItem,
  id,
  now,
  type ServiceOrder,
} from "../src/model";
async function seed(page: Page) {
  const source = newContent("song");
  source.title = "Library worship";
  source.revision = 1;
  source.revisionToken = id();
  source.sections[0].label = "Verse 1";
  source.sections[0].pages[0].text = "Original Library words";
  const chorus = { id: id(), label: "Chorus", pages: [newPage()] };
  chorus.pages[0].text = "Chorus words";
  source.sections.push(chorus);
  source.arrangements[0].sectionIds = source.sections.map(
    (section) => section.id,
  );
  source.arrangements.push({
    id: id(),
    name: "Response",
    isDefault: false,
    auto: false,
    sectionIds: [chorus.id, source.sections[0].id, chorus.id],
  });
  const item = makeItem(source);
  item.title = "Sunday worship";
  item.notes = "Keep private cue";
  item.overrides.fontSize = 74;
  item.snapshot.sections[0].pages[0].text = "Service correction";
  const order: ServiceOrder = {
    id: id(),
    title: "Source rehearsal",
    date: "",
    items: [item, makeItem(source)],
    revision: 1,
    revisionToken: id(),
    createdAt: now(),
    updatedAt: now(),
  };
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Your services", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    async ({ source, order }) => {
      const request = indexedDB.open("sanctuary:" + location.pathname);
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(["content", "services"], "readwrite");
        tx.objectStore("content").put(source);
        tx.objectStore("services").put(order);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    },
    { source, order },
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Open Source rehearsal", exact: true })
    .click();
  return { source, order };
}
async function readOrder(page: Page, orderId: string): Promise<ServiceOrder> {
  return page.evaluate(async (orderId) => {
    const request = indexedDB.open("sanctuary:" + location.pathname);
    const database = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const order = await new Promise<ServiceOrder>((resolve) => {
      const request = database
        .transaction("services")
        .objectStore("services")
        .get(orderId);
      request.onsuccess = () => resolve(request.result);
    });
    database.close();
    return order;
  }, orderId);
}
async function editSource(page: Page, words: string) {
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page
    .locator(".library-row")
    .filter({ hasText: "Library worship" })
    .click();
  await page
    .locator(".content-editor")
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill(words);
  await page
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(page.locator(".library-message")).toContainText(
    "Library master saved",
  );
}
test("comparison cancel is read-only and whole-copy refresh stays staged until Apply and Show slide", async ({
  page,
  context,
}) => {
  const { order } = await seed(page),
    editor = page.locator(".sf-editor");
  await editor.getByText("Library source", { exact: true }).click();
  await expect(editor.locator(".source-link")).toContainText(
    "matches the original",
  );
  await editor
    .getByRole("button", { name: "Compare with Library", exact: true })
    .click();
  let comparison = page.getByRole("dialog");
  await expect(
    comparison.getByRole("button", {
      name: "Replace this service copy",
      exact: true,
    }),
  ).toBeDisabled();
  await comparison
    .getByLabel("Library song order", { exact: true })
    .selectOption({ label: "Response" });
  await comparison
    .getByRole("button", { name: "Cancel comparison", exact: true })
    .click();
  expect(await readOrder(page, order.id)).toEqual(order);
  await editSource(page, "Revised Library words");
  await page.getByRole("button", { name: "Prepare", exact: true }).click();
  await expect(editor.locator(".source-link")).toContainText(
    "differs from the original",
  );
  await expect(
    page.getByText("● App shell cached · offline ready", { exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  const opening = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Open congregation window", exact: true })
    .click();
  const output = await opening;
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    output.getByText("Service correction", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Prepare / stage edits", exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Compare with Library", exact: true })
    .click();
  comparison = page.getByRole("dialog");
  await expect(comparison).toContainText(
    "operator notes, item-level appearance",
  );
  await comparison
    .getByLabel("Library song order", { exact: true })
    .selectOption({ label: "Response" });
  await comparison
    .getByRole("combobox", { name: "After replacement slide", exact: true })
    .selectOption("1");
  await expect(comparison.locator(".source-column").nth(0)).toContainText(
    "Service correction",
  );
  await expect(comparison.locator(".source-column").nth(1)).toContainText(
    "Revised Library words",
  );
  await page.setViewportSize({ width: 640, height: 480 });
  await expect(
    comparison.getByRole("button", { name: "Cancel comparison", exact: true }),
  ).toBeInViewport();
  await expect(
    comparison.getByRole("button", { name: "Blank screen", exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 1280, height: 720 });
  await comparison
    .locator(".source-columns")
    .evaluate((element) => element.scrollIntoView({ block: "center" }));
  const replacement = await comparison
    .getByRole("button", { name: "Replace this service copy", exact: true })
    .boundingBox();
  for (const frame of await comparison
    .locator(".source-frame > .frame")
    .all()) {
    const bounds = await frame.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(replacement!.y + 1);
  }
  await page.screenshot({
    path: "docs/source-comparison-preview.png",
    fullPage: true,
  });
  await comparison
    .getByRole("button", { name: "Replace this service copy", exact: true })
    .click();
  await expect(comparison).toHaveCount(0);
  const saved = await readOrder(page, order.id);
  expect(saved.items[0].id).toBe(order.items[0].id);
  expect(saved.items[0].title).toBe("Sunday worship");
  expect(saved.items[0].notes).toBe("Keep private cue");
  expect(saved.items[0].overrides).toEqual({ fontSize: 74 });
  expect(saved.items[0].sectionOrder).toHaveLength(3);
  expect(saved.items[1]).toEqual(order.items[1]);
  await expect(
    output.getByText("Service correction", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply saved changes", exact: true })
    .click();
  await expect(page.locator(".mp-notice")).toContainText("Changes applied");
  await expect(
    output.getByText("Service correction", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    output.getByText("Revised Library words", { exact: true }),
  ).toBeVisible();
});
test("a changed or deleted Library source disables a stale comparison and leaves the service copy usable", async ({
  page,
  context,
}) => {
  const { order } = await seed(page),
    editor = page.locator(".sf-editor");
  await editor.getByText("Library source", { exact: true }).click();
  await editor
    .getByRole("button", { name: "Compare with Library", exact: true })
    .click();
  const comparison = page.getByRole("dialog");
  await comparison
    .getByLabel("Library song order", { exact: true })
    .selectOption({ label: "Default" });
  const other = await context.newPage();
  await other.goto("./");
  await editSource(other, "Other window change");
  await expect(comparison.getByRole("alert")).toContainText(
    "changed after this comparison",
  );
  await expect(
    comparison.getByRole("button", {
      name: "Replace this service copy",
      exact: true,
    }),
  ).toBeDisabled();
  await comparison
    .getByRole("button", { name: "Cancel comparison", exact: true })
    .click();
  expect(await readOrder(page, order.id)).toEqual(order);
  other.once("dialog", (dialog) => dialog.accept());
  await other
    .getByRole("button", { name: "Delete library item", exact: true })
    .click();
  await expect(editor.locator(".source-link")).toContainText(
    "Source no longer in Library",
  );
  await expect(
    editor.getByRole("button", { name: "Compare with Library", exact: true }),
  ).toBeDisabled();
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Service correction");
  expect(await readOrder(page, order.id)).toEqual(order);
});
