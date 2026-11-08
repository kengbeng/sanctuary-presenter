import "./library-navigation.css";
import { EditorMenu, ReorderNavigation } from "./EditorNavigation";
import { moveSection, moveSlide } from "./authoring";
import { LibraryDetails } from "./LibraryDetails";
import { PasteLyrics } from "./PasteLyrics";
import { SectionTools, SlideTools } from "./StructureTools";
import {
  indexContent,
  findContent,
  matchExcerpt,
  similarSongs,
} from "./search";
import { SearchFilters } from "./SearchFilters";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./repository";
import { exportBackup, readBackup, restoreBackup, download } from "./backup";
import {
  type Content,
  type Page,
  type ServiceOrder,
  type ServiceItem,
  type TextStyle,
  newContent,
  newPage,
  makeItem,
  contentPages,
  contentCompatibilityIssues,
  editableContentCopy,
  servicePages,
  syncAuto,
  id,
  now,
  profileStyle,
  resolveStyle,
} from "./model";
import { withMaintenance } from "./coordination";
import { SlideFrame } from "./SlideFrame";
import {
  AdvancedTypography,
  BackgroundEditor,
  ProfileEditor,
} from "./DesignEditors";
function MediaThumbnail({
  asset,
}: {
  asset: { kind: string; blob: Blob; title: string };
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (asset.kind !== "image") return;
    const value = URL.createObjectURL(asset.blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [asset.blob, asset.kind]);
  return url ? (
    <img
      className="media-thumbnail"
      loading="lazy"
      src={url}
      alt={asset.title}
    />
  ) : null;
}
function StyleEditor({
  style,
  change,
}: {
  style: TextStyle;
  change: (s: TextStyle) => void;
}) {
  return (
    <>
      <div className="style-fields">
        <label>
          Font size at 1080p
          <input
            type="number"
            min="16"
            max="140"
            value={style.fontSize}
            onChange={(e) =>
              change({
                ...style,
                fontSize: Math.max(16, Math.min(140, Number(e.target.value))),
              })
            }
          />
        </label>
        <label>
          Line spacing
          <input
            type="number"
            min="0.8"
            max="1.8"
            step="0.05"
            value={style.lineSpacing}
            onChange={(e) =>
              change({
                ...style,
                lineSpacing: Math.max(
                  0.8,
                  Math.min(1.8, Number(e.target.value)),
                ),
              })
            }
          />
        </label>
        <label>
          Alignment
          <select
            value={style.align}
            onChange={(e) =>
              change({ ...style, align: e.target.value as TextStyle["align"] })
            }
          >
            <option>left</option>
            <option>center</option>
            <option>right</option>
          </select>
        </label>
        <label>
          Text colour
          <input
            type="color"
            value={style.color}
            onChange={(e) => change({ ...style, color: e.target.value })}
          />
        </label>
        <label>
          Background colour
          <input
            type="color"
            value={style.background}
            onChange={(e) => change({ ...style, background: e.target.value })}
          />
        </label>
      </div>
      <AdvancedTypography style={style} change={change} />
    </>
  );
}
export function PageEditor({
  page,
  change,
  media,
  previewPage,
  showPreview = true,
  focused = false,
  languages,
}: {
  page: Page;
  change: (p: Page) => void;
  media: { id: string; title: string; kind?: string }[];
  previewPage?: Page;
  showPreview?: boolean;
  focused?: boolean;
  languages?: {
    primary: string;
    secondary: string;
    change: (channel: "primary" | "secondary", language: string) => void;
  };
}) {
  return (
    <div className={focused ? "library-page-editor" : undefined}>
      {!focused && (
        <label>
          Slide heading
          <input
            value={page.title}
            onChange={(e) => change({ ...page, title: e.target.value })}
          />
        </label>
      )}
      <div
        className={
          focused
            ? `library-language-fields ${languages && !languages.secondary && !page.secondary ? "library-one-language" : ""}`
            : undefined
        }
      >
        {(["primary", "secondary"] as const).map((channel) => (
          <div key={channel}>
            {languages && (
              <label>
                {channel === "primary" ? "First language" : "Second language"}
                <select
                  aria-label={`${channel === "primary" ? "First" : "Second"} lyrics language`}
                  value={languages[channel]}
                  onChange={(event) =>
                    languages.change(channel, event.target.value)
                  }
                >
                  {channel === "secondary" && <option value="">None</option>}
                  {!["", "English", "Chinese"].includes(languages[channel]) && (
                    <option value={languages[channel]}>
                      {languages[channel]} (current)
                    </option>
                  )}
                  {channel === "primary" && !languages.primary && (
                    <option value="">Choose language</option>
                  )}
                  <option>English</option>
                  <option>Chinese</option>
                </select>
              </label>
            )}
            {(channel === "primary" ||
              !languages ||
              languages.secondary ||
              page.secondary) && (
              <label>
                {channel === "primary" ? "Primary text" : "Secondary text"}
                <textarea
                  rows={focused ? 6 : channel === "primary" ? 5 : 3}
                  aria-label={
                    channel === "primary" ? "Primary text" : "Secondary text"
                  }
                  value={channel === "primary" ? page.text : page.secondary}
                  onChange={(event) =>
                    change({
                      ...page,
                      [channel === "primary" ? "text" : "secondary"]:
                        event.target.value,
                    })
                  }
                />
              </label>
            )}
          </div>
        ))}
      </div>
      <details
        className="library-slide-settings"
        open={focused ? undefined : true}
      >
        <summary>
          {focused ? "Slide appearance" : "Slide settings and appearance"}
        </summary>
        {focused && (
          <label>
            Slide heading
            <input
              value={page.title}
              onChange={(e) => change({ ...page, title: e.target.value })}
            />
          </label>
        )}
        <label>
          Projected language
          <select
            aria-label="Projected language"
            value={page.languageMode ?? "both"}
            onChange={(e) =>
              change({
                ...page,
                languageMode: e.target.value as Page["languageMode"],
              })
            }
          >
            <option value="both">Both languages</option>
            <option value="primary">Primary only</option>
            <option value="secondary">
              Secondary (primary fallback if empty)
            </option>
          </select>
        </label>
        <label>
          Slide media
          <select
            value={page.mediaId || ""}
            onChange={(e) =>
              change({ ...page, mediaId: e.target.value || undefined })
            }
          >
            <option value="">None</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <details>
          <summary>Slide design</summary>
          <label>
            Slide typography
            <select
              aria-label="Slide typography"
              value={page.typographyMode ?? "legacy"}
              onChange={(e) =>
                change({
                  ...page,
                  typographyMode:
                    e.target.value === "legacy"
                      ? undefined
                      : (e.target.value as "inherit" | "custom"),
                })
              }
            >
              <option value="inherit">Inherit item / service profile</option>
              <option value="custom">Custom slide override</option>
              <option value="legacy">Legacy item-over-slide design</option>
            </select>
          </label>
          <StyleEditor
            style={page.style}
            change={(style) =>
              change({ ...page, style, typographyMode: "custom" })
            }
          />
        </details>
        <details>
          <summary>Slide background</summary>
          <BackgroundEditor
            scope="Slide"
            media={media}
            value={page.backgroundDesign}
            change={(backgroundDesign) => change({ ...page, backgroundDesign })}
          />
        </details>
      </details>
      {showPreview && (
        <details
          open={focused ? undefined : true}
          className="library-edit-preview"
        >
          <summary>Preview selected slide</summary>
          <div className="small-preview">
            {!page.text && !page.secondary && !page.title && !page.mediaId ? (
              <p className="library-preview-empty">
                Enter lyrics to preview this slide.
              </p>
            ) : (
              <SlideFrame page={previewPage ?? page} />
            )}
          </div>
        </details>
      )}
    </div>
  );
}
function reorder<T>(list: T[], index: number, direction: number) {
  const next = [...list],
    to = index + direction;
  if (to < 0 || to >= next.length) return next;
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
function cloneContent(c: Content) {
  const copy = structuredClone(c),
    sections = new Map<string, string>();
  copy.id = id();
  delete copy.revision;
  delete copy.revisionToken;
  copy.title += " (copy)";
  copy.createdAt = now();
  for (const section of copy.sections) {
    const key = id();
    sections.set(section.id, key);
    section.id = key;
    for (const p of section.pages) p.id = id();
  }
  for (const a of copy.arrangements) {
    a.id = id();
    a.sectionIds = a.sectionIds.map((s) => sections.get(s)!);
  }
  for (const p of copy.pages) p.id = id();
  return copy;
}
export function Library({
  request,
  onPresent,
  canRestore,
  onRestored,
  showPlanner = true,
  currentService,
  onBackToService,
  onAddToService,
  adding = false,
  addMessage = "",
}: {
  showPlanner?: boolean;
  currentService?: { id: string; title: string };
  onBackToService?: () => void;
  onAddToService?: (selection: {
    serviceId: string;
    contentId?: string;
    mediaId?: string;
    arrangementId?: string;
  }) => void;
  adding?: boolean;
  addMessage?: string;
  request?: { serviceId: string; token: string };
  onPresent: (service: ServiceOrder) => void;
  canRestore: boolean;
  onRestored: () => void;
}) {
  const [pasteStaging, setPasteStaging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sectionType, setSectionType] = useState("Verse");
  const [customSectionName, setCustomSectionName] = useState("");
  const [editorTab, setEditorTab] = useState<"lyrics" | "order" | "details">(
    "lyrics",
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string>();
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState("");
  const tools = useRef<HTMLDetailsElement>(null);
  const editor = useRef<HTMLElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const importDialog = useRef<HTMLDialogElement>(null);
  const addDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = importOpen
      ? importDialog.current
      : addOpen
        ? addDialog.current
        : undefined;
    if (!dialog) return;
    const focused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      focused?.focus();
    };
  }, [importOpen, addOpen]);
  function backToSongs() {
    setDetailOpen(false);
    requestAnimationFrame(() =>
      results.current
        ?.querySelector<HTMLButtonElement>('.library-row[aria-pressed="true"]')
        ?.focus({ preventScroll: true }),
    );
  }
  async function importFiles(files: File[]) {
    await run(async () => {
      for (const file of files) await db.importMedia(file);
      setTab("media");
      setImportOpen(false);
      setDetailOpen(false);
      setMessage(
        "Media stored locally. Select an item to inspect it or add it to a service.",
      );
    });
  }
  const restoreAllowed = useRef(canRestore);
  restoreAllowed.current = canRestore;
  const content = useLiveQuery(() => db.content.toArray(), []) ?? [],
    media = useLiveQuery(() => db.media.toArray(), []) ?? [],
    services =
      useLiveQuery(
        () => db.services.orderBy("updatedAt").reverse().toArray(),
        [],
      ) ?? [];
  const [tab, setTab] = useState<"song" | "slides" | "media">("song"),
    [query, setQuery] = useState(""),
    [draft, setDraft] = useState<Content>(),
    [dirty, setDirty] = useState(false),
    [sectionIndex, setSectionIndex] = useState(0),
    [pageIndex, setPageIndex] = useState(0),
    [service, setService] = useState<ServiceOrder>(),
    [itemIndex, setItemIndex] = useState(0),
    [servicePage, setServicePage] = useState(0),
    [message, setMessage] = useState(
      "Your library stays in this browser. Keep a full ZIP backup outside the browser.",
    ),
    [busy, setBusy] = useState(false),
    [storage, setStorage] = useState("Storage usage not yet checked"),
    [sort, setSort] = useState("title");
  useEffect(() => {
    if (addMessage) setMessage(addMessage);
  }, [addMessage]);
  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    void db.services
      .get(request.serviceId)
      .then((order) => {
        if (!cancelled && order) {
          setService(structuredClone(order));
          setItemIndex(0);
          setServicePage(0);
        }
      })
      .catch(() => setMessage("Could not open the requested service."));
    return () => {
      cancelled = true;
    };
  }, [request]);
  const [arrangement, setArrangement] = useState("");
  useLayoutEffect(() => {
    const pane = editor.current;
    if (!pane || showPlanner || !editing) return;
    const heading = pane.querySelector<HTMLElement>(".library-editor-heading");
    const toolbar = pane.querySelector<HTMLElement>(".library-slide-toolbar");
    const measure = () => {
      pane.style.setProperty(
        "--library-heading-height",
        `${heading?.offsetHeight ?? 0}px`,
      );
      pane.style.setProperty(
        "--library-toolbar-height",
        `${toolbar?.offsetHeight ?? 0}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    if (heading) observer.observe(heading);
    if (toolbar) observer.observe(toolbar);
    measure();
    return () => observer.disconnect();
  }, [editing, showPlanner, draft?.id, editorTab]);

  useLayoutEffect(() => {
    editor.current?.scrollTo({ top: 0 });
  }, [editing, draft?.id, editorTab]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Local operation failed.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void db.settings
      .get("selectedService")
      .then(async (setting) => {
        if (setting) setService(await db.services.get(setting.value));
      })
      .catch((e) => setMessage(String(e)));
  }, []);
  useEffect(() => {
    if (!dirty && !pasteStaging) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty, pasteStaging]);
  const draftGeneration = useRef(0);
  function edit(c: Content) {
    if (
      (dirty || pasteStaging) &&
      !confirm("Discard unsaved library edits and staged lyrics?")
    )
      return;
    draftGeneration.current++;
    setEditorTab("lyrics");
    const next = structuredClone(c);
    if (
      !showPlanner &&
      !content.some((item) => item.id === c.id) &&
      next.kind === "song" &&
      next.sections.length === 1 &&
      next.sections[0].label === "V1"
    )
      next.sections[0].label = "Verse 1";
    setDraft(next);
    setEditing(showPlanner || !content.some((item) => item.id === c.id));
    setDetailOpen(true);
    editor.current?.scrollTo({ top: 0 });
    setSectionIndex(0);
    setPageIndex(0);
    setDirty(!content.some((item) => item.id === c.id));
    setArrangement("");
    setTab(c.kind);
  }
  function update(mutator: (c: Content) => void) {
    if (!draft) return;
    const issues = contentCompatibilityIssues(draft);
    if (issues.length) {
      setMessage(
        "Legacy original is read-only. Export a backup, then Create editable copy to retain hidden content and existing order.",
      );
      return;
    }
    const c = structuredClone(draft);
    mutator(c);
    draftGeneration.current++;
    setDraft(c);
    setDirty(true);
  }
  async function saveService(next: ServiceOrder) {
    await serviceWrites.current;
    const own = ownServiceVersions.current.get(next.id);
    if (own && own.revision! > (next.revision ?? 0)) Object.assign(next, own);
    await db.saveService(next);
    ownServiceVersions.current.set(next.id, {
      revision: next.revision,
      revisionToken: next.revisionToken,
    });
    setService(next);
    await db.settings.put({ key: "selectedService", value: next.id });
  }
  const serviceWrites = useRef(Promise.resolve());
  const ownServiceVersions = useRef(
    new Map<string, { revision?: number; revisionToken?: string }>(),
  );
  function updateService(mutator: (s: ServiceOrder) => void) {
    if (!service) return;
    const next = structuredClone(service);
    mutator(next);
    setService(next);
    const base = {
      revision: service.revision,
      revisionToken: service.revisionToken,
    };
    const queued = serviceWrites.current.then(async () => {
      const own = ownServiceVersions.current.get(next.id);
      if (own && own.revision! > (base.revision ?? 0)) Object.assign(next, own);
      await db.saveService(next);
      ownServiceVersions.current.set(next.id, {
        revision: next.revision,
        revisionToken: next.revisionToken,
      });
      setService((current) =>
        current?.id === next.id
          ? {
              ...current,
              revision: next.revision,
              revisionToken: next.revisionToken,
            }
          : current,
      );
      setMessage("Service changes saved locally.");
    });
    serviceWrites.current = queued.catch(() => {});
    void run(() => queued);
  }
  const item = service?.items[itemIndex];
  const itemPages =
    item && !item.nonPresenting
      ? contentPages(item.snapshot, item.sectionOrder)
      : [];
  const page = draft
    ? draft.kind === "song"
      ? draft.sections[sectionIndex]?.pages[pageIndex]
      : draft.pages[pageIndex]
    : undefined;
  function changePage(next: Page) {
    update((c) => {
      if (c.kind === "song") c.sections[sectionIndex].pages[pageIndex] = next;
      else c.pages[pageIndex] = next;
    });
  }
  const migrations = useLiveQuery(() => db.provenance.toArray(), []) ?? [];
  const searchIndex = useMemo(() => indexContent(content), [content]);
  const [searchLanguage, setSearchLanguage] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const visible = findContent(searchIndex, query, {
    kind: tab === "media" ? undefined : tab,
    language: searchLanguage,
    tag: searchTag,
  }).sort((a, b) =>
    sort === "number"
      ? a.indexNumber.localeCompare(b.indexNumber, undefined, {
          numeric: true,
        })
      : a.title.localeCompare(b.title),
  );
  async function removeContent(c: Content) {
    const refs = services.filter((s) =>
      s.items.some((i) => i.sourceId === c.id),
    );
    if (
      !confirm(
        `Delete “${c.title}” from the library? ${refs.length} service order(s) retain independent copies. Export a backup first; deletion cannot be undone here.`,
      )
    )
      return;
    await db.deleteContent(c);
    if (draft?.id === c.id) {
      setDraft(undefined);
      setDirty(false);
    }
    setMessage("Library item deleted. Existing service copies are preserved.");
  }
  async function saveDraft() {
    if (!draft) return;
    const issues = contentCompatibilityIssues(draft);
    if (issues.length) throw Error(issues.join(" "));
    syncAuto(draft);
    const duplicate = content.find(
      (c) =>
        c.id !== draft.id &&
        (c.title.trim().toLowerCase() === draft.title.trim().toLowerCase() ||
          (draft.indexNumber && c.indexNumber === draft.indexNumber)),
    );
    if (
      duplicate &&
      !confirm(`Possible duplicate: “${duplicate.title}”. Save anyway?`)
    )
      return;
    const generation = draftGeneration.current;
    const saved = await db.saveContent(draft);
    setDraft((current) =>
      current?.id === saved.id
        ? {
            ...current,
            revision: saved.revision,
            revisionToken: saved.revisionToken,
            updatedAt: saved.updatedAt,
          }
        : current,
    );
    if (generation === draftGeneration.current) setDirty(false);
    setMessage(
      "Library master saved. Existing service copies remain independent.",
    );
    if (!showPlanner && generation === draftGeneration.current)
      setEditing(false);
  }
  function cancelEditing() {
    if (
      (dirty || pasteStaging) &&
      !confirm("Discard unsaved library edits and staged lyrics?")
    )
      return;
    const saved = content.find((item) => item.id === draft?.id);
    draftGeneration.current++;
    setDraft(saved ? structuredClone(saved) : undefined);
    setSectionIndex(0);
    setPageIndex(0);
    setDirty(false);
    setPasteStaging(false);
    setEditing(false);
    if (!saved) setDetailOpen(false);
  }
  function itemChange(mutator: (item: ServiceItem) => void) {
    updateService((s) => mutator(s.items[itemIndex]));
  }
  const sectionManagement =
    draft && draft.kind === "song" ? (
      <EditorMenu
        label={
          showPlanner
            ? "Section settings"
            : `Manage ${draft.sections[sectionIndex]?.label || "section"}`
        }
        inline={showPlanner}
        className="library-section-settings"
      >
        {showPlanner && (
          <label>
            Section
            <select
              value={sectionIndex}
              onChange={(e) => {
                setSectionIndex(Number(e.target.value));
                setPageIndex(0);
              }}
            >
              {draft.sections.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Section label
          <input
            value={draft.sections[sectionIndex]?.label || ""}
            onChange={(e) =>
              update((c) => {
                c.sections[sectionIndex].label = e.target.value;
              })
            }
          />
        </label>
        <div className="actions">
          <button
            hidden={!showPlanner}
            onClick={() => {
              update((c) => {
                c.sections.push({
                  id: id(),
                  label: "Verse " + (c.sections.length + 1),
                  pages: [newPage()],
                });
                syncAuto(c);
              });
              setSectionIndex(draft.sections.length);
              setPageIndex(0);
            }}
          >
            Add section
          </button>
          <button
            disabled={draft.sections.length < 2}
            onClick={() => {
              if (!confirm("Remove this section and its arrangement entries?"))
                return;
              update((c) => {
                const key = c.sections[sectionIndex].id;
                c.sections.splice(sectionIndex, 1);
                for (const a of c.arrangements)
                  a.sectionIds = a.sectionIds.filter((s) => s !== key);
                syncAuto(c);
              });
              setSectionIndex(0);
              setPageIndex(0);
            }}
          >
            {showPlanner ? "Remove section" : "Delete section"}
          </button>
        </div>
        <SectionTools
          inline={!showPlanner}
          content={draft}
          sectionIndex={sectionIndex}
          onChange={update}
          onSelect={(selection) => {
            setSectionIndex(selection.sectionIndex);
            setPageIndex(selection.pageIndex);
          }}
        />
      </EditorMenu>
    ) : null;
  return (
    <main
      className={
        "library-workspace" +
        (showPlanner ? "" : " library-only") +
        (detailOpen ? " library-detail-open" : "")
      }
    >
      <div className="library-toolbar">
        <div>
          <span className="eyebrow">
            {showPlanner
              ? "LOCAL LIBRARY & SERVICE PLANNER"
              : "REUSABLE LOCAL CONTENT"}
          </span>
          <h2>{showPlanner ? "Prepare your service" : "Library"}</h2>
          {!showPlanner && (
            <p className="muted">
              Find a song, browse its sections, then edit it or add it to a
              service.
            </p>
          )}
        </div>
        {/* Library actions */}
        {!showPlanner && (
          <div className="library-primary-actions">
            {currentService && (
              <button
                className="library-return-service"
                aria-label="Back to service"
                onClick={onBackToService}
                title={currentService.title}
              >
                Back to service<small>{currentService.title}</small>
              </button>
            )}
            <button
              onClick={() =>
                edit(newContent(tab === "slides" ? "slides" : "song"))
              }
            >
              New {tab === "slides" ? "slides" : "song"}
            </button>
            <button onClick={() => setImportOpen(true)}>Import</button>
            <button
              className="primary"
              disabled={
                busy ||
                adding ||
                dirty ||
                pasteStaging ||
                !services.length ||
                (tab === "media" ? !selectedMedia : !draft)
              }
              onClick={() => {
                setAddTarget(currentService?.id ?? services[0]?.id ?? "");
                setAddOpen(true);
              }}
            >
              Add to service
            </button>
          </div>
        )}
      </div>
      <details
        className="library-tools"
        ref={tools}
        open={showPlanner || undefined}
      >
        <summary>Library tools</summary>
        <div className="library-tools-body">
          <div className="actions">
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  download(
                    await exportBackup(),
                    `sanctuary-backup-${new Date().toISOString().slice(0, 10)}.zip`,
                  );
                  setMessage(
                    "Full backup exported. Store it outside this browser.",
                  );
                })
              }
            >
              Export full backup
            </button>
            <label className={"file-button " + (!canRestore ? "disabled" : "")}>
              Restore backup
              <input
                aria-label="Restore backup"
                type="file"
                accept=".zip"
                disabled={!canRestore || busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file)
                    void run(async () => {
                      if (!restoreAllowed.current)
                        throw Error("Stop all presentations before restore.");
                      const prepared = await readBackup(file);
                      if (prepared.compatibilityIssues.length) {
                        setMessage(
                          `Backup contains ${prepared.compatibilityIssues.length} legacy compatibility issue(s). Originals will be preserved; inspect affected content before editing.`,
                        );
                      }
                      if (
                        !confirm(
                          `Replace all local content with this validated backup (${prepared.manifest.counts.content} library items, ${prepared.manifest.counts.services} services)? ${prepared.compatibilityIssues.length ? `${prepared.compatibilityIssues.length} legacy issue(s); originals will be retained. ` : ""}Export your current backup first.`,
                        )
                      )
                        return;
                      if (!restoreAllowed.current)
                        throw Error("Stop all presentations before restore.");
                      await withMaintenance(() => restoreBackup(prepared));
                      onRestored();
                      setDraft(undefined);
                      setDirty(false);
                      setService(undefined);
                      setMessage(
                        `Backup restored. Choose a restored service. Output stays stopped.${prepared.compatibilityIssues.length ? ` ${prepared.compatibilityIssues.length} legacy issue(s) retained; inspect library items before editing.` : ""}`,
                      );
                    });
                }}
              />
            </label>
          </div>{" "}
          <details className="host-transfer-help">
            <summary>Moving to another browser or website?</summary>
            <p>
              This browser stores your library for{" "}
              <strong>{location.host}</strong>. Other browsers and websites have
              separate libraries; content does not sync automatically.
            </p>
            <ol>
              <li>
                On the original site, use <strong>Export full backup</strong>{" "}
                above and keep the ZIP file on your device.
              </li>
              <li>
                Open Library on the destination site and use{" "}
                <strong>Restore backup</strong> above to choose that ZIP file.
              </li>
              <li>
                Restore replaces content on the destination. Export its existing
                library first if you need to keep it, and stop presentations
                before restoring.
              </li>
            </ol>
            <p>
              Backup and restore use a local file. Songs, services and media are
              not uploaded to a server.
            </p>
          </details>
          {migrations.map((record) => (
            <details key={record.id}>
              <summary>v1 conversion report: {record.sourceName}</summary>
              <p>Source SHA-256: {record.sourceHash}</p>
              <ul>
                {record.report.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
              <button
                onClick={() =>
                  download(
                    new Blob([record.originalJson], {
                      type: "application/json",
                    }),
                    "v1-retained-data.json",
                  )
                }
              >
                Download retained v1 data
              </button>
            </details>
          ))}
          <div className="storage-tools">
            <p>{storage}</p>
            <button
              onClick={() =>
                void run(async () => {
                  const persisted = await navigator.storage?.persist?.();
                  const estimate = await navigator.storage?.estimate?.();
                  const ratio = estimate?.quota
                    ? (estimate.usage ?? 0) / estimate.quota
                    : 0;
                  setStorage(
                    `${persisted ? "Persistent storage granted" : "Persistence not granted; keep backups"} · ${((estimate?.usage ?? 0) / 1024 / 1024).toFixed(1)} MB used${ratio > 0.8 ? " · Storage almost full! Export a backup and free space." : ""}`,
                  );
                })
              }
            >
              Check storage & request persistence
            </button>
          </div>{" "}
        </div>
      </details>
      <p className="library-message" role="status">
        {message}
      </p>
      {!showPlanner && !services.length && (
        <p className="library-empty-service">
          Create a service in Services before adding a song.
        </p>
      )}
      {importOpen && (
        <dialog
          ref={importDialog}
          className="library-dialog"
          aria-labelledby="library-import-title"
          onCancel={(e) => {
            e.preventDefault();
            setImportOpen(false);
          }}
        >
          <div className="section-heading">
            <h2 id="library-import-title">Import into Library</h2>
            <button onClick={() => setImportOpen(false)}>Close import</button>
          </div>
          <p>Images and video are stored locally on this device.</p>
          <label className="file-button">
            Choose images or video
            <input
              aria-label="Import images or video"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void importFiles(files);
              }}
            />
          </label>
          <h3>Moving an existing song library?</h3>
          <p>
            Restore a Sanctuary backup ZIP through Library tools. Restore
            replaces destination content; export its current backup first.
          </p>
          <button
            onClick={() => {
              setImportOpen(false);
              if (tools.current) tools.current.open = true;
            }}
          >
            Open backup tools
          </button>
        </dialog>
      )}
      {addOpen && (
        <dialog
          ref={addDialog}
          className="library-dialog"
          aria-labelledby="library-add-title"
          onCancel={(e) => {
            e.preventDefault();
            setAddOpen(false);
          }}
        >
          <div className="section-heading">
            <h2 id="library-add-title">Add to service</h2>
            <button onClick={() => setAddOpen(false)}>Cancel</button>
          </div>
          <p>
            Add a separate service copy of{" "}
            {tab === "media"
              ? media.find((m) => m.id === selectedMedia)?.title
              : draft?.title}
            . Live output stays unchanged.
          </p>
          <label>
            Destination service
            <select
              value={addTarget}
              onChange={(e) => setAddTarget(e.target.value)}
            >
              {services.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.title}
                </option>
              ))}
            </select>
          </label>
          {tab !== "media" && draft?.kind === "song" && (
            <label>
              Song order
              <select
                value={arrangement}
                onChange={(e) => setArrangement(e.target.value)}
              >
                <option value="">Default song order</option>
                {draft.arrangements.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            className="primary"
            disabled={adding || !addTarget}
            onClick={() => {
              setAddOpen(false);
              onAddToService?.({
                serviceId: addTarget,
                ...(tab === "media"
                  ? { mediaId: selectedMedia }
                  : { contentId: draft?.id, arrangementId: arrangement }),
              });
            }}
          >
            Add selected item
          </button>
        </dialog>
      )}
      <div className="library-columns">
        <section className="library-list">
          <div className="tabs" role="tablist" aria-label="Content library">
            {(["song", "slides", "media"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => {
                  if (
                    t !== tab &&
                    (dirty || pasteStaging) &&
                    !confirm("Discard unsaved library edits and staged lyrics?")
                  )
                    return;
                  setTab(t);
                  if (t !== tab) {
                    setDraft(undefined);
                    setDirty(false);
                    setPasteStaging(false);
                    setEditing(false);
                    setDetailOpen(false);
                  }
                  setSearchLanguage("");
                  setSearchTag("");
                }}
              >
                {t === "song" ? "Songs" : t === "slides" ? "Slides" : "Media"}
              </button>
            ))}
          </div>
          <label>
            Search library
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          {tab !== "media" && (
            <details
              className="library-filters"
              open={showPlanner || undefined}
            >
              <summary>
                Filters and sort{searchLanguage || searchTag ? " · active" : ""}
              </summary>
              <SearchFilters
                contents={content.filter((content) => content.kind === tab)}
                language={searchLanguage}
                tag={searchTag}
                onLanguage={setSearchLanguage}
                onTag={setSearchTag}
              />
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="title">Title</option>
                  <option value="number">Song number</option>
                </select>
              </label>
            </details>
          )}
          {tab !== "media" ? (
            <>
              <button
                hidden={!showPlanner}
                onClick={() => edit(newContent(tab))}
              >
                New {tab === "song" ? "song" : "slides"}
              </button>
              <div
                className="content-results"
                ref={results}
                aria-label="Library results"
              >
                {visible.map((c) => (
                  <button
                    key={c.id}
                    className={
                      "library-row " + (draft?.id === c.id ? "selected" : "")
                    }
                    aria-pressed={draft?.id === c.id}
                    onClick={() => edit(c)}
                  >
                    <strong>{c.title}</strong>
                    {matchExcerpt(c, query) && (
                      <small className="search-excerpt">
                        {matchExcerpt(c, query)}
                      </small>
                    )}
                    <small>
                      {c.indexNumber && `${c.indexNumber} · `}
                      {c.primaryLanguage}
                      {c.secondaryLanguage && ` / ${c.secondaryLanguage}`}
                    </small>
                  </button>
                ))}
                {!visible.length && (
                  <p className="muted">
                    {query || searchLanguage || searchTag
                      ? "No matches. Try fewer words or clear the filters."
                      : `No ${tab === "song" ? "songs" : "slide sets"} yet. Create one to get started.`}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <label className="file-button">
                Import images or video
                <input
                  aria-label="Import media"
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,video/mp4,video/webm,video/quicktime"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    void run(async () => {
                      for (const file of files) await db.importMedia(file);
                      setMessage(
                        "Media stored locally. Rehearse video formats in each browser before use.",
                      );
                    });
                  }}
                />
              </label>
              <p className="muted">
                Up to 200 MB per file. PNG/JPEG/WebP/GIF/BMP, MP4/WebM/MOV.
                Codec support varies.
              </p>
              {media
                .filter((m) =>
                  m.title.toLowerCase().includes(query.toLowerCase()),
                )
                .map((m) => (
                  <div
                    className={
                      "media-row" + (selectedMedia === m.id ? " selected" : "")
                    }
                    key={m.id}
                  >
                    {!showPlanner && (
                      <button
                        onClick={() => {
                          setSelectedMedia(m.id);
                          setDetailOpen(true);
                          editor.current?.scrollTo({ top: 0 });
                        }}
                        aria-pressed={selectedMedia === m.id}
                      >
                        Select {m.title}
                      </button>
                    )}
                    <MediaThumbnail asset={m} />
                    <strong>{m.title}</strong>
                    <small>
                      {m.kind} · {(m.size / 1024 / 1024).toFixed(1)} MB
                      {m.width && m.height ? ` · ${m.width} × ${m.height}` : ""}
                      {m.duration !== undefined
                        ? ` · ${m.duration.toFixed(1)} s`
                        : ""}
                    </small>
                    <button
                      hidden={!showPlanner}
                      onClick={() =>
                        void run(async () => {
                          const title = prompt("Media title", m.title);
                          if (title?.trim())
                            await db.media.update(m.id, {
                              title: title.trim(),
                            });
                        })
                      }
                    >
                      Rename
                    </button>
                    <button
                      hidden={!showPlanner}
                      onClick={() =>
                        void run(async () => {
                          const refs = await db.references(m.id);
                          if (refs.length)
                            throw Error("Media is in use: " + refs.join(", "));
                          if (
                            confirm(
                              `Delete “${m.title}”? Export a backup first.`,
                            )
                          )
                            await db.deleteMedia(m.id);
                        })
                      }
                    >
                      Delete
                    </button>
                    <button
                      hidden={!showPlanner}
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          if (!service)
                            throw Error("Create or choose a service first.");
                          const c = newContent("slides");
                          c.title = m.title;
                          c.pages[0].mediaId = m.id;
                          await saveService({
                            ...service,
                            items: [...service.items, makeItem(c)],
                          });
                          setMessage("Media item added to the service.");
                        })
                      }
                    >
                      Add to service
                    </button>
                  </div>
                ))}
            </>
          )}
        </section>
        <section className="content-editor" ref={editor}>
          {!showPlanner && (
            <button className="library-back" onClick={backToSongs}>
              Back to{" "}
              {tab === "song" ? "songs" : tab === "slides" ? "slides" : "media"}
            </button>
          )}
          <span className="eyebrow">
            {showPlanner
              ? "LIBRARY MASTER"
              : editing
                ? "EDIT · LIBRARY SONG"
                : "BROWSE · LIBRARY"}
          </span>
          {!showPlanner && tab !== "media" && draft && (
            <div className="library-editor-heading">
              <div>
                {editing ? (
                  <label className="library-title-field">
                    {draft.kind === "song" ? "Song title" : "Slides title"}
                    <input
                      aria-label="Library title"
                      placeholder="Enter a title"
                      value={draft.title}
                      onChange={(e) =>
                        update((c) => {
                          c.title = e.target.value;
                        })
                      }
                    />
                  </label>
                ) : (
                  <h2>{draft.title || "Untitled song"}</h2>
                )}
                <span role="status">
                  {dirty
                    ? "Unsaved changes"
                    : "Saved to Library · Service copies unchanged"}
                </span>
              </div>
              <div className="actions">
                {editing ? (
                  <>
                    <button
                      className="primary"
                      disabled={busy || pasteStaging}
                      onClick={() => void run(saveDraft)}
                    >
                      {draft.kind === "song" ? "Save song" : "Save slides"}
                    </button>
                    <button onClick={cancelEditing} disabled={busy}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditorTab("lyrics");
                      setEditing(true);
                    }}
                  >
                    Edit {draft.kind === "song" ? "song" : "slides"}
                  </button>
                )}
                <details className="library-song-options">
                  <summary>Song options</summary>
                  <div className="library-song-menu">
                    <button
                      disabled={busy || dirty || pasteStaging}
                      onClick={() =>
                        void run(async () => {
                          const saved = await db.content.get(draft.id);
                          if (!saved)
                            throw Error("The saved song was deleted.");
                          const copy = cloneContent(saved);
                          await db.saveContent(copy);
                          setDraft(copy);
                          setSectionIndex(0);
                          setPageIndex(0);
                          setDirty(false);
                          setEditing(false);
                          setMessage("Independent library copy created.");
                        })
                      }
                    >
                      Duplicate library item
                    </button>
                    <button
                      disabled={busy || dirty || pasteStaging}
                      onClick={() => void run(() => removeContent(draft))}
                    >
                      Delete library item
                    </button>
                  </div>
                </details>
              </div>
              {editing && (
                <div
                  className="library-editor-tabs"
                  role="tablist"
                  aria-label="Song editor"
                  onKeyDown={(event) => {
                    if (
                      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    )
                      return;
                    event.preventDefault();
                    event.stopPropagation();
                    const tabs = Array.from(
                      event.currentTarget.querySelectorAll<HTMLButtonElement>(
                        "[role=tab]",
                      ),
                    );
                    const index = tabs.indexOf(
                      document.activeElement as HTMLButtonElement,
                    );
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tabs.length - 1
                          : (index +
                              (event.key === "ArrowRight" ? 1 : -1) +
                              tabs.length) %
                            tabs.length;
                    tabs[next]?.focus();
                    tabs[next]?.click();
                  }}
                >
                  {(["lyrics", "order", "details"] as const)
                    .filter((key) => draft.kind === "song" || key !== "order")
                    .map((key) => (
                      <button
                        key={key}
                        id={`library-tab-${key}`}
                        role="tab"
                        tabIndex={editorTab === key ? 0 : -1}
                        aria-selected={editorTab === key}
                        aria-controls={`library-panel-${key}`}
                        onClick={() => setEditorTab(key)}
                      >
                        {key === "lyrics"
                          ? "Lyrics"
                          : key === "order"
                            ? "Song order"
                            : "Details"}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
          {!showPlanner &&
            draft &&
            editing &&
            draft.kind === "song" &&
            contentCompatibilityIssues(draft).length === 0 && (
              <div
                className="library-song-paste"
                hidden={editorTab !== "lyrics"}
              >
                <PasteLyrics
                  modal
                  key={draft.id}
                  content={draft}
                  onStagingChange={setPasteStaging}
                  onChange={update}
                  onSelect={(sectionIndex) => {
                    setSectionIndex(sectionIndex);
                    setPageIndex(0);
                  }}
                />
              </div>
            )}
          {!showPlanner && tab === "media" ? (
            <div className="library-media-detail">
              <h2>
                {media.find((asset) => asset.id === selectedMedia)?.title ??
                  "Choose a media item"}
              </h2>
              {media
                .filter((asset) => asset.id === selectedMedia)
                .map((asset) => (
                  <div key={asset.id}>
                    <MediaThumbnail asset={asset} />
                    <p>
                      {asset.kind} · {(asset.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <p>Use Add to service to add a separate service copy.</p>
                    <div className="actions">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const title = prompt("Media title", asset.title);
                            if (title?.trim())
                              await db.media.update(asset.id, {
                                title: title.trim(),
                              });
                          })
                        }
                      >
                        Rename
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const refs = await db.references(asset.id);
                            if (refs.length)
                              throw Error(
                                "Media is in use: " + refs.join(", "),
                              );
                            if (
                              confirm(
                                `Delete “${asset.title}”? Export a backup first.`,
                              )
                            ) {
                              await db.deleteMedia(asset.id);
                              setSelectedMedia(undefined);
                              setDetailOpen(false);
                            }
                          })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : !showPlanner && draft && !editing ? (
            <LibraryDetails
              content={draft}
              sectionIndex={sectionIndex}
              pageIndex={pageIndex}
              onSection={(index) => {
                setSectionIndex(index);
                setPageIndex(0);
              }}
              onPage={setPageIndex}
            />
          ) : (
            <>
              {draft ? (
                <>
                  <div className="section-heading" hidden={!showPlanner}>
                    <h2>Edit {draft.kind === "song" ? "song" : "slides"}</h2>
                    <span className="muted">
                      {dirty
                        ? "Unsaved library edits"
                        : "Saved / ready to edit"}
                    </span>
                  </div>
                  {similarSongs(searchIndex, draft).length > 0 && (
                    <p role="status">
                      Similar items already in Library:{" "}
                      {similarSongs(searchIndex, draft)
                        .map((content) => content.title)
                        .join(", ")}
                      . Saving keeps this as a separate item.
                    </p>
                  )}
                  <div
                    hidden={!showPlanner && editorTab !== "details"}
                    role={showPlanner ? undefined : "tabpanel"}
                    id="library-panel-details"
                    aria-labelledby={
                      showPlanner ? undefined : "library-tab-details"
                    }
                  >
                    <details className="library-song-details" open={true}>
                      <summary>
                        Song details — title, languages and credits
                      </summary>
                      {showPlanner && (
                        <label>
                          Library title
                          <input
                            value={draft.title}
                            onChange={(e) =>
                              update((c) => {
                                c.title = e.target.value;
                              })
                            }
                          />
                        </label>
                      )}
                      <div className="field-pair">
                        <label>
                          Primary language
                          <input
                            value={draft.primaryLanguage}
                            onChange={(e) =>
                              update((c) => {
                                c.primaryLanguage = e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Secondary language
                          <input
                            value={draft.secondaryLanguage}
                            onChange={(e) =>
                              update((c) => {
                                c.secondaryLanguage = e.target.value;
                              })
                            }
                          />
                        </label>
                      </div>
                      {draft.kind === "song" && (
                        <>
                          <label>
                            Song number
                            <input
                              value={draft.indexNumber}
                              onChange={(e) =>
                                update((c) => {
                                  c.indexNumber = e.target.value;
                                })
                              }
                            />
                          </label>
                          <details>
                            <summary>Rights & metadata</summary>
                            {(
                              [
                                "author",
                                "copyright",
                                "ccliNumber",
                                "rightsStatus",
                                "copyrightYear",
                                "publisher",
                                "licenceNote",
                                "tags",
                              ] as const
                            ).map((key) => (
                              <label key={key}>
                                {
                                  {
                                    author: "Author",
                                    copyright: "Copyright",
                                    ccliNumber: "CCLI number",
                                    rightsStatus: "Rights status",
                                    copyrightYear: "Copyright year",
                                    publisher: "Publisher",
                                    licenceNote: "Licence note",
                                    tags: "Tags",
                                  }[key]
                                }
                                <input
                                  value={draft[key]}
                                  onChange={(e) =>
                                    update((c) => {
                                      c[key] = e.target.value;
                                    })
                                  }
                                />
                              </label>
                            ))}
                            <label className="check">
                              <input
                                type="checkbox"
                                checked={draft.reportingEnabled}
                                onChange={(e) =>
                                  update((c) => {
                                    c.reportingEnabled = e.target.checked;
                                  })
                                }
                              />
                              Retain reporting eligibility
                            </label>
                            <p className="muted">
                              Usage reporting is retained as metadata; report
                              generation is not available yet.
                            </p>
                          </details>
                        </>
                      )}
                    </details>
                  </div>
                  <div
                    hidden={!showPlanner && editorTab !== "lyrics"}
                    role={showPlanner ? undefined : "tabpanel"}
                    id="library-panel-lyrics"
                    aria-labelledby={
                      showPlanner ? undefined : "library-tab-lyrics"
                    }
                    className={
                      showPlanner ? undefined : "library-writing-layout"
                    }
                  >
                    <aside className="library-section-editor">
                      {" "}
                      {!showPlanner && editing && (
                        <>
                          <div className="library-section-heading">
                            Sections
                          </div>
                          <ReorderNavigation
                            label="Edit song sections"
                            items={draft.sections.map((section) => ({
                              id: section.id,
                              label: section.label,
                              detail: `${section.pages.length} ${section.pages.length === 1 ? "slide" : "slides"}`,
                            }))}
                            selectedId={draft.sections[sectionIndex]?.id}
                            onSelect={(index) => {
                              setSectionIndex(index);
                              setPageIndex(0);
                            }}
                            onMove={(from, to) => {
                              const selected = draft.sections[sectionIndex]?.id;
                              update((c) => {
                                moveSection(c, from, to - from);
                              });
                              const reordered = [...draft.sections];
                              const [moved] = reordered.splice(from, 1);
                              reordered.splice(to, 0, moved);
                              setSectionIndex(
                                reordered.findIndex(
                                  (section) => section.id === selected,
                                ),
                              );
                            }}
                            selectedTools={sectionManagement}
                          />
                        </>
                      )}
                      {draft.kind === "song" && (
                        <>
                          {!showPlanner && (
                            <EditorMenu
                              label="Add section"
                              summaryText="+ Add section"
                              closeOnSelect={false}
                              className="library-add-menu"
                            >
                              <div className="library-add-sections">
                                <label className="library-section-type">
                                  Add section
                                  <select
                                    aria-label="New section type"
                                    value={sectionType}
                                    onChange={(event) =>
                                      setSectionType(event.target.value)
                                    }
                                  >
                                    {[
                                      "Verse",
                                      "Chorus",
                                      "Pre-chorus",
                                      "Bridge",
                                      "Coda",
                                      "Custom",
                                    ].map((type) => (
                                      <option key={type}>{type}</option>
                                    ))}
                                  </select>
                                </label>
                                {sectionType === "Custom" && (
                                  <label className="library-custom-section">
                                    Section name
                                    <input
                                      aria-label="Custom section name"
                                      placeholder="e.g. Refrain"
                                      value={customSectionName}
                                      onChange={(event) =>
                                        setCustomSectionName(event.target.value)
                                      }
                                    />
                                  </label>
                                )}
                                <button
                                  aria-label="Add selected section"
                                  disabled={
                                    sectionType === "Custom" &&
                                    !customSectionName.trim()
                                  }
                                  onClick={() => {
                                    const base =
                                      sectionType === "Custom"
                                        ? customSectionName.trim()
                                        : sectionType;
                                    if (!base) return;
                                    const normalize = (label: string) =>
                                      label
                                        .toLowerCase()
                                        .replace(/^v(?=\d)/, "verse")
                                        .replace(/\s+/g, "");
                                    const used = new Set(
                                      draft.sections.map((section) =>
                                        normalize(section.label),
                                      ),
                                    );
                                    let number = 1;
                                    let label =
                                      sectionType === "Verse"
                                        ? `Verse ${number}`
                                        : base;
                                    while (used.has(normalize(label))) {
                                      number++;
                                      label = `${base} ${number}`;
                                    }
                                    update((c) => {
                                      c.sections.push({
                                        id: id(),
                                        label,
                                        pages: [newPage()],
                                      });
                                      syncAuto(c);
                                    });
                                    setSectionIndex(draft.sections.length);
                                    setPageIndex(0);
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            </EditorMenu>
                          )}
                          {showPlanner &&
                            contentCompatibilityIssues(draft).length === 0 && (
                              <PasteLyrics
                                key={draft.id}
                                content={draft}
                                onStagingChange={setPasteStaging}
                                onChange={update}
                                onSelect={(sectionIndex) => {
                                  setSectionIndex(sectionIndex);
                                  setPageIndex(0);
                                }}
                              />
                            )}

                          {showPlanner && sectionManagement}
                        </>
                      )}
                      {!showPlanner && draft.kind === "song" && (
                        <p className="library-repeat-hint">
                          To repeat the same chorus, use Song order.
                        </p>
                      )}
                    </aside>
                    <div className="library-lyrics-editor">
                      <div className="library-slide-toolbar">
                        {!showPlanner && (
                          <strong className="library-slide-context">
                            {draft.kind === "song"
                              ? draft.sections[sectionIndex]?.label
                              : "Slides"}{" "}
                            · Slide {pageIndex + 1} of{" "}
                            {draft.kind === "song"
                              ? draft.sections[sectionIndex]?.pages.length
                              : draft.pages.length}
                          </strong>
                        )}
                        {!showPlanner && (
                          <ReorderNavigation
                            horizontal
                            label="Section slides"
                            items={(draft.kind === "song"
                              ? (draft.sections[sectionIndex]?.pages ?? [])
                              : draft.pages
                            ).map((slide, index) => ({
                              id: slide.id,
                              label: `Slide ${index + 1}`,
                              excerpt:
                                slide.text.split("\n")[0] ||
                                slide.title ||
                                "Empty slide",
                            }))}
                            selectedId={page?.id}
                            onSelect={setPageIndex}
                            onMove={(from, to) => {
                              const pages =
                                draft.kind === "song"
                                  ? draft.sections[sectionIndex].pages
                                  : draft.pages;
                              const selected = pages[pageIndex]?.id;
                              update((c) => {
                                moveSlide(c, sectionIndex, from, to - from);
                              });
                              const reordered = [...pages];
                              const [moved] = reordered.splice(from, 1);
                              reordered.splice(to, 0, moved);
                              setPageIndex(
                                reordered.findIndex(
                                  (slide) => slide.id === selected,
                                ),
                              );
                            }}
                          />
                        )}
                        <label hidden={!showPlanner}>
                          Slide in {draft.kind === "song" ? "section" : "set"}
                          <select
                            value={pageIndex}
                            onChange={(e) =>
                              setPageIndex(Number(e.target.value))
                            }
                          >
                            {(draft.kind === "song"
                              ? (draft.sections[sectionIndex]?.pages ?? [])
                              : draft.pages
                            ).map((p, i) => (
                              <option key={p.id} value={i}>
                                {i + 1} ·{" "}
                                {p.title ||
                                  p.text.slice(0, 30) ||
                                  "Empty slide"}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="actions">
                          <button
                            onClick={() => {
                              const pages =
                                draft.kind === "song"
                                  ? draft.sections[sectionIndex].pages
                                  : draft.pages;
                              update((c) => {
                                (c.kind === "song"
                                  ? c.sections[sectionIndex].pages
                                  : c.pages
                                ).push(newPage());
                              });
                              setPageIndex(pages.length);
                            }}
                          >
                            Add slide
                          </button>
                        </div>
                        <EditorMenu
                          label={showPlanner ? "Slide tools" : "Slide options"}
                          inline={showPlanner}
                          className="library-slide-menu"
                        >
                          {" "}
                          <button
                            disabled={
                              (draft.kind === "song"
                                ? draft.sections[sectionIndex]?.pages.length
                                : draft.pages.length) < 2
                            }
                            onClick={() => {
                              if (!confirm("Delete this slide?")) return;
                              update((c) => {
                                (c.kind === "song"
                                  ? c.sections[sectionIndex].pages
                                  : c.pages
                                ).splice(pageIndex, 1);
                              });
                              setPageIndex(0);
                            }}
                          >
                            Remove slide
                          </button>{" "}
                          <SlideTools
                            inline={!showPlanner}
                            content={draft}
                            sectionIndex={sectionIndex}
                            pageIndex={pageIndex}
                            onChange={update}
                            onSelect={(selection) => {
                              setSectionIndex(selection.sectionIndex);
                              setPageIndex(selection.pageIndex);
                            }}
                          />
                        </EditorMenu>
                      </div>
                      {page && (
                        <PageEditor
                          page={page}
                          change={changePage}
                          media={media}
                          focused={!showPlanner}
                          languages={
                            showPlanner
                              ? undefined
                              : {
                                  primary: draft.primaryLanguage,
                                  secondary: draft.secondaryLanguage,
                                  change: (channel, language) =>
                                    update((c) => {
                                      c[
                                        channel === "primary"
                                          ? "primaryLanguage"
                                          : "secondaryLanguage"
                                      ] = language;
                                    }),
                                }
                          }
                        />
                      )}{" "}
                    </div>
                  </div>
                  {draft.kind === "song" && (
                    <div
                      hidden={!showPlanner && editorTab !== "order"}
                      role={showPlanner ? undefined : "tabpanel"}
                      id="library-panel-order"
                      aria-labelledby={
                        showPlanner ? undefined : "library-tab-order"
                      }
                    >
                      <details open={!showPlanner ? true : undefined}>
                        <summary>
                          {showPlanner ? "Arrangements" : "Saved song orders"}
                        </summary>
                        {!showPlanner && (
                          <p className="muted">
                            Repeat sections here without duplicating their
                            lyrics. Editing this order leaves existing service
                            copies unchanged.
                          </p>
                        )}
                        {draft.arrangements.map((a, i) => (
                          <div className="arrangement" key={a.id}>
                            <label>
                              Arrangement name
                              <input
                                value={a.name}
                                onChange={(e) =>
                                  update((c) => {
                                    c.arrangements[i].name = e.target.value;
                                  })
                                }
                              />
                            </label>
                            <label className="check">
                              <input
                                type="radio"
                                name="default-arrangement"
                                checked={a.isDefault}
                                onChange={() =>
                                  update((c) => {
                                    c.arrangements.forEach((x, j) => {
                                      x.isDefault = j === i;
                                    });
                                  })
                                }
                              />
                              Default arrangement
                            </label>
                            <label className="check">
                              <input
                                type="checkbox"
                                checked={a.auto}
                                onChange={(e) =>
                                  update((c) => {
                                    c.arrangements[i].auto = e.target.checked;
                                    syncAuto(c);
                                  })
                                }
                              />
                              Auto: follow section order
                            </label>
                            {!showPlanner && (
                              <ol className="library-order-entries">
                                {a.sectionIds.map((key, position) => (
                                  <li key={`${key}-${position}`}>
                                    <span>
                                      {draft.sections.find(
                                        (section) => section.id === key,
                                      )?.label || "Missing section"}
                                    </span>
                                    <div className="actions">
                                      {([-1, 1] as const).map((direction) => (
                                        <button
                                          key={direction}
                                          disabled={
                                            position + direction < 0 ||
                                            position + direction >=
                                              a.sectionIds.length
                                          }
                                          aria-label={`${direction < 0 ? "Move earlier" : "Move later"} · position ${position + 1}`}
                                          onClick={() =>
                                            update((c) => {
                                              const order = c.arrangements[i];
                                              order.auto = false;
                                              [
                                                order.sectionIds[position],
                                                order.sectionIds[
                                                  position + direction
                                                ],
                                              ] = [
                                                order.sectionIds[
                                                  position + direction
                                                ],
                                                order.sectionIds[position],
                                              ];
                                            })
                                          }
                                        >
                                          {direction < 0
                                            ? "Move earlier"
                                            : "Move later"}
                                        </button>
                                      ))}
                                      <button
                                        aria-label={`Remove · position ${position + 1}`}
                                        disabled={a.sectionIds.length < 2}
                                        onClick={() =>
                                          update((c) => {
                                            c.arrangements[i].auto = false;
                                            c.arrangements[i].sectionIds.splice(
                                              position,
                                              1,
                                            );
                                          })
                                        }
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            )}
                            <p className="muted">
                              Sequence:{" "}
                              {a.sectionIds
                                .map(
                                  (key) =>
                                    draft.sections.find((s) => s.id === key)
                                      ?.label || "?",
                                )
                                .join(" → ")}
                            </p>
                            <div className="actions">
                              {draft.sections.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() =>
                                    update((c) => {
                                      c.arrangements[i].auto = false;
                                      c.arrangements[i].sectionIds.push(s.id);
                                    })
                                  }
                                >
                                  {showPlanner ? "Append" : "Add to order:"}{" "}
                                  {s.label}
                                </button>
                              ))}
                              <button
                                disabled={a.sectionIds.length < 2}
                                onClick={() =>
                                  update((c) => {
                                    c.arrangements[i].auto = false;
                                    c.arrangements[i].sectionIds.pop();
                                  })
                                }
                              >
                                Remove last entry
                              </button>
                              <button
                                onClick={() =>
                                  update((c) => {
                                    c.arrangements[i].auto = false;
                                    c.arrangements[i].sectionIds =
                                      c.sections.map((s) => s.id);
                                  })
                                }
                              >
                                {showPlanner
                                  ? "Reset sequence"
                                  : "Use section order"}
                              </button>
                              <button
                                disabled={draft.arrangements.length < 2}
                                onClick={() =>
                                  update((c) => {
                                    c.arrangements.splice(i, 1);
                                    if (
                                      !c.arrangements.some((a) => a.isDefault)
                                    )
                                      c.arrangements[0].isDefault = true;
                                  })
                                }
                              >
                                Delete arrangement
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            update((c) => {
                              c.arrangements.push({
                                id: id(),
                                name: "Custom " + (c.arrangements.length + 1),
                                sectionIds: c.sections.map((s) => s.id),
                                isDefault: false,
                                auto: false,
                              });
                            })
                          }
                        >
                          {showPlanner ? "New arrangement" : "New song order"}
                        </button>
                      </details>
                    </div>
                  )}
                  {contentCompatibilityIssues(draft).length > 0 && (
                    <div role="alert">
                      <p>
                        Legacy content needs review. The saved original and its
                        hidden data are retained.
                      </p>
                      <ul>
                        {contentCompatibilityIssues(draft).map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            if (
                              !confirm(
                                "Create an editable copy of the currently visible content? Hidden branches remain only in the saved original. Inconsistent automatic orders become Custom without changing their sequence. Existing services are unchanged. Export a backup first.",
                              )
                            )
                              return;
                            const original = await db.content.get(draft.id);
                            if (!original)
                              throw Error(
                                "Save/export the original before creating a recovery copy.",
                              );
                            const copy = editableContentCopy(draft);
                            await db.saveContent(copy);
                            setDraft(copy);
                            setSectionIndex(0);
                            setPageIndex(0);
                            setDirty(false);
                            setMessage(
                              "Editable copy created. The saved original, hidden content and existing services were retained.",
                            );
                          })
                        }
                      >
                        Create editable copy
                      </button>
                    </div>
                  )}
                  <div className="actions">
                    <button
                      className="primary"
                      hidden={!showPlanner}
                      disabled={busy || pasteStaging}
                      onClick={() =>
                        void run(async () => {
                          await saveDraft();
                        })
                      }
                    >
                      Save library item
                    </button>
                    <button
                      hidden={!showPlanner}
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const copy = cloneContent(draft);
                          await db.saveContent(copy);
                          setDraft(copy);
                          setDirty(false);
                          setMessage("Independent library copy created.");
                        })
                      }
                    >
                      Duplicate library item
                    </button>
                    <button
                      hidden={!showPlanner}
                      disabled={busy}
                      onClick={() => void run(() => removeContent(draft))}
                    >
                      Delete library item
                    </button>
                  </div>
                  {draft.kind === "song" && (
                    <label hidden={!showPlanner}>
                      Arrangement to add
                      <select
                        value={arrangement}
                        onChange={(e) => setArrangement(e.target.value)}
                      >
                        <option value="">Default arrangement</option>
                        {draft.arrangements.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button
                    hidden={!showPlanner}
                    disabled={busy || dirty}
                    onClick={() =>
                      void run(async () => {
                        if (!service)
                          throw Error("Create or choose a service first.");
                        await saveService({
                          ...service,
                          items: [
                            ...service.items,
                            makeItem(draft, arrangement),
                          ],
                        });
                        setMessage("Independent copy added to service.");
                      })
                    }
                  >
                    Add library item to service
                  </button>
                </>
              ) : (
                <p className="muted">
                  Choose a library item or create one. Service copies have their
                  own content, notes and design.
                </p>
              )}
            </>
          )}
        </section>
        <section className="planner" hidden={!showPlanner}>
          <span className="eyebrow">SERVICE ORDER</span>
          <label>
            Saved service
            <select
              value={service?.id || ""}
              onChange={(e) => {
                const found = services.find((s) => s.id === e.target.value);
                setService(found ? structuredClone(found) : undefined);
                setItemIndex(0);
                setServicePage(0);
                if (found)
                  void db.settings.put({
                    key: "selectedService",
                    value: found.id,
                  });
              }}
            >
              <option value="">Choose service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() =>
              void run(async () => {
                const next: ServiceOrder = {
                  id: id(),
                  title: "New service",
                  date: new Date().toLocaleDateString("en-CA"),
                  items: [],
                  createdAt: now(),
                  updatedAt: now(),
                };
                await saveService(next);
                setItemIndex(0);
              })
            }
          >
            New service
          </button>
          {service && (
            <>
              <label>
                Service title
                <input
                  value={service.title}
                  onChange={(e) => {
                    setService({ ...service, title: e.target.value });
                  }}
                  onBlur={() => updateService(() => {})}
                />
              </label>
              <label>
                Service date
                <input
                  type="date"
                  value={service.date}
                  onChange={(e) =>
                    updateService((s) => {
                      s.date = e.target.value;
                    })
                  }
                />
              </label>
              <div className="actions">
                <button
                  onClick={() =>
                    void run(async () => {
                      const copy = structuredClone(service);
                      copy.id = id();
                      delete copy.revision;
                      delete copy.revisionToken;
                      copy.title += " (copy)";
                      copy.items.forEach((i) => {
                        i.id = id();
                      });
                      copy.createdAt = now();
                      await saveService(copy);
                      setItemIndex(0);
                    })
                  }
                >
                  Duplicate service
                </button>
                <button
                  onClick={() =>
                    void run(async () => {
                      if (
                        !confirm(
                          `Delete service “${service.title}”? Export a backup first.`,
                        )
                      )
                        return;
                      await db.transaction(
                        "rw",
                        db.services,
                        db.settings,
                        async () => {
                          await db.deleteService(service);
                          const selected =
                            await db.settings.get("selectedService");
                          if (selected?.value === service.id)
                            await db.settings.delete("selectedService");
                        },
                      );
                      setService(undefined);
                    })
                  }
                >
                  Delete service
                </button>
              </div>
              <details className="service-design">
                <summary>Service design & output profile</summary>
                <ProfileEditor
                  profile={service.profile}
                  change={(profile) =>
                    updateService((s) => {
                      s.profile = profile;
                    })
                  }
                />
                <StyleEditor
                  style={{ ...profileStyle(service.profile), ...service.style }}
                  change={(style) =>
                    updateService((s) => {
                      s.style = style;
                    })
                  }
                />
                <button
                  onClick={() =>
                    updateService((s) => {
                      s.style = undefined;
                    })
                  }
                >
                  Use output profile defaults
                </button>
                <BackgroundEditor
                  scope="Service"
                  media={media}
                  value={service.backgroundDesign}
                  change={(backgroundDesign) =>
                    updateService((s) => {
                      s.backgroundDesign = backgroundDesign;
                    })
                  }
                />
              </details>
              <ol className="service-plan-list">
                {service.items.map((it, i) => (
                  <li key={it.id}>
                    <button
                      className={itemIndex === i ? "selected" : ""}
                      onClick={() => {
                        setItemIndex(i);
                        setServicePage(0);
                      }}
                    >
                      {i + 1}. {it.title}
                      {it.nonPresenting ? " · Section" : ""}
                    </button>
                  </li>
                ))}
              </ol>
              {!service.items.length && (
                <p className="muted">
                  Add library items or media to this service.
                </p>
              )}
              {item && (
                <>
                  <div className="actions">
                    <button
                      disabled={itemIndex === 0 || busy}
                      onClick={() => {
                        updateService((s) => {
                          s.items = reorder(s.items, itemIndex, -1);
                        });
                        setItemIndex(itemIndex - 1);
                        setServicePage(0);
                      }}
                    >
                      Item ↑
                    </button>
                    <button
                      disabled={itemIndex === service.items.length - 1 || busy}
                      onClick={() => {
                        updateService((s) => {
                          s.items = reorder(s.items, itemIndex, 1);
                        });
                        setItemIndex(itemIndex + 1);
                        setServicePage(0);
                      }}
                    >
                      Item ↓
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (
                          !confirm(
                            "Remove this service copy? The library master is preserved.",
                          )
                        )
                          return;
                        updateService((s) => {
                          s.items.splice(itemIndex, 1);
                        });
                        setItemIndex(0);
                        setServicePage(0);
                      }}
                    >
                      Remove item
                    </button>
                  </div>
                  <h3>Selected service copy</h3>
                  {item.nonPresenting && <p>Section heading · not projected</p>}
                  <p className="muted">
                    Edits here save locally and do not change the library
                    master. Use Present this service to load saved changes into
                    the operator.
                  </p>
                  <label>
                    Service item title
                    <input
                      value={item.title}
                      onChange={(e) =>
                        itemChange((i) => {
                          i.title = e.target.value;
                        })
                      }
                    />
                  </label>
                  <label>
                    Operator notes
                    <textarea
                      aria-label="Service operator notes"
                      value={item.notes}
                      onChange={(e) =>
                        itemChange((i) => {
                          i.notes = e.target.value;
                        })
                      }
                    />
                  </label>
                  {item.snapshot.kind === "song" && (
                    <>
                      <label>
                        Service arrangement
                        <select
                          value=""
                          onChange={(e) => {
                            const a = item.snapshot.arrangements.find(
                              (a) => a.id === e.target.value,
                            );
                            if (a)
                              itemChange((i) => {
                                i.sectionOrder = [...a.sectionIds];
                              });
                            setServicePage(0);
                          }}
                        >
                          <option value="">Choose arrangement to apply</option>
                          {item.snapshot.arrangements.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="muted">
                        {item.sectionOrder
                          .map(
                            (id) =>
                              item.snapshot.sections.find((s) => s.id === id)
                                ?.label,
                          )
                          .join(" → ")}
                      </p>
                      <div className="actions">
                        {item.snapshot.sections.map((s) => (
                          <button
                            key={s.id}
                            disabled={busy}
                            onClick={() =>
                              itemChange((i) => {
                                i.sectionOrder.push(s.id);
                              })
                            }
                          >
                            Append {s.label}
                          </button>
                        ))}
                        <button
                          disabled={busy || item.sectionOrder.length < 2}
                          onClick={() => {
                            itemChange((i) => {
                              i.sectionOrder.pop();
                            });
                            setServicePage(0);
                          }}
                        >
                          Remove last entry
                        </button>
                      </div>
                    </>
                  )}
                  <details className="item-design">
                    <summary>Item design override</summary>
                    <label>
                      Item typography
                      <select
                        aria-label="Item typography"
                        value={item.typographyMode ?? "custom"}
                        onChange={(e) =>
                          itemChange((i) => {
                            i.typographyMode = e.target.value as
                              "inherit" | "custom";
                          })
                        }
                      >
                        <option value="inherit">
                          Inherit service / profile
                        </option>
                        <option value="custom">Custom item override</option>
                      </select>
                    </label>
                    <StyleEditor
                      style={{
                        ...profileStyle(service.profile),
                        ...service.style,
                        ...item.overrides,
                      }}
                      change={(style) =>
                        itemChange((i) => {
                          i.overrides = style;
                          i.typographyMode = "custom";
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        itemChange((i) => {
                          i.overrides = {};
                          i.typographyMode = "inherit";
                        })
                      }
                    >
                      Use slide designs
                    </button>
                  </details>
                  <details>
                    <summary>Item background</summary>
                    <BackgroundEditor
                      scope="Item"
                      media={media}
                      value={item.backgroundDesign}
                      change={(backgroundDesign) =>
                        itemChange((i) => {
                          i.backgroundDesign = backgroundDesign;
                        })
                      }
                    />
                  </details>
                  <label>
                    Service slide
                    <select
                      value={servicePage}
                      onChange={(e) => setServicePage(Number(e.target.value))}
                    >
                      {itemPages.map((p, i) => (
                        <option key={i} value={i}>
                          {i + 1} ·{" "}
                          {p.title || p.text.slice(0, 30) || "Empty slide"}
                        </option>
                      ))}
                    </select>
                  </label>
                  {itemPages[servicePage] && (
                    <PageEditor
                      media={media}
                      page={itemPages[servicePage]}
                      previewPage={{
                        ...itemPages[servicePage],
                        style: resolveStyle(
                          service,
                          item,
                          itemPages[servicePage],
                        ),
                        backgroundDesign: servicePages(service).find(
                          (p) =>
                            p.itemId === item.id &&
                            p.sourcePageId === itemPages[servicePage].id,
                        )?.backgroundDesign,
                      }}
                      change={(page) =>
                        itemChange((i) => {
                          const pages = [
                            ...i.snapshot.pages,
                            ...i.snapshot.sections.flatMap((s) => s.pages),
                          ];
                          const target = pages.find((p) => p.id === page.id);
                          if (target) Object.assign(target, page);
                        })
                      }
                    />
                  )}
                </>
              )}
              <button
                className="primary"
                disabled={!service.items.length || busy}
                onClick={() =>
                  void run(async () => {
                    await saveService(service);
                    onPresent(service);
                  })
                }
              >
                Present this service
              </button>
              <p className="muted">
                {servicePages(service).length} projected slides · output starts
                black
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
