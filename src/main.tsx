import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
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
import { ServiceWorkspace } from "./ServiceWorkspace";
import { ModernPresenter } from "./ModernPresenter";
import { presentationPath, sectionJump, type ExtraSection } from "./navigation";
import { SlideFrame, prepareMedia } from "./SlideFrame";
import { db } from "./repository";
import {
  defaultStyle,
  servicePages,
  pageReadinessIssue,
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
const instance = crypto.randomUUID();
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(channelName())
    : null;
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
  const params = new URLSearchParams(location.hash.split("?")[1]);
  const session = params.get("session") || "";
  const test = params.get("test") === "1";
  const cue = params.get("cue") === "1";
  type Slot = { page: Page; frameId: string; generation: number };
  const [slots, setSlots] = useState<Array<Slot | undefined>>([
    undefined,
    undefined,
  ]);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const [front, setFront] = useState(0);
  const frontRef = useRef(0);
  const pendingSlot = useRef<number | null>(null);
  const frameIdentity = useRef<string | undefined>(undefined);
  const [tools, setTools] = useState(true);
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
      ...(cue ? { cue: true, frameId: frameIdentity.current } : {}),
      visible: document.visibilityState === "visible",
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
        pendingSlot.current = null;
        blankRef.current = true;
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
      if (cue && m.type === "SETUP_CONTROLS") setTools(true);
      if (cue && m.type === "CANCEL_PENDING") {
        generation.current++;
        pendingLoad.current?.abort();
        pendingSlot.current = null;
        setSlots((previous) =>
          previous.map((slot, index) =>
            index === frontRef.current ? slot : undefined,
          ),
        );
        send("CANCELLED", {
          frameId: m.frameId,
          visibleFrameId: frameIdentity.current,
          blank: blankRef.current,
        });
      }
      if (m.type === "SHOW_SLIDE") {
        const current = ++generation.current;
        pendingLoad.current?.abort();
        const controller = new AbortController();
        pendingLoad.current = controller;
        if (!cue) {
          renderReady.current = false;
          setBlank(true);
        }
        send("MEDIA_STATUS", { rendered: false, frameId: m.frameId });
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
            if (cue && m.frameId) {
              const front = slotsRef.current[frontRef.current];
              if (
                front &&
                JSON.stringify(front.page) === JSON.stringify(prepared.page)
              ) {
                frameIdentity.current = m.frameId;
                setSlots((previous) =>
                  previous.map((slot, index) =>
                    index === frontRef.current && slot
                      ? { ...slot, frameId: m.frameId!, generation: current }
                      : slot,
                  ),
                );
                pendingSlot.current = null;
                blankRef.current = false;
                setBlank(false);
                setTools(false);
                requestAnimationFrame(() => {
                  if (current === generation.current)
                    send("OUTPUT_STATUS", {
                      frameId: m.frameId,
                      blank: false,
                      rendered: true,
                      fullscreen: !!document.fullscreenElement,
                    });
                });
              } else {
                const back = 1 - frontRef.current;
                pendingSlot.current = back;
                setSlots((previous) =>
                  previous.map((slot, index) =>
                    index === back
                      ? {
                          page: prepared.page,
                          frameId: m.frameId!,
                          generation: current,
                        }
                      : slot,
                  ),
                );
              }
              for (const warning of prepared.warnings)
                send("MEDIA_STATUS", {
                  error: warning,
                  rendered: false,
                  frameId: m.frameId,
                });
              return;
            }
            setOutputPage(prepared.page);
            for (const warning of prepared.warnings)
              send("MEDIA_STATUS", { error: warning, rendered: true });
            setSlide(m.slide ?? 0);
            setBlank(false);
          } catch (e) {
            if (current !== generation.current) return;
            blankRef.current = true;
            pendingSlot.current = null;
            setBlank(true);
            send("MEDIA_STATUS", {
              frameId: m.frameId,
              rendered: false,
              error:
                e instanceof Error ? e.message : "Slide preparation failed.",
              blank: true,
            });
            send("ERROR", {
              frameId: m.frameId,
              error:
                e instanceof Error ? e.message : "Slide preparation failed.",
              blank: true,
            });
          }
        })();
      }
      if (m.type === "SET_BLANK") {
        blankRef.current = true;
        pendingSlot.current = null;
        setTools(true);
        generation.current++;
        pendingLoad.current?.abort();
        setBlank(true);
        requestAnimationFrame(() =>
          send("OUTPUT_STATUS", {
            blank: true,
            rendered: true,
            fullscreen: !!document.fullscreenElement,
          }),
        );
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
    const visibility = () =>
      send("OUTPUT_VISIBILITY", {
        visible: document.visibilityState === "visible",
      });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      outputLease.current.release();
      window.removeEventListener("pagehide", release);
      channel.removeEventListener("message", receive);
      document.removeEventListener("fullscreenchange", status);
      document.removeEventListener("visibilitychange", visibility);
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
      {cue &&
        connected &&
        slots.map(
          (slot, index) =>
            slot && (
              <div
                key={index}
                className="output-surface cue-buffer"
                data-front={front === index}
                style={{
                  visibility: front === index && !blank ? "visible" : "hidden",
                  zIndex: front === index ? 2 : 1,
                }}
                aria-hidden={front !== index || blank}
              >
                <SlideFrame
                  page={slot.page}
                  preview={false}
                  test={test}
                  active={front === index && !blank}
                  reportPrepared={true}
                  onReady={() => {
                    if (
                      slot.generation !== generation.current ||
                      pendingSlot.current !== index
                    )
                      return;
                    pendingSlot.current = null;
                    frontRef.current = index;
                    frameIdentity.current = slot.frameId;
                    renderReady.current = true;
                    blankRef.current = false;
                    setFront(index);
                    setBlank(false);
                    setTools(false);
                    requestAnimationFrame(() => {
                      if (slot.generation === generation.current)
                        send("OUTPUT_STATUS", {
                          frameId: slot.frameId,
                          blank: false,
                          rendered: true,
                          fullscreen: !!document.fullscreenElement,
                        });
                    });
                  }}
                  onWarning={(error) => {
                    if (slot.generation === generation.current)
                      send("MEDIA_STATUS", {
                        frameId: slot.frameId,
                        error,
                        rendered: front === index,
                      });
                  }}
                  onError={(error) => {
                    if (
                      index !== frontRef.current &&
                      slot.generation !== generation.current
                    )
                      return;
                    generation.current++;
                    pendingLoad.current?.abort();
                    pendingSlot.current = null;
                    blankRef.current = true;
                    setBlank(true);
                    setTools(true);
                    send("ERROR", {
                      frameId: slot.frameId,
                      error,
                      blank: true,
                    });
                  }}
                />
              </div>
            ),
        )}
      {!cue && outputPage && connected && (
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
      <div className="output-tools" hidden={cue && !blank && !tools}>
        <button onClick={fullscreen}>Enter Fullscreen</button>
        <button
          onClick={() => {
            generation.current++;
            pendingLoad.current?.abort();
            pendingSlot.current = null;
            blankRef.current = true;
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
  const modern = location.hash !== "#/app";
  const [extra, setExtra] = useState<ExtraSection>();
  const resetNavigation = useRef(() => {});
  const [liveFrame, setLiveFrame] = useState<{
    page: Page;
    frameId: string;
    version: number;
    extra?: ExtraSection;
  }>();
  const takeRecords = useRef(
    new Map<string, { page: Page; frameId: string; version: number; extra?: ExtraSection }>(),
  );
  const takeWarnings = useRef(new Map<string, string[]>());
  const pendingTake = useRef<string | undefined>(undefined);
  const takeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const takeTimedOut = useRef(false);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [directRequest, setDirectRequest] = useState<{
    key: string; session: string; generation: number;
  }>();
  function clearTakeTimer() {
    setDirectRequest(undefined);
    if (takeTimer.current !== undefined) clearTimeout(takeTimer.current);
    takeTimer.current = undefined;
  }
  const cancelWaiter = useRef<
    { id: string; done: (message: Message) => void } | undefined
  >(undefined);
  const version = useRef(0);
  const [applying, setApplying] = useState(false);
  const applyGeneration = useRef(0);
  const [stagedId, setStagedId] = useState<string>();
  const [pinsReady, setPinsReady] = useState(true);
  const [cueReady, setCueReady] = useState(false);
  const [outputVisible, setOutputVisible] = useState<boolean | undefined>();
  const outputVisibleRef = useRef<boolean | undefined>(undefined);
  const [blankPending, setBlankPending] = useState(false);
  const blankIntent = useRef(false);
  const [view, setView] = useState<
    "services" | "prepare" | "review" | "present" | "library"
  >(location.hash === "#/app" ? "present" : "services");
  const [loaded, setLoaded] = useState<ServiceOrder>();
  const [workspaceGeneration, setWorkspaceGeneration] = useState(0);
  const [prepareRequest, setPrepareRequest] = useState<{ serviceId: string; token: string }>();
  const savedServices =
    useLiveQuery(
      () => db.services.orderBy("updatedAt").reverse().toArray(),
      [],
    ) ?? [];
  const [libraryRequest, setLibraryRequest] = useState<{
    serviceId: string;
    token: string;
  }>();
  const [setupOpen, setSetupOpen] = useState(true);

  const [mediaState, setMediaState] = useState("Bundled text ready");
  const frames = loaded
    ? presentationPath(loaded, extra)
    : samplePages.map((p) => ({ ...p, itemTitle: p.title, notes: "" }));
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const [sending, setSending] = useState(false);
  const showGeneration = useRef(0);

  const [phase, setPhase] = useState<Phase>("IDLE");
  const phaseRef = useRef<Phase>("IDLE");
  const sessionActive = !["IDLE", "STOPPED"].includes(phase);
  useEffect(() => {
    if (["READY_BLANK", "BLANKED", "LIVE"].includes(phase)) setSetupOpen(false);
    if (["IDLE", "STOPPED"].includes(phase)) setSetupOpen(true);
  }, [phase]);

  const [slide, setSlide] = useState(0);
  const currentFrame = frames[Math.min(slide, frames.length - 1)] ?? {
    id: "empty",
    title: "",
    text: "",
    secondary: "",
    style: defaultStyle,
  };
  resetNavigation.current = () => {
    if (!extra || !loaded) return;
    const base = servicePages(loaded);
    const exact = base.findIndex((page) => page.id === currentFrame.id);
    setSlide(
      exact >= 0
        ? exact
        : Math.min(extra.origin + 1, Math.max(0, base.length - 1)),
    );
    setExtra(undefined);
  };
  const [test, setTest] = useState(false);
  const [preparedPreview, setPreparedPreview] = useState<{
    key: string;
    page: Page;
    warnings: string[];
  }>();
  const [previewError, setPreviewError] = useState("");
  const previewKey = JSON.stringify(currentFrame);
  useEffect(() => {
    if (!modern || view !== "present") return;
    const controller = new AbortController();
    setPreparedPreview(undefined);
    setPreviewError("");
    const issue = pageReadinessIssue(currentFrame);
    if (issue && !test) {
      setPreviewError(issue);
      return;
    }
    void prepareMedia(test ? samplePages[0] : currentFrame, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setPreparedPreview({
            key: previewKey,
            page: result.page,
            warnings: result.warnings,
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setPreviewError(String(error));
      });
    return () => controller.abort();
  }, [modern, view, previewKey, test]);
  const automaticDisplayAvailable =
    typeof (window as Window & { getScreenDetails?: unknown }).getScreenDetails ===
    "function";
  const [mode, setMode] = useState(
    automaticDisplayAvailable ? "automatic" : "manual",
  );
  const [screens, setScreens] = useState<Display[]>([]);
  const [target, setTarget] = useState("");
  const [requestFull, setRequestFull] = useState(automaticDisplayAvailable);
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
        clearTakeTimer();
        takeTimedOut.current = false;
        outputVisibleRef.current = undefined;
        setOutputVisible(undefined);
        if (modern) resetNavigation.current();
        desiredVisible.current = false;
        pendingTake.current = undefined;
        setLiveFrame(undefined);
        setCueReady(false);
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
      if (typeof m.visible === "boolean") {
        const visibilityChanged = outputVisibleRef.current !== m.visible;
        outputVisibleRef.current = m.visible;
        if (!m.visible) setDirectRequest(undefined);
        if (visibilityChanged)
          // Commit this external-window signal before the next operator action.
          // Safari can defer rendering while windows are minimised or restored.
          flushSync(() => {
            setOutputVisible(m.visible);
            if (m.visible)
              setNotice(
                "Output page visible again. Verify the physical display; Show slide is still a separate action.",
              );
          });
        if (!m.visible && takeTimer.current !== undefined) {
          blankOutput();
          setNotice(
            "Show slide cancelled because the browser reports the output page is hidden. Black was requested; verify the physical display before retrying.",
          );
        }
      }
      const waiter = cancelWaiter.current;
      if (m.type === "CANCELLED" && waiter && waiter.id === m.frameId)
        waiter.done(m);
      if (m.type === "READY") {
        setCueReady(!!m.cue);
        setFull(!!m.fullscreen);
        change("READY");
        setNotice(
          "Output window connected. Check the physical display before Show slide; connection does not confirm visibility.",
        );
      }
      if (m.type === "OUTPUT_STATUS") {
        setFull(!!m.fullscreen);
        if (m.rendered) {
          if (m.blank && (!modern || !desiredVisible.current)) {
            if (modern && blankIntent.current)
              setNotice(
                takeTimedOut.current
                  ? "Show slide timed out; the output window has now confirmed black. Verify that it is visible on the second display, then retry Show slide."
                  : "Congregation output confirmed black. Preview a slide, then press Show slide when ready.",
              );
            blankIntent.current = false;
            setBlankPending(false);
            change("BLANK");
            if (modern) setLiveFrame(undefined);
          } else if (
            !m.blank &&
            desiredVisible.current &&
            (!modern || m.frameId === pendingTake.current)
          ) {
            clearTakeTimer();
            change("SHOW");
            setMediaState("Ready");
            if (modern && m.frameId) {
              const confirmed = takeRecords.current.get(m.frameId);
              if (confirmed) setLiveFrame(confirmed);
            }
            if (modern)
              setNotice(
                "Slide shown on congregation output. " +
                  (takeWarnings.current.get(m.frameId ?? "") ?? []).join(" "),
              );
          }
        }
      }
      if (m.type === "MEDIA_STATUS") {
        if (modern && m.frameId && m.frameId !== pendingTake.current) return;
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
          clearTakeTimer();
          desiredVisible.current = false;
          pendingTake.current = undefined;
          setLiveFrame(undefined);
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
      clearTakeTimer();
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
    clearTakeTimer();
    takeTimedOut.current = false;
    outputVisibleRef.current = undefined;
    setOutputVisible(undefined);
    blankIntent.current = false;
    resetNavigation.current();
    setBlankPending(false);
    takeWarnings.current.clear();
    takeRecords.current.clear();
    applyGeneration.current++;
    pendingTake.current = undefined;
    setLiveFrame(undefined);
    setApplying(false);
    setExtra(undefined);
    setNotice("Output closed. A new session will start black.");
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
    blankIntent.current = false;
    if (live.current && phaseRef.current !== "DISCONNECTED") return;
    clearTakeTimer();
    takeTimedOut.current = false;
    outputVisibleRef.current = undefined;
    setOutputVisible(undefined);
    applyGeneration.current++;
    setApplying(false);
    setBlankPending(false);
    const previous = session.current;
    if (previous && !modern)
      void db.frames
        .where("sessionId")
        .equals(previous)
        .delete()
        .catch(() => {});
    takeWarnings.current.clear();
    takeRecords.current.clear();
    pendingTake.current = undefined;
    setLiveFrame(undefined);
    setCueReady(false);
    resetNavigation.current();
    setExtra(undefined);
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
    ).open(
      outputUrl(session.current, isTest, requestFull) +
        (modern ? "&cue=1" : ""),
      d,
    );
    const openedSession = session.current;
    if (modern && loaded && !isTest) {
      setPinsReady(false);
      void db
        .pinServiceSnapshot(loaded, openedSession, false, previous)
        .then(() => {
          if (session.current === openedSession) setPinsReady(true);
        })
        .catch((error) => {
          if (session.current === openedSession) {
            setNotice("Could not prepare this service: " + String(error));
            setPinsReady(false);
          }
        });
    } else setPinsReady(true);
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
    clearTakeTimer();
    takeTimedOut.current = false;
    const token = ++showGeneration.current;
    const currentSession = session.current;
    const page = modern
      ? test
        ? samplePages[0]
        : preparedPreview?.key === previewKey
          ? preparedPreview.page
          : undefined
      : framesRef.current[index];
    if (!page) {
      setNotice(
        "This service has no slides. Add content in Library & planner.",
      );
      return;
    }
    const readinessIssue = pageReadinessIssue(page);
    if (readinessIssue) {
      blankOutput();
      setMediaState("Empty slide");
      setNotice(readinessIssue);
      return;
    }
    setSending(true);
    setMediaState("Preparing slide");
    if (modern)
      takeTimer.current = setTimeout(() => {
        takeTimer.current = undefined;
        if (
          token !== showGeneration.current ||
          currentSession !== session.current
        )
          return;
        // Invalidate pending preparation and send a newer black intent. A late
        // frame acknowledgement cannot turn this cancelled Show slide into LIVE.
        blankOutput();
        takeTimedOut.current = true;
        setMediaState("Show slide timed out");
        setNotice(
          "Show slide timed out. Black was requested but is not yet confirmed. Check the second display and bring the output window into view. If it is unresponsive, end the presentation and reconnect; retry Show slide only after verifying placement.",
        );
      }, 15000);
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
      pendingTake.current = frameId;
      takeWarnings.current.set(
        frameId,
        modern ? (preparedPreview?.warnings ?? []) : [],
      );
      takeRecords.current.set(frameId, {
        page,
        frameId,
        version: version.current,
        extra,
      });
      send("SHOW_SLIDE", { frameId });
    } catch (error) {
      if (token === showGeneration.current) {
        clearTakeTimer();
        setMediaState("Slide preparation failed");
        setNotice("Could not prepare slide: " + String(error));
      }
    } finally {
      if (token === showGeneration.current) setSending(false);
    }
  }
  function show() {
    if (modern && outputVisibleRef.current === false) {
      flushSync(() => {
        setOutputVisible(false);
        setNotice(
          "The browser reports the output page is hidden. Bring it into view on the second display and verify placement before Show slide.",
        );
      });
      return;
    }
    if (
      modern &&
      (applying ||
        blankPending ||
        !pinsReady ||
        !cueReady ||
        preparedPreview?.key !== previewKey ||
        !!previewError)
    )
      return;
    if (["READY_BLANK", "BLANKED", "LIVE"].includes(phaseRef.current)) {
      setNotice(
        modern
          ? "Preparing slide for display. Current output remains unchanged until the slide is ready."
          : "Preparing selected slide. Output stays black until ready.",
      );
      void transmit(slide);
    }
  }
  function blankOutput() {
    clearTakeTimer();
    takeTimedOut.current = false;
    blankIntent.current =
      modern && live.current && phaseRef.current !== "DISCONNECTED";
    setBlankPending(blankIntent.current);
    pendingTake.current = undefined;
    setNotice(
      live.current
        ? phaseRef.current === "DISCONNECTED"
          ? "Blank requested. Connection lost; verify the congregation display."
          : modern
            ? "Blank requested. Waiting for output confirmation."
            : "Output is black. Navigation changes the pending slide; Show reveals it."
        : "Output is closed. Start a session to show content.",
    );
    showGeneration.current++;
    setSending(false);
    desiredVisible.current = false;
    change("BLANK");
    send("SET_BLANK");
  }
  function cancelNavigationReveal() {
    const pending = takeTimer.current !== undefined || !!directRequest;
    clearTakeTimer();
    showGeneration.current++;
    // A frame already rendered before cancellation can still acknowledge the
    // unchanged live output. New reveals and Blank replace this frame identity.
    setSending(false);
    setMediaState("Ready");
    if (pending && live.current && cueReady)
      send("CANCEL_PENDING", { frameId: crypto.randomUUID() });
  }
  function selectDestination(index: number, nextExtra: ExtraSection | undefined) {
    const path = loaded ? presentationPath(loaded, nextExtra) : framesRef.current;
    const next = Math.max(0, Math.min(path.length - 1, index));
    const direct = modern && !test && !previewOnly && desiredVisible.current &&
      phaseRef.current === "LIVE" && !blankIntent.current && !applying &&
      outputVisibleRef.current !== false;
    if (modern) cancelNavigationReveal();
    setExtra(nextExtra);
    setSlide(next);
    if (direct && path[next])
      setDirectRequest({ key: JSON.stringify(path[next]), session: session.current,
        generation: showGeneration.current });
    else if (!modern && desiredVisible.current &&
      ["LIVE", "BLANKED", "READY_BLANK"].includes(phaseRef.current))
      void transmit(next);
  }
  function navigate(n: number) { selectDestination(n, extra); }
  function changePreviewMode(enabled: boolean) {
    cancelNavigationReveal();
    setPreviewOnly(enabled);
    setNotice(enabled
      ? "Preview only: select any slide without changing congregation output. Press Show slide when ready, or Return to live."
      : "Direct control: selecting a slide shows it while live. Black output stays black until Show slide.");
  }
  function returnToLive() {
    cancelNavigationReveal();
    setPreviewOnly(false);
    const path = loaded ? presentationPath(loaded, liveFrame?.extra) : framesRef.current;
    const index = path.findIndex((page) => page.id === liveFrame?.page.id);
    if (index >= 0) { setExtra(liveFrame?.extra); setSlide(index); }
    setNotice("Direct control restored. Congregation output is unchanged.");
  }
  useEffect(() => {
    if (!directRequest) return;
    if (directRequest.session !== session.current ||
      directRequest.generation !== showGeneration.current || previewOnly ||
      view !== "present" || !desiredVisible.current || outputVisible === false ||
      applying || phase === "DISCONNECTED") {
      setDirectRequest(undefined);
      return;
    }
    if (preparedPreview?.key === directRequest.key && previewKey === directRequest.key &&
      pinsReady && cueReady && !blankPending && !previewError) {
      setDirectRequest(undefined);
      show();
    } else if (previewError) setDirectRequest(undefined);
  }, [directRequest, preparedPreview, previewKey, previewOnly, view, outputVisible,
    applying, phase, pinsReady, cueReady, blankPending, previewError]);
  function loadService(order: ServiceOrder) {
    setExtra(undefined);
    setStagedId(undefined);
    version.current++;
    blankOutput();
    setLoaded(order);
    setSlide(0);
    setTest(false);
    setView("present");
    setNotice("Service loaded. Output remains black until Show.");
    void db.settings
      .put({ key: "selectedService", value: order.id })
      .catch(() =>
        setNotice("Service loaded, but its selection could not be saved."),
      );
  }
  async function applyStaged() {
    const staged = savedServices.find(
      (order) => order.id === (stagedId ?? loaded?.id),
    );
    if (!staged || !modern || applying || workspaceSaving) return;
    changePreviewMode(true);
    const generation = ++applyGeneration.current,
      currentSession = session.current;
    const controller = new AbortController();
    setApplying(true);
    setNotice("Validating saved changes. Live output remains unchanged.");
    try {
      const path = servicePages(staged);
      if (!path.length)
        throw Error(
          "The staged service has no presenting pages. Add content before applying.",
        );
      for (const page of path) {
        if (generation !== applyGeneration.current)
          throw Error("Apply cancelled.");
        await prepareMedia(page, controller.signal);
      }
      if (
        currentSession !== session.current ||
        generation !== applyGeneration.current
      )
        throw Error("Output session changed; Apply again after reconnecting.");
      if (live.current) {
        if (!cueReady)
          throw Error(
            "Reconnect the output with this app version before applying changes.",
          );
        showGeneration.current++;
        clearTakeTimer();
        setSending(false);
        const cancelled = await new Promise<Message>((resolve, reject) => {
          const requestId = crypto.randomUUID();
          const timer = setTimeout(() => {
            if (cancelWaiter.current?.id === requestId)
              cancelWaiter.current = undefined;
            reject(
              Error(
                "Output did not confirm cancellation. Changes were not applied; verify connection.",
              ),
            );
          }, 2500);
          cancelWaiter.current = {
            id: requestId,
            done: (message) => {
              clearTimeout(timer);
              cancelWaiter.current = undefined;
              resolve(message);
            },
          };
          send("CANCEL_PENDING", { frameId: requestId });
        });
        pendingTake.current = undefined;
        setMediaState("Ready");
        if (cancelled.blank) {
          desiredVisible.current = false;
          setLiveFrame(undefined);
          change("BLANK");
        } else if (cancelled.visibleFrameId) {
          const known = takeRecords.current.get(cancelled.visibleFrameId);
          if (!known)
            throw Error(
              "Output frame could not be confirmed. Blank and retry Apply.",
            );
          setLiveFrame(known);
        }
        await db.pinServiceSnapshot(staged, currentSession, true);
        if (session.current !== currentSession)
          await db.frames.where("sessionId").equals(currentSession).delete();
      } else {
        const saved = await db.services.get(staged.id);
        if (!saved || saved.revisionToken !== staged.revisionToken)
          throw Error(
            "The staged service changed during preparation. Apply again.",
          );
      }
      if (
        currentSession !== session.current ||
        generation !== applyGeneration.current
      )
        throw Error("Output changed during Apply. Saved changes are retained.");
      const source =
        "sourcePageId" in currentFrame ? currentFrame.sourcePageId : undefined;
      const match = path.findIndex(
        (page) =>
          page.itemId ===
            ("itemId" in currentFrame ? currentFrame.itemId : undefined) &&
          page.sourcePageId === source,
      );
      setExtra(undefined);
      setLoaded(structuredClone(staged));
      setStagedId(undefined);
      setSlide(Math.max(0, match));
      version.current++;
      setNotice(
        "Changes applied. Live words are unchanged. Preview a slide, then press Show slide when ready.",
      );
    } catch (error) {
      setNotice("Apply failed: " + String(error));
    } finally {
      controller.abort();
      if (generation === applyGeneration.current) setApplying(false);
    }
  }
  function jumpSection(itemId: string, sectionId: string) {
    if (!loaded || !("sourcePageId" in currentFrame)) return;
    const jump = sectionJump(
      loaded,
      currentFrame as import("./model").PresentationPage,
      sectionId,
      extra,
      itemId,
    );
    if (jump) {
      selectDestination(jump.index, jump.extra);
    }
  }
  async function createService() {
    if (location.hash !== "#/app") {
      setView("services");
      return;
    }
    try {
      const stamp = new Date().toISOString();
      const order: ServiceOrder = {
        id: crypto.randomUUID(),
        title: "New service",
        date: new Date().toLocaleDateString("en-CA"),
        items: [],
        createdAt: stamp,
        updatedAt: stamp,
      };
      await db.saveService(order);
      await db.settings.put({ key: "selectedService", value: order.id });
      setLibraryRequest({ serviceId: order.id, token: crypto.randomUUID() });
      setView("library");
    } catch (error) {
      setNotice("Could not create service: " + String(error));
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.isComposing ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      const target = e.target instanceof Element ? e.target : null;
      if (
        target?.closest(
          "input,select,textarea,[contenteditable]:not([contenteditable=false]),[role=textbox],dialog,[role=dialog]",
        )
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        blankOutput();
        return;
      }
      if (modern && e.key.toLowerCase() === "b" && !e.shiftKey) {
        e.preventDefault();
        blankOutput();
        return;
      }
      if (view !== "present") return;
      if (modern && e.repeat && (e.key.toLowerCase() !== "b" || e.shiftKey))
        return;
      if (modern && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        show();
        return;
      }
      if (target?.closest("[data-song-navigation]")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(slide + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(slide - 1);
      }
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        blankOutput();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [
    slide,
    view,
    modern,
    preparedPreview,
    previewKey,
    previewError,
    blankPending,
    applying,
    pinsReady,
    cueReady,
    test,
    previewOnly,
    directRequest,
  ]);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const isPreparing =
    sending || (desiredVisible.current && mediaState === "Preparing slide");
  const outputLabel =
    blankPending && phase !== "DISCONNECTED"
      ? "BLANKING"
      : modern &&
          sessionActive &&
          phase !== "DISCONNECTED" &&
          outputVisible === false
        ? "OUTPUT HIDDEN"
      : isPreparing
        ? "PREPARING"
        : phase === "LIVE"
          ? "LIVE"
          : ["READY_BLANK", "BLANKED"].includes(phase)
            ? "OUTPUT BLACK"
            : phase === "DISCONNECTED"
              ? "DISCONNECTED"
              : phase === "STOPPED"
                ? "OUTPUT STOPPED"
                : phase === "IDLE"
                  ? "OUTPUT CLOSED"
                  : "CONNECTING";
  const displaySetup = (
    <section className="setup" aria-label="Output setup">
      <details
        className="display-settings"
        open={modern || setupOpen}
        onToggle={(e) => {
          if (!modern) setSetupOpen(e.currentTarget.open);
        }}
      >
        <summary>Display setup</summary>
        <p className="muted">
          Every session starts black. Place the output on your projector before
          showing a slide.
        </p>
        {!automaticDisplayAvailable && (
          <p className="muted">
            This browser cannot select a display automatically. Open the black
            congregation window, then move it to the second display. On macOS,
            use the output window’s Window menu → Move to your display. Keep it
            windowed until you can see it there and still use the operator.
          </p>
        )}
        <label>
          Display positioning
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="automatic" disabled={!automaticDisplayAvailable}>
              Automatic{automaticDisplayAvailable ? "" : " · unavailable in this browser"}
            </option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <button
          onClick={configure}
          disabled={sessionActive || !automaticDisplayAvailable}
        >
          Configure Display
        </button>
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
          Keep Safari output windowed on the second display. In our rehearsal,
          both webpage and native window fullscreen could switch away from the
          congregation output when returning to the operator or editing.
          Fullscreen is optional. If output disappears or Safari shows a white
          or grey “Click to Exit Full Screen” placeholder, request Blank, exit
          fullscreen, and verify the windowed output before showing a slide.
        </p>
      </details>
      {sessionActive && phase !== "DISCONNECTED" && (
        <div className="placement-tools">
          <p className="muted">
            Verify the physical display before revealing content.
          </p>
          <button
            onClick={() =>
              setPlacement("Operator visually confirmed target display")
            }
          >
            Confirm visible placement
          </button>
          <button
            onClick={() => {
              popup.current?.focus();
              setNotice(
                "Move output to the intended screen and verify it stays visible when you return to the operator. Keep it windowed if fullscreen changes the visible desktop.",
              );
            }}
          >
            Reposition Output
          </button>
        </div>
      )}
      {phase === "DISCONNECTED" && (
        <div className="recovery">
          <h3>Output connection lost</h3>
          <p>
            Reconnect opens a new black window. Verify placement, then Show.
          </p>
          <button className="primary" onClick={() => start(test)}>
            Reconnect Output
          </button>
        </div>
      )}
      <details className="output-details">
        <summary>Connection details</summary>
        <dl>
          <dt>Placement</dt>
          <dd>{placement}</dd>
          <dt>Webpage fullscreen</dt>
          <dd>{full ? "Active" : "Inactive"}</dd>
          <dt>Media</dt>
          <dd>{mediaState}</dd>
        </dl>
      </details>
      <p className="muted">
        Preview and connection status cannot confirm which desktop or app the
        physical display is showing. If it shows the desktop or another app,
        Blank, reposition the output, and verify it before Show slide. Native window
        fullscreen is not reported by the webpage fullscreen indicator.
      </p>
    </section>
  );
  return (
    <div
      className={
        "app operator-app " +
        (view === "present" ? "present-view" : "library-view")
      }
    >
      <header>
        <div className="brand">
          ✦ <strong>Sanctuary</strong>
          <span>Presenter / v2 · {__APP_VERSION__}</span>
        </div>
        <nav className="tabs" aria-label="Workspace">
          <button
            aria-pressed={view === "services"}
            onClick={() => setView("services")}
          >
            Services
          </button>
          <button
            aria-pressed={view === "prepare" || view === "review"}
            onClick={() => setView("prepare")}
          >
            Prepare
          </button>
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
            {location.hash === "#/app" ? "Library & planner" : "Library"}
          </button>
        </nav>
      </header>
      <div
        className="service-pane"
        hidden={view !== "services" && view !== "prepare" && view !== "review"}
      >
        <ServiceWorkspace
          key={workspaceGeneration}
          mode={
            view === "services"
              ? "services"
              : view === "review"
                ? "review"
                : "prepare"
          }
          onMode={setView}
          prepareRequest={prepareRequest}
          onLibrary={() => setView("library")}
          sessionActive={sessionActive}
          onBlank={blankOutput}
          onSavingChange={setWorkspaceSaving}
          onPresent={(order) => {
            if (sessionActive) {
              setStagedId(order.id);
              setView("present");
              setNotice(
                "Saved version is staged. Apply changes, select a preview, then press Show slide.",
              );
            } else loadService(order);
          }}
        />
      </div>
      <div className="library-pane" hidden={view !== "library"}>
        <Library
          showPlanner={location.hash === "#/app"}
          request={libraryRequest}
          onPresent={loadService}
          onRestored={() => {
            setWorkspaceGeneration((value) => value + 1);
            blankOutput();
            setLoaded(undefined);
            setSlide(0);
            setTest(false);
          }}
          canRestore={!live.current && !otherActive}
        />
      </div>
      {modern && view === "present" && (
        <ModernPresenter
          order={loaded}
          frames={frames}
          selectedIndex={slide}
          liveFrame={liveFrame?.page}
          previousVersion={!!liveFrame && liveFrame.version !== version.current}
          state={outputLabel}
          ready={
            pinsReady &&
            outputVisible !== false &&
            cueReady &&
            preparedPreview?.key === previewKey &&
            !previewError &&
            !applying &&
            !(
              isPreparing &&
              pendingTake.current &&
              takeRecords.current.get(pendingTake.current)?.page.id ===
                currentFrame.id
            )
          }
          previewError={previewError}
          onPreviewError={setPreviewError}
          sessionActive={sessionActive}
          outputHidden={
            sessionActive && phase !== "DISCONNECTED" && outputVisible === false
          }
          test={test}
          notice={notice}
          applying={applying || workspaceSaving}
          stagedTitle={
            savedServices.find((order) => order.id === stagedId)?.title
          }
          hasStagedChanges={
            !!savedServices.find(
              (order) =>
                order.id === (stagedId ?? loaded?.id) &&
                (order.id !== loaded?.id ||
                  order.revisionToken !== loaded?.revisionToken),
            )
          }
          onApply={() => void applyStaged()}
          previewOnly={previewOnly}
          onPreviewOnly={changePreviewMode}
          onReturnToLive={returnToLive}
          onPreview={navigate}
          onSection={jumpSection}
          onOccurrence={(itemId, occurrence, pageId) => {
            if (!loaded) return;
            selectDestination(
              Math.max(0, servicePages(loaded).findIndex((page) =>
                page.itemId === itemId && page.occurrenceIndex === occurrence &&
                (!pageId || page.sourcePageId === pageId))), undefined,
            );
          }}
          onTake={show}
          onBlank={blankOutput}
          onStart={start}
          onStop={stop}
          onPrepare={() => {
            if (loaded) setPrepareRequest({ serviceId: loaded.id, token: crypto.randomUUID() });
            setView("prepare");
          }}
          setupOpen={setupOpen}
          onSetup={setSetupOpen}
          onSetupControls={() => {
            send("SETUP_CONTROLS");
            popup.current?.focus();
          }}
          setup={displaySetup}
        />
      )}
      <main className="workspace" hidden={view !== "present" || modern}>
        <aside aria-label="Service navigation">
          <span className="eyebrow">
            {loaded ? "SERVICE ORDER" : "DEMO SERVICE"}
          </span>
          <h2>{loaded?.title ?? "A time to gather"}</h2>
          {!loaded && (
            <p className="muted">
              Sample slides for rehearsal. Choose or create your own service
              below.
            </p>
          )}
          <label>
            Choose service
            <select
              aria-label="Choose service"
              value={loaded?.id ?? ""}
              onChange={(e) => {
                const order = savedServices.find(
                  (s) => s.id === e.target.value,
                );
                if (order) loadService(order);
              }}
            >
              <option value="" disabled>
                Demo slides
              </option>
              {savedServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="create-service"
            onClick={() => void createService()}
          >
            {savedServices.length ? "Create service" : "Create first service"}
          </button>
          {loaded && (
            <button
              onClick={() => {
                setLibraryRequest({
                  serviceId: loaded.id,
                  token: crypto.randomUUID(),
                });
                setView("library");
              }}
            >
              Edit service
            </button>
          )}
          <div className="slide-list">
            {frames.map((s, i) => (
              <button
                className={"service-item " + (slide === i ? "selected" : "")}
                key={s.id + ":" + i}
                onClick={() => navigate(i)}
                aria-current={slide === i ? "step" : undefined}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>
                    {s.itemTitle || s.title || "Slide " + (i + 1)}
                  </strong>
                  <small>{loaded ? "Service copy" : "Demo slide"}</small>
                </div>
              </button>
            ))}
          </div>
          <p className="muted privacy-note">
            Your content stays in this browser. Export backups from Library &
            planner.
          </p>
        </aside>
        <section className="editor" aria-label="Slide preview">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {phase === "LIVE" && !isPreparing
                  ? "LIVE SLIDE · PREVIEW"
                  : "PENDING SLIDE · PREVIEW"}
              </span>
              <h2>
                {!frames.length
                  ? "No slides in this service"
                  : test
                    ? "Test output"
                    : currentFrame.title ||
                      ("itemTitle" in currentFrame
                        ? String(currentFrame.itemTitle)
                        : "Selected slide")}
              </h2>
            </div>
            <span className="pill">16:9</span>
          </div>
          {frames.length ? (
            <Frame slide={slide} page={currentFrame} test={test} />
          ) : (
            <div className="empty-preview">
              <h3>Add content before presenting</h3>
              <p>
                This service has no presenting slides. Section headings stay off
                the congregation screen.
              </p>
              <button
                onClick={() => {
                  if (loaded)
                    setLibraryRequest({
                      serviceId: loaded.id,
                      token: crypto.randomUUID(),
                    });
                  setView("library");
                }}
              >
                Add content in planner
              </button>
            </div>
          )}
          <div className="bottom-grid">
            <div>
              <span className="eyebrow">NEXT SLIDE · PREVIEW ONLY</span>
              {frames[slide + 1] ? (
                <Frame slide={0} page={frames[slide + 1]} />
              ) : (
                <div className="end-of-service">
                  {frames.length ? "End of service" : "No upcoming slides"}
                </div>
              )}
            </div>
            <div className="notes">
              <span className="eyebrow">OPERATOR NOTES</span>
              <p>
                {"notes" in currentFrame && currentFrame.notes
                  ? String(currentFrame.notes)
                  : "No notes for this slide."}
              </p>
              <small>Notes stay in this operator window.</small>
            </div>
          </div>
        </section>
        {!modern && displaySetup}
      </main>
      <section
        className="live-controls"
        aria-label="Presentation controls"
        hidden={
          (modern && view === "present") ||
          (!sessionActive &&
            (view === "services" || view === "prepare" || view === "review"))
        }
      >
        <div
          className={
            "output-state state-" +
            (isPreparing ? "preparing" : phase.toLowerCase())
          }
          role="status"
        >
          <strong>{outputLabel}</strong>
          <span>
            {isPreparing
              ? "Preparing slide"
              : phase === "LIVE"
                ? "Congregation output acknowledged"
                : ["READY_BLANK", "BLANKED"].includes(phase)
                  ? modern
                    ? "Output acknowledged black; return to Present and press Show slide"
                    : "Show reveals the pending slide"
                  : phase === "DISCONNECTED"
                    ? "Verify the congregation display"
                    : "New sessions always start black"}
          </span>
        </div>
        {modern && (
          <div className="live-buttons">
            <button onClick={() => setView("present")}>
              Return to presentation
            </button>
            <button className="blank" onClick={blankOutput}>
              Blank screen
            </button>
            <button className="stop" disabled={!sessionActive} onClick={stop}>
              End presentation
            </button>
          </div>
        )}
        {!modern && (
          <div className="live-buttons">
            <button
              onClick={() => navigate(slide - 1)}
              disabled={view !== "present" || slide === 0 || !frames.length}
            >
              ← Previous
            </button>
            <span className="slide-count">
              {frames.length ? slide + 1 : 0} / {frames.length}
            </span>
            <button
              onClick={() => navigate(slide + 1)}
              disabled={
                view !== "present" ||
                !frames.length ||
                slide >= frames.length - 1
              }
            >
              Next →
            </button>
            {!sessionActive && view === "present" && (
              <>
                <button onClick={() => start(true)}>Test Output</button>
                <button className="primary" onClick={() => start(false)}>
                  Start Presentation
                </button>
              </>
            )}
            <button
              className="show"
              disabled={
                view !== "present" ||
                isPreparing ||
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
            <button className="stop" disabled={!sessionActive} onClick={stop}>
              Stop Presentation
            </button>
          </div>
        )}
        <p className="control-notice notice" role="status">
          {notice}
        </p>
      </section>
      <footer>
        <span>
          {offline
            ? "● App shell cached · offline ready"
            : "○ Offline cache not yet confirmed"}
        </span>
        <span>Keys: ← → navigate · B blank · S show slide · Esc blank</span>
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
const Prototype = lazy(() => import("./WorkflowPrototype"));
function AppRoutes() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const changed = () => setHash(location.hash);
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  if (hash === "#/workflow-prototype")
    return (
      <Suspense fallback={<p>Loading workflow preview…</p>}>
        <Prototype />
      </Suspense>
    );
  return hash.startsWith("#/output") ? (
    <Output key={hash} />
  ) : (
    <Operator key={hash} />
  );
}
createRoot(document.getElementById("root")!).render(<AppRoutes />);
