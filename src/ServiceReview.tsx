import { useEffect, useMemo, useRef, useState } from "react";
import { servicePages, pageReadinessIssue, type ServiceOrder } from "./model";
import type { ServiceItem, PresentationPage } from "./model";
import { SlideFrame } from "./SlideFrame";
export function ServiceReview({
  order,
  onBack,
  onEdit,
  changed,
}: {
  order: ServiceOrder;
  onBack: () => void;
  onEdit: (itemId: string, pageId?: string) => void;
  changed: boolean;
}) {
  const entries = useMemo(
    () =>
      order.items.flatMap<{
        item: ServiceItem;
        page: PresentationPage | undefined;
      }>((item) => {
        const pages = servicePages({ ...order, items: [item] });
        return pages.length
          ? pages.map((page) => ({ item, page }))
          : [{ item, page: undefined }];
      }),
    [order],
  );
  const [index, setIndex] = useState(0),
    [renderError, setRenderError] = useState("");
  const selected = entries[index];
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia("(max-width: 750px)").matches)
      preview.current?.scrollIntoView({ block: "center" });
  }, [index]);
  function select(index: number) {
    setIndex(index);
    setRenderError("");
  }
  return (
    <div className="service-review">
      <div className="sf-toolbar">
        <div>
          <span className="eyebrow">REVIEW · READ ONLY</span>
          <h1>{order.title}</h1>
        </div>
        <div className="sf-actions">
          <button onClick={onBack}>Back to preparation</button>
        </div>
      </div>
      <p className="review-notice">
        Reviewing a saved service copy. Navigation here does not change
        congregation output.
        {changed &&
          " The saved service has since changed. Return to preparation and reload to review its latest version."}
      </p>
      <main className="review-layout">
        <aside aria-label="Review service order">
          <h2>Service order</h2>
          {order.items.map((item, position) => (
            <button
              key={item.id}
              aria-pressed={selected?.item.id === item.id}
              onClick={() =>
                select(entries.findIndex((entry) => entry.item.id === item.id))
              }
            >
              {position + 1}. {item.title}
              <small>
                {item.nonPresenting
                  ? "Operator heading · not projected"
                  : `${servicePages({ ...order, items: [item] }).length} slides`}
              </small>
            </button>
          ))}
        </aside>
        <section className="review-slide">
          {selected ? (
            <>
              <h2>
                {selected.item.title}
                {selected.page?.sectionLabel
                  ? ` · ${selected.page.sectionLabel} · slide ${selected.page.pageIndex + 1}`
                  : ""}
              </h2>
              {selected.page ? (
                <>
                  <div className="review-frame" ref={preview}>
                    <SlideFrame page={selected.page} onError={setRenderError} />
                  </div>
                  {(pageReadinessIssue(selected.page) || renderError) && (
                    <p role="alert">
                      {pageReadinessIssue(selected.page) || renderError}
                    </p>
                  )}
                </>
              ) : (
                <p>
                  {selected.item.nonPresenting
                    ? "Operator-only heading. No congregation slide."
                    : "This item has no presenting slides."}
                </p>
              )}
              <div className="review-annotations">
                <details>
                  <summary>Operator notes · not projected</summary>
                  <p className="review-notes">
                    {selected.item.notes || "No operator notes."}
                  </p>
                </details>
                <button
                  onClick={() =>
                    onEdit(selected.item.id, selected.page?.sourcePageId)
                  }
                >
                  Edit this item
                </button>
              </div>
            </>
          ) : (
            <p>This service is empty. Return to preparation to add an item.</p>
          )}
        </section>
      </main>
      <div className="review-controls">
        <button disabled={index <= 0} onClick={() => select(index - 1)}>
          ← Previous in review
        </button>
        <span>
          {entries.length ? index + 1 : 0} / {entries.length}
        </span>
        <button
          disabled={index >= entries.length - 1}
          onClick={() => select(index + 1)}
        >
          Next in review →
        </button>
        {entries.length > 0 && index === entries.length - 1 && (
          <span>End of service review</span>
        )}
      </div>
    </div>
  );
}
