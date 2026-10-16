export interface TextStyle {
  fontSize: number;
  lineSpacing: number;
  align: "left" | "center" | "right";
  color: string;
  background: string;
  minFontSize?: number;
  autoFit?: boolean;
  fontFamily?: string;
  chineseFontFamily?: string;
  fontWeight?: number;
  verticalAlign?: "top" | "center" | "bottom";
  horizontalMargin?: number;
  verticalMargin?: number;
  secondaryScale?: number;
  outlineColor?: string;
  outlineWidth?: number;
}
export const defaultStyle: TextStyle = {
  fontSize: 64,
  lineSpacing: 1.3,
  align: "center",
  color: "#ffffff",
  background: "#101827",
};
export interface BackgroundDesign {
  mode: "inherit" | "color" | "image" | "video";
  mediaId?: string;
  posterId?: string;
  color: string;
  fit: "cover" | "contain";
  darken: number;
  loop: boolean;
}
export const defaultBackground: BackgroundDesign = {
  mode: "inherit",
  color: "#101827",
  fit: "cover",
  darken: 24,
  loop: true,
};
export interface OutputProfile {
  name: string;
  horizontalMargin: number;
  verticalMargin: number;
  fontSize: number;
  minFontSize: number;
  secondaryScale: number;
}
export const outputProfiles: ReadonlyArray<OutputProfile> = [
  {
    name: "Projector",
    horizontalMargin: 7,
    verticalMargin: 8,
    fontSize: 69.12,
    minFontSize: 36.72,
    secondaryScale: 0.82,
  },
  {
    name: "LED wall",
    horizontalMargin: 4.5,
    verticalMargin: 5.5,
    fontSize: 77.76,
    minFontSize: 41.04,
    secondaryScale: 0.84,
  },
  {
    name: "Livestream",
    horizontalMargin: 9.5,
    verticalMargin: 10.5,
    fontSize: 59.4,
    minFontSize: 33.48,
    secondaryScale: 0.8,
  },
];
export interface Page {
  languageMode?: "primary" | "secondary" | "both";
  id: string;
  title: string;
  text: string;
  secondary: string;
  style: TextStyle;
  mediaId?: string;
  typographyMode?: "inherit" | "custom";
  backgroundDesign?: BackgroundDesign;
}
export interface Section {
  id: string;
  label: string;
  pages: Page[];
}
export interface Arrangement {
  id: string;
  name: string;
  sectionIds: string[];
  auto: boolean;
  isDefault: boolean;
}
export interface Content {
  id: string;
  kind: "song" | "slides";
  title: string;
  indexNumber: string;
  primaryLanguage: string;
  secondaryLanguage: string;
  author: string;
  copyright: string;
  ccliNumber: string;
  rightsStatus: string;
  copyrightYear: string;
  publisher: string;
  licenceNote: string;
  reportingEnabled: boolean;
  tags: string;
  sections: Section[];
  arrangements: Arrangement[];
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}
export interface ServiceItem {
  nonPresenting?: boolean;
  id: string;
  sourceId: string;
  title: string;
  snapshot: Content;
  sectionOrder: string[];
  overrides: Partial<TextStyle>;
  notes: string;
  typographyMode?: "inherit" | "custom";
  backgroundDesign?: BackgroundDesign;
}
export interface ServiceOrder {
  id: string;
  title: string;
  date: string;
  items: ServiceItem[];
  style?: Partial<TextStyle>;
  profile?: OutputProfile;
  backgroundDesign?: BackgroundDesign;
  createdAt: string;
  updatedAt: string;
}
export interface MediaAsset {
  id: string;
  title: string;
  kind: "image" | "video";
  mimeType: string;
  size: number;
  hash: string;
  width?: number;
  height?: number;
  duration?: number;
  blob: Blob;
  createdAt: string;
}
export interface RenderRecord {
  id: string;
  sessionId: string;
  page: Page;
  createdAt: string;
}
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export function newPage(): Page {
  return {
    id: id(),
    title: "",
    text: "",
    secondary: "",
    style: { ...defaultStyle },
    typographyMode: "inherit",
  };
}
export function newContent(kind: Content["kind"]): Content {
  const section: Section = { id: id(), label: "V1", pages: [newPage()] };
  return {
    id: id(),
    kind,
    title: kind === "song" ? "Untitled song" : "Untitled slides",
    indexNumber: "",
    primaryLanguage: "English",
    secondaryLanguage: "",
    author: "",
    copyright: "",
    ccliNumber: "",
    rightsStatus: "Unspecified",
    copyrightYear: "",
    publisher: "",
    licenceNote: "",
    reportingEnabled: true,
    tags: "",
    sections: kind === "song" ? [section] : [],
    arrangements:
      kind === "song"
        ? [
            {
              id: id(),
              name: "Default",
              sectionIds: [section.id],
              auto: true,
              isDefault: true,
            },
          ]
        : [],
    pages: kind === "slides" ? [newPage()] : [],
    createdAt: now(),
    updatedAt: now(),
  };
}
export function contentPages(c: Content, order?: string[]): Page[] {
  if (c.kind === "slides") return c.pages;
  const sequence =
    order ??
    c.arrangements.find((a) => a.isDefault)?.sectionIds ??
    c.sections.map((s) => s.id);
  return sequence.flatMap(
    (sectionId) => c.sections.find((s) => s.id === sectionId)?.pages ?? [],
  );
}
export function servicePages(
  order: ServiceOrder,
): Array<Page & { itemId: string; itemTitle: string; notes: string }> {
  return order.items
    .filter((item) => !item.nonPresenting)
    .flatMap((item) =>
      contentPages(item.snapshot, item.sectionOrder).map((page) => ({
        ...page,
        id: item.id + ":" + page.id,
        style: resolveStyle(order, item, page),
        backgroundDesign: resolveBackground(order, item, page),
        itemId: item.id,
        itemTitle: item.title,
        notes: item.notes,
      })),
    );
}
export function makeItem(c: Content, arrangementId?: string): ServiceItem {
  const snapshot = structuredClone(c);
  const a =
    c.arrangements.find((a) => a.id === arrangementId) ??
    c.arrangements.find((a) => a.isDefault);
  return {
    id: id(),
    sourceId: c.id,
    title: c.title,
    snapshot,
    sectionOrder:
      c.kind === "song"
        ? [...(a?.sectionIds ?? c.sections.map((s) => s.id))]
        : [],
    overrides: {},
    notes: "",
  };
}
export function syncAuto(c: Content) {
  for (const a of c.arrangements)
    if (a.auto) a.sectionIds = c.sections.map((s) => s.id);
}
export function backgroundRefs(b?: BackgroundDesign) {
  return b
    ? [b.mediaId, b.posterId].filter((value): value is string => !!value)
    : [];
}
export function mediaRefs(c: Content) {
  return [...c.pages, ...c.sections.flatMap((s) => s.pages)].flatMap((p) => [
    ...(p.mediaId ? [p.mediaId] : []),
    ...backgroundRefs(p.backgroundDesign),
  ]);
}
export function serviceMediaRefs(order: ServiceOrder) {
  return [
    ...backgroundRefs(order.backgroundDesign),
    ...order.items.flatMap((item) => [
      ...backgroundRefs(item.backgroundDesign),
      ...mediaRefs(item.snapshot),
    ]),
  ];
}
export function profileStyle(
  profile: OutputProfile = outputProfiles[0],
): TextStyle {
  return {
    ...defaultStyle,
    ...profile,
    autoFit: true,
    fontFamily: "system-ui",
    fontWeight: 600,
    verticalAlign: "center",
  };
}
export function resolveStyle(
  order: ServiceOrder,
  item: ServiceItem,
  page: Page,
): TextStyle {
  const service = { ...profileStyle(order.profile), ...order.style };
  const inherited =
    item.typographyMode === "inherit"
      ? service
      : { ...service, ...item.overrides };
  // Undefined mode preserves 0.2's item-over-slide precedence. Explicit slide Custom wins.
  if (page.typographyMode === "custom") return { ...inherited, ...page.style };
  if (page.typographyMode === "inherit") return inherited;
  return {
    ...service,
    ...page.style,
    ...(item.typographyMode === "inherit" ? {} : item.overrides),
  };
}
export function resolveBackground(
  order: ServiceOrder,
  item: ServiceItem,
  page: Page,
): BackgroundDesign | undefined {
  for (const b of [
    page.backgroundDesign,
    item.backgroundDesign,
    order.backgroundDesign,
  ])
    if (b && b.mode !== "inherit") return { ...b };
  return undefined;
}
export function validateBackground(b?: BackgroundDesign) {
  if (b === undefined) return;
  if (
    !b ||
    !["inherit", "color", "image", "video"].includes(b.mode) ||
    !/^#[0-9a-f]{6}$/i.test(b.color) ||
    !["cover", "contain"].includes(b.fit) ||
    !Number.isFinite(b.darken) ||
    b.darken < 0 ||
    b.darken > 80 ||
    typeof b.loop !== "boolean" ||
    (b.mediaId !== undefined && typeof b.mediaId !== "string") ||
    (b.posterId !== undefined && typeof b.posterId !== "string") ||
    (["image", "video"].includes(b.mode) && !b.mediaId)
  )
    throw Error("Invalid background design.");
}
export function validateProfile(p?: OutputProfile) {
  if (p === undefined) return;
  if (!p || typeof p.name !== "string" || p.name.length > 100)
    throw Error("Invalid output profile.");
  for (const key of [
    "horizontalMargin",
    "verticalMargin",
    "fontSize",
    "minFontSize",
    "secondaryScale",
  ] as const)
    if (!Number.isFinite(p[key])) throw Error("Invalid output profile value.");
  validateStyle({ ...defaultStyle, ...p });
}
export function validateStyle(s: TextStyle) {
  if (
    !s ||
    !Number.isFinite(s.fontSize) ||
    s.fontSize < 16 ||
    s.fontSize > 140 ||
    !Number.isFinite(s.lineSpacing) ||
    s.lineSpacing < 0.8 ||
    s.lineSpacing > 1.8 ||
    !["left", "center", "right"].includes(s.align) ||
    !/^#[0-9a-f]{6}$/i.test(s.color) ||
    !/^#[0-9a-f]{6}$/i.test(s.background)
  )
    throw Error("Invalid slide style.");
  const ranges = {
    minFontSize: [16, 140],
    fontWeight: [400, 700],
    horizontalMargin: [0, 25],
    verticalMargin: [0, 25],
    secondaryScale: [0.5, 1],
    outlineWidth: [0, 8],
  } as const;
  for (const [key, range] of Object.entries(ranges)) {
    const value = s[key as keyof typeof ranges];
    if (
      value !== undefined &&
      (!Number.isFinite(value) || value < range[0] || value > range[1])
    )
      throw Error("Invalid typography value: " + key);
  }
  if (
    (s.autoFit !== undefined && typeof s.autoFit !== "boolean") ||
    (s.verticalAlign !== undefined &&
      !["top", "center", "bottom"].includes(s.verticalAlign)) ||
    (s.outlineColor !== undefined && !/^#[0-9a-f]{6}$/i.test(s.outlineColor))
  )
    throw Error("Invalid text design.");
  for (const family of [s.fontFamily, s.chineseFontFamily])
    if (
      family !== undefined &&
      (typeof family !== "string" ||
        family.length > 200 ||
        /[;{}<>\\]/.test(family))
    )
      throw Error("Invalid local font family.");
}
export function validateContent(c: Content) {
  if (
    !c ||
    !["song", "slides"].includes(c.kind) ||
    typeof c.id !== "string" ||
    !c.id ||
    typeof c.title !== "string" ||
    !c.title.trim() ||
    c.title.length > 500
  )
    throw Error("A title is required (up to 500 characters).");
  for (const key of [
    "indexNumber",
    "primaryLanguage",
    "secondaryLanguage",
    "author",
    "copyright",
    "ccliNumber",
    "rightsStatus",
    "copyrightYear",
    "publisher",
    "licenceNote",
    "tags",
    "createdAt",
    "updatedAt",
  ] as const)
    if (typeof c[key] !== "string" || c[key].length > 10000)
      throw Error("Invalid content metadata.");
  if (typeof c.reportingEnabled !== "boolean")
    throw Error("Invalid reporting setting.");
  if (
    !Array.isArray(c.sections) ||
    !Array.isArray(c.arrangements) ||
    !Array.isArray(c.pages)
  )
    throw Error("Invalid content hierarchy.");
  const identities = new Set<string>();
  const unique = (value: string) => {
    if (typeof value !== "string" || !value || identities.has(value))
      throw Error("Duplicate or missing content identifier.");
    identities.add(value);
  };
  const pages = [...c.pages];
  for (const section of c.sections) {
    unique(section.id);
    if (
      typeof section.label !== "string" ||
      !section.label.trim() ||
      !Array.isArray(section.pages) ||
      !section.pages.length
    )
      throw Error("Each section needs a label and a slide.");
    pages.push(...section.pages);
  }
  for (const page of pages) {
    unique(page.id);
    if (
      typeof page.title !== "string" ||
      typeof page.text !== "string" ||
      typeof page.secondary !== "string" ||
      page.text.length > 100000 ||
      page.secondary.length > 100000 ||
      (page.mediaId !== undefined && typeof page.mediaId !== "string")
    )
      throw Error("Invalid slide text or media reference.");
    if (
      page.languageMode !== undefined &&
      !["primary", "secondary", "both"].includes(page.languageMode)
    )
      throw Error("Invalid slide language selection.");
    validateStyle(page.style);
    if (
      page.typographyMode !== undefined &&
      !["inherit", "custom"].includes(page.typographyMode)
    )
      throw Error("Invalid slide inheritance.");
    validateBackground(page.backgroundDesign);
  }
  if (!pages.length) throw Error("Add at least one slide.");
  if (
    c.kind === "song" &&
    (!c.sections.length ||
      !c.arrangements.length ||
      c.arrangements.filter((a) => a.isDefault).length !== 1)
  )
    throw Error("Songs need sections and one default arrangement.");
  const sectionIds = new Set(c.sections.map((s) => s.id));
  for (const a of c.arrangements) {
    unique(a.id);
    if (
      typeof a.name !== "string" ||
      !a.name.trim() ||
      typeof a.auto !== "boolean" ||
      typeof a.isDefault !== "boolean" ||
      !Array.isArray(a.sectionIds) ||
      !a.sectionIds.length ||
      a.sectionIds.some((s) => !sectionIds.has(s))
    )
      throw Error("Arrangement contains an invalid section reference.");
  }
}
export function validateService(s: ServiceOrder) {
  if (
    !s ||
    typeof s.id !== "string" ||
    !s.id ||
    typeof s.title !== "string" ||
    !s.title.trim() ||
    typeof s.date !== "string" ||
    typeof s.createdAt !== "string" ||
    typeof s.updatedAt !== "string" ||
    !Array.isArray(s.items)
  )
    throw Error("Invalid service order.");
  validateProfile(s.profile);
  validateStyle({ ...defaultStyle, ...s.style });
  validateBackground(s.backgroundDesign);
  const ids = new Set<string>();
  for (const item of s.items) {
    if (
      typeof item.id !== "string" ||
      ids.has(item.id) ||
      typeof item.sourceId !== "string" ||
      typeof item.title !== "string" ||
      typeof item.notes !== "string" ||
      !Array.isArray(item.sectionOrder)
    )
      throw Error("Invalid service item.");
    if (
      item.nonPresenting !== undefined &&
      typeof item.nonPresenting !== "boolean"
    )
      throw Error("Invalid service section flag.");
    ids.add(item.id);
    validateContent(item.snapshot);
    if (
      item.typographyMode !== undefined &&
      !["inherit", "custom"].includes(item.typographyMode)
    )
      throw Error("Invalid item inheritance.");
    validateBackground(item.backgroundDesign);
    validateStyle({ ...defaultStyle, ...item.overrides });
    if (
      item.snapshot.kind === "song" &&
      (!item.sectionOrder.length ||
        item.sectionOrder.some(
          (section) => !item.snapshot.sections.some((s) => s.id === section),
        ))
    )
      throw Error("Invalid service arrangement.");
  }
}

export function validateBackgroundMedia(
  backgrounds: Array<BackgroundDesign | undefined>,
  media: Map<string, { kind: string }>,
) {
  for (const b of backgrounds) {
    if (!b) continue;
    if (
      ["image", "video"].includes(b.mode) &&
      media.get(b.mediaId!)?.kind !== b.mode
    )
      throw Error("Background media type does not match its design.");
    if (b.posterId && media.get(b.posterId)?.kind !== "image")
      throw Error("A fallback poster must be an image.");
  }
}
export function contentBackgrounds(c: Content) {
  return [...c.pages, ...c.sections.flatMap((s) => s.pages)].map(
    (p) => p.backgroundDesign,
  );
}
export function serviceBackgrounds(s: ServiceOrder) {
  return [
    s.backgroundDesign,
    ...s.items.flatMap((i) => [
      i.backgroundDesign,
      ...contentBackgrounds(i.snapshot),
    ]),
  ];
}

export interface MigrationRecord {
  id: string;
  createdAt: string;
  sourceName: string;
  sourceHash: string;
  report: string[];
  originalJson: string;
}
export function validateMigration(record: MigrationRecord) {
  if (
    !record ||
    typeof record.id !== "string" ||
    !record.id ||
    typeof record.createdAt !== "string" ||
    typeof record.sourceName !== "string" ||
    typeof record.sourceHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(record.sourceHash) ||
    !Array.isArray(record.report) ||
    record.report.length > 10000 ||
    record.report.some(
      (line) => typeof line !== "string" || line.length > 10000,
    ) ||
    typeof record.originalJson !== "string" ||
    record.originalJson.length > 16 * 1024 * 1024
  )
    throw Error("Invalid migration provenance.");
  const original: unknown = JSON.parse(record.originalJson);
  if (!original || typeof original !== "object" || Array.isArray(original))
    throw Error("Invalid original migration data.");
}

export function displayChannels(page: Page) {
  if (page.languageMode === "secondary")
    return {
      primary: page.secondary.trim() ? page.secondary : page.text,
      secondary: "",
    };
  return {
    primary: page.text,
    secondary: page.languageMode === "primary" ? "" : page.secondary,
  };
}
