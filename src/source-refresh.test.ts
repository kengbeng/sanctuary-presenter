import "fake-indexeddb/auto";
import { afterEach, expect, it } from "vitest";
import { id, newContent, makeItem, now, type ServiceOrder } from "./model";
import { sourceStatus, refreshedItem, sameContent } from "./sourceRefresh";
import { PresenterDatabase } from "./repository";
import { exportBackup, readBackup, restoreBackup } from "./backup";
const databases: PresenterDatabase[] = [];
function repo() {
  const db = new PresenterDatabase(`refresh-${id()}`);
  databases.push(db);
  return db;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});
async function fixture() {
  const db = repo(),
    source = newContent("song");
  source.title = "Source";
  source.sections[0].pages[0].text = "Original";
  await db.saveContent(source);
  const item = makeItem(source);
  item.title = "Service name";
  item.notes = "Private notes";
  item.overrides = { fontSize: 88 };
  item.typographyMode = "custom";
  item.backgroundDesign = {
    mode: "color",
    color: "#123456",
    fit: "cover",
    darken: 10,
    loop: false,
  };
  item.snapshot.sections[0].pages[0].text = "Local correction";
  const order: ServiceOrder = {
    id: id(),
    title: "Sunday",
    date: "",
    items: [item, makeItem(source)],
    createdAt: now(),
    updatedAt: now(),
  };
  await db.saveService(order);
  return { db, source, order, item };
}
it("distinguishes known, unknown and missing baselines from local-copy edits", async () => {
  const { source, item } = await fixture();
  expect(sourceStatus(item, source)).toContain("matches the original");
  const legacy = structuredClone(item);
  delete legacy.snapshot.revision;
  delete legacy.snapshot.revisionToken;
  expect(sourceStatus(legacy, source)).toContain("unknown");
  expect(sourceStatus(item)).toContain("remains usable");
  expect(sameContent(item.snapshot, source)).toBe(false);
});
it("whole-copy refresh retains service identity, name, notes, appearance and other copies", async () => {
  const { db, source, order, item } = await fixture(),
    before = structuredClone(order),
    sourceBefore = structuredClone(source);
  source.sections[0].pages[0].text = "Updated words";
  source.sections[0].pages[0].secondary = "新詞";
  source.sections[0].pages[0].style.fontSize = 50;
  source.arrangements[0].auto = false;
  source.arrangements[0].sectionIds.push(source.sections[0].id);
  await db.saveContent(source);
  expect(sourceStatus(item, source)).toContain("differs from the original");
  const saved = await db.refreshServiceItem(
    order,
    item.id,
    source,
    source.arrangements[0].id,
  );
  const { snapshot, sectionOrder, ...retained } = saved.items[0],
    {
      snapshot: oldSnapshot,
      sectionOrder: oldOrder,
      ...originalRetained
    } = before.items[0];
  void oldSnapshot;
  void oldOrder;
  expect(retained).toEqual(originalRetained);
  expect(snapshot).toEqual(source);
  expect(sectionOrder).toHaveLength(2);
  expect(saved.items[1]).toEqual(before.items[1]);
  expect((await db.content.get(source.id))?.sections[0].pages[0].text).toBe(
    "Updated words",
  );
  expect(sourceBefore.sections[0].pages[0].text).toBe("Original");
  expect(sourceStatus(saved.items[0], source)).toContain(
    "matches the original",
  );
});
it("requires an explicit valid song order, accepts flat slides and rejects a different source", () => {
  const song = newContent("song"),
    item = makeItem(song);
  expect(() => refreshedItem(item, song)).toThrow(
    "Choose a Library song order",
  );
  expect(() => refreshedItem(item, song, "missing")).toThrow("Choose");
  expect(() => refreshedItem(item, newContent("song"))).toThrow(
    "not the source",
  );
  const slides = newContent("slides");
  expect(refreshedItem(makeItem(slides), slides).sectionOrder).toEqual([]);
});
it("stale source/service comparisons roll back and preserve the supplied working copy", async () => {
  const { db, source, order, item } = await fixture(),
    staleSource = structuredClone(source),
    original = structuredClone(order);
  source.sections[0].pages[0].text = "Another window";
  await db.saveContent(source);
  await expect(
    db.refreshServiceItem(
      order,
      item.id,
      staleSource,
      source.arrangements[0].id,
    ),
  ).rejects.toThrow("changed after comparison");
  expect(order).toEqual(original);
  const other = structuredClone(order);
  other.title = "Changed service";
  await db.saveService(other);
  await expect(
    db.refreshServiceItem(order, item.id, source, source.arrangements[0].id),
  ).rejects.toThrow("changed in another window");
  expect(order).toEqual(original);
  expect(
    (await db.services.get(order.id))?.items[0].snapshot.sections[0].pages[0]
      .text,
  ).toBe("Local correction");
});
it("deleted or missing-media sources cannot replace a service copy", async () => {
  const { db, source, order, item } = await fixture(),
    before = structuredClone(order);
  const mediaId = id();
  source.sections[0].pages[0].mediaId = mediaId;
  await db.media.add({
    id: mediaId,
    title: "Image",
    kind: "image",
    mimeType: "image/png",
    size: 1,
    hash: "h",
    blob: new Blob(["x"]),
    createdAt: now(),
  });
  await db.saveContent(source);
  await db.media.delete(mediaId);
  await expect(
    db.refreshServiceItem(order, item.id, source, source.arrangements[0].id),
  ).rejects.toThrow("media is missing");
  expect(order).toEqual(before);
  await db.deleteContent(source);
  await expect(
    db.refreshServiceItem(order, item.id, source, source.arrangements[0].id),
  ).rejects.toThrow("Source no longer");
  expect(order).toEqual(before);
});
it("backup/restore preserves known and unknown snapshot provenance without inventing a baseline", async () => {
  const { db, source, order } = await fixture();
  delete order.items[1].snapshot.revision;
  delete order.items[1].snapshot.revisionToken;
  await db.saveService(order);
  const token = order.items[0].snapshot.revisionToken,
    backup = await readBackup(await exportBackup(db));
  await restoreBackup(backup, db);
  const restored = (await db.services.get(order.id))!,
    restoredSource = (await db.content.get(source.id))!;
  expect(restored.items[0].snapshot.revisionToken).toBe(token);
  expect(sourceStatus(restored.items[1], restoredSource)).toContain("unknown");
  expect(sourceStatus(restored.items[0], restoredSource)).toContain(
    "differs from the original",
  );
});
