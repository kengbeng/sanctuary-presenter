import { expect, it } from "vitest";
import { newContent } from "./model";
import {
  findContent,
  indexContent,
  matchExcerpt,
  normalizeSearch,
  similarSongs,
} from "./search";
it("finds punctuation, accents, whitespace, reordered terms, bilingual lyrics and text song numbers without changing records", () => {
  const song = newContent("song");
  song.title = "Grâce éternelle";
  song.indexNumber = "H-007";
  song.sections[0].pages[0].text = "Holy, holy\nLove never fails";
  song.sections[0].pages[0].secondary = "祢的恩典永遠長存";
  const before = structuredClone(song),
    index = indexContent([song]);
  for (const query of [
    "GRACE",
    "holy   holy",
    "fails love",
    "h 007",
    "恩典",
    "  éternelle\nGRACE ",
  ])
    expect(findContent(index, query)).toEqual([song]);
  expect(findContent(index, "fails unknown")).toHaveLength(0);
  expect(matchExcerpt(song, "恩典")).toBe("祢的恩典永遠長存");
  expect(matchExcerpt(song, "holy")).toBe("Holy, holy");
  expect(song).toEqual(before);
  expect(normalizeSearch("ＡＢＣ—123")).toBe("abc 123");
});
it("filters either language channel and whole tags while preserving multiword tags", () => {
  const song = newContent("song");
  song.primaryLanguage = "English";
  song.secondaryLanguage = "中文";
  song.tags = "Holy Spirit, Advent; Prayer";
  const index = indexContent([song]);
  expect(
    findContent(index, "", {
      language: "中文",
      tag: "holy spirit",
      kind: "song",
    }),
  ).toEqual([song]);
  expect(findContent(index, "", { tag: "Holy" })).toHaveLength(0);
  expect(findContent(index, "", { language: "French" })).toHaveLength(0);
  expect(findContent(index, "", { kind: "slides" })).toHaveLength(0);
});
it("suggests independent possible duplicates without including the edited record", () => {
  const song = newContent("song");
  song.title = "Grace";
  song.sections[0].pages[0].text = "Amazing grace how sweet the sound";
  const copy = structuredClone(song);
  copy.id = "another";
  copy.title = "Different title";
  expect(similarSongs(indexContent([song, copy]), song)).toEqual([copy]);
  expect(similarSongs(indexContent([song]), song)).toHaveLength(0);
});
it("searches a synthetic 5000-song library without a persisted index", () => {
  const records = Array.from({ length: 5000 }, (_, i) => {
    const song = newContent("song");
    song.title = `Song ${i}`;
    song.indexNumber = `H-${i}`;
    song.sections[0].pages[0].text = `Grace and peace unique${i} words`;
    return song;
  });
  const start = performance.now(),
    index = indexContent(records),
    indexed = performance.now();
  const matches = findContent(index, "unique4999 peace");
  console.info(
    `5000-song index: ${(indexed - start).toFixed(1)}ms; query: ${(performance.now() - indexed).toFixed(1)}ms`,
  );
  expect(matches.map((song) => song.indexNumber)).toEqual(["H-4999"]);
});
it("keeps the matching original words in long Unicode excerpts", () => {
  const song = newContent("song");
  song.sections[0].pages[0].text =
    "é\u0301 ".repeat(180) + "Unfailing love, forever.";
  const excerpt = matchExcerpt(song, "unfailing");
  expect(excerpt).toContain("Unfailing love, forever.");
  expect(excerpt.startsWith("…")).toBe(true);
});
