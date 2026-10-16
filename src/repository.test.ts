import "fake-indexeddb/auto";
import { afterEach, describe, it, expect } from "vitest";
import { PresenterDatabase } from "./repository";
import { newContent, makeItem, servicePages, id, now } from "./model";
import { exportBackup, readBackup, restoreBackup } from "./backup";
const databases: PresenterDatabase[] = [];
function repository() {
  const r = new PresenterDatabase("test-" + id());
  databases.push(r);
  return r;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((d) => d.delete()));
});
describe("local repository", () => {
  it("preserves repeated bilingual arrangements and detached service edits across reopen", async () => {
    const db = repository();
    const song = newContent("song");
    song.indexNumber = "H-007";
    song.sections[0].pages[0].text = "Primary";
    song.sections[0].pages[0].secondary = "第二行";
    song.arrangements[0].auto = false;
    song.arrangements[0].sectionIds = [
      song.sections[0].id,
      song.sections[0].id,
    ];
    await db.saveContent(song);
    const item = makeItem(song);
    item.notes = "private note";
    item.overrides.fontSize = 80;
    const service = {
      id: id(),
      title: "Service",
      date: "2026-10-16",
      items: [item],
      createdAt: now(),
      updatedAt: now(),
    };
    await db.saveService(service);
    song.sections[0].pages[0].text = "Changed source";
    await db.saveContent(song);
    db.close();
    await db.open();
    const saved = (await db.services.get(service.id))!;
    expect(servicePages(saved)).toHaveLength(2);
    expect(servicePages(saved)[0].text).toBe("Primary");
    expect(servicePages(saved)[0].secondary).toBe("第二行");
    expect(servicePages(saved)[0].style.fontSize).toBe(80);
    expect((await db.content.get(song.id))?.indexNumber).toBe("H-007");
  });
  it("rejects missing arrangement references and protects referenced media", async () => {
    const db = repository();
    const c = newContent("song");
    c.arrangements[0].sectionIds = ["missing"];
    await expect(db.saveContent(c)).rejects.toThrow("section reference");
    const asset = {
      id: id(),
      title: "image",
      kind: "image" as const,
      mimeType: "image/png",
      size: 3,
      hash: "h",
      blob: new Blob(["abc"]),
      createdAt: now(),
    };
    await db.media.add(asset);
    const slides = newContent("slides");
    slides.pages[0].mediaId = asset.id;
    await db.saveContent(slides);
    await expect(db.deleteMedia(asset.id)).rejects.toThrow("in use");
    await db.content.delete(slides.id);
    await db.deleteMedia(asset.id);
    expect(await db.media.count()).toBe(0);
  });
  it("backs up and restores complete data transactionally and rejects corrupt input", async () => {
    const db = repository(),
      target = repository();
    const content = newContent("slides");
    content.pages[0].text = "<script>plain text</script>";
    await db.saveContent(content);
    const zip = await exportBackup(db);
    const prepared = await readBackup(zip);
    await restoreBackup(prepared, target);
    expect((await target.content.get(content.id))?.pages[0].text).toBe(
      "<script>plain text</script>",
    );
    await expect(readBackup(new Blob(["not zip"]))).rejects.toThrow();
    expect(await target.content.count()).toBe(1);
  });
  it("render snapshots omit all operator notes and source metadata", async () => {
    const db = repository();
    const c = newContent("slides");
    const item = makeItem(c);
    item.notes = "PRIVATE";
    const order = {
      id: id(),
      title: "s",
      date: "",
      items: [item],
      createdAt: now(),
      updatedAt: now(),
    };
    const frameId = await db.prepareFrame(servicePages(order)[0]);
    const stored = JSON.stringify(await db.frames.get(frameId));
    expect(stored).not.toContain("PRIVATE");
    expect(stored).not.toContain("sourceId");
    expect(stored).not.toContain("itemTitle");
  });
});

it("backup media blobs and hashes survive a clean restore", async () => {
  const source = repository(),
    target = repository();
  const bytes = new TextEncoder().encode("test image bytes");
  const { sha256 } = await import("./repository");
  const hash = await sha256(bytes.buffer);
  const asset = {
    id: id(),
    title: "Test image",
    kind: "image" as const,
    mimeType: "image/png",
    size: bytes.byteLength,
    hash,
    blob: new Blob([bytes]),
    createdAt: now(),
  };
  await source.media.add(asset);
  const content = newContent("slides");
  content.pages[0].mediaId = asset.id;
  await source.saveContent(content);
  const prepared = await readBackup(await exportBackup(source));
  await restoreBackup(prepared, target);
  expect(await (await target.media.get(asset.id))?.blob.text()).toBe(
    "test image bytes",
  );
  expect((await target.content.get(content.id))?.pages[0].mediaId).toBe(
    asset.id,
  );
});
it("restore validation rejects traversal, tampering and duplicate identifiers before writing", async () => {
  const JSZip = (await import("jszip")).default;
  const repo = repository();
  const content = newContent("slides");
  await repo.saveContent(content);
  const original = await exportBackup(repo);
  const zip = await JSZip.loadAsync(await original.arrayBuffer());
  zip.file("data.json", "{}");
  await expect(
    readBackup(await zip.generateAsync({ type: "blob" })),
  ).rejects.toThrow("checksum");
  const traversal = new JSZip();
  traversal.file("../data.json", "{}");
  await expect(
    readBackup(await traversal.generateAsync({ type: "blob" })),
  ).rejects.toThrow("unsafe");
  const clean = await JSZip.loadAsync(await original.arrayBuffer());
  const data = JSON.parse(await clean.file("data.json")!.async("string"));
  data.content.push(data.content[0]);
  const payload = new TextEncoder().encode(JSON.stringify(data));
  clean.file("data.json", payload);
  const manifest = JSON.parse(
    await clean.file("manifest.json")!.async("string"),
  );
  const { sha256 } = await import("./repository");
  manifest.files["data.json"] = await sha256(payload.buffer);
  manifest.counts.content = 2;
  clean.file("manifest.json", JSON.stringify(manifest));
  await expect(
    readBackup(await clean.generateAsync({ type: "blob" })),
  ).rejects.toThrow("Duplicate");
  expect(await repo.content.count()).toBe(1);
});
it("failed database replacement rolls back every cleared table", async () => {
  const source = repository(),
    target = repository();
  const existing = newContent("song");
  await target.saveContent(existing);
  const imported = newContent("slides");
  await source.saveContent(imported);
  const prepared = await readBackup(await exportBackup(source));
  prepared.data.content.push(structuredClone(prepared.data.content[0]));
  await expect(restoreBackup(prepared, target)).rejects.toThrow();
  expect(await target.content.get(existing.id)).toBeDefined();
  expect(await target.content.count()).toBe(1);
});

it("scoped background and profile backups round-trip and protect inherited media", async () => {
  const { defaultBackground, outputProfiles } = await import("./model");
  const db = repository(),
    target = repository();
  const bytes = new TextEncoder().encode("background");
  const { sha256 } = await import("./repository");
  const asset = {
    id: id(),
    title: "poster",
    kind: "image" as const,
    mimeType: "image/png",
    blob: new Blob([bytes]),
    size: bytes.length,
    hash: await sha256(bytes.buffer),
    createdAt: now(),
  };
  await db.media.put(asset);
  const c = newContent("slides");
  const service = {
    id: id(),
    title: "Background service",
    date: "",
    items: [makeItem(c)],
    createdAt: now(),
    updatedAt: now(),
    profile: { ...outputProfiles[1], name: "Custom", horizontalMargin: 12 },
    backgroundDesign: {
      ...defaultBackground,
      mode: "image" as const,
      mediaId: asset.id,
    },
  };
  await db.saveService(service);
  await expect(db.deleteMedia(asset.id)).rejects.toThrow("in use");
  const backup = await readBackup(await exportBackup(db));
  expect(backup.manifest.version).toBe(4);
  await restoreBackup(backup, target);
  expect(
    (await target.services.get(service.id))?.profile?.horizontalMargin,
  ).toBe(12);
  expect(
    servicePages((await target.services.get(service.id))!)[0].backgroundDesign
      ?.mediaId,
  ).toBe(asset.id);
});
it("legacy version-1 backup is accepted without changing existing style values", async () => {
  const repo = repository();
  const c = newContent("slides");
  delete c.pages[0].typographyMode;
  c.pages[0].style.fontSize = 55;
  await repo.saveContent(c);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(
    await (await exportBackup(repo)).arrayBuffer(),
  );
  const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
  manifest.version = 1;
  zip.file("manifest.json", JSON.stringify(manifest));
  const prepared = await readBackup(await zip.generateAsync({ type: "blob" }));
  expect(prepared.data.content[0].pages[0].style.fontSize).toBe(55);
  expect(prepared.data.content[0].pages[0].typographyMode).toBeUndefined();
});

it("adds provenance storage without rewriting version-1 library records", async () => {
  const Dexie = (await import("dexie")).default;
  const name = "upgrade-" + id();
  const legacy = new Dexie(name);
  legacy.version(1).stores({
    content: "id,kind,title,updatedAt",
    media: "id,hash,title",
    services: "id,title,updatedAt",
    settings: "key",
    frames: "id,sessionId,createdAt",
  });
  const original = newContent("song");
  await legacy.table("content").add(original);
  legacy.close();
  const upgraded = new PresenterDatabase(name);
  databases.push(upgraded);
  expect(await upgraded.content.get(original.id)).toEqual(original);
  expect(await upgraded.provenance.count()).toBe(0);
});

it("preserves conversion provenance across backup replacement and rejects malformed reports", async () => {
  const source = repository(),
    target = repository();
  const record = {
    id: "conversion",
    createdAt: now(),
    sourceName: "synthetic.splibrary",
    sourceHash: "a".repeat(64),
    report: ["Synthetic conversion"],
    originalJson: '{"unmapped":"保留"}',
  };
  await source.provenance.add(record);
  await target.provenance.add({ ...record, id: "obsolete" });
  const prepared = await readBackup(await exportBackup(source));
  await restoreBackup(prepared, target);
  expect(await target.provenance.toArray()).toEqual([record]);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(
    await (await exportBackup(source)).arrayBuffer(),
  );
  const payload = JSON.parse(await zip.file("data.json")!.async("string"));
  payload.provenance[0].report = [123];
  const data = JSON.stringify(payload);
  const { sha256 } = await import("./repository");
  const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
  manifest.files["data.json"] = await sha256(
    new TextEncoder().encode(data).buffer,
  );
  zip.file("data.json", data);
  zip.file("manifest.json", JSON.stringify(manifest));
  await expect(
    readBackup(await zip.generateAsync({ type: "blob" })),
  ).rejects.toThrow("provenance");
  expect(await target.provenance.toArray()).toEqual([record]);
});

it("version-2 backups without provenance remain restorable", async () => {
  const source = repository();
  await source.saveContent(newContent("slides"));
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(
    await (await exportBackup(source)).arrayBuffer(),
  );
  const payload = JSON.parse(await zip.file("data.json")!.async("string"));
  delete payload.provenance;
  const data = JSON.stringify(payload);
  const { sha256 } = await import("./repository");
  const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
  manifest.version = 2;
  manifest.files["data.json"] = await sha256(
    new TextEncoder().encode(data).buffer,
  );
  zip.file("data.json", data);
  zip.file("manifest.json", JSON.stringify(manifest));
  const prepared = await readBackup(await zip.generateAsync({ type: "blob" }));
  expect(prepared.data.provenance).toEqual([]);
  expect(prepared.data.content).toHaveLength(1);
});

it("backs up section flags and language selection and includes selection in notes-free frames", async () => {
  const repo = repository(),
    target = repository();
  const c = newContent("slides");
  c.pages[0].text = "Retained primary";
  c.pages[0].secondary = "只显示第二语言";
  c.pages[0].languageMode = "secondary";
  const item = makeItem(c),
    section = makeItem(c);
  section.nonPresenting = true;
  section.notes = "PRIVATE SECTION NOTE";
  item.notes = "PRIVATE NOTE";
  const service = {
    id: id(),
    title: "Converted service",
    date: "2026-10-16",
    items: [section, item],
    createdAt: now(),
    updatedAt: now(),
  };
  await repo.saveService(service);
  const prepared = await readBackup(await exportBackup(repo));
  await restoreBackup(prepared, target);
  expect((await target.services.get(service.id))?.items[0].nonPresenting).toBe(
    true,
  );
  const pages = servicePages((await target.services.get(service.id))!);
  expect(pages).toHaveLength(1);
  const key = await target.prepareFrame(pages[0]);
  const frame = await target.frames.get(key);
  expect(frame?.page.languageMode).toBe("secondary");
  expect(JSON.stringify(frame)).not.toContain("PRIVATE");
});
