import { test, expect, type Page } from "@playwright/test";
async function start(page: Page) {
  const popup = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await popup;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  return output;
}

test("blank shortcuts work from focused controls, preserve native editing and ignore modifiers", async ({
  page,
}) => {
  await page.goto("./");
  const output = await start(page);
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(
    output.getByRole("heading", { name: "Together", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next →", exact: true }).press("b");
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(output.locator(".frame")).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .press("Escape");
  await expect(output.locator(".blackout")).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .press("Control+b");
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Library & planner", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Search library", exact: true })
    .fill("b");
  await page
    .getByRole("searchbox", { name: "Search library", exact: true })
    .press("Escape");
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await page
    .getByRole("button", { name: "01 Welcome Demo slide", exact: true })
    .click();
  await page
    .getByRole("button", { name: "01 Welcome Demo slide", exact: true })
    .press("Shift+B");
  await expect(output.locator(".blackout")).toBeVisible();
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
});

for (const size of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 640, height: 480 },
]) {
  test(`essential controls stay in view at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("./");
    const output = await start(page);
    for (const name of [
      "Next →",
      "Show / Restore",
      "Blank",
      "Stop Presentation",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      const box = await button.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
    }
    await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start Presentation", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Reconnect Output", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("combobox", { name: "Display positioning", exact: true }),
    ).not.toBeVisible();
    await expect(output.locator(".blackout")).toBeVisible();
    await page
      .getByRole("button", { name: "Stop Presentation", exact: true })
      .click();
  });
}

test("clear pending/live labels and end-of-service state never imply another slide", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByText("DEMO SERVICE", { exact: true })).toBeVisible();
  const output = await start(page);
  await expect(
    page.getByText("PENDING SLIDE · PREVIEW", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(
    page.getByText("LIVE SLIDE · PREVIEW", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(page.getByText("End of service", { exact: true })).toBeVisible();
  await expect(
    page.getByText("PENDING SLIDE · PREVIEW", { exact: true }),
  ).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(page.locator(".black-preview")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
});

test("create first service, load an empty service without sample content and choose saved service", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Create first service", exact: true })
    .click();
  const title = page.getByLabel("Service title", { exact: true });
  await expect(title).toHaveValue("New service");
  await title.fill("First service");
  await title.blur();
  await expect(
    page.getByText("Service changes saved locally.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Choose service", exact: true })
    .selectOption({ label: "First service" });
  await expect(
    page.getByText("No slides in this service", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("No upcoming slides", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Show / Restore", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Choose service", exact: true }),
  ).toHaveValue(/.+/);
  await page
    .getByRole("button", { name: "Add content in planner", exact: true })
    .click();
  await expect(title).toHaveValue("First service");
});

test("long service navigation scrolls independently and choosing another service blanks live output", async ({
  page,
}) => {
  const { newContent, newPage, makeItem, id, now } =
    await import("../src/model");
  const content = newContent("slides");
  content.pages = Array.from({ length: 100 }, (_, i) => ({
    ...newPage(),
    text: "Long service slide " + (i + 1),
  }));
  const second = newContent("slides");
  second.pages[0].text = "Second service pending text";
  const orders = [content, second].map((c, i) => ({
    id: id(),
    title: i ? "Second service" : "Long service",
    date: "2026-10-16",
    items: [makeItem(c)],
    createdAt: now(),
    updatedAt: now(),
  }));
  await page.goto("./");
  await page.evaluate(async (orders) => {
    const request = indexedDB.open("sanctuary:" + location.pathname);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("services", "readwrite");
      for (const order of orders)
        transaction.objectStore("services").put(order);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, orders);
  // Reopen to load the synthetic fixture through the normal live queries.
  await page.reload();
  await page
    .getByRole("combobox", { name: "Choose service", exact: true })
    .selectOption({ label: "Long service" });
  const output = await start(page);
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(
    output.getByText("Long service slide 1", { exact: true }),
  ).toBeVisible();
  const before = await page
    .getByRole("button", { name: "Blank", exact: true })
    .boundingBox();
  await page.locator(".slide-list .service-item").last().click();
  await expect(
    output.getByText("Long service slide 100", { exact: true }),
  ).toBeVisible();
  const after = await page
    .getByRole("button", { name: "Blank", exact: true })
    .boundingBox();
  expect(after?.y).toBe(before?.y);
  await page
    .getByRole("combobox", { name: "Choose service", exact: true })
    .selectOption({ label: "Second service" });
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await expect(
    page
      .locator(".editor")
      .getByText("Second service pending text", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show / Restore", exact: true })
    .click();
  await expect(
    output.getByText("Second service pending text", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Stop Presentation", exact: true })
    .click();
});
