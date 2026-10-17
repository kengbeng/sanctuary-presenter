import { test, expect } from "@playwright/test";
test("structural edits persist bilingual copies, preserve custom repeats and keep service edits separate from Library", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByLabel("Service name", { exact: true })
    .fill("Authoring rehearsal");
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
    .fill("Structured worship");
  await drawer
    .getByRole("textbox", { name: "Verse 1 · slide 1", exact: true })
    .fill("Original verse");
  await drawer
    .getByRole("textbox", {
      name: "Verse 1 · slide 1 · second language",
      exact: true,
    })
    .fill("原文");
  await drawer.getByText("Slide options · 1", { exact: true }).click();
  await drawer
    .getByRole("button", { name: "Duplicate slide", exact: true })
    .click();
  await drawer
    .getByRole("textbox", { name: "Verse 1 · slide 2", exact: true })
    .fill("Copied words");
  await drawer.getByRole("button", { name: "Add chorus", exact: true }).click();
  await drawer
    .getByRole("textbox", { name: "Chorus · slide 1", exact: true })
    .fill("Chorus words");
  const verse = drawer
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: /^Verse 1$/ }) })
    .last();
  await verse.getByText("Slide options · 2", { exact: true }).click();
  await verse
    .locator("details")
    .filter({ has: page.getByText("Slide options · 2", { exact: true }) })
    .getByLabel("Move slide to section", { exact: true })
    .selectOption({ label: "Chorus" });
  await expect(
    drawer.getByRole("textbox", { name: "Chorus · slide 2", exact: true }),
  ).toHaveValue("Copied words");
  await expect(
    drawer.getByRole("textbox", {
      name: "Chorus · slide 2 · second language",
      exact: true,
    }),
  ).toHaveValue("原文");
  const chorus = drawer
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: /^Chorus$/ }) })
    .last();
  await chorus.getByText("Section options · Chorus", { exact: true }).click();
  await chorus
    .getByRole("button", { name: "Duplicate section", exact: true })
    .click();
  await expect(
    drawer.getByRole("textbox", {
      name: "Chorus (copy) · slide 2",
      exact: true,
    }),
  ).toHaveValue("Copied words");
  await drawer
    .getByRole("textbox", { name: "Chorus (copy) · slide 1", exact: true })
    .fill("Independent copy");
  await drawer
    .getByLabel("Section to repeat", { exact: true })
    .selectOption({ label: "Chorus" });
  await drawer
    .getByRole("button", { name: "Repeat section in order", exact: true })
    .click();
  const copy = drawer
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: /^Chorus \(copy\)$/ }) })
    .last();
  await copy
    .getByText("Section options · Chorus (copy)", { exact: true })
    .click();
  await copy
    .getByRole("button", { name: "Move section up", exact: true })
    .click();
  await expect(
    chorus.getByRole("textbox", { name: "Chorus · slide 1", exact: true }),
  ).toHaveValue("Chorus words");
  await drawer
    .getByRole("button", { name: "Save song and add to service", exact: true })
    .click();
  await expect(drawer).toHaveCount(0);
  const editor = page.locator(".sf-editor");
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Original verse");
  await editor.getByText("Slide options · 1", { exact: true }).click();
  await editor
    .getByRole("button", { name: "Duplicate slide", exact: true })
    .click();
  await editor
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Service copy only");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page.reload();
  await page
    .getByRole("button", { name: "Open Authoring rehearsal", exact: true })
    .click();
  await editor.getByText("Song order & sections", { exact: true }).click();
  await expect(editor).toContainText(
    "Verse 1 → Chorus → Chorus (copy) → Chorus",
  );
  await editor
    .getByLabel("Edit service section", { exact: true })
    .selectOption({ label: "Chorus (copy)" });
  await expect(
    editor.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Independent copy");
  await editor
    .getByText("Section options · Chorus (copy)", { exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Duplicate section", exact: true })
    .click();
  await expect(
    editor
      .getByLabel("Edit service section", { exact: true })
      .locator("option:checked"),
  ).toContainText("outside song order");
  await editor
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Unplanned service copy section");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page
    .locator(".library-row")
    .filter({ hasText: "Structured worship" })
    .click();
  const library = page.locator(".content-editor");
  await expect(
    library.getByRole("textbox", { name: "Primary text", exact: true }),
  ).toHaveValue("Original verse");
  await expect(
    library
      .getByRole("combobox", { name: "Slide in section", exact: true })
      .locator("option"),
  ).toHaveCount(1);
  await library.getByText("Section options · Verse 1", { exact: true }).click();
  await library
    .getByRole("button", { name: "Duplicate section", exact: true })
    .click();
  await expect(
    library.getByLabel("Section label", { exact: true }),
  ).toHaveValue("Verse 1 (copy)");
  await library
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(page.locator(".library-message")).toContainText("saved");
});
