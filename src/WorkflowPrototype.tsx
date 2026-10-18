import { useEffect, useState } from "react";
import { SlideFrame } from "./SlideFrame";
import {
  id,
  now,
  newContent,
  newPage,
  makeItem,
  servicePages,
  pageReadinessIssue,
  type Content,
  type Page,
  type ServiceOrder,
} from "./model";
import "./workflow-prototype.css";

export default function WorkflowPrototype() {
  const [screen, setScreen] = useState<"services" | "prepare" | "present">(
    "services",
  );
  const [name, setName] = useState("Sunday service");
  const [working, setWorking] = useState<ServiceOrder>();
  const [committed, setCommitted] = useState<ServiceOrder>();
  const [version, setVersion] = useState(0);
  const [live, setLive] = useState<{ page: Page; version: number }>();
  const [connected, setConnected] = useState(false);
  const [setup, setSetup] = useState(false);
  const [selection, setSelection] = useState(0);
  const [ready, setReady] = useState(false);
  const [edit, setEdit] = useState<{ content: Content; itemId?: string }>();
  const [notice, setNotice] = useState("");
  const [sectionChoice, setSectionChoice] = useState("");
  const frames = working
    ? servicePages(screen === "present" && committed ? committed : working)
    : [];
  const selected = frames[selection];
  const selectedItem = (screen === "present" ? committed : working)?.items.find(
    (item) => item.id === selected?.itemId,
  );
  const changed =
    connected && JSON.stringify(working) !== JSON.stringify(committed);
  useEffect(() => {
    setReady(false);
    const timer = setTimeout(() => setReady(true), 180);
    return () => clearTimeout(timer);
  }, [selected?.id, selected?.text, selected?.secondary]);
  useEffect(() => {
    if (!edit && !setup) return;
    const active = document.activeElement as HTMLElement | null;
    const dialog =
      document.querySelector<HTMLDialogElement>(".workflow dialog");
    dialog?.showModal();
    return () => {
      dialog?.close();
      active?.focus();
    };
  }, [!!edit, setup]);
  function changeContent(update: (content: Content) => void) {
    if (!edit) return;
    const next = structuredClone(edit);
    update(next.content);
    setEdit(next);
  }
  function createService() {
    setWorking({
      id: id(),
      title: name.trim() || "Sunday service",
      date: "",
      items: [],
      createdAt: now(),
      updatedAt: now(),
    });
    setScreen("prepare");
    setNotice("Service created for practice. Add your first song.");
  }
  function saveSong() {
    if (
      !working ||
      !edit ||
      !edit.content.title.trim() ||
      !edit.content.sections.some((section) =>
        section.pages.some((page) => page.text.trim() || page.secondary.trim()),
      )
    )
      return;
    const content = structuredClone(edit.content);
    content.arrangements[0].auto = false;
    setWorking({
      ...working,
      items: edit.itemId
        ? working.items.map((item) =>
            item.id === edit.itemId
              ? {
                  ...item,
                  title: content.title,
                  snapshot: content,
                  sectionOrder: [...content.arrangements[0].sectionIds],
                }
              : item,
          )
        : [...working.items, makeItem(content)],
    });
    setEdit(undefined);
    setNotice(
      edit.itemId
        ? "Service copy saved. Apply when ready; live output has not changed."
        : "Song added to the practice service. No real library records were saved.",
    );
  }
  function select(index: number) {
    setSelection(index);
    setNotice("Preview selected. Click Show slide to show these words.");
  }
  function apply() {
    if (!working) return;
    const source = selected?.sourcePageId;
    setCommitted(structuredClone(working));
    setVersion((v) => v + 1);
    const next = servicePages(working);
    setSelection(
      Math.max(
        0,
        next.findIndex(
          (page) =>
            page.itemId === selected?.itemId && page.sourcePageId === source,
        ),
      ),
    );
    setNotice(
      "Changes applied to the practice sequence. Live words stay unchanged until Show slide.",
    );
  }
  function take() {
    if (!connected || !ready || !selected || pageReadinessIssue(selected))
      return;
    setLive({ page: structuredClone(selected), version });
    setNotice("Selected preview taken to simulated output.");
  }
  function blank() {
    setLive(undefined);
    setNotice(
      "Simulated congregation output is black. Preview selection is retained.",
    );
  }
  function jump(sectionId: string) {
    const matches = frames
      .map((page, index) => ({ page, index }))
      .filter(
        ({ page }) =>
          page.itemId === selected?.itemId &&
          page.sectionId === sectionId &&
          page.pageIndex === 0,
      );
    const match =
      matches.find(
        ({ page }) =>
          page.occurrenceIndex === selected?.occurrenceIndex &&
          selected?.sectionId === sectionId,
      ) ||
      matches.find(({ index }) => index > selection) ||
      matches[0];
    if (match) select(match.index);
  }
  const editValid =
    !!edit?.content.title.trim() &&
    edit.content.sections.some((section) =>
      section.pages.some((page) => page.text.trim() || page.secondary.trim()),
    );
  return (
    <div className="workflow">
      <div className="wf-prototype">
        Workflow prototype · temporary practice data · simulated output · reload
        resets this session <a href="./">Return to current app</a>
      </div>
      <header className="wf-header">
        <strong>
          Sanctuary <span>Presenter</span>
        </strong>
        <nav aria-label="Prototype workspace">
          <button
            aria-pressed={screen === "services"}
            onClick={() => setScreen("services")}
          >
            Services
          </button>
          {working && (
            <>
              <button
                aria-pressed={screen === "prepare"}
                onClick={() => setScreen("prepare")}
              >
                Prepare
              </button>
              <button
                aria-pressed={screen === "present"}
                onClick={() => {
                  if (!committed) setCommitted(structuredClone(working));
                  setScreen("present");
                  setSelection(0);
                }}
              >
                Present
              </button>
            </>
          )}
        </nav>
        <span className="wf-state" role="status">
          {connected
            ? live
              ? "SIMULATED LIVE"
              : "SIMULATED BLACK"
            : "Practice display closed"}
        </span>
        {connected && (
          <button className="wf-blank" onClick={blank}>
            Blank screen
          </button>
        )}
      </header>
      {screen === "services" ? (
        <main className="wf-home">
          <span className="wf-eyebrow">PREPARE FOR THE SERVICE</span>
          <h1>Your services</h1>
          <p>
            A service is the running order of songs and slides you will present.
          </p>
          {working ? (
            <article>
              <h2>{working.title}</h2>
              <p>{working.items.length} items · practice session only</p>
              <button
                className="wf-primary"
                onClick={() => setScreen("prepare")}
              >
                Open service
              </button>
            </article>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                createService();
              }}
            >
              <h2>Create your first service</h2>
              <label>
                Service name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
              <button className="wf-primary" type="submit">
                Create service
              </button>
            </form>
          )}
        </main>
      ) : (
        working && (
          <>
            <div className="wf-service">
              <div>
                <span className="wf-eyebrow">
                  {screen === "prepare" ? "PREPARE" : "PRESENT"}
                </span>
                <h1>{working.title}</h1>
              </div>
              <div>
                {changed && (
                  <span className="wf-warning">Unapplied changes</span>
                )}
                {connected && (
                  <button
                    disabled={!changed || !working.items.length}
                    onClick={apply}
                  >
                    Apply staged changes
                  </button>
                )}
                {screen === "prepare" ? (
                  <button
                    className="wf-primary"
                    disabled={!working.items.length}
                    onClick={() => {
                      if (!connected) setCommitted(structuredClone(working));
                      setScreen("present");
                      setSelection(0);
                    }}
                  >
                    Present service
                  </button>
                ) : (
                  <button onClick={() => setSetup(true)}>Display setup</button>
                )}
              </div>
            </div>
            <main className="wf-body">
              <aside className="wf-order" aria-label="Practice service order">
                <div className="wf-panel-title">
                  <h2>Service order</h2>
                  {screen === "prepare" && (
                    <button
                      onClick={() => {
                        const content = newContent("song");
                        content.title = "";
                        content.sections[0].label = "Verse 1";
                        setEdit({ content });
                      }}
                    >
                      Add song
                    </button>
                  )}
                </div>
                {!working.items.length && (
                  <p>No items yet. Add your first song.</p>
                )}
                {(screen === "present" ? committed : working)?.items.map(
                  (item, index) => (
                    <div className="wf-order-item" key={item.id}>
                      <strong>
                        {index + 1}. {item.title}
                      </strong>
                      <small>
                        {item.sectionOrder.length} sections · copy for this
                        service
                      </small>
                      {screen === "prepare" ? (
                        <button
                          onClick={() =>
                            setEdit({
                              content: structuredClone(item.snapshot),
                              itemId: item.id,
                            })
                          }
                        >
                          Edit song
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            select(
                              frames.findIndex(
                                (page) => page.itemId === item.id,
                              ),
                            )
                          }
                        >
                          Preview song
                        </button>
                      )}
                    </div>
                  ),
                )}
              </aside>
              {screen === "prepare" ? (
                <section className="wf-prepare">
                  <span className="wf-eyebrow">BUILD THE RUNNING ORDER</span>
                  <h2>
                    {working.items.length
                      ? "Ready for the next item?"
                      : "Start with a song"}
                  </h2>
                  <p>
                    Add words as verses, choruses and bridges. Repeat sections
                    in Song order without retyping them.
                  </p>
                  <button
                    className="wf-primary"
                    onClick={() => {
                      const content = newContent("song");
                      content.title = "";
                      content.sections[0].label = "Verse 1";
                      setEdit({ content });
                    }}
                  >
                    Create song and add
                  </button>
                  <p className="wf-muted">
                    This prototype explores the core workflow. Library search,
                    media and real display connection remain in the current app.
                  </p>
                  {frames[0] && (
                    <div className="wf-preview">
                      <SlideFrame page={frames[0]} />
                    </div>
                  )}
                </section>
              ) : (
                <>
                  <section className="wf-center">
                    <div className="wf-panel-title">
                      <div>
                        <span className="wf-eyebrow">
                          PREVIEW · NOT ON OUTPUT UNTIL SHOW SLIDE
                        </span>
                        <h2>{selectedItem?.title || "Select a song"}</h2>
                      </div>
                      <span>
                        {selected?.sectionLabel}{" "}
                        {selected
                          ? `${selected.pageIndex + 1}/${selectedItem?.snapshot.sections.find((section) => section.id === selected.sectionId)?.pages.length || 1}`
                          : ""}
                      </span>
                    </div>
                    <div className="wf-navigation">
                      <strong>Song order</strong>
                      <div>
                        {selectedItem?.sectionOrder.map((sectionId, index) => {
                          const section = selectedItem.snapshot.sections.find(
                            (s) => s.id === sectionId,
                          );
                          return (
                            <button
                              key={`${sectionId}:${index}`}
                              aria-pressed={selected?.occurrenceIndex === index}
                              onClick={() =>
                                select(
                                  frames.findIndex(
                                    (page) =>
                                      page.itemId === selectedItem.id &&
                                      page.occurrenceIndex === index,
                                  ),
                                )
                              }
                            >
                              {section?.label} <small>{index + 1}</small>
                            </button>
                          );
                        })}
                      </div>
                      <strong>Jump to section</strong>
                      <div>
                        {selectedItem?.snapshot.sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => jump(section.id)}
                          >
                            {section.label}
                          </button>
                        ))}
                      </div>
                      <div aria-label="Section pages">
                        {frames.map((page, index) =>
                          page.itemId === selected?.itemId &&
                          page.occurrenceIndex === selected?.occurrenceIndex ? (
                            <button
                              key={page.id}
                              aria-pressed={index === selection}
                              onClick={() => select(index)}
                            >
                              Slide {page.pageIndex + 1}
                            </button>
                          ) : null,
                        )}
                      </div>
                    </div>
                    <div className="wf-preview">
                      {selected ? (
                        <SlideFrame page={selected} />
                      ) : (
                        <p>No presenting pages</p>
                      )}
                    </div>
                    <p>
                      {!ready ? "Preparing preview…" : "Preview ready"} ·
                      Navigation selects preview only.
                    </p>
                  </section>
                  <aside className="wf-output">
                    <span className="wf-eyebrow">
                      SIMULATED CONGREGATION OUTPUT
                    </span>
                    <h2>{live ? "Live" : "Black"}</h2>
                    <div
                      className="wf-output-frame"
                      aria-label="Simulated congregation frame"
                    >
                      {live && <SlideFrame page={live.page} />}
                    </div>
                    {live && live.version !== version && (
                      <p className="wf-warning">
                        Live: previous version. Show slide to show the new preview.
                      </p>
                    )}
                    <h3>Next preview</h3>
                    <p>
                      {frames[selection + 1]
                        ? `${frames[selection + 1].itemTitle} · ${frames[selection + 1].sectionLabel} · slide ${frames[selection + 1].pageIndex + 1}`
                        : "End of service"}
                    </p>
                    <h3>Operator notes</h3>
                    <p className="wf-muted">
                      Wait for the worship leader's cue. Preview the section,
                      then Show slide.
                    </p>
                  </aside>
                </>
              )}
            </main>
            {screen === "present" && (
              <section
                className="wf-controls"
                aria-label="Practice presentation controls"
              >
                <div>
                  <button
                    disabled={selection === 0 || !frames.length}
                    onClick={() => select(selection - 1)}
                  >
                    ← Previous preview
                  </button>
                  <span>
                    {frames.length ? selection + 1 : 0} / {frames.length}
                  </span>
                  <button
                    disabled={selection >= frames.length - 1}
                    onClick={() => select(selection + 1)}
                  >
                    Next preview →
                  </button>
                </div>
                <div>
                  {!connected ? (
                    <button
                      className="wf-primary"
                      onClick={() => setSetup(true)}
                    >
                      Connect practice display
                    </button>
                  ) : (
                    <>
                      <button
                        className="wf-primary"
                        disabled={
                          !ready || !selected || !!pageReadinessIssue(selected)
                        }
                        onClick={take}
                      >
                        Show slide
                      </button>
                      <button className="wf-blank" onClick={blank}>
                        Blank screen
                      </button>
                      <button
                        onClick={() => {
                          setConnected(false);
                          setLive(undefined);
                          setCommitted(undefined);
                          setScreen("prepare");
                          setNotice("Practice session ended. Output is black.");
                        }}
                      >
                        End presentation
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
          </>
        )
      )}
      <div className="wf-notice" role="status">
        {notice || "Practice the workflow without changing your saved library."}
      </div>
      {(edit || setup) && (
        <dialog
          onCancel={(event) => {
            if (edit) {
              event.preventDefault();
              if (confirm("Discard this unsaved practice draft?"))
                setEdit(undefined);
            } else setSetup(false);
          }}
        >
          {edit ? (
            <>
              <div className="wf-panel-title">
                <h2>{edit.itemId ? "Edit service copy" : "Create song"}</h2>
                <button
                  onClick={() => {
                    if (confirm("Discard this unsaved practice draft?"))
                      setEdit(undefined);
                  }}
                >
                  Cancel
                </button>
              </div>
              <label>
                Song title
                <input
                  autoFocus
                  value={edit.content.title}
                  onChange={(event) =>
                    changeContent((c) => {
                      c.title = event.target.value;
                    })
                  }
                />
              </label>
              <p className="wf-muted">
                Temporary practice song. The production save-and-add will use
                the local database transaction.
              </p>
              <div className="wf-lyric-editor">
                {edit.content.sections.map((section, index) => (
                  <fieldset key={section.id}>
                    <legend>{section.label}</legend>
                    {section.pages.map((page, pageIndex) => (
                      <label key={page.id}>
                        {section.label} · slide {pageIndex + 1}
                        <textarea
                          rows={3}
                          value={page.text}
                          onChange={(event) =>
                            changeContent((c) => {
                              c.sections[index].pages[pageIndex].text =
                                event.target.value;
                            })
                          }
                        />
                      </label>
                    ))}
                    <button
                      onClick={() =>
                        changeContent((c) => {
                          c.sections[index].pages.push(newPage());
                        })
                      }
                    >
                      Add slide to {section.label}
                    </button>
                  </fieldset>
                ))}
              </div>
              <div className="wf-wrap">
                {["Verse", "Chorus", "Bridge"].map((label) => (
                  <button
                    key={label}
                    onClick={() =>
                      changeContent((c) => {
                        const count = c.sections.filter((section) =>
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
                        c.sections.push(section);
                        c.arrangements[0].sectionIds.push(section.id);
                      })
                    }
                  >
                    Add {label.toLowerCase()}
                  </button>
                ))}
              </div>
              <h3>Song order</h3>
              <p>
                {edit.content.arrangements[0].sectionIds
                  .map(
                    (sectionId) =>
                      edit.content.sections.find(
                        (section) => section.id === sectionId,
                      )?.label,
                  )
                  .join(" → ")}
              </p>
              <div className="wf-wrap">
                <select
                  aria-label="Section to repeat"
                  value={sectionChoice}
                  onChange={(event) => setSectionChoice(event.target.value)}
                >
                  <option value="">Choose section to repeat</option>
                  {edit.content.sections.map((section) => (
                    <option value={section.id} key={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
                <button
                  disabled={
                    !edit.content.sections.some(
                      (section) => section.id === sectionChoice,
                    )
                  }
                  onClick={() =>
                    changeContent((c) => {
                      c.arrangements[0].sectionIds.push(sectionChoice);
                    })
                  }
                >
                  Add section to order
                </button>
              </div>
              <footer>
                {connected && (
                  <button className="wf-blank" onClick={blank}>
                    Blank screen
                  </button>
                )}
                <button
                  className="wf-primary"
                  disabled={!editValid}
                  onClick={saveSong}
                >
                  {edit.itemId
                    ? "Save service copy"
                    : "Save song and add to service"}
                </button>
              </footer>
            </>
          ) : (
            <>
              <h2>Connect practice display</h2>
              <p>
                This prototype simulates a congregation screen inside the
                operator page. It does not open a projector window.
              </p>
              <p>Real output will start black and need a separate Show slide.</p>
              {connected && (
                <button className="wf-blank" onClick={blank}>
                  Blank screen
                </button>
              )}
              <footer>
                <button onClick={() => setSetup(false)}>Close setup</button>
                <button
                  className="wf-primary"
                  onClick={() => {
                    setConnected(true);
                    setLive(undefined);
                    if (working) setCommitted(structuredClone(working));
                    setVersion((v) => v + 1);
                    setSetup(false);
                    setNotice(
                      "Practice display connected black. Select a preview and click Show slide.",
                    );
                  }}
                >
                  Connect simulated output
                </button>
              </footer>
            </>
          )}
        </dialog>
      )}
    </div>
  );
}
