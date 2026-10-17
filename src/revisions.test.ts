import "fake-indexeddb/auto";
import { afterEach, expect, it } from "vitest";
import Dexie from "dexie";
import { PresenterDatabase } from "./repository";
import { newContent, id, now, type ServiceOrder } from "./model";
import { exportBackup, readBackup, restoreBackup } from "./backup";
const databases: PresenterDatabase[] = [];
function repo(name = `revisions-${id()}`) {
  const r = new PresenterDatabase(name);
  databases.push(r);
  return r;
}
afterEach(async () => {
  for (const r of databases.splice(0)) {
    r.close();
    await Dexie.delete(r.name);
  }
});
function service(): ServiceOrder {
  return {
    id: id(),
    title: "Sunday",
    date: "",
    items: [],
    createdAt: now(),
    updatedAt: now(),
  };
}
it("rejects competing clients' stale updates and deletes while preserving their drafts", async () => {
  const a = repo(),
    b = repo(a.name),
    song = newContent("song");
  song.sections[0].pages[0].text = "Original";
  await a.saveContent(song);
  const draftA = (await a.content.get(song.id))!,
    draftB = (await b.content.get(song.id))!;
  draftA.sections[0].pages[0].text = "New words";
  await a.saveContent(draftA);
  draftB.sections[0].pages[0].text = "Other draft";
  await expect(b.saveContent(draftB)).rejects.toThrow(
    "changed in another window",
  );
  await expect(b.deleteContent(draftB)).rejects.toThrow(
    "changed in another window",
  );
  expect(draftB.sections[0].pages[0].text).toBe("Other draft");
  expect((await b.content.get(song.id))?.sections[0].pages[0].text).toBe(
    "New words",
  );
  expect(draftA.revision).toBe(2);
});
it("stale service edits and deleted-record updates cannot overwrite or resurrect", async () => {
  const a = repo(),
    b = repo(a.name),
    order = service();
  await a.saveService(order);
  const stale = structuredClone(order);
  order.title = "Revised";
  await a.saveService(order);
  await expect(b.saveService(stale)).rejects.toThrow(
    "changed in another window",
  );
  await expect(b.deleteService(stale)).rejects.toThrow(
    "changed in another window",
  );
  await a.deleteService(order);
  await expect(b.saveService(order)).rejects.toThrow("deleted or replaced");
  expect(await a.services.count()).toBe(0);
});
it("restore invalidates even same-number old drafts without changing saved words", async () => {
  const r = repo(),
    song = newContent("song");
  song.sections[0].pages[0].text = "Keep exactly";
  await r.saveContent(song);
  const stale = structuredClone(song),
    backup = await readBackup(await exportBackup(r));
  expect(backup.manifest.version).toBe(5);
  await restoreBackup(backup, r);
  const restored = (await r.content.get(song.id))!;
  expect(restored.revision).toBe(stale.revision);
  expect(restored.revisionToken).not.toBe(stale.revisionToken);
  expect(restored.sections).toEqual(stale.sections);
  await expect(r.saveContent(stale)).rejects.toThrow("was restored");
  await expect(r.deleteContent(stale)).rejects.toThrow("was restored");
});
it("save-and-add commits both records once, with retry-stable item identity", async () => {
  const r = repo(),
    song = newContent("song"),
    order = service(),
    operation = id();
  song.sections[0].pages[0].text = "Words";
  await r.saveService(order);
  await r.saveSongAndAdd(song, order, operation);
  expect(order.items).toHaveLength(1);
  expect(order.items[0].id).toBe(operation);
  expect(order.items[0].snapshot).toEqual(song);
  const revision = order.revision;
  await r.saveSongAndAdd(song, order, operation);
  expect((await r.services.get(order.id))?.items).toHaveLength(1);
  expect(order.revision).toBe(revision);
  expect(await r.content.count()).toBe(1);
});
it("save-and-add rollback leaves neither orphaned content nor advanced input revisions", async () => {
  const r = repo(),
    song = newContent("song"),
    order = service();
  await r.saveService(order);
  const stale = structuredClone(order);
  order.title = "Other window";
  await r.saveService(order);
  const originalSong = structuredClone(song),
    originalOrder = structuredClone(stale);
  await expect(r.saveSongAndAdd(song, stale, id())).rejects.toThrow(
    "changed in another window",
  );
  expect(await r.content.get(song.id)).toBeUndefined();
  expect(song).toEqual(originalSong);
  expect(stale).toEqual(originalOrder);
  expect((await r.services.get(order.id))?.items).toHaveLength(0);
});
it("schema-2 migration adds tokens without rewriting service copies or song bodies", async () => {
  const name = `migration-${id()}`,
    legacy = new Dexie(name),
    song = newContent("song"),
    order = service();
  legacy.version(2).stores({
    content: "id,kind,title,updatedAt",
    media: "id,hash,title",
    services: "id,title,updatedAt",
    settings: "key",
    frames: "id,sessionId,createdAt",
    provenance: "id,createdAt",
  });
  await legacy.table("content").add(song);
  await legacy.table("services").add(order);
  legacy.close();
  const r = repo(name),
    saved = (await r.content.get(song.id))!,
    savedOrder = (await r.services.get(order.id))!;
  const { revision, revisionToken, ...body } = saved;
  expect(body).toEqual(song);
  expect(revision).toBe(1);
  expect(revisionToken).toBeTruthy();
  expect(savedOrder.items).toEqual(order.items);
  expect(savedOrder.createdAt).toBe(order.createdAt);
});
it("pins immutable render records and rejects a stale Apply atomically", async () => {
  const r = repo(),
    order = service(),
    song = newContent("song");
  song.sections[0].pages[0].text = "Live original";
  const { makeItem } = await import("./model");
  order.items.push(makeItem(song));
  order.items[0].notes = "Private cue";
  await r.saveService(order);
  const pinned = await r.pinServiceSnapshot(order, "live", true);
  const stale = structuredClone(order);
  order.items[0].snapshot.sections[0].pages[0].text = "New words";
  await r.saveService(order);
  await expect(
    r.pinServiceSnapshot(stale, "replacement", true, "live"),
  ).rejects.toThrow("changed during preparation");
  expect(await r.frames.where("sessionId").equals("replacement").count()).toBe(
    0,
  );
  expect((await r.frames.get(pinned[0]))?.page.text).toBe("Live original");
  expect(JSON.stringify((await r.frames.get(pinned[0]))?.page)).not.toContain(
    "Private cue",
  );
  await r.pinServiceSnapshot(order, "replacement", true, "live");
  expect(await r.frames.where("sessionId").equals("live").count()).toBe(0);
});
it("pins keep live media in use after source deletion and missing media cannot retire old pins", async () => {
  const r = repo(),
    order = service(),
    song = newContent("song");
  const { makeItem } = await import("./model");
  const asset = {
    id: id(),
    title: "Image",
    kind: "image" as const,
    mimeType: "image/png",
    size: 3,
    hash: "h",
    blob: new Blob(["abc"]),
    createdAt: now(),
  };
  await r.media.add(asset);
  song.sections[0].pages[0].mediaId = asset.id;
  order.items.push(makeItem(song));
  await r.saveService(order);
  await r.pinServiceSnapshot(order, "live", true);
  await r.deleteService(order);
  await expect(r.deleteMedia(asset.id)).rejects.toThrow(
    "Prepared output snapshot",
  );
  const broken = structuredClone(order);
  broken.items[0].snapshot.sections[0].pages[0].mediaId = id();
  await expect(
    r.pinServiceSnapshot(broken, "next", false, "live"),
  ).rejects.toThrow("media is missing");
  expect(await r.frames.where("sessionId").equals("live").count()).toBe(1);
  expect(await r.frames.where("sessionId").equals("next").count()).toBe(0);
});
it("pins media in omitted sections that remain available through quick jumps", async () => {
  const r = repo(),
    order = service(),
    song = newContent("song");
  const { makeItem, newPage } = await import("./model");
  const asset = {
    id: id(),
    title: "Bridge image",
    kind: "image" as const,
    mimeType: "image/png",
    size: 3,
    hash: "h",
    blob: new Blob(["abc"]),
    createdAt: now(),
  };
  await r.media.add(asset);
  const page = newPage();
  page.mediaId = asset.id;
  song.sections.push({ id: id(), label: "Bridge", pages: [page] });
  song.arrangements[0].auto = false;
  order.items.push(makeItem(song));
  await r.saveService(order);
  await r.pinServiceSnapshot(order, "live", true);
  await r.deleteService(order);
  await expect(r.deleteMedia(asset.id)).rejects.toThrow(
    "Prepared output snapshot",
  );
});
