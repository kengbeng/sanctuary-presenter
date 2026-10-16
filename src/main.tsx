import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PresentationLease, applySafeUpdate } from "./coordination";
import { registerSW } from "virtual:pwa-register";
import {
  channelName,
  fresh,
  outputUrl,
  slides,
  transition,
  valid,
  type Message,
  type Kind,
  type Phase,
} from "./protocol";
import {
  ChromiumDisplayAdapter,
  ManualDisplayAdapter,
  type Display,
} from "./display";
import "./style.css";
import { Library } from "./Library";
import { SlideFrame, prepareMedia } from "./SlideFrame";
import { db } from "./repository";
import {
  defaultStyle,
  servicePages,
  type Page,
  type ServiceOrder,
} from "./model";
const samplePages: Page[] = slides.map((s, i) => ({
  id: "sample-" + i,
  title: s.title,
  text: s.text,
  secondary: "",
  style: { ...defaultStyle, fontSize: 69 },
}));
const isOutput = location.hash.startsWith("#/output");
const instance = crypto.randomUUID();
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(channelName())
    : null;
const params = new URLSearchParams(location.hash.split("?")[1]);
function Frame({
  slide,
  test = false,
  page,
}: {
  slide: number;
  test?: boolean;
  page?: Page;
}) {
  return (
    <SlideFrame
      page={page ?? samplePages[slide] ?? samplePages[0]}
      test={test}
    />
  );
}
function Output() {
  const session = params.get("session") || "";
  const test = params.get("test") === "1";
  const [blank, setBlank] = useState(true);
  const [slide, setSlide] = useState(0);
  const [outputPage, setOutputPage] = useState<Page>();
  const outputLease = useRef(new PresentationLease());
  const guarded = useRef(false),
    ended = useRef(false);
  const generation = useRef(0);
  const pendingLoad = useRef<AbortController | null>(null);
  const renderReady = useRef(false);
  const [guidance, setGuidance] = useState("");
  const [connected, setConnected] = useState(false);
  const blankRef = useRef(true);
  blankRef.current = blank;
  const seq = useRef(0),
    last = useRef(0),
    beat = useRef(Date.now()),
    owner = useRef("");
  const send = (type: Kind, extra: Partial<Message> = {}) =>
    channel?.postMessage({
      v: 1,
      session,
      instance,
      seq: ++seq.current,
      type,
      ...extra,
    });
  useEffect(() => {
    if (!channel || !session) return;
    const status = () =>
      send("OUTPUT_STATUS", {
        blank: blankRef.current,
        fullscreen: !!document.fullscreenElement,
        rendered: blankRef.current || renderReady.current,
      });
    const receive = (e: MessageEvent) => {
      if (
        !guarded.current ||
        ended.current ||
        !valid(e.data, session) ||
        e.data.instance === instance
      )
        return;
      const m = e.data;
      if (owner.current && owner.current !== m.instance) return;
      if (m.target !== instance || !fresh(m.seq, last.current)) return;
      last.current = m.seq;
      owner.current = m.instance;
      beat.current = Date.now();
      if (m.type === "SYNC_STATE") {
        generation.current++;
        pendingLoad.current?.abort();
        setBlank(true);
        setConnected(true);
        requestAnimationFrame(() =>
          send("READY", {
            blank: true,
            rendered: true,
            fullscreen: !!document.fullscreenElement,
          }),
        );
      }
      if (m.type === "HEARTBEAT") send("HEARTBEAT");
      if (m.type === "SHOW_SLIDE") {
        const current = ++generation.current;
        pendingLoad.current?.abort();
        const controller = new AbortController();
        pendingLoad.current = controller;
        renderReady.current = false;
        setBlank(true);
        send("MEDIA_STATUS", { rendered: false });
        void (async () => {
          try {
            const page = m.frameId
              ? (await db.frames.get(m.frameId))?.page
              : samplePages[m.slide ?? 0];
            if (!page)
              throw Error(
                "Prepared slide is missing. Return to the operator and Show again.",
              );
            const prepared = test
              ? { page, warnings: [] }
              : await prepareMedia(page, controller.signal);
            if (current !== generation.current) return;
            setOutputPage(prepared.page);
            for (const warning of prepared.warnings)
              send("MEDIA_STATUS", { error: warning, rendered: true });
            setSlide(m.slide ?? 0);
            setBlank(false);
          } catch (e) {
            if (current !== generation.current) return;
            setBlank(true);
            send("MEDIA_STATUS", {
              rendered: false,
              error:
                e instanceof Error ? e.message : "Slide preparation failed.",
              blank: true,
            });
            send("ERROR", {
              error:
                e instanceof Error ? e.message : "Slide preparation failed.",
              blank: true,
            });
          }
        })();
      }
      if (m.type === "SET_BLANK") {
        generation.current++;
        pendingLoad.current?.abort();
        setBlank(true);
      }
      if (m.type === "STOP_PRESENTATION") {
        ended.current = true;
        outputLease.current.release();
        generation.current++;
        pendingLoad.current?.abort();
        setBlank(true);
        setConnected(false);
        window.close();
      }
    };
    channel.addEventListener("message", receive);
    void outputLease.current.acquire().then((acquired) => {
      if (!acquired) {
        setGuidance(
          "An update or restore is in progress. Close this output and retry afterward.",
        );
        return;
      }
      guarded.current = true;
      send("HELLO");
    });
    const release = () => outputLease.current.release();
    window.addEventListener("pagehide", release);
    const timer = setInterval(() => {
      if (ended.current || !guarded.current) return;
      if (!owner.current) send("HELLO");
      if (Date.now() - beat.current > 5000) {
        generation.current++;
        pendingLoad.current?.abort();
        setBlank(true);
        setConnected(false);
        owner.current = "";
        last.current = 0;
        send("HELLO");
      }
    }, 1000);
    document.addEventListener("fullscreenchange", status);
    return () => {
      clearInterval(timer);
      outputLease.current.release();
      window.removeEventListener("pagehide", release);
      channel.removeEventListener("message", receive);
      document.removeEventListener("fullscreenchange", status);
    };
  }, []);
  useEffect(() => {
    if (!session || !blank) return;
    const id = requestAnimationFrame(() =>
      send("OUTPUT_STATUS", {
        blank,
        fullscreen: !!document.fullscreenElement,
        rendered: true,
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [blank, slide, outputPage]);
  async function fullscreen() {
    if (!document.documentElement.requestFullscreen) {
      setGuidance(
        "Fullscreen is unavailable. Use browser fullscreen or keep this window windowed.",
      );
      return;
    }
    try {
      await document.documentElement.requestFullscreen();
      setGuidance("");
    } catch {
      setGuidance(
        "Fullscreen was not enabled. Click Enter Fullscreen again, use browser fullscreen, or continue windowed.",
      );
      send("ERROR", {
        error:
          "Fullscreen inactive. Use Enter Fullscreen in the output window or continue windowed.",
      });
    }
  }
  useEffect(() => {
    if (params.get("fullscreen") !== "1") return;
    // A popup's asynchronous startup usually has no transient activation.
    // Unknown activation support also falls back to a fresh in-window click.
    if (navigator.userActivation?.isActive) void fullscreen();
    else
      setGuidance(
        "Click Enter Fullscreen in this window to enable fullscreen.",
      );
  }, []);
  return (
    <main className="output">
      <div
        className="blackout"
        hidden={!blank}
        aria-label="Congregation output is black"
      />
      {outputPage && connected && (
        <div
          className="output-surface"
          style={{ display: blank ? "none" : "flex" }}
        >
          <SlideFrame
            page={outputPage ?? samplePages[slide]}
            test={test}
            preview={false}
            active={!blank}
            onWarning={(error) =>
              send("MEDIA_STATUS", { error, rendered: true })
            }
            onReady={() => {
              if (blankRef.current) return;
              renderReady.current = true;
              send("MEDIA_STATUS", { rendered: true });
              send("OUTPUT_STATUS", {
                blank: false,
                rendered: true,
                fullscreen: !!document.fullscreenElement,
              });
            }}
            onError={(error) => {
              generation.current++;
              pendingLoad.current?.abort();
              setBlank(true);
              send("ERROR", { error, blank: true });
              send("MEDIA_STATUS", { error, rendered: false });
            }}
          />
        </div>
      )}
      <div className="output-tools">
        <button onClick={fullscreen}>Enter Fullscreen</button>
        <button
          onClick={() => {
            generation.current++;
            pendingLoad.current?.abort();
            setBlank(true);
          }}
        >
          Black now
        </button>
        <span>
          {connected ? "Connected" : "Waiting for operator"} ·{" "}
          {guidance ||
            "Move this window to the projector. Controls hide when the pointer leaves."}
        </span>
      </div>
    </main>
  );
}
function Operator() {
  const [view, setView] = useState<"present" | "library">("present");
  const [loaded, setLoaded] = useState<ServiceOrder>();
  const [mediaState, setMediaState] = useState("Bundled text ready");
  const frames = loaded
    ? servicePages(loaded)
    : samplePages.map((p) => ({ ...p, itemTitle: p.title, notes: "" }));
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const [sending, setSending] = useState(false);
  const showGeneration = useRef(0);

  const [phase, setPhase] = useState<Phase>("IDLE");
  const phaseRef = useRef<Phase>("IDLE");
  const [slide, setSlide] = useState(0);
  const currentFrame =
    frames[Math.min(slide, frames.length - 1)] ?? samplePages[0];
  const [test, setTest] = useState(false);
  const [mode, setMode] = useState("automatic");
  const [screens, setScreens] = useState<Display[]>([]);
  const [target, setTarget] = useState("");
  const [requestFull, setRequestFull] = useState(true);
  const [full, setFull] = useState(false);
  const [placement, setPlacement] = useState("Unknown — verify on projector");
  const [notice, setNotice] = useState(
    "Configure your output, then start a blank session.",
  );
  const [offline, setOffline] = useState(false);
  const [update, setUpdate] = useState(false);
  const [otherActive, setOtherActive] = useState(false);
  const leases = useRef(new Map<string, number>());
  const retired = useRef(new Set<string>());
  const popup = useRef<Window | null>(null),
    session = useRef(""),
    active = useRef(""),
    seq = useRef(0),
    last = useRef(0),
    beat = useRef(0);
  const live = useRef(false);
  const operatorLease = useRef(new PresentationLease());
  const [applyingUpdate, setApplyingUpdate] = useState(false);
  const desiredVisible = useRef(false);
  const testing = useRef(false);
  const beforeTest = useRef<Phase>("IDLE");
  const sw = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  const change = (event: Parameters<typeof transition>[1]) => {
    phaseRef.current = transition(phaseRef.current, event);
    setPhase(phaseRef.current);
    live.current = !["IDLE", "STOPPED"].includes(phaseRef.current);
  };
  const send = (type: Kind, extra: Partial<Message> = {}) =>
    channel?.postMessage({
      v: 1,
      session: session.current,
      target: active.current || undefined,
      instance,
      seq: ++seq.current,
      type,
      ...extra,
    });
  useEffect(() => {
    sw.current = registerSW({
      onOfflineReady: () => setOffline(true),
      onNeedRefresh: () => setUpdate(true),
    });
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.ready
        .then(async () => {
          if (
            await caches.match(
              new URL(import.meta.env.BASE_URL + "index.html", location.origin),
              { ignoreSearch: true },
            )
          )
            setOffline(true);
        })
        .catch(() => {});
    const receive = (e: MessageEvent) => {
      if (
        e.data?.v === 1 &&
        e.data?.type === "HEARTBEAT" &&
        e.data?.instance !== instance &&
        typeof e.data?.instance === "string"
      )
        leases.current.set(e.data.instance, Date.now());
      if (!valid(e.data, session.current) || e.data.instance === instance)
        return;
      const m = e.data;
      if (m.type === "HELLO") {
        if (retired.current.has(m.instance)) return;
        desiredVisible.current = false;
        if (active.current && active.current !== m.instance) {
          send("SET_BLANK");
          retired.current.add(active.current);
        }
        active.current = m.instance;
        last.current = 0;
        phaseRef.current = "OPENING";
        setPhase("OPENING");
        send("SYNC_STATE", { blank: true });
      }
      if (m.instance !== active.current || !fresh(m.seq, last.current)) return;
      last.current = m.seq;
      beat.current = Date.now();
      if (m.type === "READY") {
        setFull(!!m.fullscreen);
        change("READY");
        setNotice("Output acknowledged. Verify display placement before Show.");
      }
      if (m.type === "OUTPUT_STATUS") {
        setFull(!!m.fullscreen);
        if (m.rendered) {
          if (m.blank) change("BLANK");
          else if (desiredVisible.current) {
            change("SHOW");
            setMediaState("Ready");
          }
        }
      }
      if (m.type === "MEDIA_STATUS") {
        if (m.error) setNotice(m.error);
        setMediaState(
          m.error
            ? "Error: " + m.error
            : m.rendered
              ? "Ready"
              : "Preparing slide",
        );
      }
      if (m.type === "ERROR") {
        if (m.blank) {
          desiredVisible.current = false;
          change("BLANK");
        }
        setNotice(m.error || "Output error");
      }
    };
    channel?.addEventListener("message", receive);
    const timer = setInterval(() => {
      setOtherActive(
        [...leases.current.values()].some((t) => Date.now() - t < 6000),
      );
      if (!live.current) return;
      send("HEARTBEAT");
      if (popup.current?.closed && testing.current) {
        operatorLease.current.release();
        phaseRef.current = beforeTest.current;
        setPhase(beforeTest.current);
        live.current = false;
        session.current = "";
        return;
      }
      if (
        popup.current?.closed ||
        (beat.current && Date.now() - beat.current > 5000)
      ) {
        change("LOST");
        setPlacement("Unknown — connection lost");
      }
    }, 1000);
    const moved = () =>
      setPlacement("Unknown — screen configuration changed; verify placement");
    void db.settings
      .get("selectedService")
      .then(async (setting) => {
        if (setting) {
          const order = await db.services.get(setting.value);
          if (order) setLoaded(order);
        }
      })
      .catch((error) =>
        setNotice("Local library could not be opened: " + String(error)),
      );
    const topology = () => {
      moved();
      setScreens([]);
      setTarget("");
    };
    window.addEventListener("sanctuary-display-change", topology);
    window.addEventListener("resize", moved);
    return () => {
      operatorLease.current.release();
      channel?.removeEventListener("message", receive);
      clearInterval(timer);
      window.removeEventListener("resize", moved);
      window.removeEventListener("sanctuary-display-change", topology);
    };
  }, []);
  async function configure() {
    try {
      const ds = await new ChromiumDisplayAdapter().discover();
      setScreens(ds);
      const secondary = ds.filter((d) => !d.isPrimary);
      setTarget(secondary.length === 1 ? String(ds.indexOf(secondary[0])) : "");
      setNotice(
        ds.length === 1
          ? "Only one screen discovered. Use windowed output or manual positioning."
          : secondary.length > 1
            ? "Select the intended secondary display."
            : "Display configured. Placement still needs visual verification.",
      );
    } catch (e) {
      setMode("manual");
      setNotice(String(e));
    }
  }
  function stop() {
    operatorLease.current.release();
    const previous = session.current;
    if (previous)
      void db.frames
        .where("sessionId")
        .equals(previous)
        .delete()
        .catch(() => {});
    showGeneration.current++;
    setSending(false);
    send("STOP_PRESENTATION");
    popup.current?.close();
    change("STOP");
    active.current = "";
    desiredVisible.current = false;
    session.current = "";
    setFull(false);
  }
  function start(isTest: boolean) {
    const previous = session.current;
    if (previous)
      void db.frames
        .where("sessionId")
        .equals(previous)
        .delete()
        .catch(() => {});
    showGeneration.current++;
    setSending(false);
    if (!channel) {
      setNotice("BroadcastChannel unavailable. Use a supported browser.");
      return;
    }
    if (
      mode === "automatic" &&
      screens.filter((d) => !d.isPrimary).length > 1 &&
      target === ""
    ) {
      setNotice("Select a display or choose Manual before starting.");
      return;
    }
    if (popup.current && !popup.current.closed) {
      send("SET_BLANK");
      popup.current.close();
    }
    if (isTest)
      beforeTest.current = ["IDLE", "STOPPED"].includes(phaseRef.current)
        ? phaseRef.current
        : "STOPPED";
    testing.current = isTest;
    desiredVisible.current = false;
    session.current = crypto.randomUUID();
    seq.current = 0;
    last.current = 0;
    active.current = "";
    beat.current = Date.now();
    setTest(isTest);
    setFull(false);
    change("START");
    const d = target === "" ? undefined : screens[Number(target)];
    popup.current = (
      mode === "automatic"
        ? new ChromiumDisplayAdapter()
        : new ManualDisplayAdapter()
    ).open(outputUrl(session.current, isTest, requestFull), d);
    const openedSession = session.current;
    operatorLease.current.release();
    if (popup.current)
      void operatorLease.current.acquire().then((acquired) => {
        if (session.current !== openedSession) return;
        if (!acquired) {
          send("STOP_PRESENTATION");
          popup.current?.close();
          session.current = "";
          change("STOP");
          setNotice(
            "An update or restore is in progress. Retry presentation afterward.",
          );
        }
      });
    setPlacement(
      d
        ? "Placement requested — verify on projector"
        : "Manual — move window and verify",
    );
    if (!popup.current) {
      change("LOST");
      setNotice(
        "Popup blocked. Allow popups for this site, then click Start or Reconnect again.",
      );
    } else {
      setNotice(
        requestFull
          ? "Output starts black. Click Enter Fullscreen inside it; browser permission may require a fresh gesture."
          : "Output starts black in windowed mode.",
      );
    }
  }
  async function transmit(index: number) {
    const token = ++showGeneration.current;
    const currentSession = session.current;
    const page = framesRef.current[index];
    if (!page) {
      setNotice(
        "This service has no slides. Add content in Library & planner.",
      );
      return;
    }
    setSending(true);
    try {
      const frameId = await db.prepareFrame(page, currentSession);
      if (
        token !== showGeneration.current ||
        currentSession !== session.current
      ) {
        await db.frames.delete(frameId);
        return;
      }
      desiredVisible.current = true;
      send("SHOW_SLIDE", { frameId });
    } catch (error) {
      if (token === showGeneration.current)
        setNotice("Could not prepare slide: " + String(error));
    } finally {
      if (token === showGeneration.current) setSending(false);
    }
  }
  function show() {
    if (["READY_BLANK", "BLANKED", "LIVE"].includes(phaseRef.current))
      void transmit(slide);
  }
  function blankOutput() {
    showGeneration.current++;
    setSending(false);
    desiredVisible.current = false;
    change("BLANK");
    send("SET_BLANK");
  }
  function navigate(n: number) {
    const next = Math.max(0, Math.min(framesRef.current.length - 1, n));
    setSlide(next);
    if (
      desiredVisible.current &&
      ["LIVE", "BLANKED", "READY_BLANK"].includes(phaseRef.current)
    )
      void transmit(next);
  }
  function loadService(order: ServiceOrder) {
    blankOutput();
    setLoaded(order);
    setSlide(0);
    setTest(false);
    setView("present");
    setNotice("Service loaded. Output remains black until Show.");
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (view !== "present") return;
      if ((e.target as HTMLElement).matches("input,select,textarea,button"))
        return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(slide + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(slide - 1);
      }
      if (e.key === "b" || e.key === "Escape") blankOutput();
      if (e.key === "s") show();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [slide, view]);
  return (
    <div className="app">
      <header>
        <div className="brand">
          ✦ <strong>Sanctuary</strong>
          <span>Presenter / v2</span>
        </div>
        <nav className="tabs" aria-label="Workspace">
          <button
            aria-pressed={view === "present"}
            onClick={() => setView("present")}
          >
            Present
          </button>
          <button
            aria-pressed={view === "library"}
            onClick={() => setView("library")}
          >
            Library & planner
          </button>
        </nav>
      </header>
      <div hidden={view !== "library"}>
        <Library
          onPresent={loadService}
          onRestored={() => {
            blankOutput();
            setLoaded(undefined);
            setSlide(0);
            setTest(false);
          }}
          canRestore={!live.current && !otherActive}
        />
      </div>
      <main className="workspace" hidden={view !== "present"}>
        <aside>
          <span className="eyebrow">
            {loaded ? "SERVICE ORDER" : "SAMPLE SERVICE"}
          </span>
          <h2>{loaded?.title ?? "A time to gather"}</h2>
          <p className="muted">Presentation rehearsal</p>
          {frames.map((s, i) => (
            <button
              className={"service-item " + (slide === i ? "selected" : "")}
              key={s.id + ":" + i}
              onClick={() => navigate(i)}
            >
              <span>0{i + 1}</span>
              <div>
                <strong>{s.itemTitle || s.title || "Slide " + (i + 1)}</strong>
                <small>{loaded ? "Service copy" : "Sample slide"}</small>
              </div>
            </button>
          ))}
          <div className="aside-note">
            Local by design
            <p>
              No accounts, uploads, analytics, or remote content. This phase
              stores content only in this browser. Export backups regularly.
            </p>
          </div>
        </aside>
        <section className="editor">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CURRENT / PENDING</span>
              <h2>
                {test
                  ? "Test output"
                  : currentFrame.title ||
                    ("itemTitle" in currentFrame
                      ? String(currentFrame.itemTitle)
                      : "Selected slide")}
              </h2>
            </div>
            <span className="pill">16:9</span>
          </div>
          <Frame slide={slide} page={currentFrame} />
          <div className="transport">
            <button onClick={() => navigate(slide - 1)} disabled={slide === 0}>
              ← Previous
            </button>
            <span>
              {frames.length ? slide + 1 : 0} / {frames.length}
            </span>
            <button
              onClick={() => navigate(slide + 1)}
              disabled={!frames.length || slide >= frames.length - 1}
            >
              Next →
            </button>
          </div>
          <div className="bottom-grid">
            <div>
              <span className="eyebrow">NEXT SLIDE · PREVIEW ONLY</span>
              <Frame
                slide={0}
                page={
                  frames[Math.min(slide + 1, frames.length - 1)] ??
                  samplePages[0]
                }
              />
            </div>
            <div className="notes">
              <span className="eyebrow">OPERATOR NOTES</span>
              <p>
                {"notes" in currentFrame && currentFrame.notes
                  ? String(currentFrame.notes)
                  : "Verify the projector is showing black before the service begins."}
              </p>
              <small>Notes stay in this operator window.</small>
            </div>
          </div>
        </section>
        <section className="setup">
          <span className="eyebrow">OUTPUT SETUP</span>
          <h2>Ready when you are</h2>
          <label>
            Display positioning
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <button onClick={configure}>Configure Display</button>
          <label>
            Preferred display
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Manual / no screen selected</option>
              {screens.map((d, i) => (
                <option value={i} key={i}>
                  {d.label || `Discovered screen ${i + 1}`}{" "}
                  {d.isPrimary ? "(primary)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={requestFull}
              onChange={(e) => setRequestFull(e.target.checked)}
            />
            Request fullscreen
          </label>
          <p className="muted">
            Start blank is always enforced. Move the output window to your
            projector, then click its Enter Fullscreen button.
          </p>
          <div className="black-preview" />
          <small>Preview only · initial congregation output</small>
          <div className="actions">
            <button onClick={() => start(true)}>Test Output</button>
            <button className="primary" onClick={() => start(false)}>
              Start Presentation
            </button>
          </div>
          <div className="status" role="status">
            <strong>{phase}</strong>
            <dl>
              <dt>Connection</dt>
              <dd>
                {["READY_BLANK", "LIVE", "BLANKED"].includes(phase)
                  ? "Acknowledged"
                  : "Not ready"}
              </dd>
              <dt>Placement</dt>
              <dd>{placement}</dd>
              <dt>Fullscreen</dt>
              <dd>{full ? "Active" : "Inactive"}</dd>
              <dt>Output</dt>
              <dd>
                {phase === "LIVE"
                  ? "Live"
                  : ["READY_BLANK", "BLANKED"].includes(phase)
                    ? "Black"
                    : "Not connected"}
              </dd>
              <dt>Media</dt>
              <dd>{mediaState}</dd>
            </dl>
          </div>
          <div className="actions">
            <button
              className="show"
              disabled={
                sending ||
                !frames.length ||
                !["READY_BLANK", "BLANKED", "LIVE"].includes(phase)
              }
              onClick={show}
            >
              {test ? "Show Test Pattern" : "Show / Restore"}
            </button>
            <button className="blank" onClick={blankOutput}>
              Blank
            </button>
          </div>
          <button
            onClick={() =>
              setPlacement("Operator visually confirmed target display")
            }
          >
            Confirm visible placement
          </button>
          <div className="actions">
            <button onClick={() => start(test)}>Reconnect Output</button>
            <button
              onClick={() => {
                popup.current?.focus();
                setNotice(
                  "Move output to the intended screen, use Enter Fullscreen there, then visually confirm placement.",
                );
              }}
            >
              Reposition Output
            </button>
            <button onClick={stop}>Stop Presentation</button>
          </div>
          <p className="notice" role="status">
            {notice}
          </p>
        </section>
      </main>
      <footer>
        <span>
          {offline
            ? "● App shell cached · offline ready"
            : "○ Offline cache not yet confirmed"}
        </span>
        <span>Keys: ← → navigate · B blank · S show · Esc blank</span>
        {update && (
          <button
            disabled={live.current || otherActive || applyingUpdate}
            onClick={() => {
              if (live.current || otherActive || applyingUpdate) return;
              setApplyingUpdate(true);
              void applySafeUpdate(async () => {
                await sw.current?.(true);
              })
                .catch((error) =>
                  setNotice(
                    error instanceof Error
                      ? error.message
                      : "Update could not be applied.",
                  ),
                )
                .finally(() => setApplyingUpdate(false));
            }}
          >
            {applyingUpdate
              ? "Applying update — keep outputs stopped until reload"
              : "Apply update after stopping all output windows"}
          </button>
        )}
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  isOutput ? <Output /> : <Operator />,
);
