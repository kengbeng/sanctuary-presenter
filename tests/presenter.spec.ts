import { id, makeItem, newContent, newPage, now } from "../src/model";
import { test, expect } from "@playwright/test";
test("preview-only mode requires Show slide and preserves live words through Apply", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByLabel("Service name", { exact: true })
    .fill("Presenter rehearsal");
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
  await drawer.getByLabel("Song title", { exact: true }).fill("Rehearsal song");
  await drawer
    .getByRole("textbox", { name: "Verse 1 · slide 1", exact: true })
    .fill("Original verse");
  await drawer.getByRole("button", { name: "Add chorus", exact: true }).click();
  await drawer
    .getByRole("textbox", { name: "Chorus · slide 1", exact: true })
    .fill("Original chorus");
  await drawer
    .getByRole("button", { name: "Save song and add to service", exact: true })
    .click();
  await expect(drawer).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const opening = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Open congregation window", exact: true })
    .click();
  const output = await opening;
  await expect(output.locator(".blackout")).toBeVisible();
  await page.getByRole("checkbox", { name: "Preview only", exact: true }).check();
  const take = page.getByRole("button", { name: "Show slide", exact: true });
  await expect(take).toBeEnabled();
  await take.click();
  await expect(
    output.getByText("Original verse", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Next preview →", exact: true })
    .click();
  await expect(
    output.getByText("Original verse", { exact: true }),
  ).toBeVisible();
  await take.click();
  await expect(
    output.getByText("Original chorus", { exact: true }),
  ).toBeVisible();
  await output.mouse.move(20, 20);
  await expect(output.locator(".output-tools")).toBeHidden();
  await page.screenshot({ path: "docs/presenter-preview.png", fullPage: true });
  // A restored presenter has a selected service but no workspace working copy.
  // The dedicated entry must still open the active saved service directly.
  await page
    .getByRole("button", { name: "Prepare / stage edits", exact: true })
    .click();
  await page
    .locator(".sf-editor")
    .getByRole("textbox", { name: "Primary text", exact: true })
    .fill("Revised verse");
  await expect(page.locator(".sf-notice")).toContainText("Saved locally");
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Apply saved changes", exact: true })
    .click();
  await expect(page.locator(".mp-notice")).toContainText("Changes applied");
  await expect(
    output.getByText("Original chorus", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "← Previous preview", exact: true })
    .click();
  await take.click();
  await expect(
    output.getByText("Revised verse", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Blank screen", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(page.locator(".mp-title")).toContainText("OUTPUT BLACK");
  await page.getByRole("button", { name: "Blank screen", exact: true }).click();
  await expect(page.locator(".mp-title")).toContainText("OUTPUT BLACK");
  await take.click();
  await expect(
    output.getByText("Revised verse", { exact: true }),
  ).toBeVisible();
  await output.reload();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(page.locator(".mp-title")).toContainText("OUTPUT BLACK");
  await expect(take).toBeEnabled();
  await take.click();
  await expect(
    output.getByText("Revised verse", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Prepare / stage edits", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Services", exact: true })
    .first()
    .focus();
  await page.keyboard.press("b");
  await expect(output.locator(".blackout")).toBeVisible();
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 640, height: 480 },
  { width: 640, height: 360 },
]) {
  test(`presenter safety controls remain reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("./");
    await page.getByRole("button", { name: "Present", exact: true }).click();
    await page
      .getByRole("button", { name: "Close setup", exact: true })
      .click();
    for (const name of ["Blank screen", "Connect display", "Next preview →"]) {
      const control = page.getByRole("button", { name, exact: true });
      await expect(control).toBeInViewport();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("modern output opens offline, Show slide is explicit and live setup controls require an operator action", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await expect(
    page.getByText("● App shell cached · offline ready"),
  ).toBeVisible();
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const opening = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Open congregation window", exact: true })
    .click();
  const output = await opening;
  const take = page.getByRole("button", { name: "Show slide", exact: true });
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(take).toBeEnabled();
  await take.click();
  await expect(
    output.getByRole("heading", { name: "Welcome", exact: true }),
  ).toBeVisible();
  await output.mouse.move(25, 25);
  await expect(output.locator(".output-tools")).toBeHidden();
  await page
    .getByRole("button", { name: "Display setup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Show output setup controls", exact: true })
    .click();
  await expect(
    output.getByRole("button", { name: "Enter Fullscreen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Blank screen", exact: true })
    .last()
    .click();
  await expect(output.locator(".blackout")).toBeVisible();
});

test("song controls distinguish repeated choruses and resume after an unplanned two-page bridge", async ({
  page,
}) => {
  const song = newContent("song"),
    chorus = { id: id(), label: "Chorus", pages: [newPage(), newPage()] },
    bridge = { id: id(), label: "Bridge", pages: [newPage(), newPage()] };
  song.sections[0].pages.push(newPage());
  song.sections[0].pages.forEach((p, i) => (p.text = `Verse page ${i + 1}`));
  chorus.pages.forEach((p, i) => (p.text = `Chorus page ${i + 1}`));
  bridge.pages.forEach((p, i) => (p.text = `Bridge page ${i + 1}`));
  song.sections.push(chorus, bridge);
  song.arrangements[0].auto = false;
  song.arrangements[0].sectionIds = [
    song.sections[0].id,
    chorus.id,
    song.sections[0].id,
    chorus.id,
  ];
  const order = {
    id: id(),
    title: "Section rehearsal",
    date: "",
    items: [makeItem(song)],
    createdAt: now(),
    updatedAt: now(),
  };
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Your services", exact: true }),
  ).toBeVisible();
  await page.evaluate(async (order) => {
    const request = indexedDB.open("sanctuary:" + location.pathname);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("services", "readwrite");
      tx.objectStore("services").put(order);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    database.close();
  }, order);
  await page.reload();
  await page
    .getByRole("button", { name: "Open Section rehearsal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  await page.getByRole("button", { name: "Close setup", exact: true }).click();
  const preview = page.locator(".mp-preview-frame");
  const secondChorus = page.getByRole("button", {
    name: "Chorus, position 4",
    exact: true,
  });
  await secondChorus.click();
  await expect(secondChorus).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toContainText("Chorus page 1");
  await page
    .getByRole("button", { name: "Chorus, position 2", exact: true })
    .click();
  await page
    .locator('[aria-label="Direct song sections"]')
    .getByRole("button", { name: "Bridge", exact: true })
    .click();
  await expect(preview).toContainText("Bridge page 1");
  await page
    .getByRole("button", { name: "Next preview →", exact: true })
    .click();
  await expect(preview).toContainText("Bridge page 2");
  await page
    .getByRole("button", { name: "Next preview →", exact: true })
    .click();
  await expect(preview).toContainText("Chorus page 2");
  await page
    .getByRole("button", { name: "← Previous preview", exact: true })
    .click();
  await expect(preview).toContainText("Bridge page 2");
  const position = page.getByRole("button", {
    name: "Chorus, position 2",
    exact: true,
  });
  await position.focus();
  await page.keyboard.press("ArrowRight");
  await expect(preview).toContainText("Bridge page 2");
  await page.keyboard.press("Enter");
  await expect(preview).toContainText("Verse page 1");
  await expect(page.locator(".mp-extra")).toHaveCount(0);
  await page.getByRole("button", { name: "Display setup", exact: true }).click();
  const opening = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open congregation window", exact: true }).click();
  const output = await opening;
  const show = page.getByRole("button", { name: "Show slide", exact: true });
  await expect(show).toBeEnabled(); await show.click();
  await expect(output.getByText("Verse page 1", { exact: true })).toBeVisible();
  await secondChorus.click();
  await expect(output.getByText("Chorus page 1", { exact: true })).toBeVisible();
  await page.locator('[aria-label="Direct song sections"]').getByRole("button", { name: "Bridge", exact: true }).click();
  await expect(output.getByText("Bridge page 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Slide 2", exact: true }).click();
  await expect(output.getByText("Bridge page 2", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Preview only", exact: true }).check();
  await secondChorus.click();
  await expect(preview).toContainText("Chorus page 1");
  await expect(output.getByText("Bridge page 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Return to live", exact: true }).click();
  await expect(preview).toContainText("Bridge page 2");
  await expect(page.locator(".mp-extra")).toBeVisible();
  await expect(output.getByText("Bridge page 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "End presentation", exact: true }).click();
});


test("direct control is one-click while live, with optional preview and black-first navigation", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Present", exact: true }).click();
  const opening = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Open congregation window", exact: true }).click();
  const output = await opening;
  const show = page.getByRole("button", { name: "Show slide", exact: true });
  const previewOnly = page.getByRole("checkbox", { name: "Preview only", exact: true });
  await expect(previewOnly).not.toBeChecked();
  await expect(show).toBeEnabled();
  // First selection cannot unblank startup.
  await page.getByRole("button", { name: "2. Together", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(show).toBeEnabled(); await show.click();
  await expect(output.getByText("Together", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next slide →", exact: true }).click();
  await expect(output.getByText("Peace", { exact: true })).toBeVisible();
  // Rapid destination requests must settle on the newest selection.
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>("button")];
    buttons.find((button) => button.textContent?.trim() === "2. Together")!.click();
    buttons.find((button) => button.textContent?.trim() === "1. Welcome")!.click();
  });
  await expect(output.getByText("Welcome", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "3. Peace", exact: true }).click();
  await expect(output.getByText("Peace", { exact: true })).toBeVisible();
  // Return to live targets the operator's acknowledged frame, not a paint that
  // has not yet been confirmed across the output-window channel.
  await expect(page.locator(".mp-live-frame")).toContainText("Peace");
  await previewOnly.check();
  await page.getByRole("button", { name: "1. Welcome", exact: true }).click();
  await expect(page.locator(".mp-preview-frame")).toContainText("Welcome");
  await expect(output.getByText("Peace", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Return to live", exact: true }).click();
  await expect(previewOnly).not.toBeChecked();
  await expect(page.locator(".mp-preview-frame")).toContainText("Peace");
  // Arrow keys use direct navigation outside composite section controls.
  await page.locator(".mp-title h1").click(); await page.keyboard.press("ArrowLeft");
  await expect(output.getByText("Together", { exact: true })).toBeVisible();
  await previewOnly.check();
  await page.getByRole("button", { name: "1. Welcome", exact: true }).click();
  await expect(show).toBeEnabled(); await show.click();
  await expect(output.getByText("Welcome", { exact: true })).toBeVisible();
  await expect(previewOnly).toBeChecked();
  await previewOnly.uncheck();
  await page.getByRole("button", { name: "Blank screen", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await page.getByRole("button", { name: "3. Peace", exact: true }).click();
  await expect(page.locator(".mp-preview-frame")).toContainText("Peace");
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(show).toBeEnabled(); await show.click();
  await expect(output.getByText("Peace", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "End presentation", exact: true }).click();
  await expect.poll(() => output.isClosed()).toBe(true);
});
