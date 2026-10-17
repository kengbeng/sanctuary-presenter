import { test, expect } from "@playwright/test";

test("legacy originals have an explicit copy recovery path without losing hidden text", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("./#/app");
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("button", { name: "New song", exact: true }).click();
  await page
    .getByLabel("Library title", { exact: true })
    .fill("Legacy fixture");
  await page
    .locator(".content-editor")
    .getByLabel("Primary text", { exact: true })
    .fill("Visible verse");
  await page
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    page.getByText("Library master saved.", { exact: false }),
  ).toBeVisible();
  // Seed a previously accepted record through IndexedDB, not the stricter new-write API.
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("sanctuary:" + location.pathname);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("content", "readwrite");
      const store = tx.objectStore("content");
      const req = store.getAll();
      req.onsuccess = () => {
        const song = req.result.find((c) => c.title === "Legacy fixture");
        song.pages = [
          {
            ...song.sections[0].pages[0],
            id: "legacy-hidden-page",
            text: "Hidden original words",
          },
        ];
        song.arrangements[0].sectionIds.push(song.sections[0].id);
        store.put(song);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    database.close();
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Legacy fixture", exact: false })
    .first()
    .click();
  await expect(
    page.getByText("Legacy content needs review.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create editable copy", exact: true })
    .click();
  await expect(page.getByLabel("Library title", { exact: true })).toHaveValue(
    "Legacy fixture (editable copy)",
  );
  await expect(
    page.locator(".content-editor").getByLabel("Primary text", { exact: true }),
  ).toHaveValue("Visible verse");
  await expect(
    page.getByText("Editable copy created.", { exact: false }),
  ).toBeVisible();
  const saved = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("sanctuary:" + location.pathname);
      req.onsuccess = () => resolve(req.result);
    });
    const records = await new Promise<any[]>((resolve) => {
      const req = database
        .transaction("content")
        .objectStore("content")
        .getAll();
      req.onsuccess = () => resolve(req.result);
    });
    database.close();
    return records.map((c) => ({
      title: c.title,
      hidden: c.pages.map((p: { text: string }) => p.text),
      auto: c.arrangements[0].auto,
      sequenceLength: c.arrangements[0].sectionIds.length,
    }));
  });
  expect(saved.find((c) => c.title === "Legacy fixture")).toMatchObject({
    hidden: ["Hidden original words"],
    auto: true,
    sequenceLength: 2,
  });
  expect(saved.find((c) => c.title.endsWith("(editable copy)"))).toMatchObject({
    hidden: [],
    auto: false,
    sequenceLength: 2,
  });
});

test("empty working songs can be saved but explicit Show keeps congregation output black", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("./#/app");
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("button", { name: "New service", exact: true }).click();
  await page.getByRole("button", { name: "New song", exact: true }).click();
  await page
    .getByLabel("Library title", { exact: true })
    .fill("Unfinished song");
  await page
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    page.getByText("Library master saved.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add library item to service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Present this service", exact: true })
    .click();
  const pending = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await pending;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(
    page.getByText("This slide is empty.", { exact: false }),
  ).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
});

test("two operator tabs retain a rejected stale lyric draft instead of overwriting newer words", async ({
  page,
  context,
}) => {
  for (const tab of [page]) tab.on("dialog", (dialog) => dialog.accept());
  await page.goto("./#/app");
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("button", { name: "New song", exact: true }).click();
  await page
    .getByLabel("Library title", { exact: true })
    .fill("Shared local song");
  const master = page.locator(".content-editor");
  await master
    .getByLabel("Primary text", { exact: true })
    .fill("Original words");
  await page
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    page.getByText("Library master saved.", { exact: false }),
  ).toBeVisible();
  const other = await context.newPage();
  other.on("dialog", (dialog) => dialog.accept());
  await other.goto("./#/app");
  await other
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await other
    .getByRole("button", { name: "Shared local song", exact: false })
    .first()
    .click();
  const otherMaster = other.locator(".content-editor");
  await otherMaster
    .getByLabel("Primary text", { exact: true })
    .fill("Other volunteer draft");
  await master
    .getByLabel("Primary text", { exact: true })
    .fill("Corrected saved words");
  await page
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    master.getByText("Saved / ready to edit", { exact: true }),
  ).toBeVisible();
  await other
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    other.getByText("This record changed in another window", { exact: false }),
  ).toBeVisible();
  await expect(
    otherMaster.getByLabel("Primary text", { exact: true }),
  ).toHaveValue("Other volunteer draft");
  // A separate copy is the explicit recovery path, rather than a force-overwrite.
  await other
    .getByRole("button", { name: "Duplicate library item", exact: true })
    .click();
  await expect(other.getByLabel("Library title", { exact: true })).toHaveValue(
    "Shared local song (copy)",
  );
  await expect(
    otherMaster.getByLabel("Primary text", { exact: true }),
  ).toHaveValue("Other volunteer draft");
  await page.reload();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Shared local song", exact: false })
    .filter({ has: page.getByText("Shared local song", { exact: true }) })
    .click();
  await expect(
    page.locator(".content-editor").getByLabel("Primary text", { exact: true }),
  ).toHaveValue("Corrected saved words");
});
