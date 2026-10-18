import { test, expect, type Page } from "@playwright/test";
async function prepare(page: Page) {
  await page.goto("./#/workflow-prototype");
  await page
    .getByLabel("Service name", { exact: true })
    .fill("Sunday practice");
  await page
    .getByRole("button", { name: "Create service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create song and add", exact: true })
    .click();
  await page.getByLabel("Song title", { exact: true }).fill("Practice song");
  await page
    .getByLabel("Verse 1 · slide 1", { exact: true })
    .fill("Verse words");
  await page.getByRole("button", { name: "Add chorus", exact: true }).click();
  await page
    .getByLabel("Chorus · slide 1", { exact: true })
    .fill("Chorus words");
  await page
    .getByRole("button", { name: "Add slide to Chorus", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Chorus · slide 2", exact: true })
    .fill("Chorus second page");
  await page.getByRole("button", { name: "Add bridge", exact: true }).click();
  await page
    .getByLabel("Bridge · slide 1", { exact: true })
    .fill("Bridge words");
  await page
    .getByRole("button", { name: "Save song and add to service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Present service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Connect practice display", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Connect simulated output", exact: true })
    .click();
}
test("prototype previews sections before Show slide and applies staged changes without changing live words", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await prepare(page);
  const simulated = page.getByLabel("Simulated congregation frame", {
    exact: true,
  });
  await expect(simulated.getByText("Verse words", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Show slide", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    simulated.getByText("Verse words", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chorus", exact: true }).click();
  await expect(
    page.locator(".wf-center").getByText("Chorus words", { exact: true }),
  ).toBeVisible();
  await expect(
    simulated.getByText("Verse words", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    simulated.getByText("Chorus words", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Slide 2", exact: true }).click();
  await expect(
    page.locator(".wf-center").getByText("Chorus second page", { exact: true }),
  ).toBeVisible();
  await expect(
    simulated.getByText("Chorus words", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    simulated.getByText("Chorus second page", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Prepare", exact: true }).click();
  await page.getByRole("button", { name: "Edit song", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Chorus · slide 2", exact: true })
    .fill("Revised staged chorus");
  await page
    .getByRole("button", { name: "Save service copy", exact: true })
    .click();
  await expect(
    page.getByText("Unapplied changes", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Apply staged changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await expect(
    simulated.getByText("Chorus second page", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Live: previous version.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chorus", exact: true }).click();
  await page.getByRole("button", { name: "Slide 2", exact: true }).click();
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    simulated.getByText("Revised staged chorus", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/workflow-prototype.png",
    fullPage: false,
  });
  await page
    .getByRole("region", {
      name: "Practice presentation controls",
      exact: true,
    })
    .getByRole("button", { name: "Blank screen", exact: true })
    .click();
  await expect(simulated.locator(".frame")).toHaveCount(0);
  await page.getByRole("button", { name: "Bridge", exact: true }).click();
  await expect(simulated.locator(".frame")).toHaveCount(0);
  await page.getByRole("button", { name: "Show slide", exact: true }).click();
  await expect(
    simulated.getByText("Bridge words", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "End presentation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Present service", exact: true }),
  ).toBeVisible();
});
for (const width of [1280, 1024, 640])
  test(`prototype safety controls reachable at width ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 640 ? 480 : 720 });
    await prepare(page);
    const controls = page.getByRole("region", {
      name: "Practice presentation controls",
      exact: true,
    });
    for (const name of ["Show slide", "Blank screen", "End presentation"]) {
      const control = controls.getByRole("button", { name, exact: true });
      await expect(control).toBeInViewport();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
