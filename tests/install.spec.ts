import { test, expect } from "@playwright/test";

test("Install offers manual guidance without claiming installation", async ({
  page,
}) => {
  await page.goto("./");
  const install = page
    .locator("header")
    .getByRole("button", { name: "Install", exact: true });
  await install.click();
  const help = page.getByRole("dialog", {
    name: "Install Sanctuary Presenter",
    exact: true,
  });
  await expect(help).toBeVisible();
  await expect(help).toContainText("Add to Dock");
  await page.keyboard.press("Escape");
  await expect(help).not.toBeVisible();
  await expect(install).toBeFocused();
});

test("install prompt reports pending, cancellation and confirmed installation", async ({
  page,
}) => {
  await page.goto("./");
  async function offer() {
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      let resolve!: (value: { outcome: string }) => void;
      const choice = new Promise((done) => {
        resolve = done;
      });
      Object.assign(window, { finishInstallChoice: resolve });
      Object.assign(event, { prompt: async () => {}, userChoice: choice });
      window.dispatchEvent(event);
    });
  }
  await offer();
  const install = page
    .locator("header")
    .getByRole("button", { name: "Install", exact: true });
  await install.click();
  await expect(
    page
      .locator("header")
      .getByRole("button", { name: "Installing…", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() => {
    (window as any).finishInstallChoice({ outcome: "dismissed" });
  });
  await expect(install).toBeEnabled();
  await expect(page.locator(".install-announcement")).toContainText(
    "cancelled",
  );
  await offer();
  await install.click();
  await page.evaluate(() => {
    (window as any).finishInstallChoice({ outcome: "accepted" });
  });
  await expect(page.locator(".install-announcement")).toContainText(
    "Installation requested",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page
      .locator("header")
      .getByRole("button", { name: "Installed", exact: true }),
  ).toBeDisabled();
});
