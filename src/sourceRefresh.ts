import { validateContent, type Content, type ServiceItem } from "./model";
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => JSON.stringify(key) + ":" + stable(value))
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export function sameContent(a: Content, b: Content) {
  const body = (content: Content) => {
    const { revision, revisionToken, createdAt, updatedAt, ...body } = content;
    void revision;
    void revisionToken;
    void createdAt;
    void updatedAt;
    return body;
  };
  return stable(body(a)) === stable(body(b));
}
export function sourceStatus(item: ServiceItem, source?: Content) {
  if (!source)
    return "Source no longer in Library. This service copy remains usable.";
  if (
    item.snapshot.id !== item.sourceId ||
    !item.snapshot.revisionToken ||
    item.snapshot.revision === undefined
  )
    return "Original Library version unknown. Compare before replacing this copy.";
  return item.snapshot.revisionToken === source.revisionToken
    ? "Library version matches the original copy. Service-specific edits may differ."
    : "Library version differs from the original copy. Compare before replacing.";
}
export function refreshedItem(
  item: ServiceItem,
  source: Content,
  arrangementId?: string,
): ServiceItem {
  if (item.sourceId !== source.id)
    throw Error(
      "This Library item is not the source of the selected service copy.",
    );
  if (item.snapshot.kind !== source.kind)
    throw Error(
      "The source content type changed. Add it as a new service item instead.",
    );
  validateContent(source);
  const arrangement =
    source.kind === "song"
      ? source.arrangements.find((value) => value.id === arrangementId)
      : undefined;
  if (source.kind === "song" && !arrangement)
    throw Error("Choose a Library song order before replacing this copy.");
  return {
    ...structuredClone(item),
    snapshot: structuredClone(source),
    sectionOrder: arrangement ? [...arrangement.sectionIds] : [],
  };
}
