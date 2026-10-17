import type { Content } from "./model";
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
export function contentTags(content: Content): string[] {
  return content.tags
    .split(/[,;\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}
export function lyricLines(content: Content): string[] {
  const pages =
    content.kind === "song"
      ? content.sections.flatMap((section) => section.pages)
      : content.pages;
  return pages
    .flatMap((page) => [page.text, page.secondary])
    .flatMap((text) => text.split(/\r?\n/))
    .filter((text) => text.trim());
}
export interface SearchEntry {
  content: Content;
  text: string;
  title: string;
  firstLine: string;
  languages: string[];
  tags: string[];
}
export function indexContent(contents: Content[]): SearchEntry[] {
  return contents.map((content) => ({
    content,
    title: normalizeSearch(content.title),
    firstLine: normalizeSearch(lyricLines(content)[0] ?? ""),
    text: normalizeSearch(
      [
        content.title,
        content.indexNumber,
        content.author,
        content.tags,
        ...lyricLines(content),
      ].join(" "),
    ),
    languages: [content.primaryLanguage, content.secondaryLanguage]
      .filter(Boolean)
      .map(normalizeSearch),
    tags: contentTags(content).map(normalizeSearch),
  }));
}
export function findContent(
  index: SearchEntry[],
  query: string,
  filters: { kind?: Content["kind"]; language?: string; tag?: string } = {},
): Content[] {
  const terms = normalizeSearch(query).split(" ").filter(Boolean),
    language = normalizeSearch(filters.language ?? ""),
    tag = normalizeSearch(filters.tag ?? "");
  return index
    .filter(
      (entry) =>
        (!filters.kind || entry.content.kind === filters.kind) &&
        (!language || entry.languages.includes(language)) &&
        (!tag || entry.tags.includes(tag)) &&
        terms.every((term) => entry.text.includes(term)),
    )
    .map((entry) => entry.content);
}
export function matchExcerpt(content: Content, query: string): string {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  if (!terms.length) return "";
  const line = lyricLines(content).find((line) =>
    terms.some((term) => normalizeSearch(line).includes(term)),
  );
  if (!line) return "";
  const normalized = normalizeSearch(line),
    position = Math.min(
      ...terms
        .map((term) => normalized.indexOf(term))
        .filter((index) => index >= 0),
    );
  // Preserve original words, including punctuation and both language channels.
  let originalPosition = position;
  if (line.length > 150) {
    // Map normalized characters back to original UTF-16 positions for excerpts.
    const offsets: number[] = [];
    let offset = 0,
      space = true;
    for (const character of line) {
      for (const folded of character
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()) {
        if (/[\p{L}\p{N}]/u.test(folded)) {
          for (let n = 0; n < folded.length; n++) offsets.push(offset);
          space = false;
        } else if (!space) {
          offsets.push(offset);
          space = true;
        }
      }
      offset += character.length;
    }
    originalPosition = offsets[position] ?? 0;
  }
  const start = line.length > 150 ? Math.max(0, originalPosition - 35) : 0;
  return (
    (start ? "…" : "") +
    line.slice(start, start + 150) +
    (line.length > start + 150 ? "…" : "")
  );
}
export function similarSongs(index: SearchEntry[], draft: Content): Content[] {
  const title = normalizeSearch(draft.title),
    first = normalizeSearch(lyricLines(draft)[0] ?? "");
  return index
    .filter(
      (entry) =>
        entry.content.id !== draft.id &&
        entry.content.kind === draft.kind &&
        ((title && title === entry.title) ||
          (first.length >= 12 && first === entry.firstLine)),
    )
    .slice(0, 3)
    .map((entry) => entry.content);
}
