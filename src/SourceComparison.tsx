import { useEffect, useRef, useState } from "react";
import {
  servicePages,
  pageReadinessIssue,
  type Content,
  type ServiceItem,
  type ServiceOrder,
} from "./model";
import { SlideFrame } from "./SlideFrame";
import { refreshedItem, sourceStatus } from "./sourceRefresh";
function ComparisonColumn({
  label,
  order,
  item,
}: {
  label: string;
  order: ServiceOrder;
  item: ServiceItem;
}) {
  const pages = servicePages({ ...order, items: [item] }),
    [index, setIndex] = useState(0),
    [previewError, setPreviewError] = useState(""),
    page = pages[Math.min(index, pages.length - 1)];
  useEffect(() => setPreviewError(""), [page?.id]);
  const content = item.snapshot,
    sections =
      content.kind === "song"
        ? content.sections
        : [{ id: content.id, label: "Slides", pages: content.pages }];
  return (
    <section className="source-column">
      <h3>{label}</h3>
      <p>
        {content.title} · {pages.length} slides
        {content.kind === "song" ? " in song order" : ""}
      </p>
      <p>
        <strong>Song order: </strong>
        {content.kind === "song"
          ? item.sectionOrder
              .map(
                (id) =>
                  content.sections.find((section) => section.id === id)
                    ?.label ?? "Missing section",
              )
              .join(" → ")
          : "Slide sequence"}
      </p>
      {page ? (
        <>
          <label>
            {label} slide
            <select
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
            >
              {pages.map((page, index) => (
                <option key={page.id} value={index}>
                  {index + 1}. {page.sectionLabel ?? page.title ?? "Slide"} ·
                  slide {page.pageIndex + 1}
                </option>
              ))}
            </select>
          </label>
          <div className="source-frame">
            <SlideFrame page={page} onError={setPreviewError} />
          </div>
          {(pageReadinessIssue(page) || previewError) && (
            <p role="status">{pageReadinessIssue(page) || previewError}</p>
          )}
        </>
      ) : (
        <p>No presenting slides.</p>
      )}
      <details>
        <summary>All lyrics, sections and slide settings</summary>
        {sections.map((section) => (
          <article key={section.id}>
            <h4>{section.label}</h4>
            {section.pages.map((page, index) => (
              <div key={page.id}>
                <strong>
                  Slide {index + 1}
                  {page.title ? ` · ${page.title}` : ""}
                </strong>
                <pre>{page.text}</pre>
                {page.secondary && <pre>{page.secondary}</pre>}
                <small>
                  {page.mediaId ? "Local media · " : ""}
                  {page.languageMode ?? "Both languages"} · font{" "}
                  {page.style.fontSize} ·{" "}
                  {page.backgroundDesign?.mode ?? "Inherited background"}
                </small>
              </div>
            ))}
          </article>
        ))}
      </details>
      <details>
        <summary>Saved song details</summary>
        <dl>
          <dt>Song number</dt>
          <dd>{content.indexNumber || "None"}</dd>
          <dt>Languages</dt>
          <dd>
            {[content.primaryLanguage, content.secondaryLanguage]
              .filter(Boolean)
              .join(" / ") || "Unspecified"}
          </dd>
          <dt>Author</dt>
          <dd>{content.author || "Unspecified"}</dd>
          <dt>Rights</dt>
          <dd>
            {content.copyright} {content.rightsStatus} {content.publisher}
          </dd>
        </dl>
      </details>
    </section>
  );
}
export function SourceComparison({
  order,
  itemId,
  source,
  latestSource,
  latestOrder,
  onClose,
  onReplace,
  sessionActive,
  onBlank,
}: {
  order: ServiceOrder;
  itemId: string;
  source: Content;
  latestSource?: Content;
  latestOrder?: ServiceOrder;
  onClose: () => void;
  onReplace: (arrangementId?: string) => Promise<void>;
  sessionActive: boolean;
  onBlank: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [arrangement, setArrangement] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const item = order.items.find((item) => item.id === itemId)!;
  const stale =
    !latestSource ||
    !latestOrder ||
    source.revisionToken !== latestSource.revisionToken ||
    source.revision !== latestSource.revision ||
    order.revisionToken !== latestOrder.revisionToken ||
    order.revision !== latestOrder.revision;
  let after: ServiceItem | undefined,
    issue = "";
  try {
    if (source.kind === "slides" || arrangement)
      after = refreshedItem(item, source, arrangement || undefined);
  } catch (error) {
    issue = String(error instanceof Error ? error.message : error);
  }
  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      focused?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="source-comparison"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="source-heading">
        <h2>Compare with Library</h2>
        <div className="actions">
          {sessionActive && (
            <button className="blank" onClick={onBlank}>
              Blank screen
            </button>
          )}
          <button disabled={busy} onClick={onClose}>
            Cancel comparison
          </button>
        </div>
      </div>
      <p>{sourceStatus(item, source)}</p>
      <p>
        <strong>Retained:</strong> service item name “{item.title}”, operator
        notes, item-level appearance and service settings.
      </p>
      <p>
        <strong>Replaced:</strong> all words, sections, the chosen song order,
        saved song details and individual slide settings. The Library and other
        service copies are unchanged.
      </p>
      {sessionActive && (
        <p>
          Replacement saves a staged service copy. Apply in Present separately;
          the current live slide stays unchanged until Show slide.
        </p>
      )}
      {stale && (
        <p role="alert">
          The Library or service changed after this comparison opened. Cancel
          and reopen the service/comparison to review the latest saved versions.
        </p>
      )}
      {(issue || error) && <p role="alert">{issue || error}</p>}
      <fieldset disabled={busy}>
        <legend>Replacement preview</legend>
        {source.kind === "song" && (
          <label>
            Library song order
            <select
              aria-label="Library song order"
              value={arrangement}
              onChange={(event) => setArrangement(event.target.value)}
            >
              <option value="">Choose the order to use</option>
              {source.arrangements.map((arrangement) => (
                <option key={arrangement.id} value={arrangement.id}>
                  {arrangement.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="source-columns">
          <ComparisonColumn
            label="Current service copy"
            order={order}
            item={item}
          />
          {after ? (
            <ComparisonColumn
              key={arrangement}
              label="After replacement"
              order={order}
              item={after}
            />
          ) : (
            <section>
              <h3>After replacement</h3>
              <p>Choose a Library song order to preview the replacement.</p>
            </section>
          )}
        </div>
        <button
          className="primary source-replace"
          disabled={!after || stale || !!issue}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onReplace(arrangement || undefined);
            } catch (error) {
              setError(String(error instanceof Error ? error.message : error));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Replacing…" : "Replace this service copy"}
        </button>
      </fieldset>
    </dialog>
  );
}
