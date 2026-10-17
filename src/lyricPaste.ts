import { id, newPage, syncAuto, type Content, type Section } from "./model";
export interface PastedSection {
  label: string;
  pages: { text: string; secondary: string }[];
}
function parseChannel(value: string) {
  if (value.length > 1_000_000)
    throw Error("Paste up to one million characters at a time.");
  const sections: { label: string; pages: string[] }[] = [];
  let current: { label: string; pages: string[] } | undefined,
    lines: string[] = [];
  const finish = () => {
    if (current) {
      const text = lines.join("\n");
      if (text.length > 100000)
        throw Error("A slide is too long. Insert a slide break (---).");
      current.pages.push(text);
      lines = [];
    }
  };
  for (const line of value.replace(/\r\n?/g, "\n").split("\n")) {
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      finish();
      const label = header[1].trim();
      if (!label) throw Error("Give every section a name inside brackets.");
      if (sections.some((section) => section.label === label))
        throw Error(
          `Use a unique section label for ${label}. Add repeats in Song order after pasting.`,
        );
      current = { label, pages: [] };
      sections.push(current);
    } else if (line === "---") {
      if (!current)
        throw Error("Start with a section label such as [Verse 1].");
      finish();
    } else if (current) lines.push(line);
    else if (line.trim())
      throw Error(
        "Start with a section label such as [Verse 1]. Lyrics are not split automatically.",
      );
  }
  finish();
  if (!sections.length)
    throw Error("Add a section label such as [Verse 1], followed by lyrics.");
  return sections;
}
export function parseLyrics(primary: string, secondary = ""): PastedSection[] {
  const first = parseChannel(primary),
    second = secondary.trim() ? parseChannel(secondary) : undefined;
  if (
    second &&
    (second.length !== first.length ||
      second.some(
        (section, index) =>
          section.label !== first[index].label ||
          section.pages.length !== first[index].pages.length,
      ))
  )
    throw Error(
      "Both languages need the same section labels and slide breaks. Edit the staging text to align them.",
    );
  return first.map((section, index) => ({
    label: section.label,
    pages: section.pages.map((text, pageIndex) => {
      const other = second?.[index].pages[pageIndex] ?? "";
      if (!text.trim() && !other.trim())
        throw Error(
          `Empty slide in ${section.label}. Remove the extra break or add words.`,
        );
      return { text, secondary: other };
    }),
  }));
}
export function replacesStarter(content: Content) {
  const section = content.sections[0],
    page = section?.pages[0];
  if (
    content.kind !== "song" ||
    content.sections.length !== 1 ||
    section.pages.length !== 1 ||
    !["V1", "Verse 1"].includes(section.label) ||
    content.arrangements.length !== 1 ||
    !content.arrangements[0].auto
  )
    return false;
  const { id: originalId, ...body } = page,
    { id: emptyId, ...empty } = newPage();
  void originalId;
  void emptyId;
  return JSON.stringify(body) === JSON.stringify(empty);
}
export function pasteLabels(
  content: Content,
  parsed: PastedSection[],
): PastedSection[] {
  const labels = new Set(
    replacesStarter(content)
      ? []
      : content.sections.map((section) => section.label),
  );
  return parsed.map((section) => {
    let label = section.label,
      n = 1;
    while (labels.has(label)) {
      label = `${section.label} (pasted${n === 1 ? "" : ` ${n}`})`;
      n++;
    }
    labels.add(label);
    return { ...section, label };
  });
}
export function applyPastedLyrics(
  content: Content,
  parsed: PastedSection[],
): Section[] {
  if (content.kind !== "song")
    throw Error("Paste lyrics is available for songs.");
  if (!parsed.length) throw Error("Preview the sections before applying.");
  const replace = replacesStarter(content),
    sections = pasteLabels(content, parsed).map((section) => ({
      id: id(),
      label: section.label,
      pages: section.pages.map((page) => ({ ...newPage(), ...page })),
    }));
  if (replace) content.sections = sections;
  else content.sections.push(...sections);
  syncAuto(content);
  return sections;
}
