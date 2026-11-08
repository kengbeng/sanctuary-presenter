import { test, expect, type Page } from "@playwright/test";
import {
  newContent,
  newPage,
  syncAuto,
  makeItem,
  id,
  now,
  type ServiceOrder,
} from "../src/model";
async function seed(page: Page, rich = false) {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Your services", exact: true }),
  ).toBeVisible();
  const songs = Array.from({ length: 28 }, (_, index) => {
    const content = newContent("song");
    content.title = `Song ${String(index + 1).padStart(2, "0")}`;
    content.sections[0].label = "Verse 1";
    content.sections[0].pages[0].text = `Original words ${index + 1}`;
    return content;
  });
  if (rich) {
    const song = songs[0];
    song.sections[0].pages.push({ ...newPage(), text: "Second verse slide" });
    for (const label of ["Chorus", "Bridge"])
      song.sections.push({
        id: id(),
        label,
        pages: [{ ...newPage(), text: `${label} words` }],
      });
    syncAuto(song);
    song.arrangements.push({
      id: id(),
      name: "Custom repeats",
      isDefault: false,
      auto: false,
      sectionIds: [
        song.sections[0].id,
        song.sections[1].id,
        song.sections[0].id,
      ],
    });
  }
  const stamp = now();
  const service: ServiceOrder = {
    id: id(),
    title: "Sunday service",
    date: "2026-10-19",
    items: [makeItem(songs[0])],
    createdAt: stamp,
    updatedAt: stamp,
  };
  await page.evaluate(
    async ({ songs, service }) => {
      const request = indexedDB.open("sanctuary:" + location.pathname);
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction(["content", "services"], "readwrite");
        songs.forEach((song) => tx.objectStore("content").put(song));
        tx.objectStore("services").put(service);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    },
    { songs, service },
  );
  await page.reload();
  return songs[0];
}
test("browsing keeps search and scroll; editing requires intent and protects unsaved words", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only");
  const list = library.locator(".content-results");
  const editor = library.locator(".content-editor");
  await library.getByRole("searchbox").fill("Song");
  await library.locator(".library-row").filter({ hasText: "Song 24" }).click();
  const scroll = await list.evaluate((el) => el.scrollTop);
  expect(scroll).toBeGreaterThan(100);
  await expect(
    editor.getByRole("heading", { name: "Song 24", exact: true }),
  ).toBeVisible();
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveCount(0);
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  await editor
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Unsaved correction");
  page.once("dialog", (dialog) => dialog.dismiss());
  await library.locator(".library-row").filter({ hasText: "Song 23" }).click();
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Unsaved correction");
  await editor.getByRole("button", { name: "Save song", exact: true }).click();
  await expect(
    editor.getByRole("button", { name: "Edit song", exact: true }),
  ).toBeVisible();
  await expect(editor.locator(".library-lyrics")).toContainText(
    "Unsaved correction",
  );
  await expect(library.getByRole("searchbox")).toHaveValue("Song");
  expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
  await page.screenshot({
    path: "docs/library-navigation-preview.png",
    fullPage: true,
  });
});
test("small-screen Back to songs restores the filtered list without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 480 });
  await seed(page);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only");
  await library.getByRole("searchbox").fill("Song");
  await library.locator(".library-row").filter({ hasText: "Song 24" }).click();
  await expect(library.locator(".library-list")).toBeHidden();
  await expect(
    library.getByRole("button", { name: "Back to songs", exact: true }),
  ).toBeInViewport();
  await library
    .getByRole("button", { name: "Back to songs", exact: true })
    .click();
  await expect(library.getByRole("searchbox")).toHaveValue("Song");
  expect(
    await library.locator(".content-results").evaluate((el) => el.scrollTop),
  ).toBeGreaterThan(100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Add to service preserves the working service and creates an independent copy", async ({
  page,
}) => {
  await seed(page);
  await page
    .getByRole("button", { name: "Open Sunday service", exact: true })
    .click();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only");
  await expect(
    library.getByRole("button", { name: "Back to service", exact: true }),
  ).toBeVisible();
  await library.locator(".library-row").filter({ hasText: "Song 02" }).click();
  await library
    .getByRole("button", { name: "Add to service", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Add to service",
    exact: true,
  });
  await dialog
    .getByRole("button", { name: "Add selected item", exact: true })
    .click();
  await expect(page.locator(".sf-toolbar")).toContainText("Sunday service");
  await expect(
    page
      .locator(".sf-editor")
      .getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Original words 2");
  await expect(page.locator(".sf-order")).toContainText("Song 01");
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await library.getByRole("button", { name: "Edit song", exact: true }).click();
  await library
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Library correction");
  await library.getByRole("button", { name: "Save song", exact: true }).click();
  await library
    .getByRole("button", { name: "Back to service", exact: true })
    .click();
  await expect(
    page
      .locator(".sf-editor")
      .getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Original words 2");
});

test("adding an unplanned Library song during a presentation does not reveal it", async ({
  page,
}) => {
  await seed(page);
  await page
    .getByRole("button", { name: "Open Sunday service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  const opening = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Open congregation window", exact: true })
    .click();
  const output = await opening;
  await expect(
    page.getByRole("button", { name: "Show slide", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    output.getByText("Original words 1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.locator(".library-row").filter({ hasText: "Song 02" }).click();
  await page
    .getByRole("button", { name: "Add to service", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Add to service", exact: true })
    .getByRole("button", { name: "Add selected item", exact: true })
    .click();
  await expect(
    page
      .locator(".sf-editor")
      .getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Original words 2");
  await expect(
    output.getByText("Original words 1", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "End presentation", exact: true })
    .click();
  await expect.poll(() => output.isClosed()).toBe(true);
});

test("song writing keeps sections separate from lyrics and persists only explicit saves", async ({
  page,
}) => {
  await seed(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only");
  await library.locator(".library-row").filter({ hasText: "Song 01" }).click();
  const editor = library.locator(".content-editor");
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  await expect(
    editor.getByRole("tab", { name: "Lyrics", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    editor.getByLabel("Library title", { exact: true }),
  ).toBeVisible();
  await editor.getByLabel("Add section", { exact: true }).click();
  await editor
    .getByLabel("New section type", { exact: true })
    .selectOption("Chorus");
  await editor
    .getByRole("button", { name: "Add selected section", exact: true })
    .click();
  await editor
    .getByLabel("Primary text", { exact: true })
    .fill("Together we sing.");
  await editor
    .getByLabel("Second lyrics language", { exact: true })
    .selectOption("Chinese");
  await editor.getByLabel("Secondary text", { exact: true }).fill("同心歌唱。");
  await editor.getByRole("button", { name: "Add slide", exact: true }).click();
  await editor
    .getByLabel("Primary text", { exact: true })
    .fill("Second chorus page.");
  await editor
    .getByRole("navigation", { name: "Section slides" })
    .getByRole("button", { name: "Slide 1", exact: true })
    .click();
  await expect(editor.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Together we sing.",
  );
  await editor
    .getByRole("navigation", { name: "Edit song sections" })
    .getByRole("button", { name: "Verse 1", exact: true })
    .click();
  await expect(editor.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Original words 1",
  );
  await editor
    .getByRole("navigation", { name: "Edit song sections" })
    .getByRole("button", { name: "Chorus", exact: true })
    .click();
  await expect(
    editor.getByLabel("Secondary text", { exact: true }),
  ).toHaveValue("同心歌唱。");
  await editor.getByRole("tab", { name: "Song order", exact: true }).click();
  await expect(
    editor.getByLabel("Primary text", { exact: true }),
  ).not.toBeVisible();
  await editor
    .getByRole("button", { name: "Add to order: Chorus", exact: true })
    .click();
  await expect(editor.locator(".library-order-entries li")).toHaveCount(3);
  await editor
    .getByRole("button", { name: "Move earlier · position 3", exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Remove · position 2", exact: true })
    .click();
  await expect(editor.locator(".library-order-entries li")).toHaveCount(2);
  await page.screenshot({
    path: "docs/library-song-order-preview.png",
    fullPage: true,
  });
  await editor.getByRole("tab", { name: "Song order", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    editor.getByRole("tab", { name: "Details", exact: true }),
  ).toBeFocused();
  await editor
    .getByLabel("Secondary language", { exact: true })
    .fill("Chinese");
  await editor.getByRole("tab", { name: "Lyrics", exact: true }).click();
  await expect(
    editor.getByLabel("Secondary text", { exact: true }),
  ).toHaveValue("同心歌唱。");
  await page.screenshot({
    path: "docs/library-song-editor-preview.png",
    fullPage: true,
  });
  await editor.getByRole("button", { name: "Save song", exact: true }).click();
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  await editor
    .getByRole("navigation", { name: "Edit song sections" })
    .getByRole("button", { name: "Chorus", exact: true })
    .click();
  await expect(editor.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Together we sing.",
  );
  await page.setViewportSize({ width: 640, height: 480 });
  await expect(library.locator(".library-message")).toBeVisible();
  await expect(
    editor.getByRole("button", { name: "Save song", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await editor
    .getByLabel("Primary text", { exact: true })
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expect(
    editor.getByRole("button", { name: "Save song", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/library-song-editor-mobile.png",
    fullPage: true,
  });
});

test("compact section picker adds pre-chorus, coda and named custom sections", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only");
  await library.locator(".library-row").filter({ hasText: "Song 01" }).click();
  const editor = library.locator(".content-editor");
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  const picker = editor.getByLabel("New section type", { exact: true });
  const add = editor.getByRole("button", {
    name: "Add selected section",
    exact: true,
  });
  for (const type of ["Pre-chorus", "Coda"]) {
    await editor.getByLabel("Add section", { exact: true }).click();
    await picker.selectOption(type);
    await add.click();
    await expect(
      editor
        .getByRole("navigation", { name: "Edit song sections" })
        .getByRole("button", { name: type, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await editor.getByLabel("Manage Coda", { exact: true }).click();
  await expect(editor.getByLabel("Section", { exact: true })).toHaveCount(0);
  await expect(
    editor.getByRole("button", { name: "Duplicate section", exact: true }),
  ).toBeVisible();
  await editor.getByLabel("Manage Coda", { exact: true }).click();
  await expect(
    editor.locator(".library-section-editor .paste-lyrics"),
  ).toHaveCount(0);
  await expect(
    editor.locator(".library-song-paste .paste-modal-trigger"),
  ).toBeVisible();
  await editor.getByLabel("Add section", { exact: true }).click();
  await picker.selectOption("Custom");
  await expect(add).toBeDisabled();
  await editor
    .getByLabel("Custom section name", { exact: true })
    .fill("Refrain");
  await add.click();
  await editor.getByLabel("Add section", { exact: true }).click();
  await add.click();
  await expect(
    editor
      .getByRole("navigation", { name: "Edit song sections" })
      .getByRole("button", { name: "Refrain 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await editor.getByRole("button", { name: "Save song", exact: true }).click();
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  for (const name of ["Pre-chorus", "Coda", "Refrain", "Refrain 2"])
    await expect(
      editor
        .getByRole("navigation", { name: "Edit song sections" })
        .getByRole("button", { name, exact: true }),
    ).toBeVisible();
});

test("lyrics language choices retain words and slide tools apply only to the selected page", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only");
  await library.locator(".library-row").filter({ hasText: "Song 01" }).click();
  const editor = library.locator(".content-editor");
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  await editor
    .getByLabel("First lyrics language", { exact: true })
    .selectOption("Chinese");
  await editor
    .getByLabel("Second lyrics language", { exact: true })
    .selectOption("English");
  await editor
    .getByLabel("Secondary text", { exact: true })
    .fill("Translation retained");
  await editor
    .getByLabel("Second lyrics language", { exact: true })
    .selectOption("");
  await expect(
    editor.getByLabel("Secondary text", { exact: true }),
  ).toHaveValue("Translation retained");
  await editor
    .getByLabel("Second lyrics language", { exact: true })
    .selectOption("English");
  await editor.getByLabel("Slide options", { exact: true }).click();
  await editor
    .getByRole("button", { name: "Duplicate slide", exact: true })
    .click();
  await expect(
    editor
      .getByRole("navigation", { name: "Section slides" })
      .locator(".editor-reorder-select"),
  ).toHaveCount(2);
  await expect(editor.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Original words 1",
  );
  await editor.getByLabel("Slide options", { exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await editor
    .getByRole("button", { name: "Remove slide", exact: true })
    .click();
  await expect(
    editor
      .getByRole("navigation", { name: "Section slides" })
      .locator(".editor-reorder-select"),
  ).toHaveCount(1);
  await editor.getByRole("button", { name: "Save song", exact: true }).click();
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  await expect(
    editor.getByLabel("First lyrics language", { exact: true }),
  ).toHaveValue("Chinese");
  await expect(
    editor.getByLabel("Second lyrics language", { exact: true }),
  ).toHaveValue("English");
  await expect(
    editor.getByLabel("Secondary text", { exact: true }),
  ).toHaveValue("Translation retained");
});

test("drag reorder preserves selected words, saved IDs and custom repeats; menus do not expand navigation", async ({
  page,
}) => {
  const original = await seed(page, true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-only"),
    editor = library.locator(".content-editor");
  await library.locator(".library-row").filter({ hasText: "Song 01" }).click();
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  const sections = editor.getByRole("navigation", {
    name: "Edit song sections",
  });
  const bridge = sections.getByRole("button", {
    name: "Reorder Bridge",
    exact: true,
  });
  const first = sections.locator(".editor-reorder-item").first();
  await bridge.dragTo(first, { targetPosition: { x: 60, y: 2 } });
  await expect(sections.locator(".editor-reorder-select")).toHaveText([
    "Bridge1 slide",
    "Verse 12 slides",
    "Chorus1 slide",
  ]);
  await expect(editor.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Original words 1",
  );
  const slides = editor.getByRole("navigation", { name: "Section slides" });
  const secondHandle = slides.getByRole("button", {
    name: "Reorder Slide 2",
    exact: true,
  });
  await secondHandle.dragTo(slides.locator(".editor-reorder-item").first(), {
    targetPosition: { x: 2, y: 10 },
  });
  await expect(
    editor.getByRole("button", { name: "Slide 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(editor.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Original words 1",
  );
  const toolbar = editor.locator(".library-slide-toolbar");
  const before = await toolbar.boundingBox();
  await editor.getByLabel("Slide options", { exact: true }).click();
  const after = await toolbar.boundingBox();
  expect(after!.height).toBe(before!.height);
  await page.keyboard.press("Escape");
  await expect(
    editor.getByRole("button", { name: "Duplicate slide", exact: true }),
  ).not.toBeVisible();
  await editor.getByRole("button", { name: "Save song", exact: true }).click();
  await expect(
    editor.getByRole("button", { name: "Edit song", exact: true }),
  ).toBeVisible();
  await page.reload();
  const saved = await page.evaluate(async (id) => {
    const request = indexedDB.open("sanctuary:" + location.pathname);
    const db = await new Promise<IDBDatabase>(
      (resolve) => (request.onsuccess = () => resolve(request.result)),
    );
    const tx = db.transaction(["content", "services"]);
    const content = await new Promise<any>((resolve) => {
      const req = tx.objectStore("content").get(id);
      req.onsuccess = () => resolve(req.result);
    });
    db.close();
    return content;
  }, original.id);
  expect(saved.sections.map((section: any) => section.id)).toEqual([
    original.sections[2].id,
    original.sections[0].id,
    original.sections[1].id,
  ]);
  expect(saved.sections[1].pages.map((slide: any) => slide.id)).toEqual(
    [...original.sections[0].pages].reverse().map((slide) => slide.id),
  );
  expect(
    saved.arrangements.find((order: any) => order.auto).sectionIds,
  ).toEqual(saved.sections.map((section: any) => section.id));
  expect(
    saved.arrangements.find((order: any) => !order.auto).sectionIds,
  ).toEqual(original.arrangements[1].sectionIds);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await library.locator(".library-row").filter({ hasText: "Song 01" }).click();
  await editor.getByRole("button", { name: "Edit song", exact: true }).click();
  const handle = editor.getByRole("button", {
    name: "Reorder Bridge",
    exact: true,
  });
  await handle.focus();
  await page.keyboard.press("Alt+ArrowDown");
  await expect(
    editor
      .getByRole("navigation", { name: "Edit song sections" })
      .locator(".editor-reorder-select"),
  ).toHaveText(["Verse 12 slides", "Bridge1 slide", "Chorus1 slide"]);
  page.once("dialog", (dialog) => dialog.accept());
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    editor
      .getByRole("navigation", { name: "Song sections" })
      .getByRole("button")
      .first(),
  ).toHaveText("Bridge");
});
