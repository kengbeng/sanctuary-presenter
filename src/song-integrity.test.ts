import "fake-indexeddb/auto";
import JSZip from "jszip";
import { afterEach, expect, it } from "vitest";
import {
  newContent,
  newPage,
  makeItem,
  id,
  now,
  servicePages,
  validateContent,
  contentCompatibilityIssues,
  editableContentCopy,
  pageReadinessIssue,
  type ServiceOrder,
} from "./model";
import { PresenterDatabase } from "./repository";
import { exportBackup, readBackup, restoreBackup } from "./backup";
const databases: PresenterDatabase[] = [];
function repo() {
  const r = new PresenterDatabase(`integrity-${id()}`);
  databases.push(r);
  return r;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((r) => r.delete()));
});
function fixture(): ServiceOrder {
  const song = newContent("song");
  song.sections[0].pages[0].text = "Verse\n第一段";
  song.sections[0].pages.push(newPage());
  song.sections[0].pages[1].text = "Second page";
  song.arrangements[0].auto = false;
  song.arrangements[0].sectionIds.push(song.sections[0].id);
  return {
    id: id(),
    title: "Fixture",
    date: "",
    items: [makeItem(song), makeItem(song)],
    createdAt: now(),
    updatedAt: now(),
  };
}
it("distinguishes repeats, pages and song items without changing their source IDs", () => {
  const order = fixture();
  const before = structuredClone(order);
  const pages = servicePages(order);
  expect(pages).toHaveLength(8);
  expect(new Set(pages.map((p) => p.id)).size).toBe(8);
  expect(pages[0].sourcePageId).toBe(pages[2].sourcePageId);
  expect(pages.map((p) => [p.occurrenceIndex, p.pageIndex])).toEqual([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]);
  expect(pages[2].sectionId).toBe(order.items[0].snapshot.sections[0].id);
  expect(servicePages(order).map((p) => p.id)).toEqual(pages.map((p) => p.id));
  expect(order).toEqual(before);
  order.items[0].nonPresenting = true;
  expect(servicePages(order)).toHaveLength(4);
});
it("encodes imported destination IDs without separator collisions", () => {
  const order = fixture();
  order.items[0].id = 'item:0:["page"]';
  order.items[0].snapshot.sections[0].pages[0].id = "page:0";
  expect(new Set(servicePages(order).map((p) => p.id)).size).toBe(8);
});
it("rejects hidden branches and inconsistent auto orders on new writes, while preserving legacy reads", async () => {
  const r = repo();
  const song = newContent("song");
  song.pages.push(newPage());
  expect(() => validateContent(song)).toThrow("hidden top-level");
  expect(() => validateContent(song, { legacy: true })).not.toThrow();
  await expect(r.saveContent(song)).rejects.toThrow("hidden top-level");
  const slides = newContent("slides");
  slides.sections = song.sections;
  slides.arrangements = song.arrangements;
  expect(() => validateContent(slides)).toThrow("hidden song");
  const auto = newContent("song");
  auto.arrangements[0].sectionIds.push(auto.sections[0].id);
  await expect(r.saveContent(auto)).rejects.toThrow(
    "differs from section order",
  );
  auto.arrangements[0].auto = false;
  await r.saveContent(auto);
});
it("recovery copies preserve original bytes and convert contradictory auto order to custom", async () => {
  const r = repo();
  const original = newContent("song");
  original.pages.push(newPage());
  original.pages[0].text = "Retained hidden text";
  original.arrangements[0].sectionIds.push(original.sections[0].id);
  const before = structuredClone(original);
  await r.content.add(original); // legacy fixture, bypass new-write API deliberately
  const copy = editableContentCopy(original);
  await r.saveContent(copy);
  expect(copy.pages).toEqual([]);
  expect(copy.arrangements[0].auto).toBe(false);
  expect(copy.arrangements[0].sectionIds).toEqual([
    copy.sections[0].id,
    copy.sections[0].id,
  ]);
  expect(copy.sections[0].id).not.toBe(original.sections[0].id);
  expect(copy.sections[0].pages[0].id).not.toBe(
    original.sections[0].pages[0].id,
  );
  expect(await r.content.get(original.id)).toEqual(before);
  expect(original).toEqual(before);
  expect(contentCompatibilityIssues(copy)).toEqual([]);
});
it("legacy hidden text and custom order round trip with fresh editing tokens", async () => {
  const source = repo(),
    target = repo();
  const original = newContent("song");
  original.pages.push(newPage());
  original.pages[0].text = "Hidden original";
  original.arrangements[0].sectionIds.push(original.sections[0].id);
  const order = fixture();
  order.items[0].snapshot = structuredClone(original);
  order.items[0].sectionOrder = [...original.arrangements[0].sectionIds];
  await source.content.add(original);
  await source.services.add(order);
  const prepared = await readBackup(await exportBackup(source));
  expect(prepared.compatibilityIssues).toHaveLength(4);
  await restoreBackup(prepared, target);
  const restoredContent = (await target.content.get(original.id))!;
  const restoredOrder = (await target.services.get(order.id))!;
  const {
    revision: contentRevision,
    revisionToken: contentToken,
    ...contentBody
  } = restoredContent;
  const {
    revision: serviceRevision,
    revisionToken: serviceToken,
    ...serviceBody
  } = restoredOrder;
  expect(contentBody).toEqual(original);
  expect(serviceBody).toEqual(order);
  expect(contentRevision).toBe(1);
  expect(serviceRevision).toBe(1);
  expect(contentToken).toBeTruthy();
  expect(serviceToken).toBeTruthy();
  const reexport = await readBackup(await exportBackup(target));
  expect(reexport.data.content).toEqual([restoredContent]);
  expect(reexport.compatibilityIssues).toEqual(prepared.compatibilityIssues);
  // Notes/reordering can preserve old snapshots, but changing or newly copying one is rejected.
  restoredOrder.items[0].notes = "Private cue";
  await target.saveService(restoredOrder);
  restoredOrder.items[0].snapshot.sections[0].pages[0].text = "Changed";
  await expect(target.saveService(restoredOrder)).rejects.toThrow(
    "hidden top-level",
  );
  expect((await target.services.get(order.id))?.items[0].notes).toBe(
    "Private cue",
  );
});
it("unfinished songs remain storable while selected language and intentional media determine readiness", () => {
  const song = newContent("song");
  expect(() => validateContent(song)).not.toThrow();
  const page = song.sections[0].pages[0];
  expect(pageReadinessIssue(page)).toContain("empty");
  page.secondary = "第二语言";
  expect(pageReadinessIssue(page)).toBeUndefined();
  page.languageMode = "primary";
  expect(pageReadinessIssue(page)).toContain("empty");
  page.mediaId = "selected-local-media";
  expect(pageReadinessIssue(page)).toBeUndefined();
  // Readiness does not claim the referenced asset exists or decodes; repository/renderer check that.
});

it.each([1, 2, 3, 4])(
  "retains ambiguous legacy bytes when reading backup version %i",
  async (version) => {
    const source = repo();
    const original = newContent("slides");
    const hidden = newContent("song");
    original.sections = hidden.sections;
    original.arrangements = hidden.arrangements;
    original.sections[0].pages[0].text = "Hidden bilingual original\n原文";
    await source.content.add(original);
    const blob = await exportBackup(source);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const manifest = JSON.parse(
      await zip.file("manifest.json")!.async("string"),
    );
    manifest.version = version;
    zip.file("manifest.json", JSON.stringify(manifest));
    const prepared = await readBackup(
      await zip.generateAsync({ type: "blob" }),
    );
    expect(prepared.data.content[0]).toEqual(original);
    expect(prepared.compatibilityIssues.length).toBeGreaterThan(0);
    const copy = editableContentCopy(original);
    expect(copy.pages).toHaveLength(1);
    expect(copy.sections).toEqual([]);
    expect(copy.arrangements).toEqual([]);
  },
);
