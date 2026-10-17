import { id, syncAuto, type Content } from "./model";
export interface AuthoringSelection {
  sectionIndex: number;
  pageIndex: number;
  pageId: string;
}
export function duplicateSection(
  content: Content,
  index: number,
): AuthoringSelection | undefined {
  const source = content.sections[index];
  if (content.kind !== "song" || !source) return;
  const copy = structuredClone(source);
  copy.id = id();
  copy.pages = copy.pages.map((page) => ({ ...page, id: id() }));
  let suffix = 1;
  do {
    copy.label = `${source.label} (copy${suffix === 1 ? "" : ` ${suffix}`})`;
    suffix++;
  } while (content.sections.some((section) => section.label === copy.label));
  content.sections.splice(index + 1, 0, copy);
  syncAuto(content);
  return { sectionIndex: index + 1, pageIndex: 0, pageId: copy.pages[0].id };
}
export function duplicateSlide(
  content: Content,
  sectionIndex: number,
  pageIndex: number,
): AuthoringSelection | undefined {
  const pages =
    content.kind === "song"
      ? content.sections[sectionIndex]?.pages
      : content.pages;
  if (!pages?.[pageIndex]) return;
  const copy = { ...structuredClone(pages[pageIndex]), id: id() };
  pages.splice(pageIndex + 1, 0, copy);
  return { sectionIndex, pageIndex: pageIndex + 1, pageId: copy.id };
}
export function moveSection(
  content: Content,
  index: number,
  direction: number,
) {
  const to = index + direction;
  if (
    content.kind !== "song" ||
    !content.sections[index] ||
    !content.sections[to]
  )
    return;
  const [section] = content.sections.splice(index, 1);
  content.sections.splice(to, 0, section);
  syncAuto(content);
  return { sectionIndex: to, pageIndex: 0, pageId: section.pages[0].id };
}
export function moveSlide(
  content: Content,
  sectionIndex: number,
  pageIndex: number,
  direction: number,
) {
  const pages =
      content.kind === "song"
        ? content.sections[sectionIndex]?.pages
        : content.pages,
    to = pageIndex + direction;
  if (!pages?.[pageIndex] || !pages[to]) return;
  const [page] = pages.splice(pageIndex, 1);
  pages.splice(to, 0, page);
  return { sectionIndex, pageIndex: to, pageId: page.id };
}
export function transferSlide(
  content: Content,
  sectionIndex: number,
  pageIndex: number,
  targetIndex: number,
) {
  if (content.kind !== "song" || sectionIndex === targetIndex) return;
  const source = content.sections[sectionIndex],
    target = content.sections[targetIndex];
  if (!source || !target || source.pages.length < 2 || !source.pages[pageIndex])
    return;
  const [page] = source.pages.splice(pageIndex, 1);
  target.pages.push(page);
  return {
    sectionIndex: targetIndex,
    pageIndex: target.pages.length - 1,
    pageId: page.id,
  };
}
