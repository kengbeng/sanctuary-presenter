import { test, expect } from "@playwright/test";
test("bilingual library, repeated arrangement, independent service copy and persistence", async ({
  page,
  context,
}) => {
  const dialogs: string[] = [];
  page.on("dialog", async (d) => {
    dialogs.push(d.message());
    await d.accept();
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("button", { name: "New service", exact: true }).click();
  await page
    .getByLabel("Service title", { exact: true })
    .fill("Sunday rehearsal");
  await page.getByLabel("Service title", { exact: true }).blur();
  await page.getByRole("button", { name: "New song", exact: true }).click();
  await page
    .getByLabel("Library title", { exact: true })
    .fill("Bilingual rehearsal");
  await page.getByLabel("Song number", { exact: true }).fill("H-007");
  await page.getByLabel("Secondary language", { exact: true }).fill("Chinese");
  const master = page.locator(".content-editor");
  await master.getByLabel("Primary text", { exact: true }).fill("First verse");
  await master.getByLabel("Secondary text", { exact: true }).fill("第一段");
  await master.getByText("Arrangements", { exact: true }).click();
  await master.getByRole("button", { name: "Append V1", exact: true }).click();
  await master
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    page.getByText("Library master saved.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add library item to service", exact: true })
    .click();
  const planner = page.locator(".planner");
  await expect(
    planner.getByText("2 projected slides · output starts black"),
  ).toBeVisible();
  await planner
    .getByLabel("Service operator notes", { exact: true })
    .fill("PRIVATE OPERATOR NOTE");
  await planner.getByText("Item design override", { exact: true }).click();
  await planner
    .locator(".item-design")
    .getByLabel("Font size at 1080p", { exact: true })
    .first()
    .fill("84");
  await planner
    .getByLabel("Primary text", { exact: true })
    .fill("Service-only verse");
  await master
    .getByLabel("Primary text", { exact: true })
    .fill("Changed library verse");
  await master
    .getByRole("button", { name: "Save library item", exact: true })
    .click();
  await expect(
    master.getByText("Saved / ready to edit", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await expect(
    planner.getByLabel("Service operator notes", { exact: true }),
  ).toHaveValue("PRIVATE OPERATOR NOTE");
  await expect(planner.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Service-only verse",
  );
  await planner.getByText("Item design override", { exact: true }).click();
  await expect(
    planner
      .locator(".item-design")
      .getByLabel("Font size at 1080p", { exact: true })
      .first(),
  ).toHaveValue("84");
  await page.getByRole("tab", { name: "Songs", exact: true }).click();
  await page
    .getByRole("button", { name: "Bilingual rehearsal", exact: false })
    .first()
    .click();
  await expect(master.getByLabel("Song number", { exact: true })).toHaveValue(
    "H-007",
  );
  await expect(master.getByLabel("Primary text", { exact: true })).toHaveValue(
    "Changed library verse",
  );
  await planner
    .getByRole("button", { name: "Present this service", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sunday rehearsal" }),
  ).toBeVisible();
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await promise;
  await expect(page.getByText("READY_BLANK", { exact: true })).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(
    output.getByText("Service-only verse", { exact: true }),
  ).toBeVisible();
  await expect(output.getByText("第一段", { exact: true })).toBeVisible();
  await expect(
    output.getByText("PRIVATE OPERATOR NOTE", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(
    output.getByText("Service-only verse", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  const backupPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export full backup", exact: true })
    .click();
  const backup = await backupPromise;
  const backupPath = await backup.path();
  expect(backupPath).toBeTruthy();
  const clean = await context.browser()!.newContext();
  const restored = await clean.newPage();
  restored.on("dialog", (d) => d.accept());
  await restored.goto("./");
  await restored
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await restored
    .getByLabel("Restore backup", { exact: true })
    .setInputFiles(backupPath!);
  await expect(
    restored.getByText("Backup restored.", { exact: false }),
  ).toBeVisible();
  await restored
    .getByRole("combobox", { name: "Saved service", exact: true })
    .selectOption({ label: "Sunday rehearsal" });
  await expect(
    restored
      .locator(".planner")
      .getByLabel("Service operator notes", { exact: true }),
  ).toHaveValue("PRIVATE OPERATOR NOTE");
  await clean.close();
  expect(dialogs).toEqual([]);
});
test("local image import, reference protection, output readiness and malformed restore safety", async ({
  page,
  context,
}) => {
  page.on("dialog", (d) => d.accept());
  await page.goto("./");
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("button", { name: "New service", exact: true }).click();
  await page.getByRole("tab", { name: "Media", exact: true }).click();
  await page
    .getByLabel("Import media", { exact: true })
    .setInputFiles("public/icon-192.png");
  await expect(
    page.getByText("Media stored locally.", { exact: false }),
  ).toBeVisible();
  await page
    .locator(".media-row")
    .getByRole("button", { name: "Add to service", exact: true })
    .click();
  await page
    .locator(".media-row")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByText("Media is in use:", { exact: false }),
  ).toBeVisible();
  await page
    .locator(".planner")
    .getByRole("button", { name: "Present this service", exact: true })
    .click();
  await expect(
    page.getByText("● App shell cached · offline ready"),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "New service", exact: true }),
  ).toBeVisible();
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await promise;
  await expect(page.getByText("READY_BLANK", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(output.locator(".slide-media")).toBeVisible();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page.getByRole("tab", { name: "Media", exact: true }).click();
  await page.getByLabel("Restore backup", { exact: true }).setInputFiles({
    name: "invalid.zip",
    mimeType: "application/zip",
    buffer: Buffer.from("invalid"),
  });
  await expect(
    page.getByText("Invalid or multipart ZIP archive."),
  ).toBeVisible();
  await expect(
    page.locator(".media-row").getByText("icon-192.png", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/library-preview.png", fullPage: true });
});
