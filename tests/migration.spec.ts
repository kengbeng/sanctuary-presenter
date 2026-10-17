import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("Python-converted v1 library restores in v2 with repeated bilingual slides, media and retained provenance", async ({
  page,
  context,
}) => {
  const folder = mkdtempSync(join(tmpdir(), "sanctuary-conversion-"));
  try {
    const source = join(folder, "synthetic.splibrary"),
      output = join(folder, "converted.zip");
    execFileSync("python3", [
      "-c",
      "import sys; from pathlib import Path; sys.path.insert(0,'tools/tests'); from test_convert_v1 import write_fixture; write_fixture(Path(sys.argv[1]))",
      source,
    ]);
    execFileSync("python3", [
      "tools/convert_v1.py",
      "--library",
      source,
      "--output",
      output,
    ]);
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("./#/app");
    await page
      .getByRole("button", { name: "Library & planner", exact: true })
      .click();
    await page
      .getByLabel("Restore backup", { exact: true })
      .setInputFiles(output);
    await expect(
      page.getByText("Backup restored.", { exact: false }),
    ).toBeVisible();
    await page
      .getByText("v1 conversion report: synthetic.splibrary", { exact: true })
      .click();
    await expect(
      page.getByText("Converted 2 library items and 1 media files.", {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Synthetic song", exact: false })
      .first()
      .click();
    const master = page.locator(".content-editor");
    await expect(master.getByLabel("Song number", { exact: true })).toHaveValue(
      "H-007",
    );
    await expect(
      master.getByLabel("Secondary text", { exact: true }),
    ).toHaveValue("测试\n第二行");
    await page
      .getByRole("button", { name: "New service", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add library item to service", exact: true })
      .click();
    await expect(
      page
        .locator(".planner")
        .getByText("3 projected slides · output starts black"),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Media", exact: true }).click();
    await expect(
      page.getByText("Test pixel", { exact: true }).first(),
    ).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export full backup", exact: true })
      .click();
    const backup = await downloaded;
    const clean = await context.browser()!.newContext();
    try {
      const restored = await clean.newPage();
      restored.on("dialog", (dialog) => dialog.accept());
      await restored.goto("./#/app");
      await restored
        .getByRole("button", { name: "Library & planner", exact: true })
        .click();
      await restored
        .getByLabel("Restore backup", { exact: true })
        .setInputFiles((await backup.path())!);
      await expect(
        restored.getByText("Backup restored.", { exact: false }),
      ).toBeVisible();
      await expect(
        restored.getByText("v1 conversion report: synthetic.splibrary", {
          exact: true,
        }),
      ).toBeVisible();
      const originalDownload = restored.waitForEvent("download");
      await restored
        .getByText("v1 conversion report: synthetic.splibrary", { exact: true })
        .click();
      await restored
        .getByRole("button", {
          name: "Download retained v1 data",
          exact: true,
        })
        .click();
      expect((await originalDownload).suggestedFilename()).toBe(
        "v1-retained-data.json",
      );
    } finally {
      await clean.close();
    }
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("SQLite conversion restores active content, projects bilingual snapshots and retains historical rows only in provenance", async ({
  page,
}) => {
  const folder = mkdtempSync(join(tmpdir(), "sanctuary-sqlite-"));
  try {
    const source = join(folder, "library.db"),
      output = join(folder, "converted.zip"),
      media = join(folder, "media");
    execFileSync("python3", [
      "-c",
      "import sys; from pathlib import Path; sys.path.insert(0,'tools/tests'); from test_sqlite_v1 import write_database; write_database(Path(sys.argv[1]),Path(sys.argv[2]))",
      source,
      media,
    ]);
    execFileSync("python3", [
      "tools/convert_v1.py",
      "--database",
      source,
      "--media-root",
      media,
      "--output",
      output,
    ]);
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("./#/app");
    await page
      .getByRole("button", { name: "Library & planner", exact: true })
      .click();
    await page
      .getByLabel("Restore backup", { exact: true })
      .setInputFiles(output);
    await expect(
      page.getByText("Backup restored.", { exact: false }),
    ).toBeVisible();
    await page
      .getByText("v1 conversion report: library.db", { exact: true })
      .click();
    await expect(
      page.getByText("Source rows: song_usage = 1", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "SQLite synthetic song", exact: false })
      .first()
      .click();
    await expect(
      page
        .locator(".content-editor")
        .getByLabel("Song number", { exact: true }),
    ).toHaveValue("007A");
    await page
      .getByRole("button", { name: "New service", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add library item to service", exact: true })
      .click();
    await expect(
      page
        .locator(".planner")
        .getByText("3 projected slides · output starts black"),
    ).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download retained v1 data", exact: true })
      .click();
    const { readFileSync } = await import("node:fs");
    const raw = JSON.parse(
      readFileSync((await (await downloaded).path())!, "utf8"),
    );
    expect(raw.tables.song_usage[0].song_title).toBe("Historical title");
    expect(raw.tables.songs).toHaveLength(2);
    await page
      .locator(".planner")
      .getByRole("button", { name: "Present this service", exact: true })
      .click();
    const popup = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Start Presentation", exact: true })
      .click();
    const outputPage = await popup;
    await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
    await expect(outputPage.locator(".blackout")).toBeVisible();
    await page
      .getByRole("button", { name: "Show / Restore", exact: true })
      .click();
    await expect(
      outputPage.getByText("测试\n第二行", { exact: true }),
    ).toBeVisible();
    await expect(
      outputPage.getByText("Historical title", { exact: false }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Stop Presentation", exact: true })
      .click();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("portable service conversion preserves edited snapshots, sections, language selection and notes-free output", async ({
  page,
}) => {
  const folder = mkdtempSync(join(tmpdir(), "sanctuary-service-"));
  try {
    const library = join(folder, "library.splibrary"),
      source = join(folder, "service.spservice"),
      backup = join(folder, "converted.zip");
    execFileSync("python3", [
      "-c",
      "import sys; from pathlib import Path; sys.path.insert(0,'tools/tests'); from test_convert_v1 import write_fixture; from test_service_v1 import write_service; write_fixture(Path(sys.argv[1])); write_service(Path(sys.argv[2]),packaged=True)",
      library,
      source,
    ]);
    execFileSync("python3", [
      "tools/convert_v1.py",
      "--library",
      library,
      "--service",
      source,
      "--output",
      backup,
    ]);
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("./#/app");
    await page
      .getByRole("button", { name: "Library & planner", exact: true })
      .click();
    await page
      .getByLabel("Restore backup", { exact: true })
      .setInputFiles(backup);
    await expect(
      page.getByText("Backup restored.", { exact: false }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Synthetic song", exact: false })
      .first()
      .click();
    await expect(
      page
        .locator(".content-editor")
        .getByLabel("Primary text", { exact: true }),
    ).toHaveValue("Primary\nHard break");
    await page
      .getByRole("combobox", { name: "Saved service", exact: true })
      .selectOption({ label: "Saved v1 service" });
    const planner = page.locator(".planner");
    await expect(
      planner.getByText("4 projected slides · output starts black", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      planner.getByText("Section heading · not projected", { exact: true }),
    ).toBeVisible();
    await planner
      .getByRole("button", { name: "2. PRIVATE ITEM TITLE", exact: true })
      .click();
    await expect(
      planner.getByLabel("Service operator notes", { exact: true }),
    ).toHaveValue("PRIVATE OPERATOR NOTES");
    await expect(
      planner.getByLabel("Primary text", { exact: true }),
    ).toHaveValue("Service-only edited verse");
    await expect(
      planner.getByLabel("Projected language", { exact: true }),
    ).toHaveValue("both");
    await planner
      .getByRole("button", { name: "Present this service", exact: true })
      .click();
    const popup = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Start Presentation", exact: true })
      .click();
    const output = await popup;
    await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
    await expect(output.locator(".blackout")).toBeVisible();
    await page
      .getByRole("button", { name: "Show / Restore", exact: true })
      .click();
    await expect(
      output.getByText("Service-only edited verse", { exact: true }),
    ).toBeVisible();
    await expect(
      output.getByText("保存的服务歌词", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await expect(
      output.getByText("只显示第二语言", { exact: true }),
    ).toBeVisible();
    await expect(
      output.getByText("Do not project primary", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await expect(
      output.getByText("Fallback primary", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await expect(output.locator(".foreground-media")).toBeVisible();
    await expect(output.locator(".blackout")).not.toBeVisible();
    await expect(output.getByText("PRIVATE", { exact: false })).toHaveCount(0);
    await expect(
      output.getByText("HIDDEN MEDIA TEXT", { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Stop Presentation", exact: true })
      .click();
    await page.reload();
    const again = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Start Presentation", exact: true })
      .click();
    const reloadedOutput = await again;
    await expect(page.getByText("OUTPUT BLACK", { exact: true })).toBeVisible();
    await expect(reloadedOutput.locator(".blackout")).toBeVisible();
    await page
      .getByRole("button", { name: "Stop Presentation", exact: true })
      .click();
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
