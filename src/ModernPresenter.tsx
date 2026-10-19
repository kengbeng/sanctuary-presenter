import { useEffect, useRef, useState, type ReactNode } from "react";
import { SlideFrame } from "./SlideFrame";
import { type Page, type PresentationPage, type ServiceOrder } from "./model";
import "./modern-presenter.css";
type Frame = Page & {
  itemTitle: string;
  notes: string;
} & Partial<PresentationPage>;
export function ModernPresenter(props: {
  order?: ServiceOrder;
  frames: Frame[];
  selectedIndex: number;
  liveFrame?: Page;
  previousVersion: boolean;
  pendingReveal: boolean;
  state: string;
  ready: boolean;
  previewError: string;
  onPreviewError: (message: string) => void;
  sessionActive: boolean;
  outputHidden: boolean;
  test: boolean;
  notice: string;
  applying: boolean;
  hasStagedChanges: boolean;
  stagedTitle?: string;
  onApply: () => void;
  previewOnly: boolean;
  onPreviewOnly: (enabled: boolean) => void;
  onReturnToLive: () => void;
  onPreview: (index: number) => void;
  onSection: (itemId: string, sectionId: string) => void;
  onOccurrence: (itemId: string, occurrence: number, pageId?: string) => void;
  onTake: () => void;
  onBlank: () => void;
  onStart: (test: boolean) => void;
  onStop: () => void;
  onPrepare: () => void;
  setupOpen: boolean;
  onSetup: (open: boolean) => void;
  onSetupControls: () => void;
  setup: ReactNode;
}) {
  const selected = props.frames[props.selectedIndex];
  const [browsed, setBrowsed] = useState<string>();
  const [notes, setNotes] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = useRef<HTMLDialogElement>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const item = props.order?.items.find(
    (item) => item.id === (browsed ?? selected?.itemId),
  );
  const sectionPages = props.frames
    .map((frame, index) => ({ frame, index }))
    .filter(
      ({ frame }) =>
        frame.itemId === selected?.itemId &&
        frame.occurrenceIndex === selected?.occurrenceIndex,
    );
  useEffect(() => {
    setBrowsed(undefined);
  }, [selected?.itemId]);
  useEffect(() => {
    if (!props.setupOpen) return;
    const focused = document.activeElement as HTMLElement | null;
    modal.current?.showModal();
    return () => {
      modal.current?.close();
      focused?.focus();
    };
  }, [props.setupOpen]);
  useEffect(() => {
    if (!guideOpen) return;
    const focused = document.activeElement as HTMLElement | null;
    guide.current?.showModal();
    return () => {
      guide.current?.close();
      focused?.focus();
    };
  }, [guideOpen]);
  function focusArrows(event: React.KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ),
    );
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : event.key === "ArrowLeft"
            ? (index - 1 + buttons.length) % buttons.length
            : (index + 1) % buttons.length;
    buttons[next]?.focus();
  }
  const canReveal =
    props.ready && ["OUTPUT BLACK", "LIVE", "PREPARING"].includes(props.state);
  const next = props.frames[props.selectedIndex + 1];
  const directLive = !props.previewOnly && ["LIVE", "PREPARING"].includes(props.state);
  const selectedIsLive = !!selected && selected.id === props.liveFrame?.id &&
    !props.previousVersion && !props.pendingReveal;
  return (
    <div className="modern-presenter">
      <div className="mp-title">
        <div>
          <span className="eyebrow">PRESENT · {props.previewOnly ? "PREVIEW ONLY" : "DIRECT CONTROL"}</span>
          <h1>{props.order?.title ?? "Demo service"}</h1>
        </div>
        <div className="mp-actions">
          <strong role="status">{props.state}</strong>
          <button onClick={() => setGuideOpen(true)}>How to present</button>
          <button onClick={props.onPrepare}>Prepare / stage edits</button>
          <button onClick={() => props.onSetup(true)}>Display setup</button>
          {props.sessionActive && (
            <button
              onClick={props.onStop}
              title="Blank and close congregation output"
            >
              End presentation
            </button>
          )}
        </div>
      </div>
      <div className={`mp-navigation-mode${props.previewOnly ? " mp-preview-only" : ""}`} aria-label="Slide navigation mode">
        <strong>{props.previewOnly ? "Preview only" : "Direct control"}</strong>
        <label><input type="checkbox" checked={props.previewOnly}
          onChange={(event) => props.onPreviewOnly(event.target.checked)} /> Preview only</label>
        <span>{props.previewOnly
          ? "Selections stay local. Press Show slide to reveal."
          : props.state === "LIVE" || props.state === "PREPARING"
            ? "Click a slide or section to show it immediately."
            : "Select a slide, then Show slide. Black output stays black."}</span>
        {props.previewOnly && <button onClick={props.onReturnToLive}>Return to live</button>}
      </div>
      {props.hasStagedChanges && (
        <div className="mp-staged">
          <span>
            Saved changes waiting to Apply
            {props.stagedTitle ? `: ${props.stagedTitle}` : ""}. Live words stay
            unchanged.
          </span>
          <button disabled={props.applying} onClick={props.onApply}>
            {props.applying ? "Applying…" : "Apply saved changes"}
          </button>
        </div>
      )}
      <main className="mp-layout">
        <aside className="mp-order" aria-label="Presenter service order">
          <h2>Service order</h2>
          {props.order
            ? props.order.items.map((entry, index) => (
                <article
                  key={entry.id}
                  className={
                    entry.id === selected?.itemId ? "mp-selected-item" : ""
                  }
                >
                  <button
                    aria-expanded={item?.id === entry.id}
                    onClick={() =>
                      setBrowsed(item?.id === entry.id ? "" : entry.id)
                    }
                  >
                    {index + 1}. {entry.title}
                    <small>
                      {entry.nonPresenting
                        ? "Operator heading · not projected"
                        : entry.snapshot.kind === "song"
                          ? "Song"
                          : "Slides"}
                    </small>
                  </button>
                  {item?.id === entry.id && !entry.nonPresenting && (
                    <div
                      className="mp-item-pages"
                      aria-label="Song order occurrences"
                      data-song-navigation="true"
                      onKeyDown={focusArrows}
                    >
                      {entry.snapshot.kind === "song"
                        ? entry.sectionOrder.map((sectionId, occurrence) => (
                            <button
                              key={`${sectionId}:${occurrence}`}
                              aria-label={`${entry.snapshot.sections.find((section) => section.id === sectionId)?.label}, position ${occurrence + 1}`}
                              aria-pressed={
                                entry.id === selected?.itemId &&
                                selected?.occurrenceIndex === occurrence
                              }
                              onClick={() =>
                                props.onOccurrence(entry.id, occurrence)
                              }
                            >
                              {
                                entry.snapshot.sections.find(
                                  (section) => section.id === sectionId,
                                )?.label
                              }{" "}
                              <small>{occurrence + 1}</small>
                            </button>
                          ))
                        : entry.snapshot.pages.map((page, index) => (
                            <button
                              key={page.id}
                              onClick={() =>
                                props.onOccurrence(entry.id, 0, page.id)
                              }
                            >
                              Slide {index + 1} ·{" "}
                              {page.title || page.text.slice(0, 25)}
                            </button>
                          ))}
                    </div>
                  )}
                </article>
              ))
            : props.frames.map((frame, index) => (
                <button key={frame.id} onClick={() => props.onPreview(index)}>
                  {index + 1}. {frame.title}
                </button>
              ))}
        </aside>
        <section className={`mp-preview-column${props.previewOnly ? " mp-preview-only" : ""}`}>
          <div className="mp-preview-heading">
            <div>
              <span className="eyebrow">
                {props.pendingReveal ? "SELECTED · WAITING FOR DISPLAY" : selectedIsLive ? "SELECTED · CONFIRMED LIVE" : "SELECTED PREVIEW"}
              </span>
              <h2>
                {selected?.itemTitle ||
                  selected?.title ||
                  "No presenting slides"}
              </h2>
            </div>
            <span>
              {selected?.sectionLabel}{" "}
              {selected?.pageIndex !== undefined
                ? `· slide ${selected.pageIndex + 1}`
                : ""}
            </span>
          </div>
          {item && item.id !== selected?.itemId && (
            <div className="mp-browsing">
              Browsing {item.title}
              <button onClick={() => setBrowsed(undefined)}>
                Return to current song
              </button>
            </div>
          )}
          {item?.snapshot.kind === "song" && !item.nonPresenting && (
            <div className="mp-song-navigation" data-song-navigation="true">
              <strong>Jump to</strong>
              <div aria-label="Direct song sections" onKeyDown={focusArrows}>
                {item.snapshot.sections.map((section) => (
                  <button
                    key={section.id}
                    disabled={!section.pages.length}
                    onClick={() => props.onSection(item.id, section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              {item.id === selected?.itemId && sectionPages.length > 1 && (
                <div className="mp-section-pages">
                  <strong>Slides</strong>
                  <div aria-label="Section slides" onKeyDown={focusArrows}>
                    {sectionPages.map(({ frame, index }) => (
                      <button
                        key={frame.id}
                        aria-label={`Slide ${(frame.pageIndex ?? index) + 1}`}
                        aria-pressed={index === props.selectedIndex}
                        onClick={() => props.onPreview(index)}
                      >
                        {(frame.pageIndex ?? index) + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {selected?.occurrenceIndex === -1 && (
            <p className="mp-extra">
              Extra section ·{" "}
              {next
                ? `Next: ${next.sectionLabel ?? next.itemTitle}, slide ${(next.pageIndex ?? 0) + 1}`
                : "End of service"}
            </p>
          )}
          <div className="mp-preview-frame">
            {selected ? (
              <SlideFrame
                page={selected}
                test={props.test}
                onError={props.onPreviewError}
              />
            ) : (
              <p>Add songs or slides in Prepare.</p>
            )}
          </div>
          <p className="mp-preview-caption" role="status">
            {props.previewError ||
              (props.pendingReveal
                ? "Preparing selected slide or waiting for display confirmation."
                : props.outputHidden
                ? "Preview stays local. Bring the output window into view before Show slide."
                : !props.ready
                ? "Preparing selected preview or waiting for output…"
                : selectedIsLive
                  ? "Selected slide matches the last confirmed congregation output."
                : !directLive
                  ? "Preview ready. Press Show slide to reveal."
                  : "Direct control: selecting a slide changes congregation output.")}
          </p>
        </section>
        <aside className="mp-confirmed">
          <span className="eyebrow">CONGREGATION OUTPUT</span>
          <h2>
            {props.liveFrame ? "Last confirmed live" : "Black / no live frame"}
          </h2>
          <div
            className="mp-live-frame"
            aria-label="Last confirmed congregation frame"
          >
            {props.liveFrame ? (
              <SlideFrame page={props.liveFrame} test={props.test} />
            ) : (
              <p>Black</p>
            )}
          </div>
          {props.previousVersion && (
            <p className="mp-warning">
              Live: previous version. Apply did not change these words.
            </p>
          )}
          <h3>Next preview</h3>
          {next ? (
            <div className="mp-next">
              <small>
                {next.itemTitle} · {next.sectionLabel} · slide{" "}
                {(next.pageIndex ?? 0) + 1}
              </small>
              <SlideFrame page={next} />
            </div>
          ) : (
            <p>End of service</p>
          )}
          <button aria-expanded={notes} onClick={() => setNotes(!notes)}>
            Operator notes
          </button>
          {notes && <p>{selected?.notes || "No notes for this slide."}</p>}
        </aside>
      </main>
      <section className="mp-controls" aria-label="Presenter controls">
        <div>
          <button
            disabled={props.selectedIndex <= 0}
            onClick={() => props.onPreview(props.selectedIndex - 1)}
          >
            {directLive ? "← Previous slide" : "← Previous preview"}
          </button>
          <span>
            {props.frames.length ? props.selectedIndex + 1 : 0} /{" "}
            {props.frames.length}
          </span>
          <button
            disabled={props.selectedIndex >= props.frames.length - 1}
            onClick={() => props.onPreview(props.selectedIndex + 1)}
          >
            {directLive ? "Next slide →" : "Next preview →"}
          </button>
        </div>
        <div>
          {!props.sessionActive ? (
            <>
              <button
                onClick={() => {
                  props.onSetup(true);
                }}
              >
                Connect display
              </button>
              <button
                onClick={() => {
                  props.onStart(true);
                }}
              >
                Test output
              </button>
            </>
          ) : props.state === "DISCONNECTED" ? (
            <button
              className="primary"
              onClick={() => props.onStart(props.test)}
            >
              Reconnect display
            </button>
          ) : (
            <button
              className="primary"
              disabled={!canReveal}
              onClick={props.onTake}
            >
              {props.test ? "Show test pattern" : "Show slide"}
            </button>
          )}
          <button className="mp-blank" onClick={props.onBlank}>
            Blank screen
          </button>
        </div>
      </section>
      <div className="mp-notice" role="status">
        {props.outputHidden
          ? "Output page hidden — Show slide is unavailable. Use Display setup to bring the output window into view, then check the second display. Browser visibility does not confirm physical placement."
          : props.notice}
      </div>
      {guideOpen && (
        <dialog ref={guide} className="mp-setup-dialog mp-guide-dialog"
          aria-labelledby="presentation-guide-title"
          onCancel={(event) => { event.preventDefault(); setGuideOpen(false); }}>
          <div className="mp-setup-heading">
            <h2 id="presentation-guide-title">How to present</h2>
            <button onClick={() => setGuideOpen(false)}>Close guide</button>
          </div>
          <ol>
            <li><strong>Connect display.</strong> Move the congregation window to the second display and check it is black. Windowed output is recommended in Safari.</li>
            <li><strong>Show the first slide.</strong> Select it, then press Show slide.</li>
            <li><strong>Navigate in one click.</strong> While live in Direct control, click a slide, verse, chorus or bridge, or use Previous/Next. Wait for the confirmed live preview.</li>
            <li><strong>Preview when needed.</strong> Enable Preview only to inspect a selection. Show slide reveals it; Return to live returns to the last confirmed slide without revealing a different slide.</li>
            <li><strong>Blank screen.</strong> Hide output immediately. Selections stay local while black; press Show slide to resume.</li>
            <li><strong>Correct words safely.</strong> Save edits in Prepare, then Apply saved changes. Apply enters Preview only; Show slide reveals the correction.</li>
            <li><strong>End presentation.</strong> Close output when finished. A new session always starts black.</li>
          </ol>
          <p>Arrow keys navigate outside song-section controls. S shows the selected slide; B or Escape blanks outside editing fields and dialogs. Escape closes this guide.</p>
          {props.sessionActive && <button className="mp-blank" onClick={props.onBlank}>Blank screen</button>}
        </dialog>
      )}
      {props.setupOpen && (
        <dialog
          ref={modal}
          className="mp-setup-dialog"
          onCancel={(event) => {
            event.preventDefault();
            props.onSetup(false);
          }}
        >
          <div className="mp-setup-heading">
            <h2>Connect congregation display</h2>
            <button onClick={() => props.onSetup(false)}>Close setup</button>
          </div>
          <p>New and recovered output stays black until you press Show slide.</p>
          {props.setup}
          <div className="mp-actions">
            {props.sessionActive ? (
              <>
                <button onClick={props.onBlank} className="mp-blank">
                  Blank screen
                </button>
                <button onClick={props.onSetupControls}>
                  Show output setup controls
                </button>
              </>
            ) : (
              <>
                <button
                  className="primary"
                  onClick={() => {
                    props.onStart(false);
                    props.onSetup(false);
                  }}
                >
                  Open congregation window
                </button>
                <button
                  onClick={() => {
                    props.onStart(true);
                    props.onSetup(false);
                  }}
                >
                  Test output
                </button>
              </>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
