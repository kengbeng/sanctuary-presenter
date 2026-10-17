import { test, expect } from "@playwright/test";
import { newContent } from "../src/model";
test("Library and Prepare share normalized search, bilingual excerpts and filters; duplicate suggestions do not block separate songs", async ({
  page,
}) => {
  const grace = newContent("song");
  grace.title = "Grâce éternelle";
  grace.indexNumber = "H-007";
  grace.primaryLanguage = "English";
  grace.secondaryLanguage = "中文";
  grace.tags = "Advent, Holy Spirit";
  grace.sections[0].pages[0].text = "Holy, holy\nLove never fails";
  grace.sections[0].pages[0].secondary = "祢的恩典永遠長存";
  const other = newContent("song");
  other.title = "Morning praise";
  other.primaryLanguage = "English";
  other.secondaryLanguage = "";
  other.tags = "Thanksgiving";
  other.sections[0].pages[0].text = "Morning song";
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Your services", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    async (records) => {
      const request = indexedDB.open("sanctuary:" + location.pathname);
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = database.transaction("content", "readwrite");
        for (const record of records) tx.objectStore("content").put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      database.close();
    },
    [grace, other],
  );
  await page.reload();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const library = page.locator(".library-pane");
  const search = library.getByRole("searchbox");
  await search.fill("ETERNELLE grace");
  await expect(library.locator(".library-row")).toHaveCount(1);
  await expect(library.locator(".library-row")).toContainText(
    "Grâce éternelle",
  );
  await search.fill("fails LOVE");
  await expect(library.locator(".search-excerpt")).toHaveText(
    "Love never fails",
  );
  await search.fill("恩典");
  await expect(library.locator(".search-excerpt")).toHaveText(
    "祢的恩典永遠長存",
  );
  await search.fill("H 007");
  await expect(library.locator(".library-row")).toHaveCount(1);
  await search.fill("");
  await library
    .getByLabel("Search language", { exact: true })
    .selectOption("中文");
  await expect(library.locator(".library-row")).toHaveCount(1);
  await library
    .getByLabel("Search tag", { exact: true })
    .selectOption("Thanksgiving");
  await expect(
    library.getByText("No matches. Try fewer words or clear the filters.", {
      exact: true,
    }),
  ).toBeVisible();
  await library
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(library.locator(".library-row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Services", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Service name", { exact: true })
    .fill("Search rehearsal");
  await page
    .getByRole("button", { name: "Create service", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add first item", exact: true })
    .click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("searchbox").fill("fails love");
  await expect(drawer.locator(".sf-result")).toHaveCount(1);
  await expect(drawer.locator(".search-excerpt")).toHaveText(
    "Love never fails",
  );
  await drawer.getByLabel("Search tag", { exact: true }).selectOption("Advent");
  await expect(drawer.locator(".sf-result")).toHaveCount(1);
  await page.screenshot({path:"docs/song-search-preview.png",fullPage:true});
  await drawer
    .getByRole("button", { name: "Create song", exact: true })
    .click();
  await drawer
    .getByLabel("Song title", { exact: true })
    .fill("GRACE ETERNELLE");
  await expect(
    drawer.getByText(/Similar items already in Library/),
  ).toBeVisible();
  await drawer
    .getByRole("textbox", { name: "Verse 1 · slide 1", exact: true })
    .fill("A distinct song with a similar title");
  await drawer
    .getByRole("button", { name: "Save song and add to service", exact: true })
    .click();
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await expect(library.locator(".library-row")).toHaveCount(3);
  await search.fill("grace");
  await expect(library.locator(".library-row")).toHaveCount(2);
});
