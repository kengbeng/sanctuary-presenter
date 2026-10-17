import {
  servicePages,
  type PresentationPage,
  type ServiceOrder,
} from "./model";
export interface ExtraSection {
  itemId: string;
  sectionId: string;
  origin: number;
}
export function presentationPath(
  order: ServiceOrder,
  extra?: ExtraSection,
): PresentationPage[] {
  const base = servicePages(order);
  if (!extra) return base;
  const item = order.items.find((item) => item.id === extra.itemId);
  if (
    !item ||
    item.nonPresenting ||
    !item.snapshot.sections.some((section) => section.id === extra.sectionId)
  )
    return base;
  const pages = servicePages({
    ...order,
    items: [{ ...item, sectionOrder: [extra.sectionId] }],
  }).map((page) => ({
    ...page,
    id: JSON.stringify([item.id, "extra", extra.sectionId, page.sourcePageId]),
    occurrenceIndex: -1,
  }));
  const insertion = Math.max(0, Math.min(extra.origin + 1, base.length));
  return [...base.slice(0, insertion), ...pages, ...base.slice(insertion)];
}
export function sectionJump(
  order: ServiceOrder,
  current: PresentationPage | undefined,
  sectionId: string,
  extra?: ExtraSection,
  targetItemId = current?.itemId,
) {
  if (!current) return undefined;
  const base = servicePages(order);
  const occurrences = base
    .map((page, index) => ({ page, index }))
    .filter(
      ({ page }) =>
        page.itemId === targetItemId &&
        page.sectionId === sectionId &&
        page.pageIndex === 0,
    );
  if (occurrences.length) {
    const currentBase = base.findIndex((page) => page.id === current.id);
    const position =
      targetItemId !== current.itemId
        ? base.findIndex((page) => page.itemId === targetItemId) - 1
        : currentBase >= 0
          ? currentBase
          : (extra?.origin ?? -1);
    const target =
      occurrences.find(
        ({ page }) =>
          page.occurrenceIndex === current.occurrenceIndex &&
          current.itemId === targetItemId &&
          current.sectionId === sectionId,
      ) ||
      occurrences.find(({ index }) => index > position) ||
      occurrences[0];
    return { index: target.index, extra: undefined };
  }
  const item = order.items.find((item) => item.id === targetItemId);
  if (!item?.snapshot.sections.some((section) => section.id === sectionId))
    return undefined;
  const origin =
    extra?.origin ?? base.findIndex((page) => page.id === current.id);
  return {
    index: origin + 1,
    extra: { itemId: targetItemId!, sectionId, origin },
  };
}
