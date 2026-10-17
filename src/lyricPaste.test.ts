import { expect, it } from "vitest";
import { newContent, validateContent } from "./model";
import {
  parseLyrics,
  applyPastedLyrics,
  pasteLabels,
  replacesStarter,
} from "./lyricPaste";
it("uses explicit sections and slide breaks, preserving blank lines, punctuation and bilingual words", () => {
  const primary =
      "[Verse 1]\nFirst line\n\nThird ‘line’\n---\nNext slide\n[Chorus]\nSing!\n",
    secondary = "[Verse 1]\n第一行\n\n第三行\n---\n下一頁\n[Chorus]\n歌唱！\n";
  const parsed = parseLyrics(primary, secondary);
  expect(parsed.map((section) => section.label)).toEqual(["Verse 1", "Chorus"]);
  expect(parsed[0].pages).toEqual([
    { text: "First line\n\nThird ‘line’", secondary: "第一行\n\n第三行" },
    { text: "Next slide", secondary: "下一頁" },
  ]);
  expect(parsed[1].pages[0]).toEqual({
    text: "Sing!\n",
    secondary: "歌唱！\n",
  });
});
it("rejects guessed structure, empty public slides and misaligned language channels", () => {
  for (const primary of [
    "Verse words without a marker",
    "[Verse 1]\n---\nWords",
    "[Verse 1]\nWords\n[Verse 1]\nRepeat",
  ])
    expect(() => parseLyrics(primary)).toThrow();
  expect(() =>
    parseLyrics("[Verse]\nWords\n---\nMore", "[Verse]\n文字"),
  ).toThrow("same section labels");
  expect(() => parseLyrics("[Verse]\nWords", "[Chorus]\n文字")).toThrow(
    "same section labels",
  );
  expect(
    parseLyrics("[Verse]\n", "[Verse]\n只有中文")[0].pages[0].secondary,
  ).toBe("只有中文");
});
it("replaces only an untouched empty starter, with fresh identities and automatic order", () => {
  const content = newContent("song"),
    old = content.sections[0].id,
    parsed = parseLyrics("[Verse 1]\nVerse words\n[Chorus]\nChorus words");
  expect(replacesStarter(content)).toBe(true);
  const sections = applyPastedLyrics(content, parsed);
  expect(content.sections).toHaveLength(2);
  expect(content.sections[0].id).not.toBe(old);
  expect(content.arrangements[0].sectionIds).toEqual(
    sections.map((section) => section.id),
  );
  validateContent(content);
});
it("appends without overwriting existing words, designs, IDs or custom repeated order", () => {
  const content = newContent("song");
  content.sections[0].label = "Verse 1";
  content.sections[0].pages[0].text = "Keep exactly";
  content.sections[0].pages[0].secondary = "保留";
  content.arrangements[0].auto = false;
  content.arrangements[0].sectionIds.push(content.sections[0].id);
  const original = structuredClone(content),
    parsed = parseLyrics("[Verse 1]\nNew words");
  const preview = pasteLabels(content, parsed);
  expect(preview[0].label).toBe("Verse 1 (pasted)");
  expect(content).toEqual(original);
  applyPastedLyrics(content, parsed);
  expect(content.sections[0]).toEqual(original.sections[0]);
  expect(content.arrangements).toEqual(original.arrangements);
  expect(content.sections[1].label).toBe(preview[0].label);
  validateContent(content);
});
it("keeps customized empty starter designs and rejects overlong slides before Apply", () => {
  const content = newContent("song");
  content.sections[0].pages[0].style.fontSize = 88;
  expect(replacesStarter(content)).toBe(false);
  applyPastedLyrics(content, parseLyrics("[Verse]\nWords"));
  expect(content.sections[0].pages[0].style.fontSize).toBe(88);
  expect(content.sections).toHaveLength(2);
  expect(() => parseLyrics("[Verse]\n" + "a".repeat(100001))).toThrow(
    "too long",
  );
});
