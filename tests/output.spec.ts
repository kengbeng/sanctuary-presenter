import { test, expect } from "@playwright/test";
test("black first, explicit reveal, navigation, blank, reload, reconnect, stop", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
  await page.goto("./#/app");
  const popupPromise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await popupPromise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(
    output.getByRole("heading", { name: "Welcome", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(
    output.getByRole("heading", { name: "Together", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(output.locator(".frame")).toHaveCount(1);
  await output.reload();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(output.locator(".frame")).toHaveCount(1);
  await output.close();
  await expect(page.getByText("DISCONNECTED", { exact: true })).toBeVisible();
  const replacementPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Reconnect Output" }).click();
  const replacement = await replacementPromise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await expect(replacement.locator(".blackout")).toBeVisible();
  await expect(replacement.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Stop Presentation" }).click();
  await expect(page.getByText("OUTPUT STOPPED", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("test pattern never leaks selected service and output opens offline", async ({
  page,
  context,
}) => {
  await page.goto("./#/app");
  await expect(
    page.getByText("● App shell cached · offline ready"),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "A time to gather" }),
  ).toBeVisible();
  const promise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Test Output", exact: true }).click();
  const output = await promise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Show Test Pattern" }).click();
  await expect(
    output.getByRole("heading", { name: "Sanctuary · Test output" }),
  ).toBeVisible();
  await expect(
    output.getByText("A place to gather.", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await page.screenshot({ path: "docs/operator-preview.png", fullPage: true });
  await output.close();
  await expect(page.getByText("OUTPUT CLOSED", { exact: true })).toBeVisible();
});
test("direct output URL and popup denial stay safe", async ({ page }) => {
  await page.goto("./#/output");
  await expect(page.locator(".blackout")).toBeVisible();
  await expect(page.locator(".frame")).not.toBeVisible();
  await page.goto("./#/app");
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  await expect(page.getByText(/Popup blocked/)).toBeVisible();
  await expect(page.getByText("DISCONNECTED", { exact: true })).toBeVisible();
});

test("automatic selection requires a choice for multiple secondary displays", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "getScreenDetails", {
      value: async () => ({
        screens: [
          {
            label: "Desk",
            isPrimary: true,
            left: 0,
            top: 0,
            width: 1280,
            height: 720,
          },
          {
            label: "Projector A",
            isPrimary: false,
            left: 1280,
            top: 0,
            width: 1920,
            height: 1080,
          },
          {
            label: "Projector B",
            isPrimary: false,
            left: 3200,
            top: 0,
            width: 1920,
            height: 1080,
          },
        ],
      }),
    }),
  );
  await page.goto("./#/app");
  await page.getByRole("button", { name: "Configure Display" }).click();
  await expect(
    page.getByText("Select the intended secondary display."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  await expect(
    page.getByText("Select a display or choose Manual before starting."),
  ).toBeVisible();
  await page.getByLabel("Preferred display").selectOption("1");
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await promise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
});
test("retired output is quarantined and stale/wrong-session commands are rejected", async ({
  page,
  context,
}) => {
  await page.goto("./#/app");
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const old = await promise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(old.locator(".frame")).toHaveCount(1);
  const replacement = await context.newPage();
  await replacement.goto(old.url());
  await expect(old.locator(".blackout")).toBeVisible();
  await expect(old.locator(".frame")).not.toBeVisible();
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show / Restore" }).click();
  await expect(replacement.locator(".frame")).toHaveCount(1);
  await expect(old.locator(".blackout")).toBeVisible();
  await expect(old.locator(".frame")).not.toBeVisible();
  await replacement.evaluate(() => {
    const bc = new BroadcastChannel(`sanctuary:${location.pathname}`);
    bc.postMessage({
      v: 1,
      session: "wrong",
      instance: "fake",
      seq: 999,
      type: "SHOW_SLIDE",
      slide: 2,
    });
    bc.close();
  });
  await expect(old.locator(".blackout")).toBeVisible();
  await expect(old.locator(".frame")).not.toBeVisible();
  await page.getByRole("button", { name: "Blank", exact: true }).click();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(replacement.locator(".blackout")).toBeVisible();
  await expect(replacement.locator(".frame")).not.toBeVisible();
});

test("startup without activation waits for the fullscreen button", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "userActivation", {
      get: () => ({ isActive: false }),
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      value: () => {
        document.documentElement.dataset.fullscreenCalls = String(
          Number(document.documentElement.dataset.fullscreenCalls || 0) + 1,
        );
        return Promise.resolve();
      },
    });
  });
  await page.goto("./#/app");
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await promise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await expect(output.locator("html")).not.toHaveAttribute(
    "data-fullscreen-calls",
  );
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await output.locator(".output-tools").hover();
  await expect(
    output.getByText(
      "Click Enter Fullscreen in this window to enable fullscreen.",
      { exact: false },
    ),
  ).toBeVisible();
  await output
    .getByRole("button", { name: "Enter Fullscreen", exact: true })
    .click();
  await expect(output.locator("html")).toHaveAttribute(
    "data-fullscreen-calls",
    "1",
  );
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
});
test("fullscreen rejection gives guidance and keeps output black", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "userActivation", {
      get: () => ({ isActive: false }),
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      value: () =>
        Promise.reject(
          new TypeError(
            "Cannot request fullscreen without transient activation.",
          ),
        ),
    });
  });
  await page.goto("./#/app");
  const promise = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  const output = await promise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  await output.locator(".output-tools").hover();
  await output
    .getByRole("button", { name: "Enter Fullscreen", exact: true })
    .click();
  await expect(
    output.getByText("Fullscreen was not enabled.", { exact: false }),
  ).toBeVisible();
  await expect(output.getByText("TypeError", { exact: false })).toHaveCount(0);
  await expect(output.locator(".blackout")).toBeVisible();
  await expect(output.locator(".frame")).not.toBeVisible();
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
});

test("native cross-window maintenance locks survive silence and release after Test Output closes", async ({
  page,
}) => {
  await page.goto("./#/app");
  const canMaintain = () =>
    page.evaluate(() =>
      navigator.locks.request(
        "sanctuary-maintenance:" + location.pathname,
        { mode: "exclusive", ifAvailable: true },
        (lock) => !!lock,
      ),
    );
  expect(await canMaintain()).toBe(true);
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Test Output", exact: true }).click();
  const output = await popupPromise;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  expect(await canMaintain()).toBe(false);
  // No heartbeat timing is involved: the browser owns the lock until release.
  const held = await output.evaluate(() => navigator.locks.query());
  expect(held.held?.some((lock) => lock.mode === "shared")).toBe(true);
  await output.close();
  await expect(page.getByText("OUTPUT CLOSED", { exact: true })).toBeVisible();
  await expect.poll(canMaintain).toBe(true);
  const again = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Start Presentation", exact: true })
    .click();
  await again;
  await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
  expect(await canMaintain()).toBe(false);
  await page.getByRole("button", { name: "Stop Presentation" }).click();
  await expect.poll(canMaintain).toBe(true);
});
