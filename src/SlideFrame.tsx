import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { db } from "./repository";
import { displayChannels, type Page, type MediaAsset } from "./model";
const decoded = new Set<string>();
async function decodeAsset(asset: MediaAsset, signal?: AbortSignal) {
  if (decoded.has(asset.id)) return;
  const url = URL.createObjectURL(asset.blob);
  const element =
    asset.kind === "image" ? new Image() : document.createElement("video");
  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
        element.onload = null;
        element.onerror = null;
        element.onloadeddata = null;
        if (error) reject(error);
        else resolve();
      };
      const abort = () => finish(new Error("Media preparation cancelled."));
      const timeout = setTimeout(
        () =>
          finish(
            new Error(
              "Media preparation timed out. Use a smaller file or a supported codec.",
            ),
          ),
        15000,
      );
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) {
        abort();
        return;
      }
      element.onerror = () =>
        finish(
          new Error(
            "Cannot decode media. Try PNG/JPEG or MP4/H.264 in this browser.",
          ),
        );
      if (element instanceof HTMLVideoElement) {
        element.muted = true;
        element.preload = "auto";
        element.onloadeddata = () => finish();
      } else element.onload = () => finish();
      element.src = url;
    });
    decoded.add(asset.id);
  } finally {
    if (element instanceof HTMLVideoElement) {
      element.pause();
      element.removeAttribute("src");
      element.load();
    } else element.src = "";
    URL.revokeObjectURL(url);
  }
}
export async function prepareMedia(original: Page, signal?: AbortSignal) {
  const page = structuredClone(original);
  const warnings: string[] = [];
  async function prepare(ref: string, kind?: string) {
    if (signal?.aborted) throw Error("Media preparation cancelled.");
    const asset = await db.media.get(ref);
    if (!asset) throw Error("Media is missing. Reimport it before Show.");
    if (kind && asset.kind !== kind)
      throw Error("The selected background has the wrong media type.");
    await decodeAsset(asset, signal);
    return asset;
  }
  if (page.mediaId) await prepare(page.mediaId);
  const background = page.backgroundDesign;
  if (background && ["image", "video"].includes(background.mode)) {
    try {
      await prepare(background.mediaId!, background.mode);
    } catch (error) {
      if (signal?.aborted) throw error;
      let posterReady = false;
      if (background.posterId) {
        try {
          await prepare(background.posterId, "image");
          posterReady = true;
        } catch {
          /* Use the explicitly configured colour fallback. */
        }
      }
      page.backgroundDesign = {
        ...background,
        mode: posterReady ? "image" : "color",
        mediaId: posterReady ? background.posterId : undefined,
        posterId: undefined,
      };
      warnings.push(
        `Background unavailable; configured ${posterReady ? "poster" : "colour"} fallback will be shown. ${error instanceof Error ? error.message : ""}`,
      );
    }
  }
  return { page, warnings };
}
interface LocalMedia {
  id: string;
  url: string;
  kind: MediaAsset["kind"];
  ready: boolean;
  error?: string;
}
function useMedia(mediaId?: string) {
  const [value, setValue] = useState<LocalMedia>();
  useEffect(() => {
    let cancelled = false,
      url = "";
    setValue(undefined);
    if (mediaId)
      void db.media
        .get(mediaId)
        .then((asset) => {
          if (cancelled) return;
          if (!asset) {
            setValue({
              id: mediaId,
              url: "",
              kind: "image",
              ready: false,
              error: "Media is missing.",
            });
            return;
          }
          url = URL.createObjectURL(asset.blob);
          setValue({ id: mediaId, url, kind: asset.kind, ready: false });
        })
        .catch(() => {
          if (!cancelled)
            setValue({
              id: mediaId,
              url: "",
              kind: "image",
              ready: false,
              error: "Local media could not be opened.",
            });
        });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [mediaId]);
  const current = value?.id === mediaId ? value : undefined;
  return {
    value: current,
    ready: () => setValue((v) => (v ? { ...v, ready: true } : v)),
    fail: (message: string) =>
      setValue((v) => (v ? { ...v, error: message } : v)),
  };
}
export interface FitReport {
  fontSize: number;
  overflow: boolean;
}
export function SlideFrame({
  page,
  test = false,
  preview = true,
  active = true,
  reportPrepared = false,
  onError,
  onReady,
  onWarning,
}: {
  page: Page;
  test?: boolean;
  preview?: boolean;
  active?: boolean;
  reportPrepared?: boolean;
  onError?: (error: string) => void;
  onReady?: () => void;
  onWarning?: (message: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null),
    safe = useRef<HTMLDivElement>(null),
    text = useRef<HTMLDivElement>(null),
    backgroundVideo = useRef<HTMLVideoElement>(null),
    foregroundVideo = useRef<HTMLVideoElement>(null);
  const [scale, setScale] = useState(1),
    [fit, setFit] = useState<FitReport & { page?: Page }>({
      fontSize: page.style.fontSize,
      overflow: false,
    });
  const callbacks = useRef({ onError, onReady, onWarning });
  callbacks.current = { onError, onReady, onWarning };
  const background = test ? undefined : page.backgroundDesign;
  const staticBackground = preview && background?.mode === "video";
  const bg = useMedia(
    background && ["image", "video"].includes(background.mode)
      ? staticBackground
        ? background.posterId
        : background.mediaId
      : undefined,
  );
  const poster = useMedia(
    !preview && background?.mode === "video" ? background.posterId : undefined,
  );
  const foreground = useMedia(test ? undefined : page.mediaId);
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => {
    setVideoFailed(false);
  }, [background?.mediaId]);
  useLayoutEffect(() => {
    if (!root.current) return;
    const update = () => setScale(root.current!.clientWidth / 1920);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (test || !safe.current || !text.current) return;
    const box = safe.current,
      content = text.current;
    const preferred = page.style.fontSize;
    const minimum = Math.min(preferred, page.style.minFontSize ?? 32);
    const fits = (size: number) => {
      content.style.setProperty("--projection-font", `${size}px`);
      return (
        content.scrollHeight <= box.clientHeight + 1 &&
        content.scrollWidth <= box.clientWidth + 1
      );
    };
    let size = preferred;
    if (!fits(size) && page.style.autoFit) {
      let low = minimum,
        high = preferred;
      for (let n = 0; n < 12; n++) {
        const mid = (low + high) / 2;
        if (fits(mid)) low = mid;
        else high = mid;
      }
      size = Math.floor(low * 10) / 10;
    }
    const overflow = !fits(size);
    setFit({ fontSize: size, overflow, page });
  }, [page, test]);
  const backgroundBad = !!bg.value?.error || videoFailed;
  const fallback = backgroundBad && background?.mode === "video";
  const posterAvailable =
    fallback && poster.value?.ready && !poster.value.error;
  const bgReady =
    !background ||
    !["image", "video"].includes(background.mode) ||
    staticBackground ||
    backgroundBad ||
    !!bg.value?.ready;
  const fgReady =
    !page.mediaId ||
    (preview && foreground.value?.kind === "video") ||
    !!foreground.value?.ready;
  const ready =
    test || (fit.page === page && bgReady && fgReady && !fit.overflow);
  useEffect(() => {
    if (!ready || (!active && !reportPrepared) || foreground.value?.error)
      return;
    const tick = requestAnimationFrame(() => callbacks.current.onReady?.());
    return () => cancelAnimationFrame(tick);
  }, [ready, page, active, reportPrepared, foreground.value?.error]);
  useEffect(() => {
    if (fit.page === page && fit.overflow && !test)
      callbacks.current.onError?.(
        "Text exceeds the safe area at the minimum font size. Shorten the slide or adjust its design.",
      );
  }, [fit.overflow, fit.page, page, test]);
  useEffect(() => {
    if (foreground.value?.error)
      callbacks.current.onError?.(foreground.value.error);
  }, [foreground.value?.error]);
  useEffect(() => {
    if (backgroundBad)
      callbacks.current.onWarning?.(
        "Background playback failed. Configured poster or colour fallback is visible.",
      );
  }, [backgroundBad]);
  useEffect(() => {
    let cancelled = false;
    for (const video of [backgroundVideo.current, foregroundVideo.current]) {
      if (!video) continue;
      if (!active || preview) video.pause();
      else
        void video.play().catch((error) => {
          if (cancelled || error?.name === "AbortError") return;
          if (video === backgroundVideo.current) setVideoFailed(true);
          else
            callbacks.current.onError?.(
              "Video playback was blocked. Use a supported muted video or an image.",
            );
        });
    }
    return () => {
      cancelled = true;
    };
  }, [active, preview, bg.value?.url, foreground.value?.url, ready]);
  const style = page.style;
  const channels = displayChannels(page);
  const shadow = style.outlineWidth
    ? Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI) / 4;
        return `${Math.cos(angle) * style.outlineWidth!}px ${Math.sin(angle) * style.outlineWidth!}px 0 ${style.outlineColor ?? "#000000"}`;
      }).join(",")
    : undefined;
  const textStyle = {
    fontFamily: style.fontFamily ?? "system-ui",
    fontWeight: style.fontWeight ?? 600,
    color: style.color,
    lineHeight: style.lineSpacing,
    textShadow: shadow,
    "--projection-font": `${fit.fontSize}px`,
    "--secondary-scale": style.secondaryScale ?? 0.82,
  } as CSSProperties;
  return (
    <>
      <div
        ref={root}
        className={"frame projection-frame " + (test ? "test" : "")}
        data-ready={ready}
        data-font-size={fit.fontSize}
        style={{ background: background?.color ?? style.background }}
      >
        <div
          className="slide-canvas"
          style={{
            transform: `scale(${scale})`,
            visibility: ready || preview ? "visible" : "hidden",
          }}
        >
          {!test &&
            background?.mode !== "color" &&
            bg.value?.url &&
            !backgroundBad &&
            (bg.value.kind === "image" ? (
              <img
                className="slide-media background-media"
                src={bg.value.url}
                alt=""
                style={{ objectFit: background?.fit ?? "cover" }}
                onLoad={bg.ready}
                onError={() =>
                  bg.fail("Background image could not be decoded.")
                }
              />
            ) : (
              !preview && (
                <video
                  ref={backgroundVideo}
                  className="slide-media background-media"
                  src={bg.value.url}
                  muted
                  loop={background?.loop ?? true}
                  playsInline
                  preload="auto"
                  style={{ objectFit: background?.fit ?? "cover" }}
                  onLoadedData={bg.ready}
                  onError={() => setVideoFailed(true)}
                />
              )
            ))}
          {!test && poster.value?.url && (
            <img
              className="slide-media background-poster"
              src={poster.value!.url}
              alt=""
              style={{
                objectFit: background?.fit ?? "cover",
                opacity: posterAvailable ? 1 : 0,
              }}
              onLoad={poster.ready}
              onError={() => poster.fail("Poster unavailable.")}
            />
          )}
          {!test &&
            background &&
            ["image", "video"].includes(background.mode) && (
              <div
                className="background-shade"
                style={{ opacity: background.darken / 100 }}
              />
            )}
          {!test &&
            foreground.value?.url &&
            (foreground.value.kind === "image" ? (
              <img
                className="slide-media foreground-media"
                src={foreground.value.url}
                alt=""
                onLoad={foreground.ready}
                onError={() => foreground.fail("Image could not be displayed.")}
              />
            ) : (
              !preview && (
                <video
                  ref={foregroundVideo}
                  className="slide-media foreground-media"
                  src={foreground.value.url}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onLoadedData={foreground.ready}
                  onError={() =>
                    foreground.fail(
                      "Video could not be decoded. Try MP4/H.264.",
                    )
                  }
                />
              )
            ))}
          {test ? (
            <div className="test-pattern">
              <h1>Sanctuary · Test output</h1>
              <p>16:9 · Safe area 10%</p>
              <small>Verify this window is on the intended display</small>
            </div>
          ) : (
            <div
              ref={safe}
              className="projection-safe"
              style={{
                left: `${style.horizontalMargin ?? 10}%`,
                right: `${style.horizontalMargin ?? 10}%`,
                top: `${style.verticalMargin ?? 10}%`,
                bottom: `${style.verticalMargin ?? 10}%`,
                justifyContent:
                  style.verticalAlign === "top"
                    ? "flex-start"
                    : style.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center",
                textAlign: style.align,
              }}
            >
              <div ref={text} className="projection-content" style={textStyle}>
                {page.title && (
                  <h1 className="projection-heading">{page.title}</h1>
                )}
                {channels.primary && (
                  <p
                    className="projection-primary"
                    style={
                      page.languageMode === "secondary" &&
                      page.secondary.trim() &&
                      style.chineseFontFamily
                        ? { fontFamily: style.chineseFontFamily }
                        : undefined
                    }
                  >
                    {channels.primary}
                  </p>
                )}
                {channels.secondary && (
                  <p
                    className="projection-secondary"
                    style={{
                      fontFamily:
                        style.chineseFontFamily ||
                        '"PingFang TC", "Microsoft JhengHei", "Noto Sans CJK TC", sans-serif',
                    }}
                  >
                    {channels.secondary}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {preview && !test && (
        <div className="render-info">
          Preview only · {fit.fontSize.toFixed(1)} px at 1080p
          {fit.overflow ? " · Text exceeds safe area" : ""}
          {staticBackground || foreground.value?.kind === "video"
            ? " · Video preview is static"
            : ""}
          {backgroundBad ? " · Background fallback" : ""}
        </div>
      )}
    </>
  );
}
