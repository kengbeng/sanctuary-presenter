import {
  defaultBackground,
  outputProfiles,
  profileStyle,
  type BackgroundDesign,
  type OutputProfile,
  type TextStyle,
} from "./model";
type MediaChoice = { id: string; title: string; kind?: string };
export function AdvancedTypography({
  style,
  change,
}: {
  style: TextStyle;
  change: (style: TextStyle) => void;
}) {
  const number = (
    key: keyof TextStyle,
    label: string,
    fallback: number,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label key={key}>
      {label}
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number(style[key] ?? fallback)}
        onChange={(e) =>
          change({
            ...style,
            [key]: Math.max(min, Math.min(max, Number(e.target.value))),
          })
        }
      />
    </label>
  );
  return (
    <>
      <label className="check">
        <input
          type="checkbox"
          checked={style.autoFit ?? false}
          onChange={(e) => change({ ...style, autoFit: e.target.checked })}
        />
        Auto Fit within safe area
      </label>
      <div className="style-fields">
        {number("minFontSize", "Minimum font size at 1080p", 32, 16, 140)}
        {number(
          "horizontalMargin",
          "Horizontal safe margin (%)",
          10,
          0,
          25,
          0.5,
        )}
        {number("verticalMargin", "Vertical safe margin (%)", 10, 0, 25, 0.5)}
        {number("secondaryScale", "Secondary text scale", 0.82, 0.5, 1, 0.01)}
        <label>
          Vertical alignment
          <select
            aria-label="Vertical alignment"
            value={style.verticalAlign ?? "center"}
            onChange={(e) =>
              change({
                ...style,
                verticalAlign: e.target.value as TextStyle["verticalAlign"],
              })
            }
          >
            <option value="top">Top</option>
            <option value="center">Centre</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
        <label>
          Local font
          <select
            aria-label="Local font"
            value={style.fontFamily ?? "system-ui"}
            onChange={(e) => change({ ...style, fontFamily: e.target.value })}
          >
            <option value="system-ui">System sans serif</option>
            <option value="Arial">Arial / sans serif fallback</option>
            <option value="Georgia">Georgia / serif fallback</option>
            <option value="Verdana">Verdana / sans serif fallback</option>
          </select>
        </label>
        <label>
          Chinese font
          <select
            aria-label="Chinese font"
            value={style.chineseFontFamily ?? ""}
            onChange={(e) =>
              change({ ...style, chineseFontFamily: e.target.value })
            }
          >
            <option value="">Automatic local CJK fonts</option>
            <option value="PingFang TC">PingFang TC</option>
            <option value="PingFang SC">PingFang SC</option>
            <option value="Microsoft JhengHei">Microsoft JhengHei</option>
            <option value="Microsoft YaHei">Microsoft YaHei</option>
            <option value="Noto Sans CJK TC">Noto Sans CJK TC</option>
          </select>
        </label>
        <label>
          Font weight
          <select
            aria-label="Font weight"
            value={style.fontWeight ?? 600}
            onChange={(e) =>
              change({ ...style, fontWeight: Number(e.target.value) })
            }
          >
            <option value="400">Regular · 400</option>
            <option value="500">Medium · 500</option>
            <option value="600">Semibold · 600</option>
            <option value="700">Bold · 700</option>
          </select>
        </label>
        {number("outlineWidth", "Outline width at 1080p", 0, 0, 8, 0.5)}
        <label>
          Outline colour
          <input
            type="color"
            value={style.outlineColor ?? "#000000"}
            onChange={(e) => change({ ...style, outlineColor: e.target.value })}
          />
        </label>
      </div>
      <p className="muted">
        Fonts come from this device. No fonts are downloaded; missing fonts use
        local fallbacks. Verify CJK text on the projector.
      </p>
    </>
  );
}
export function BackgroundEditor({
  value,
  change,
  media,
  scope,
}: {
  value?: BackgroundDesign;
  change: (b: BackgroundDesign) => void;
  media: MediaChoice[];
  scope: string;
}) {
  const current = value ?? defaultBackground;
  return (
    <div className="background-editor">
      <label>
        {scope} background
        <select
          aria-label={`${scope} background`}
          value={current.mode}
          onChange={(e) => {
            const mode = e.target.value as BackgroundDesign["mode"];
            change({
              ...current,
              mode,
              mediaId:
                mode === "image" || mode === "video"
                  ? media.find((m) => m.kind === mode)?.id
                  : undefined,
            });
          }}
        >
          <option value="inherit">Inherit</option>
          <option value="color">Solid colour</option>
          <option
            value="image"
            disabled={!media.some((m) => m.kind === "image")}
          >
            Local image
          </option>
          <option
            value="video"
            disabled={!media.some((m) => m.kind === "video")}
          >
            Local video
          </option>
        </select>
      </label>
      {["image", "video"].includes(current.mode) && (
        <>
          <label>
            {scope} background asset
            <select
              aria-label={`${scope} background asset`}
              value={current.mediaId ?? ""}
              onChange={(e) => change({ ...current, mediaId: e.target.value })}
            >
              {media
                .filter((m) => m.kind === current.mode)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
            </select>
          </label>
          <div className="field-pair">
            <label>
              Media fit
              <select
                aria-label={`${scope} media fit`}
                value={current.fit}
                onChange={(e) =>
                  change({
                    ...current,
                    fit: e.target.value as BackgroundDesign["fit"],
                  })
                }
              >
                <option value="cover">Cover · crop edges</option>
                <option value="contain">Contain · retain whole image</option>
              </select>
            </label>
            <label>
              Darken (%)
              <input
                aria-label={`${scope} darken (%)`}
                type="number"
                min="0"
                max="80"
                value={current.darken}
                onChange={(e) =>
                  change({
                    ...current,
                    darken: Math.max(0, Math.min(80, Number(e.target.value))),
                  })
                }
              />
            </label>
          </div>
        </>
      )}
      {current.mode === "video" && (
        <>
          <label>
            Fallback poster
            <select
              aria-label={`${scope} fallback poster`}
              value={current.posterId ?? ""}
              onChange={(e) =>
                change({ ...current, posterId: e.target.value || undefined })
              }
            >
              <option value="">Use fallback colour</option>
              {media
                .filter((m) => m.kind === "image")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={current.loop}
              onChange={(e) => change({ ...current, loop: e.target.checked })}
            />
            Loop muted background video
          </label>
        </>
      )}
      {current.mode !== "inherit" && (
        <label>
          {current.mode === "color" ? "Background colour" : "Fallback colour"}
          <input
            aria-label={`${scope} background colour`}
            type="color"
            value={current.color}
            onChange={(e) => change({ ...current, color: e.target.value })}
          />
        </label>
      )}
      <p className="muted">
        {scope === "Service"
          ? "Service defaults apply to items and slides set to Inherit."
          : "Slide settings override item settings, then service defaults."}{" "}
        Videos remain muted. Blank pauses playback; Restore resumes an unchanged
        source.
      </p>
    </div>
  );
}
export function ProfileEditor({
  profile,
  change,
}: {
  profile?: OutputProfile;
  change: (p: OutputProfile) => void;
}) {
  const current = profile ?? outputProfiles[0];
  return (
    <div className="profile-editor">
      <label>
        Output profile
        <select
          aria-label="Output profile"
          value={
            outputProfiles.some(
              (p) => JSON.stringify(p) === JSON.stringify(current),
            )
              ? current.name
              : "Custom"
          }
          onChange={(e) => {
            const p = outputProfiles.find((p) => p.name === e.target.value);
            if (p) change({ ...p });
            else change({ ...current, name: "Custom" });
          }}
        >
          {outputProfiles.map((p) => (
            <option key={p.name}>{p.name}</option>
          ))}
          <option>Custom</option>
        </select>
      </label>
      <p className="muted">
        Safe margins: {current.horizontalMargin}% horizontal /{" "}
        {current.verticalMargin}% vertical. Preferred{" "}
        {current.fontSize.toFixed(1)} px, minimum{" "}
        {current.minFontSize.toFixed(1)} px at 1080p. Secondary scale{" "}
        {current.secondaryScale}. Profiles affect layout, not display selection
        or streaming.
      </p>
      <div className="style-fields">
        {(
          [
            "horizontalMargin",
            "verticalMargin",
            "fontSize",
            "minFontSize",
            "secondaryScale",
          ] as const
        ).map((key) => (
          <label key={key}>
            Custom{" "}
            {
              {
                horizontalMargin: "horizontal margin (%)",
                verticalMargin: "vertical margin (%)",
                fontSize: "preferred size",
                minFontSize: "minimum size",
                secondaryScale: "secondary scale",
              }[key]
            }
            <input
              type="number"
              min={
                key.includes("Margin") ? 0 : key === "secondaryScale" ? 0.5 : 16
              }
              max={
                key.includes("Margin") ? 25 : key === "secondaryScale" ? 1 : 140
              }
              step={key === "secondaryScale" ? 0.01 : 0.5}
              value={current[key]}
              onChange={(e) => {
                const value = Number(e.target.value);
                const candidate = { ...current, name: "Custom", [key]: value };
                const bounds = key.includes("Margin")
                  ? [0, 25]
                  : key === "secondaryScale"
                    ? [0.5, 1]
                    : [16, 140];
                candidate[key] = Math.max(
                  bounds[0],
                  Math.min(bounds[1], value),
                );
                change(candidate);
              }}
            />
          </label>
        ))}
      </div>
      <small className="muted">
        Resolved profile defaults: {profileStyle(current).fontSize.toFixed(1)}{" "}
        px. Factory presets remain unchanged.
      </small>
    </div>
  );
}
