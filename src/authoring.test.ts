import { expect, it } from "vitest";
import { id, newContent, newPage, makeItem, validateContent } from "./model";
import {
  duplicateSection,
  duplicateSlide,
  moveSection,
  moveSlide,
  transferSlide,
} from "./authoring";
it("section copies keep both text channels and designs with new identities and independent edits", () => {
  const song = newContent("song"),
    section = song.sections[0],
    page = section.pages[0];
  page.text = "Verse\nLine two";
  page.secondary = "第一段";
  page.mediaId = id();
  page.style.fontSize = 78;
  const serviceCopy = makeItem(song),
    original = structuredClone(song);
  const selected = duplicateSection(song, 0)!;
  expect(selected.sectionIndex).toBe(1);
  expect(song.sections[1].id).not.toBe(section.id);
  expect(song.sections[1].pages[0].id).not.toBe(page.id);
  expect(song.sections[1].pages[0].text).toBe(page.text);
  expect(song.sections[1].pages[0].secondary).toBe(page.secondary);
  expect(song.sections[1].pages[0].mediaId).toBe(page.mediaId);
  song.sections[1].pages[0].style.fontSize = 40;
  song.sections[1].pages[0].text = "Changed copy";
  expect(page.style.fontSize).toBe(78);
  expect(page.text).toBe("Verse\nLine two");
  expect(serviceCopy.snapshot).toEqual(original);
  duplicateSection(song, 0);
  expect(new Set(song.sections.map((section) => section.label)).size).toBe(3);
  validateContent(song);
});
it("custom repeats retain exact order while automatic arrangements follow structural changes", () => {
  const song = newContent("song");
  song.sections.push({ id: id(), label: "Chorus", pages: [newPage()] });
  song.arrangements[0].sectionIds = song.sections.map((section) => section.id);
  const custom = {
    ...structuredClone(song.arrangements[0]),
    id: id(),
    isDefault: false,
    auto: false,
    sectionIds: [song.sections[1].id, song.sections[0].id, song.sections[1].id],
  };
  song.arrangements.push(custom);
  const sequence = [...custom.sectionIds];
  duplicateSection(song, 1);
  moveSection(song, 2, -1);
  expect(custom.sectionIds).toEqual(sequence);
  expect(song.arrangements[0].sectionIds).toEqual(
    song.sections.map((section) => section.id),
  );
  validateContent(song);
});
it("slide duplication, movement and transfer preserve identity rules and cannot empty a section", () => {
  const song = newContent("song"),
    first = song.sections[0].pages[0];
  first.text = "Original";
  first.secondary = "原文";
  const selected = duplicateSlide(song, 0, 0)!;
  expect(selected.pageId).not.toBe(first.id);
  expect(song.sections[0].pages[1].secondary).toBe("原文");
  expect(moveSlide(song, 0, 1, -1)?.pageId).toBe(selected.pageId);
  const second = { id: id(), label: "Bridge", pages: [newPage()] };
  song.sections.push(second);
  song.arrangements[0].sectionIds = song.sections.map((section) => section.id);
  const moved = transferSlide(song, 0, 0, 1)!;
  expect(moved.pageId).toBe(selected.pageId);
  expect(second.pages[1].id).toBe(selected.pageId);
  const before = structuredClone(song);
  expect(transferSlide(song, 0, 0, 1)).toBeUndefined();
  expect(moveSlide(song, 0, 0, -1)).toBeUndefined();
  expect(song).toEqual(before);
  validateContent(song);
});
it("slide sets duplicate both channels and designs without introducing song sections", () => {
  const content = newContent("slides");
  content.pages[0].secondary = "副文本";
  duplicateSlide(content, 0, 0);
  moveSlide(content, 0, 1, -1);
  expect(content.pages[0].secondary).toBe("副文本");
  expect(content.sections).toEqual([]);
  expect(content.pages[0].id).not.toBe(content.pages[1].id);
  validateContent(content);
});
