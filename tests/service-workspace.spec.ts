import { test, expect } from "@playwright/test";
test("new Services and Prepare create real bilingual repeated songs atomically and preserve copies", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Your services", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Service name", { exact: true }).fill("Sunday morning");
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
  await drawer
    .getByLabel("Song title", { exact: true })
    .fill("New worship song");
  await drawer
    .getByRole("textbox", { name: "Verse 1 · slide 1", exact: true })
    .fill("Verse words");
  await drawer
    .getByRole("textbox", {
      name: "Verse 1 · slide 1 · second language",
      exact: true,
    })
    .fill("第一段");
  await drawer.getByRole("button", { name: "Add chorus", exact: true }).click();
  await drawer
    .getByRole("textbox", { name: "Chorus · slide 1", exact: true })
    .fill("Chorus words");
  await drawer
    .getByRole("button", { name: "Add slide to Chorus", exact: true })
    .click();
  await drawer
    .getByRole("textbox", { name: "Chorus · slide 2", exact: true })
    .fill("Chorus second page");
  await drawer
    .getByRole("combobox", { name: "Section to repeat", exact: true })
    .selectOption({ label: "Chorus" });
  await drawer
    .getByRole("button", { name: "Repeat section in order", exact: true })
    .click();
  await drawer
    .getByRole("button", { name: "Save song and add to service", exact: true })
    .click();
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByText("Saved in Library and added as a separate copy", {
      exact: false,
    }),
  ).toBeVisible();
  const editor = page.locator(".sf-editor");
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Verse words");
  await editor
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Service-specific revision");
  await editor
    .locator("summary")
    .filter({ hasText: /^Operator notes$/ })
    .click();
  await editor
    .getByRole("textbox", { name: "Operator notes", exact: false })
    .fill("Private cue");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page.reload();
  await page
    .getByRole("button", { name: "Open Sunday morning", exact: true })
    .click();
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Service-specific revision");
  await editor
    .locator("summary")
    .filter({ hasText: /^Operator notes$/ })
    .click();
  await expect(
    editor.getByRole("textbox", { name: "Operator notes", exact: false }),
  ).toHaveValue("Private cue");
  await expect(
    page.getByRole("complementary", {
      name: "Service running order",
      exact: true,
    }),
  ).toContainText("5 slides");
  await page
    .getByRole("button", { name: "Services", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Duplicate Sunday morning", exact: true })
    .click();
  await expect(
    page
      .locator(".sf-toolbar")
      .getByRole("heading", { name: "Sunday morning (copy)", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page
    .locator(".library-row")
    .filter({ has: page.getByText("New worship song", { exact: true }) })
    .click();
  await expect(
    page
      .locator(".content-editor")
      .getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Verse words");
});
test("add picker reuses saved content and cancelled authoring does not save a partial song", async ({
  page,
}) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("./");
  await page
    .getByRole("button", { name: "Create service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add first item", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await drawer
    .getByRole("button", { name: "Create slides", exact: true })
    .count();
  await drawer
    .getByRole("button", { name: "Create song", exact: true })
    .click();
  await drawer.getByLabel("Song title", { exact: true }).fill("Discard me");
  await drawer.getByRole("button", { name: "Close", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add first item", exact: true })
    .click();
  await expect(
    drawer.getByText("Your library is empty", { exact: false }),
  ).toBeVisible();
  await drawer.getByRole("tab", { name: "Slides", exact: true }).click();
  await drawer
    .getByRole("button", { name: "Create slides", exact: true })
    .click();
  await drawer.getByLabel("Slide-set title", { exact: true }).fill("Welcome");
  await drawer.getByLabel("Slide 1", { exact: true }).fill("Welcome everyone");
  await drawer
    .getByRole("button", {
      name: "Save slides and add to service",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await drawer.getByRole("tab", { name: "Slides", exact: true }).click();
  await drawer
    .getByRole("button", { name: "Add to service", exact: true })
    .click();
  await expect(
    page
      .getByRole("complementary", {
        name: "Service running order",
        exact: true,
      })
      .locator("article"),
  ).toHaveCount(2);
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Move selected item up", exact: true })
    .click();
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
});

test("Escape closes the native picker without hijacking input, and temporary empty service names remain recoverable", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Create service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add first item", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Done", exact: true })
    .press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByText("Service name, date & appearance", { exact: true })
    .click();
  const name = page.getByRole("textbox", { name: "Service name", exact: true });
  await name.fill("");
  await expect(
    page.getByText("Enter a service name to save changes.", { exact: true }),
  ).toBeVisible();
  await name.fill("Evening gathering");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open Evening gathering", exact: true }),
  ).toBeVisible();
});

test("adding a slide edits only the service copy and operator headings never become presentation pages", async ({
  page,
}) => {
  page.on("dialog", (dialog) =>
    dialog.type() === "prompt" ? dialog.accept("Prayer") : dialog.accept(),
  );
  await page.goto("./");
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
  await drawer.getByLabel("Song title", { exact: true }).fill("Working song");
  await drawer
    .getByRole("button", { name: "Save song and add to service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add slide to service copy", exact: true })
    .click();
  await page
    .locator(".sf-editor")
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Added service slide");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await drawer
    .getByRole("button", { name: "Add operator-only heading", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", {
      name: "Service running order",
      exact: true,
    }),
  ).toContainText("not projected");
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  await expect(page.locator(".slide-list .service-item")).toHaveCount(2);
  await expect(page.locator(".slide-list")).not.toContainText("Prayer");
});
