import { test, expect, type Page } from "@playwright/test";
async function savedServices(page: Page) {
  return page.evaluate(async () => {
    const request = indexedDB.open("sanctuary:" + location.pathname);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = database
        .transaction("services")
        .objectStore("services")
        .getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return JSON.stringify(records);
  });
}
test("bilingual paste stages/cancels explicitly and read-only review preserves live output", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await page
    .getByLabel("Service name", { exact: true })
    .fill("Review rehearsal");
  await page
    .getByRole("button", { name: "Create service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add first item", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await drawer
    .getByRole("button", { name: "Create song", exact: true })
    .click();
  await drawer.getByLabel("Song title", { exact: true }).fill("Pasted worship");
  const save = drawer.getByRole("button", {
    name: "Save song and add to service",
    exact: true,
  });
  await drawer.getByText("Paste whole-song lyrics", { exact: true }).click();
  const primary = drawer.getByLabel("Primary lyrics to stage", { exact: true });
  const words =
    "[Verse 1]\nFirst line\n\nThird line\n---\nSecond slide\n[Chorus]\nChorus words";
  await primary.fill(words);
  await expect(save).toBeDisabled();
  await drawer
    .getByRole("button", { name: "Preview pasted lyrics", exact: true })
    .click();
  await expect(drawer.locator(".paste-preview")).toContainText("First line");
  await drawer
    .getByRole("button", { name: "Cancel paste", exact: true })
    .click();
  await expect(
    drawer.getByRole("textbox", { name: "Verse 1 · slide 1", exact: true }),
  ).toHaveValue("");
  await expect(save).toBeEnabled();
  await drawer.getByText("Paste whole-song lyrics", { exact: true }).click();
  await primary.fill(words);
  await drawer
    .getByText("Include second-language lyrics", { exact: true })
    .click();
  const secondary = drawer.getByLabel("Secondary lyrics to stage", {
    exact: true,
  });
  await secondary.fill("[Verse 1]\n只有一頁");
  await drawer
    .getByRole("button", { name: "Preview pasted lyrics", exact: true })
    .click();
  await expect(drawer.getByRole("alert")).toContainText(
    "same section labels and slide breaks",
  );
  await secondary.fill(
    "[Verse 1]\n第一行\n\n第三行\n---\n第二頁\n[Chorus]\n副歌",
  );
  await drawer
    .getByRole("button", { name: "Preview pasted lyrics", exact: true })
    .click();
  await drawer
    .getByRole("button", { name: "Apply pasted lyrics", exact: true })
    .click();
  await expect(
    drawer.getByRole("textbox", { name: "Verse 1 · slide 1", exact: true }),
  ).toHaveValue("First line\n\nThird line");
  await expect(
    drawer.getByRole("textbox", {
      name: "Verse 1 · slide 2 · second language",
      exact: true,
    }),
  ).toHaveValue("第二頁");
  await save.click();
  await expect(drawer).toHaveCount(0);
  const editor = page.locator(".sf-editor");
  await editor.getByText("Operator notes", { exact: true }).click();
  await editor
    .getByRole("textbox", { name: "Operator notes", exact: false })
    .fill("Private prayer cue");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept("Prayer"));
  await drawer
    .getByRole("button", { name: "Add operator-only heading", exact: true })
    .click();
  await expect(drawer).toHaveCount(0);
  const beforeReview = await savedServices(page);
  await page
    .getByRole("button", { name: "Review service", exact: true })
    .click();
  const review = page.locator(".service-review");
  await expect(review.getByRole("textbox")).toHaveCount(0);
  await expect(review.locator(".review-frame")).toContainText("First line");
  await review
    .getByRole("button", { name: "Next in review →", exact: true })
    .click();
  await expect(review.locator(".review-frame")).toContainText("Second slide");
  await review
    .getByRole("button", { name: "Next in review →", exact: true })
    .click();
  await expect(review.locator(".review-frame")).toContainText("Chorus words");
  await review
    .getByRole("button", { name: "Next in review →", exact: true })
    .click();
  await expect(review).toContainText(
    "Operator-only heading. No congregation slide.",
  );
  await expect(
    review.getByRole("button", { name: "Next in review →", exact: true }),
  ).toBeDisabled();
  await review
    .getByRole("button", { name: "1. Pasted worship 3 slides", exact: true })
    .click();
  await review
    .getByRole("button", { name: "Next in review →", exact: true })
    .click();
  await review
    .getByRole("button", { name: "Edit this item", exact: true })
    .click();
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Second slide");
  expect(await savedServices(page)).toBe(beforeReview);
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  const opening = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Open congregation window", exact: true })
    .click();
  const output = await opening;
  await page.getByRole("button", { name: "Take", exact: true }).click();
  await expect(output.getByText("First line", { exact: false })).toBeVisible();
  await page
    .getByRole("button", { name: "Prepare / stage edits", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review service", exact: true })
    .click();
  await review
    .getByRole("button", { name: "Next in review →", exact: true })
    .click();
  await expect(review.locator(".review-frame")).toContainText("Second slide");
  await expect(output.getByText("First line", { exact: false })).toBeVisible();
  await expect(
    output.getByText("Private prayer cue", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Blank screen", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await page.screenshot({
    path: "docs/service-review-preview.png",
    fullPage: true,
  });
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 640, height: 480 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(
      review.getByRole("button", { name: "Back to preparation", exact: true }),
    ).toBeInViewport();
    await expect(
      review.getByRole("button", { name: "Next in review →", exact: true }),
    ).toBeInViewport();
    const bounds = await review.locator(".review-frame").boundingBox(),
      frame = await review.locator(".review-frame > .frame").boundingBox();
    expect(frame!.height).toBeGreaterThan(35);
    expect(frame!.height).toBeLessThanOrEqual(bounds!.height + 1);
    expect(frame!.width).toBeLessThanOrEqual(bounds!.width + 1);
  }
  await review
    .locator(".review-frame > .frame")
    .evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect(review.locator(".review-frame > .frame")).toBeInViewport({
    ratio: 0.99,
  });
  const visibleFrame = await review
      .locator(".review-frame > .frame")
      .boundingBox(),
    controls = await review.locator(".review-controls").boundingBox();
  expect(visibleFrame!.y + visibleFrame!.height).toBeLessThanOrEqual(
    controls!.y + 1,
  );
  await page.screenshot({
    path: testInfo.outputPath("sanctuary-review-compact.png"),
    fullPage: true,
  });
});

test("Library paste refuses a stale preview and saves only after explicit apply", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.getByRole("button", { name: "New song", exact: true }).click();
  const library = page.locator(".content-editor");
  await library
    .getByLabel("Library title", { exact: true })
    .fill("Library staging");
  await library.getByText("Paste whole-song lyrics", { exact: true }).click();
  await library
    .getByLabel("Primary lyrics to stage", { exact: true })
    .fill("[Verse]\nLibrary pasted words");
  await library
    .getByRole("button", { name: "Preview pasted lyrics", exact: true })
    .click();
  await library
    .getByLabel("Library title", { exact: true })
    .fill("Changed during staging");
  await library
    .getByRole("button", { name: "Apply pasted lyrics", exact: true })
    .click();
  await expect(library.getByRole("alert")).toContainText("song changed");
  await expect(
    library.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("");
  await expect(
    library.getByRole("button", { name: "Save library item", exact: true }),
  ).toBeDisabled();
  await library
    .getByRole("button", { name: "Preview pasted lyrics", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Apply pasted lyrics", exact: true })
    .click();
  await library
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(page.locator(".library-message")).toContainText(
    "Library master saved",
  );
  await page.reload();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page
    .locator(".library-row")
    .filter({ hasText: "Changed during staging" })
    .click();
  await expect(
    library.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Library pasted words");
});
