import { SourceComparison } from "./SourceComparison";
import { sourceStatus } from "./sourceRefresh";
import { ServiceReview } from "./ServiceReview";
import { PasteLyrics } from "./PasteLyrics";
import { SectionTools, SlideTools } from "./StructureTools";
import {
  indexContent,
  findContent,
  matchExcerpt,
  similarSongs,
} from "./search";
import { SearchFilters } from "./SearchFilters";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./repository";
import { PageEditor } from "./Library";
import { SlideFrame } from "./SlideFrame";
import { ProfileEditor, BackgroundEditor } from "./DesignEditors";
import {
  contentCompatibilityIssues,
  contentPages,
  id,
  makeItem,
  newContent,
  newPage,
  now,
  servicePages,
  syncAuto,
  type Content,
  type ServiceOrder,
  type ServiceItem,
  type Page,
} from "./model";
import "./service-workspace.css";

type Draft = { content: Content; operationId: string };
export function ServiceWorkspace({
  mode,
  onMode,
  onPresent,
  onLibrary,
  sessionActive,
  onBlank,
  onSavingChange,
  prepareRequest,
}: {
  mode: "services" | "prepare" | "review";
  onMode: (mode: "services" | "prepare" | "review") => void;
  onPresent: (service: ServiceOrder) => void;
  onLibrary: () => void;
  sessionActive: boolean;
  onBlank: () => void;
  onSavingChange?: (saving: boolean) => void;
  prepareRequest?: { serviceId: string; token: string };
}) {
  const orders =
    useLiveQuery(
      () => db.services.orderBy("updatedAt").reverse().toArray(),
      [],
    ) ?? [];
  const library = useLiveQuery(() => db.content.toArray(), []) ?? [];
  const media = useLiveQuery(() => db.media.toArray(), []) ?? [];
  const [service, setService] = useState<ServiceOrder>();
  const [reviewOrder, setReviewOrder] = useState<ServiceOrder>();
  const [comparison, setComparison] = useState<{
    order: ServiceOrder;
    itemId: string;
    source: Content;
  }>();
  const [pasteStaging, setPasteStaging] = useState(false);
  const working = useRef<ServiceOrder | undefined>(undefined);
  const [itemId, setItemId] = useState("");
  const [pageId, setPageId] = useState("");
  const [status, setStatus] = useState(
    "Choose a service, or create one for the next gathering.",
  );
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [newName, setNewName] = useState("Sunday service");
  const [orderWidth, setOrderWidth] = useState(270);
  const [picker, setPicker] = useState(false);
  const [tab, setTab] = useState<"song" | "slides" | "media">("song");
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState("");
  const [draft, setDraft] = useState<Draft>();
  const [repeat, setRepeat] = useState("");
  const draftStart = useRef("");
  const draftDirty =
    pasteStaging ||
    (!!draft && JSON.stringify(draft.content) !== draftStart.current);
  const queue = useRef(Promise.resolve());
  const failed = useRef(false);
  const latest = useRef(0);
  const revision = useRef<{ revision?: number; revisionToken?: string }>({});
  const activeId = useRef("");
  const dialog = useRef<HTMLDialogElement>(null);
  const item = service?.items.find((item) => item.id === itemId);
  const pages = item ? contentPages(item.snapshot, item.sectionOrder) : [];
  const selected =
    (item
      ? item.snapshot.kind === "song"
        ? item.snapshot.sections.flatMap((section) => section.pages)
        : item.snapshot.pages
      : []
    ).find((page) => page.id === pageId) ?? pages[0];
  const section = item?.snapshot.sections.find((section) =>
    section.pages.some((page) => page.id === selected?.id),
  );
  const resolved =
    service && item && selected
      ? servicePages(service).find(
          (page) =>
            page.itemId === item.id && page.sourcePageId === selected.id,
        )
      : undefined;
  useEffect(() => {
    if (!picker) return;
    const focus = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      focus?.focus();
    };
  }, [picker]);
  useEffect(() => {
    if (!draftDirty && !saving) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [draftDirty, saving]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }
  async function settled() {
    await queue.current;
    if (failed.current)
      throw Error(
        "Service changes are not saved. Retry saving or reload the saved service before continuing.",
      );
  }
  async function open(order: ServiceOrder) {
    setReviewOrder(undefined);
    await settled();
    working.current = structuredClone(order);
    activeId.current = order.id;
    revision.current = {
      revision: order.revision,
      revisionToken: order.revisionToken,
    };
    setService(working.current);
    setItemId(order.items[0]?.id ?? "");
    setPageId("");
    setStatus("Saved locally · changes here affect this service only");
    setError("");
    await db.settings.put({ key: "selectedService", value: order.id });
    onMode("prepare");
  }
  useEffect(() => {
    if (!prepareRequest) return;
    // Keep an existing working copy and its draft intact when returning to it.
    if (activeId.current === prepareRequest.serviceId) {
      setReviewOrder(undefined);
      return;
    }
    if (draftDirty) {
      setError("Finish or cancel the current song draft before opening the presentation service.");
      return;
    }
    let cancelled = false;
    void run(async () => {
      await settled();
      const order = await db.services.get(prepareRequest.serviceId);
      if (cancelled) return;
      if (!order) throw Error("The presentation service is no longer saved locally.");
      await open(order);
    });
    return () => { cancelled = true; };
  }, [prepareRequest]);
  function mutate(change: (order: ServiceOrder) => void) {
    if (!working.current) return;
    const next = structuredClone(working.current);
    change(next);
    working.current = next;
    setService(next);
    setSaving(true);
    const generation = ++latest.current;
    if (!next.title.trim()) {
      setError("Enter a service name to save changes.");
      return;
    }
    setError("");
    const pending = queue.current.then(async () => {
      if (failed.current)
        throw Error(
          "A previous service save failed. Your working changes are retained; retry saving.",
        );
      const saved = await db.saveService({ ...next, ...revision.current });
      if (activeId.current === saved.id) {
        revision.current = {
          revision: saved.revision,
          revisionToken: saved.revisionToken,
        };
        Object.assign(working.current!, revision.current);
        setService((current) =>
          current?.id === saved.id
            ? { ...current, ...revision.current }
            : current,
        );
      }
      if (generation === latest.current) {
        setSaving(false);
        setStatus("Saved locally · changes here affect this service only");
      }
    });
    queue.current = pending.catch((error) => {
      failed.current = true;
      setSaving(false);
      setError(error instanceof Error ? error.message : String(error));
    });
  }
  async function retry() {
    await queue.current;
    if (!working.current) return;
    const saved = await db.saveService({
      ...working.current,
      ...revision.current,
    });
    failed.current = false;
    working.current = saved;
    revision.current = {
      revision: saved.revision,
      revisionToken: saved.revisionToken,
    };
    setService(saved);
    setError("");
    setStatus("Saved locally");
  }
  function changeItem(change: (item: ServiceItem) => void) {
    mutate((order) => {
      const item = order.items.find((item) => item.id === itemId);
      if (item) change(item);
    });
  }
  function changePage(page: Page) {
    changeItem((item) => {
      const target = [
        ...item.snapshot.pages,
        ...item.snapshot.sections.flatMap((section) => section.pages),
      ].find((value) => value.id === page.id);
      if (target) Object.assign(target, page);
    });
  }
  async function addContent(content: Content, nonPresenting = false) {
    await settled();
    const item = makeItem(content);
    if (nonPresenting) item.nonPresenting = true;
    const next = {
      ...working.current!,
      ...revision.current,
      items: [...working.current!.items, item],
    };
    const saved = await db.saveService(next);
    working.current = saved;
    revision.current = {
      revision: saved.revision,
      revisionToken: saved.revisionToken,
    };
    setService(saved);
    setItemId(item.id);
    setPageId("");
    setStatus(`Added “${item.title}” as a separate service copy.`);
  }
  function createDraft(kind: "song" | "slides") {
    const content = newContent(kind);
    content.title = "";
    if (kind === "song") content.sections[0].label = "Verse 1";
    draftStart.current = JSON.stringify(content);
    setDraft({ content, operationId: id() });
    setRepeat("");
  }
  function editDraft(change: (content: Content) => void) {
    if (!draft) return;
    const next = structuredClone(draft);
    change(next.content);
    setDraft(next);
  }
  function closePicker() {
    if (busy) return;
    if (draftDirty && !confirm("Discard the unsaved song or slides?")) return;
    setDraft(undefined);
    setPicker(false);
  }
  async function saveAndAdd() {
    if (!draft || !working.current) return;
    await settled();
    const content = structuredClone(draft.content);
    syncAuto(content);
    const { service: saved } = await db.saveSongAndAdd(
      content,
      { ...working.current, ...revision.current },
      draft.operationId,
    );
    working.current = saved;
    revision.current = {
      revision: saved.revision,
      revisionToken: saved.revisionToken,
    };
    setService(saved);
    setItemId(draft.operationId);
    setPageId("");
    setDraft(undefined);
    setPicker(false);
    setStatus(
      "Saved in Library and added as a separate copy for this service.",
    );
  }
  const searchIndex = useMemo(() => indexContent(library), [library]);
  const [searchLanguage, setSearchLanguage] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const candidates = findContent(searchIndex, query, {
    kind: tab === "media" ? undefined : tab,
    language: searchLanguage,
    tag: searchTag,
  });
  const candidate =
    candidates.find((content) => content.id === chosen) ?? candidates[0];
  const visibleMedia = media.filter((asset) =>
    asset.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const draftPages =
    draft?.content.kind === "song"
      ? draft.content.sections.flatMap((section) => section.pages)
      : (draft?.content.pages ?? []);
  return (
    <div className="service-flow">
      <div className="sf-notice" role="status" hidden={mode === "review"}>
        {saving ? "Saving changes…" : status}
      </div>
      {error && (
        <div className="sf-error" role="alert">
          {error}{" "}
          {failed.current && (
            <>
              <button disabled={busy} onClick={() => void run(retry)}>
                Retry saving
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    if (
                      !confirm(
                        "Discard unsaved service changes and reload the saved version?",
                      )
                    )
                      return;
                    failed.current = false;
                    const saved = await db.services.get(activeId.current);
                    if (!saved)
                      throw Error(
                        "Saved service was deleted. Keep a copy of your work before leaving.",
                      );
                    await open(saved);
                  })
                }
              >
                Reload saved service
              </button>
            </>
          )}
        </div>
      )}
      {mode === "services" ? (
        <main className="sf-home">
          <div className="sf-home-heading">
            <div>
              <span className="eyebrow">PREPARE FOR THE SERVICE</span>
              <h1>Your services</h1>
              <p>
                A service is the running order of songs and slides you will
                present.
              </p>
            </div>
            <button onClick={onLibrary}>Manage library & backups</button>
          </div>
          <form
            className="sf-create"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await settled();
                const stamp = now();
                const order: ServiceOrder = {
                  id: id(),
                  title: newName.trim(),
                  date: "",
                  items: [],
                  createdAt: stamp,
                  updatedAt: stamp,
                };
                await db.saveService(order);
                await open(order);
              });
            }}
          >
            <h2>Create a service</h2>
            <label>
              Service name
              <input
                required
                maxLength={500}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={busy || saving || !newName.trim()}
            >
              Create service
            </button>
          </form>
          <div className="sf-saved">
            <h2>Saved services</h2>
            <label>
              Find a service
              <input
                type="search"
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
              />
            </label>
            {!orders.length && (
              <p>
                No saved services yet. Create one above; no library import is
                needed.
              </p>
            )}
            {orders
              .filter((order) =>
                `${order.title} ${order.date}`
                  .toLocaleLowerCase()
                  .includes(serviceSearch.toLocaleLowerCase()),
              )
              .map((order) => (
                <article className="sf-service-row" key={order.id}>
                  <div>
                    <h3>{order.title}</h3>
                    <p>
                      {order.date || "No date"} · {order.items.length} items
                    </p>
                  </div>
                  <div className="sf-actions">
                    <button
                      disabled={busy || saving}
                      onClick={() => void run(() => open(order))}
                    >
                      Open {order.title}
                    </button>
                    <button
                      disabled={busy || saving}
                      onClick={() =>
                        void run(async () => {
                          await settled();
                          const copy = structuredClone(order);
                          copy.id = id();
                          delete copy.revision;
                          delete copy.revisionToken;
                          copy.title += " (copy)";
                          copy.createdAt = now();
                          copy.items.forEach((item) => {
                            item.id = id();
                          });
                          await db.saveService(copy);
                          await open(copy);
                        })
                      }
                    >
                      Duplicate {order.title}
                    </button>
                    <button
                      disabled={busy || saving || sessionActive}
                      onClick={() =>
                        void run(async () => {
                          if (
                            confirm(
                              `Delete service “${order.title}”? Library songs remain. Export a full backup first; deletion cannot be undone.`,
                            )
                          ) {
                            await db.deleteService(order);
                            if (working.current?.id === order.id) {
                              working.current = undefined;
                              setService(undefined);
                            }
                          }
                        })
                      }
                    >
                      Delete {order.title}
                    </button>
                  </div>
                </article>
              ))}
          </div>
          <p className="muted">
            Songs and services stay in this browser on this device. Export a
            full backup from Library to keep a separate copy.
          </p>
        </main>
      ) : !service ? (
        <main className="sf-home">
          <h1>Choose a service</h1>
          <button onClick={() => onMode("services")}>Back to services</button>
        </main>
      ) : mode === "review" && reviewOrder ? (
        <ServiceReview
          key={reviewOrder.id + reviewOrder.revisionToken}
          order={reviewOrder}
          onBack={() => onMode("prepare")}
          onEdit={(itemId, pageId) => {
            setItemId(itemId);
            setPageId(pageId ?? "");
            onMode("prepare");
          }}
          changed={
            orders.find((order) => order.id === reviewOrder.id)
              ?.revisionToken !== reviewOrder.revisionToken
          }
        />
      ) : (
        <>
          <div className="sf-toolbar">
            <div>
              <span className="eyebrow">PREPARE · COPY FOR THIS SERVICE</span>
              <h1>{service.title}</h1>
            </div>
            <div className="sf-actions">
              <button onClick={() => onMode("services")}>Services</button>
              <button
                disabled={busy || saving || failed.current}
                onClick={() =>
                  void run(async () => {
                    await settled();
                    setReviewOrder(structuredClone(working.current!));
                    onMode("review");
                  })
                }
              >
                Review service
              </button>
              <button
                disabled={
                  busy ||
                  saving ||
                  !servicePages(service).length ||
                  failed.current
                }
                className="primary"
                onClick={() =>
                  void run(async () => {
                    await settled();
                    onPresent(structuredClone(working.current!));
                  })
                }
              >
                Present service
              </button>
            </div>
          </div>
          <main
            className="sf-layout"
            style={{ gridTemplateColumns: `${orderWidth}px minmax(0,1fr)` }}
          >
            <aside className="sf-order" aria-label="Service running order">
              <div className="sf-panel-heading">
                <h2>Service order</h2>
                <button
                  disabled={busy || saving}
                  onClick={() => {
                    setPicker(true);
                    setDraft(undefined);
                    setChosen("");
                  }}
                >
                  Add item
                </button>
              </div>
              {!service.items.length && (
                <p>No items yet. Add your first song or slides.</p>
              )}
              {service.items.map((value, index) => (
                <article
                  key={value.id}
                  className={value.id === itemId ? "selected" : ""}
                >
                  <button
                    className="sf-item-button"
                    onClick={() => {
                      setItemId(value.id);
                      setPageId("");
                    }}
                  >
                    {index + 1}. {value.title}
                    <small>
                      {value.nonPresenting
                        ? "Operator heading · not projected"
                        : `${contentPages(value.snapshot, value.sectionOrder).length} slides`}
                    </small>
                  </button>
                  {value.id === itemId && (
                    <>
                      <div className="sf-actions">
                        <button
                          aria-label="Move selected item up"
                          disabled={!index}
                          onClick={() =>
                            mutate((order) => {
                              [order.items[index - 1], order.items[index]] = [
                                order.items[index],
                                order.items[index - 1],
                              ];
                            })
                          }
                        >
                          ↑
                        </button>
                        <button
                          aria-label="Move selected item down"
                          disabled={index === service.items.length - 1}
                          onClick={() =>
                            mutate((order) => {
                              [order.items[index], order.items[index + 1]] = [
                                order.items[index + 1],
                                order.items[index],
                              ];
                            })
                          }
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Remove “${value.title}” from this service? The library source remains.`,
                              )
                            ) {
                              mutate((order) => {
                                order.items = order.items.filter(
                                  (item) => item.id !== value.id,
                                );
                              });
                              setItemId(
                                service.items.find(
                                  (item) => item.id !== value.id,
                                )?.id ?? "",
                              );
                              setPageId("");
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      {!value.nonPresenting &&
                        contentPages(value.snapshot, value.sectionOrder).map(
                          (page, index) => (
                            <button
                              className="sf-page-button"
                              key={`${page.id}:${index}`}
                              aria-pressed={selected?.id === page.id}
                              onClick={() => setPageId(page.id)}
                            >
                              {index + 1}.{" "}
                              {page.text.split("\n")[0] ||
                                page.title ||
                                "Empty slide"}
                            </button>
                          ),
                        )}
                    </>
                  )}
                </article>
              ))}
            </aside>
            <section className="sf-editor">
              <details className="sf-service-settings">
                <summary>Service name, date & appearance</summary>
                <label>
                  Service name
                  <input
                    value={service.title}
                    onChange={(event) =>
                      mutate((order) => {
                        order.title = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Service date
                  <input
                    type="date"
                    value={service.date}
                    onChange={(event) =>
                      mutate((order) => {
                        order.date = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Service order panel width
                  <input
                    type="range"
                    min={210}
                    max={400}
                    value={orderWidth}
                    onChange={(event) =>
                      setOrderWidth(Number(event.target.value))
                    }
                  />
                </label>
                <ProfileEditor
                  profile={service.profile}
                  change={(profile) =>
                    mutate((order) => {
                      order.profile = profile;
                    })
                  }
                />
                <BackgroundEditor
                  scope="Service"
                  media={media}
                  value={service.backgroundDesign}
                  change={(value) =>
                    mutate((order) => {
                      order.backgroundDesign = value;
                    })
                  }
                />
              </details>
              {!item ? (
                <div className="sf-empty">
                  <h2>Start with a song or slide set</h2>
                  <p>
                    Choose from your Library, or create something new without
                    leaving this service.
                  </p>
                  <button className="primary" onClick={() => setPicker(true)}>
                    Add first item
                  </button>
                </div>
              ) : (
                <>
                  <div className="sf-panel-heading">
                    <div>
                      <h2>{item.title}</h2>
                      <p className="muted">
                        Changes affect this service copy only.
                      </p>
                    </div>
                  </div>
                  {!item.nonPresenting && (
                    <details className="source-link">
                      <summary>Library source</summary>
                      <p>
                        {sourceStatus(
                          item,
                          library.find(
                            (content) => content.id === item.sourceId,
                          ),
                        )}
                      </p>
                      <button
                        disabled={
                          busy ||
                          saving ||
                          failed.current ||
                          !library.some(
                            (content) => content.id === item.sourceId,
                          )
                        }
                        onClick={() =>
                          void run(async () => {
                            await settled();
                            const currentItem = working.current!.items.find(
                              (value) => value.id === item.id,
                            );
                            const source = await db.content.get(item.sourceId);
                            if (!source || !currentItem)
                              throw Error(
                                "Source no longer in Library. This service copy remains usable.",
                              );
                            setComparison({
                              order: structuredClone(working.current!),
                              itemId: item.id,
                              source: structuredClone(source),
                            });
                          })
                        }
                      >
                        Compare with Library
                      </button>
                    </details>
                  )}
                  <details>
                    <summary>Item name</summary>
                    <label>
                      Item title
                      <input
                        value={item.title}
                        onChange={(event) =>
                          changeItem((item) => {
                            item.title = event.target.value;
                          })
                        }
                      />
                    </label>
                  </details>
                  {item.snapshot.kind === "song" && (
                    <details>
                      <summary>Song order & sections</summary>
                      <p>
                        {item.sectionOrder
                          .map(
                            (sectionId) =>
                              item.snapshot.sections.find(
                                (section) => section.id === sectionId,
                              )?.label,
                          )
                          .join(" → ")}
                      </p>
                      <p>
                        New sections can be appended below. The current service
                        song order stays unchanged.
                      </p>
                      {section && (
                        <SectionTools
                          content={item.snapshot}
                          sectionIndex={item.snapshot.sections.findIndex(
                            (value) => value.id === section.id,
                          )}
                          onChange={(change) =>
                            changeItem((item) => change(item.snapshot))
                          }
                          onSelect={(selection) => setPageId(selection.pageId)}
                        />
                      )}
                      <label>
                        Edit section
                        <select
                          aria-label="Edit service section"
                          value={section?.id ?? ""}
                          onChange={(event) => {
                            const target = item.snapshot.sections.find(
                              (section) => section.id === event.target.value,
                            );
                            if (target) setPageId(target.pages[0].id);
                          }}
                        >
                          {item.snapshot.sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {section.label}
                              {item.sectionOrder.includes(section.id)
                                ? ""
                                : " · outside song order"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Saved arrangement
                        <select
                          value=""
                          onChange={(event) => {
                            const arrangement = item.snapshot.arrangements.find(
                              (arrangement) =>
                                arrangement.id === event.target.value,
                            );
                            if (arrangement)
                              changeItem((item) => {
                                item.sectionOrder = [...arrangement.sectionIds];
                              });
                          }}
                        >
                          <option value="">Choose song order</option>
                          {item.snapshot.arrangements.map((arrangement) => (
                            <option key={arrangement.id} value={arrangement.id}>
                              {arrangement.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="sf-actions">
                        {item.snapshot.sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() =>
                              changeItem((item) => {
                                item.sectionOrder.push(section.id);
                              })
                            }
                          >
                            Append {section.label}
                          </button>
                        ))}
                        <button
                          disabled={item.sectionOrder.length < 2}
                          onClick={() =>
                            changeItem((item) => {
                              item.sectionOrder.pop();
                            })
                          }
                        >
                          Remove last occurrence
                        </button>
                      </div>
                    </details>
                  )}
                  {selected && (
                    <SlideTools
                      content={item.snapshot}
                      sectionIndex={
                        section
                          ? item.snapshot.sections.findIndex(
                              (value) => value.id === section.id,
                            )
                          : 0
                      }
                      pageIndex={(section?.pages ?? pages).findIndex(
                        (page) => page.id === selected.id,
                      )}
                      onChange={(change) =>
                        changeItem((item) => change(item.snapshot))
                      }
                      onSelect={(selection) => setPageId(selection.pageId)}
                    />
                  )}
                  <details>
                    <summary>Operator notes</summary>
                    <label>
                      Operator notes
                      <textarea
                        rows={3}
                        value={item.notes}
                        onChange={(event) =>
                          changeItem((item) => {
                            item.notes = event.target.value;
                          })
                        }
                      />
                      <small>
                        Private presentation cues; never shown to the
                        congregation.
                      </small>
                    </label>
                  </details>
                  {selected && (
                    <div className="sf-content-grid">
                      <div className="sf-fields">
                        <h3>{section?.label || "Slide"}</h3>
                        <button
                          onClick={() => {
                            const page = newPage();
                            changeItem((item) => {
                              if (section)
                                item.snapshot.sections
                                  .find((value) => value.id === section.id)!
                                  .pages.push(page);
                              else item.snapshot.pages.push(page);
                            });
                            setPageId(page.id);
                          }}
                        >
                          Add slide to service copy
                        </button>
                        <PageEditor
                          page={selected}
                          change={changePage}
                          media={media}
                          showPreview={false}
                        />
                      </div>
                      <div className="sf-preview">
                        <span className="eyebrow">CONGREGATION PREVIEW</span>
                        <SlideFrame page={resolved ?? selected} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </main>
        </>
      )}
      {comparison && (
        <SourceComparison
          order={comparison.order}
          itemId={comparison.itemId}
          source={comparison.source}
          latestSource={library.find(
            (content) => content.id === comparison.source.id,
          )}
          latestOrder={orders.find((order) => order.id === comparison.order.id)}
          sessionActive={sessionActive}
          onBlank={onBlank}
          onClose={() => setComparison(undefined)}
          onReplace={async (arrangementId) => {
            await settled();
            const saved = await db.refreshServiceItem(
              structuredClone(comparison.order),
              comparison.itemId,
              comparison.source,
              arrangementId,
            );
            working.current = saved;
            revision.current = {
              revision: saved.revision,
              revisionToken: saved.revisionToken,
            };
            setService(saved);
            setItemId(comparison.itemId);
            setPageId("");
            setComparison(undefined);
            setStatus(
              "Service copy replaced from Library. Item name, notes and item appearance were retained. Apply separately in Present if a session is active.",
            );
          }}
        />
      )}
      {picker && (
        <dialog
          ref={dialog}
          className="sf-dialog"
          onCancel={(event) => {
            event.preventDefault();
            closePicker();
          }}
        >
          <div className="sf-panel-heading">
            <h2>
              {draft
                ? `Create ${draft.content.kind === "song" ? "song" : "slides"}`
                : "Add to service"}
            </h2>
            <div className="sf-actions">
              {sessionActive && (
                <button className="blank" onClick={onBlank}>
                  Blank screen
                </button>
              )}
              <button disabled={busy} onClick={closePicker}>
                Close
              </button>
            </div>
          </div>
          {error && <p role="alert">{error}</p>}
          {draft ? (
            <fieldset disabled={busy} className="sf-authoring-fields">
              <p>
                Saved in Library for reuse; a separate copy is added to this
                service.
              </p>
              {similarSongs(searchIndex, draft.content).length > 0 && (
                <p role="status">
                  Similar items already in Library:{" "}
                  {similarSongs(searchIndex, draft.content)
                    .map((content) => content.title)
                    .join(", ")}
                  . You can still save this as a separate item.
                </p>
              )}
              <label>
                {draft.content.kind === "song"
                  ? "Song title"
                  : "Slide-set title"}
                <input
                  autoFocus
                  value={draft.content.title}
                  onChange={(event) =>
                    editDraft((content) => {
                      content.title = event.target.value;
                    })
                  }
                />
              </label>
              {draft.content.kind === "song" && (
                <PasteLyrics
                  key={draft.operationId}
                  content={draft.content}
                  onStagingChange={setPasteStaging}
                  onChange={editDraft}
                />
              )}
              {draft.content.kind === "song"
                ? draft.content.sections.map((section, index) => (
                    <fieldset key={section.id}>
                      <legend>{section.label}</legend>
                      <label>
                        Section label
                        <input
                          value={section.label}
                          onChange={(event) =>
                            editDraft((content) => {
                              content.sections[index].label =
                                event.target.value;
                            })
                          }
                        />
                      </label>
                      <SectionTools
                        content={draft.content}
                        sectionIndex={index}
                        onChange={editDraft}
                      />
                      {section.pages.map((page, pageIndex) => (
                        <div key={page.id}>
                          <SlideTools
                            content={draft.content}
                            sectionIndex={index}
                            pageIndex={pageIndex}
                            onChange={editDraft}
                          />
                          <label>
                            {section.label} · slide {pageIndex + 1}
                            <textarea
                              rows={3}
                              value={page.text}
                              onChange={(event) =>
                                editDraft((content) => {
                                  content.sections[index].pages[
                                    pageIndex
                                  ].text = event.target.value;
                                })
                              }
                            />
                          </label>
                          <label>
                            {section.label} · slide {pageIndex + 1} · second
                            language
                            <textarea
                              rows={2}
                              value={page.secondary}
                              onChange={(event) =>
                                editDraft((content) => {
                                  content.sections[index].pages[
                                    pageIndex
                                  ].secondary = event.target.value;
                                })
                              }
                            />
                          </label>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          editDraft((content) => {
                            content.sections[index].pages.push(newPage());
                          })
                        }
                      >
                        Add slide to {section.label}
                      </button>
                    </fieldset>
                  ))
                : draft.content.pages.map((page, index) => (
                    <div key={page.id}>
                      <SlideTools
                        content={draft.content}
                        sectionIndex={0}
                        pageIndex={index}
                        onChange={editDraft}
                      />
                      <label>
                        Slide {index + 1}
                        <textarea
                          rows={4}
                          value={page.text}
                          onChange={(event) =>
                            editDraft((content) => {
                              content.pages[index].text = event.target.value;
                            })
                          }
                        />
                      </label>
                    </div>
                  ))}
              <div className="sf-actions">
                {draft.content.kind === "song" ? (
                  ["Verse", "Chorus", "Bridge"].map((label) => (
                    <button
                      key={label}
                      onClick={() =>
                        editDraft((content) => {
                          const count = content.sections.filter((section) =>
                            section.label.startsWith(label),
                          ).length;
                          const section = {
                            id: id(),
                            label:
                              label === "Verse"
                                ? `Verse ${count + 1}`
                                : count
                                  ? `${label} ${count + 1}`
                                  : label,
                            pages: [newPage()],
                          };
                          content.sections.push(section);
                          syncAuto(content);
                        })
                      }
                    >
                      Add {label.toLowerCase()}
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() =>
                      editDraft((content) => {
                        content.pages.push(newPage());
                      })
                    }
                  >
                    Add slide
                  </button>
                )}
              </div>
              {draft.content.kind === "song" && (
                <>
                  <h3>Song order</h3>
                  <p>
                    {draft.content.arrangements[0].sectionIds
                      .map(
                        (sectionId) =>
                          draft.content.sections.find(
                            (section) => section.id === sectionId,
                          )?.label,
                      )
                      .join(" → ")}
                  </p>
                  <div className="sf-actions">
                    <select
                      aria-label="Section to repeat"
                      value={repeat}
                      onChange={(event) => setRepeat(event.target.value)}
                    >
                      <option value="">Choose section</option>
                      {draft.content.sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.label}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={!repeat}
                      onClick={() =>
                        editDraft((content) => {
                          content.arrangements[0].auto = false;
                          content.arrangements[0].sectionIds.push(repeat);
                        })
                      }
                    >
                      Repeat section in order
                    </button>
                  </div>
                </>
              )}
              <details>
                <summary>Song details</summary>
                <label>
                  Church song number
                  <input
                    value={draft.content.indexNumber}
                    onChange={(event) =>
                      editDraft((content) => {
                        content.indexNumber = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Primary language
                  <input
                    value={draft.content.primaryLanguage}
                    onChange={(event) =>
                      editDraft((content) => {
                        content.primaryLanguage = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Secondary language
                  <input
                    value={draft.content.secondaryLanguage}
                    onChange={(event) =>
                      editDraft((content) => {
                        content.secondaryLanguage = event.target.value;
                      })
                    }
                  />
                </label>
                <label>
                  Author
                  <input
                    value={draft.content.author}
                    onChange={(event) =>
                      editDraft((content) => {
                        content.author = event.target.value;
                      })
                    }
                  />
                </label>
              </details>
              <div className="sf-dialog-footer">
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Discard this unsaved draft and return to results?",
                      )
                    )
                      setDraft(undefined);
                  }}
                >
                  Back to results
                </button>
                <button
                  className="primary"
                  disabled={
                    busy ||
                    pasteStaging ||
                    !draft.content.title.trim() ||
                    !draftPages.length
                  }
                  onClick={() => void run(saveAndAdd)}
                >
                  Save {draft.content.kind === "song" ? "song" : "slides"} and
                  add to service
                </button>
              </div>
            </fieldset>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const title = prompt(
                      "Operator-only heading, such as Prayer or Message",
                    );
                    if (!title?.trim()) return;
                    const content = newContent("slides");
                    content.title = title.trim();
                    await addContent(content, true);
                    setPicker(false);
                  })
                }
              >
                Add operator-only heading
              </button>
              <div
                className="sf-tabs"
                role="tablist"
                aria-label="Add item type"
              >
                {(["song", "slides", "media"] as const).map((value) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => {
                      setTab(value);
                      setSearchLanguage("");
                      setSearchTag("");
                      setChosen("");
                    }}
                  >
                    {value === "song"
                      ? "Songs"
                      : value === "slides"
                        ? "Slides"
                        : "Media"}
                  </button>
                ))}
              </div>
              <label>
                Search library
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setChosen("");
                  }}
                />
              </label>
              {tab !== "media" && (
                <SearchFilters
                  contents={library.filter((content) => content.kind === tab)}
                  language={searchLanguage}
                  tag={searchTag}
                  onLanguage={setSearchLanguage}
                  onTag={setSearchTag}
                />
              )}
              {tab !== "media" ? (
                <>
                  <button onClick={() => createDraft(tab)}>
                    Create {tab === "song" ? "song" : "slides"}
                  </button>
                  <div className="sf-picker-grid">
                    <div>
                      {!candidates.length && (
                        <p>
                          {query || searchLanguage || searchTag
                            ? "No matching items. Clear the search or create something new."
                            : "Your library is empty. Create your first item."}
                        </p>
                      )}
                      {candidates.map((content) => (
                        <button
                          className="sf-result"
                          key={content.id}
                          aria-pressed={candidate?.id === content.id}
                          onClick={() => setChosen(content.id)}
                        >
                          <strong>{content.title}</strong>
                          {matchExcerpt(content, query) && (
                            <small className="search-excerpt">
                              {matchExcerpt(content, query)}
                            </small>
                          )}
                          <small>
                            {content.indexNumber} {content.primaryLanguage}
                          </small>
                        </button>
                      ))}
                    </div>
                    <div>
                      {candidate && (
                        <>
                          <h3>{candidate.title}</h3>
                          {contentCompatibilityIssues(candidate).length ? (
                            <p>
                              Legacy item needs review. Create an editable copy
                              in Library before adding.
                            </p>
                          ) : (
                            <>
                              <SlideFrame page={contentPages(candidate)[0]} />
                              <button
                                className="primary"
                                disabled={busy}
                                onClick={() =>
                                  void run(() => addContent(candidate))
                                }
                              >
                                Add to service
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    Import local media
                    <input
                      type="file"
                      accept="image/*,video/*"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file)
                          void run(async () => {
                            await db.importMedia(file);
                            setStatus("Media imported locally.");
                          });
                      }}
                    />
                  </label>
                  {visibleMedia.map((asset) => (
                    <article key={asset.id}>
                      <strong>{asset.title}</strong>
                      <span> · {asset.kind}</span>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const content = newContent("slides");
                            content.title = asset.title;
                            content.pages[0].mediaId = asset.id;
                            await addContent(content);
                          })
                        }
                      >
                        Add {asset.title}
                      </button>
                    </article>
                  ))}
                </>
              )}
              <div className="sf-dialog-footer">
                <button onClick={closePicker}>Done</button>
              </div>
            </>
          )}
        </dialog>
      )}
    </div>
  );
}
