import { expect, it } from "vitest";
import { id, makeItem, newContent, newPage, now, servicePages } from "./model";
import { presentationPath, sectionJump } from "./navigation";
function fixture() {
  const song = newContent("song");
  const verse = song.sections[0];
  const chorus = { id: id(), label: "Chorus", pages: [newPage(), newPage()] };
  const bridge = { id: id(), label: "Bridge", pages: [newPage(), newPage()] };
  song.sections.push(chorus, bridge);
  song.arrangements[0].auto = false;
  song.arrangements[0].sectionIds = [verse.id, chorus.id, verse.id, chorus.id];
  const order = {
    id: id(),
    title: "Sunday",
    date: "",
    items: [makeItem(song), makeItem(song)],
    createdAt: now(),
    updatedAt: now(),
  };
  return { order, verse, chorus, bridge };
}
it("jumps to the next repeated chorus and stays within its current occurrence", () => {
  const { order, chorus } = fixture(),
    pages = servicePages(order);
  expect(sectionJump(order, pages[3], chorus.id)?.index).toBe(4);
  expect(sectionJump(order, pages[5], chorus.id)?.index).toBe(4);
  expect(
    sectionJump(order, pages[0], chorus.id, undefined, order.items[1].id)
      ?.index,
  ).toBe(7);
});
it("temporary multi-page sections resume at the exact next arranged page without rewriting the service", () => {
  const { order, bridge } = fixture(),
    original = structuredClone(order),
    base = servicePages(order);
  const jump = sectionJump(order, base[1], bridge.id)!;
  const path = presentationPath(order, jump.extra);
  expect(jump.index).toBe(2);
  expect(path.slice(2, 4).map((p) => p.sourcePageId)).toEqual(
    bridge.pages.map((p) => p.id),
  );
  expect(path[4].id).toBe(base[2].id);
  expect(
    sectionJump(order, path[3], bridge.id, jump.extra)?.extra?.origin,
  ).toBe(1);
  expect(new Set(path.map((p) => p.id)).size).toBe(path.length);
  expect(order).toEqual(original);
});
