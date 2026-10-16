import { useEffect, useRef, useState } from "react";
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
function PageEditor({
  page,
  change,
  media,
  previewPage,
}: {
  page: Page;
  change: (p: Page) => void;
  media: { id: string; title: string; kind?: string }[];
  previewPage?: Page;
}) {
  return (
    <>
      <label>
        Slide heading
        <input
          value={page.title}
          onChange={(e) => change({ ...page, title: e.target.value })}
        />
      </label>
      <label>
        Primary text
        <textarea
          rows={5}
          aria-label="Primary text"
          value={page.text}
          onChange={(e) => change({ ...page, text: e.target.value })}
        />
      </label>
      <label>
        Secondary text
        <textarea
          rows={3}
          aria-label="Secondary text"
          value={page.secondary}
          onChange={(e) => change({ ...page, secondary: e.target.value })}
        />
      </label>
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
      <div className="small-preview">
        <SlideFrame page={previewPage ?? page} />
      </div>
    </>
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
}: {
  request?: { serviceId: string; token: string };
  onPresent: (service: ServiceOrder) => void;
  canRestore: boolean;
  onRestored: () => void;
}) {
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
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function edit(c: Content) {
    if (dirty && !confirm("Discard unsaved library edits?")) return;
    setDraft(structuredClone(c));
    setSectionIndex(0);
    setPageIndex(0);
    setDirty(!content.some((item) => item.id === c.id));
    setArrangement("");
    setTab(c.kind);
  }
  function update(mutator: (c: Content) => void) {
    if (!draft) return;
    const c = structuredClone(draft);
    mutator(c);
    setDraft(c);
    setDirty(true);
  }
  async function saveService(next: ServiceOrder) {
    await db.saveService(next);
    setService(next);
    await db.settings.put({ key: "selectedService", value: next.id });
  }
  function updateService(mutator: (s: ServiceOrder) => void) {
    if (!service) return;
    const next = structuredClone(service);
    mutator(next);
    setService(next);
    void run(async () => {
      await db.saveService(next);
      setMessage("Service changes saved locally.");
    });
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
  const visible = content
    .filter(
      (c) =>
        c.kind === tab &&
        `${c.title} ${c.indexNumber} ${c.tags} ${c.author} ${c.sections.flatMap((s) => s.pages.map((p) => p.text + " " + p.secondary)).join(" ")} ${c.pages.map((p) => p.text + " " + p.secondary).join(" ")}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
    )
    .sort((a, b) =>
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
    await db.content.delete(c.id);
    if (draft?.id === c.id) {
      setDraft(undefined);
      setDirty(false);
    }
    setMessage("Library item deleted. Existing service copies are preserved.");
  }
  function itemChange(mutator: (item: ServiceItem) => void) {
    updateService((s) => mutator(s.items[itemIndex]));
  }
  return (
    <main className="library-workspace">
      <div className="library-toolbar">
        <div>
          <span className="eyebrow">LOCAL LIBRARY & SERVICE PLANNER</span>
          <h2>Prepare your service</h2>
        </div>
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
                    if (
                      !confirm(
                        `Replace all local content with this validated backup (${prepared.manifest.counts.content} library items, ${prepared.manifest.counts.services} services)? Export your current backup first.`,
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
                      "Backup restored. Choose a restored service. Output stays stopped.",
                    );
                  });
              }}
            />
          </label>
        </div>
      </div>
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
                new Blob([record.originalJson], { type: "application/json" }),
                "v1-retained-data.json",
              )
            }
          >
            Download retained v1 data
          </button>
        </details>
      ))}
      <p className="library-message" role="status">
        {message}
      </p>
      <div className="library-columns">
        <section className="library-list">
          <div className="tabs" role="tablist" aria-label="Content library">
            {(["song", "slides", "media"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
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
          {tab !== "media" ? (
            <>
              <label>
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="title">Title</option>
                  <option value="number">Song number</option>
                </select>
              </label>
              <button onClick={() => edit(newContent(tab))}>
                New {tab === "song" ? "song" : "slides"}
              </button>
              <div className="content-results">
                {visible.map((c) => (
                  <button
                    key={c.id}
                    className={
                      "library-row " + (draft?.id === c.id ? "selected" : "")
                    }
                    onClick={() => edit(c)}
                  >
                    <strong>{c.title}</strong>
                    <small>
                      {c.indexNumber && `${c.indexNumber} · `}
                      {c.primaryLanguage}
                      {c.secondaryLanguage && ` / ${c.secondaryLanguage}`}
                    </small>
                  </button>
                ))}
                {!visible.length && (
                  <p className="muted">
                    No {tab === "song" ? "songs" : "slide sets"} yet. Create one
                    to get started.
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
                  <div className="media-row" key={m.id}>
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
          </div>
        </section>
        <section className="content-editor">
          <span className="eyebrow">LIBRARY MASTER</span>
          {draft ? (
            <>
              <div className="section-heading">
                <h2>Edit {draft.kind === "song" ? "song" : "slides"}</h2>
                <span className="muted">
                  {dirty ? "Unsaved library edits" : "Saved / ready to edit"}
                </span>
              </div>
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
                      Usage reporting is retained as metadata; report generation
                      is not available yet.
                    </p>
                  </details>
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
                      onClick={() => {
                        update((c) => {
                          c.sections.push({
                            id: id(),
                            label: "V" + (c.sections.length + 1),
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
                      disabled={sectionIndex === 0}
                      onClick={() => {
                        update((c) => {
                          c.sections = reorder(c.sections, sectionIndex, -1);
                          syncAuto(c);
                        });
                        setSectionIndex(sectionIndex - 1);
                      }}
                    >
                      Section ↑
                    </button>
                    <button
                      disabled={sectionIndex >= draft.sections.length - 1}
                      onClick={() => {
                        update((c) => {
                          c.sections = reorder(c.sections, sectionIndex, 1);
                          syncAuto(c);
                        });
                        setSectionIndex(sectionIndex + 1);
                      }}
                    >
                      Section ↓
                    </button>
                    <button
                      disabled={draft.sections.length < 2}
                      onClick={() => {
                        if (
                          !confirm(
                            "Remove this section and its arrangement entries?",
                          )
                        )
                          return;
                        update((c) => {
                          const key = c.sections[sectionIndex].id;
                          c.sections.splice(sectionIndex, 1);
                          for (const a of c.arrangements)
                            a.sectionIds = a.sectionIds.filter(
                              (s) => s !== key,
                            );
                          syncAuto(c);
                        });
                        setSectionIndex(0);
                        setPageIndex(0);
                      }}
                    >
                      Remove section
                    </button>
                  </div>
                  <details>
                    <summary>Arrangements</summary>
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
                              Append {s.label}
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
                                c.arrangements[i].sectionIds = c.sections.map(
                                  (s) => s.id,
                                );
                              })
                            }
                          >
                            Reset sequence
                          </button>
                          <button
                            disabled={draft.arrangements.length < 2}
                            onClick={() =>
                              update((c) => {
                                c.arrangements.splice(i, 1);
                                if (!c.arrangements.some((a) => a.isDefault))
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
                      New arrangement
                    </button>
                  </details>
                </>
              )}
              <label>
                Slide in {draft.kind === "song" ? "section" : "set"}
                <select
                  value={pageIndex}
                  onChange={(e) => setPageIndex(Number(e.target.value))}
                >
                  {(draft.kind === "song"
                    ? (draft.sections[sectionIndex]?.pages ?? [])
                    : draft.pages
                  ).map((p, i) => (
                    <option key={p.id} value={i}>
                      {i + 1} ·{" "}
                      {p.title || p.text.slice(0, 30) || "Empty slide"}
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
                <button
                  disabled={!page || pageIndex === 0}
                  onClick={() => {
                    update((c) => {
                      if (c.kind === "song")
                        c.sections[sectionIndex].pages = reorder(
                          c.sections[sectionIndex].pages,
                          pageIndex,
                          -1,
                        );
                      else c.pages = reorder(c.pages, pageIndex, -1);
                    });
                    setPageIndex(pageIndex - 1);
                  }}
                >
                  Slide ↑
                </button>
                <button
                  disabled={
                    (draft.kind === "song"
                      ? draft.sections[sectionIndex]?.pages.length
                      : draft.pages.length) <=
                    pageIndex + 1
                  }
                  onClick={() => {
                    update((c) => {
                      if (c.kind === "song")
                        c.sections[sectionIndex].pages = reorder(
                          c.sections[sectionIndex].pages,
                          pageIndex,
                          1,
                        );
                      else c.pages = reorder(c.pages, pageIndex, 1);
                    });
                    setPageIndex(pageIndex + 1);
                  }}
                >
                  Slide ↓
                </button>
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
                </button>
              </div>
              {page && (
                <PageEditor page={page} change={changePage} media={media} />
              )}
              <div className="actions">
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      syncAuto(draft);
                      const duplicate = content.find(
                        (c) =>
                          c.id !== draft.id &&
                          (c.title.trim().toLowerCase() ===
                            draft.title.trim().toLowerCase() ||
                            (draft.indexNumber &&
                              c.indexNumber === draft.indexNumber)),
                      );
                      if (
                        duplicate &&
                        !confirm(
                          `Possible duplicate: “${duplicate.title}”. Save anyway?`,
                        )
                      )
                        return;
                      await db.saveContent(draft);
                      setDirty(false);
                      setMessage(
                        "Library master saved. Existing service copies remain independent.",
                      );
                    })
                  }
                >
                  Save library item
                </button>
                <button
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
                  disabled={busy}
                  onClick={() => void run(() => removeContent(draft))}
                >
                  Delete library item
                </button>
              </div>
              {draft.kind === "song" && (
                <label>
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
                disabled={busy || dirty}
                onClick={() =>
                  void run(async () => {
                    if (!service)
                      throw Error("Create or choose a service first.");
                    await saveService({
                      ...service,
                      items: [...service.items, makeItem(draft, arrangement)],
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
              Choose a library item or create one. Service copies have their own
              content, notes and design.
            </p>
          )}
        </section>
        <section className="planner">
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
                  onBlur={() =>
                    void run(async () => {
                      await db.saveService(service);
                      setMessage("Service changes saved locally.");
                    })
                  }
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
                          await db.services.delete(service.id);
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
                            p.id === item.id + ":" + itemPages[servicePage].id,
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
