import { useEffect, useRef, useState } from "react";
import type { Content } from "./model";
import {
  applyPastedLyrics,
  parseLyrics,
  pasteLabels,
  replacesStarter,
  type PastedSection,
} from "./lyricPaste";
export function PasteLyrics({
  content,
  onChange,
  onSelect,
  onStagingChange,
}: {
  content: Content;
  onChange: (change: (content: Content) => void) => void;
  onSelect?: (sectionIndex: number) => void;
  onStagingChange?: (staged: boolean) => void;
}) {
  const details = useRef<HTMLDetailsElement>(null),
    [primary, setPrimary] = useState(""),
    [secondary, setSecondary] = useState(""),
    [preview, setPreview] = useState<{
      sections: PastedSection[];
      source: string;
    }>(),
    [error, setError] = useState("");
  useEffect(() => {
    onStagingChange?.(!!(primary || secondary));
  }, [primary, secondary, onStagingChange]);
  useEffect(() => () => onStagingChange?.(false), [onStagingChange]);
  function reset() {
    setPrimary("");
    setSecondary("");
    setPreview(undefined);
    setError("");
    if (details.current) details.current.open = false;
  }
  return (
    <details ref={details} className="paste-lyrics">
      <summary>
        Paste whole-song lyrics
        {primary || secondary ? " · staged, not applied" : ""}
      </summary>
      <p>
        Mark each section with a line like <code>[Verse 1]</code> or{" "}
        <code>[Chorus]</code>. Put <code>---</code> on its own line to start
        another slide. Blank lines stay within the slide. Nothing changes until
        you apply the preview.
      </p>
      {(primary || secondary) && (
        <p>Apply or cancel the pasted lyrics before saving the song.</p>
      )}
      <label>
        Primary lyrics to stage
        <textarea
          rows={7}
          aria-label="Primary lyrics to stage"
          value={primary}
          placeholder={
            "[Verse 1]\nFirst slide words\n---\nSecond slide words\n[Chorus]\nChorus words"
          }
          onChange={(event) => {
            setPrimary(event.target.value);
            setPreview(undefined);
            setError("");
          }}
        />
      </label>
      <details>
        <summary>Include second-language lyrics</summary>
        <label>
          Secondary lyrics to stage
          <textarea
            rows={7}
            aria-label="Secondary lyrics to stage"
            value={secondary}
            onChange={(event) => {
              setSecondary(event.target.value);
              setPreview(undefined);
              setError("");
            }}
          />
        </label>
        <p>
          Use exactly the same section labels and slide breaks. Words are never
          translated or aligned automatically.
        </p>
      </details>
      <div className="actions">
        <button
          onClick={() => {
            try {
              setPreview({
                sections: parseLyrics(primary, secondary),
                source: JSON.stringify(content),
              });
              setError("");
            } catch (error) {
              setPreview(undefined);
              setError(String(error instanceof Error ? error.message : error));
            }
          }}
        >
          Preview pasted lyrics
        </button>
        <button onClick={reset}>Cancel paste</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {preview && (
        <div className="paste-preview">
          <h3>Pasted lyrics preview</h3>
          <p>
            {replacesStarter(content)
              ? "Replaces the empty starter section."
              : "Adds sections; your existing lyrics and custom song orders stay unchanged."}
          </p>
          {pasteLabels(content, preview.sections).map((section, index) => (
            <article key={index}>
              <h4>{section.label}</h4>
              {section.pages.map((page, index) => (
                <div key={index}>
                  <strong>Slide {index + 1}</strong>
                  <pre>{page.text}</pre>
                  {page.secondary && <pre>{page.secondary}</pre>}
                </div>
              ))}
            </article>
          ))}
          <button
            className="primary"
            onClick={() => {
              try {
                if (JSON.stringify(content) !== preview.source)
                  throw Error(
                    "The song changed. Preview the pasted lyrics again before applying.",
                  );
                onChange((current) => {
                  if (JSON.stringify(current) !== preview.source)
                    throw Error("The song changed. Preview again.");
                  const sections = applyPastedLyrics(current, preview.sections);
                  onSelect?.(
                    current.sections.findIndex(
                      (section) => section.id === sections[0].id,
                    ),
                  );
                });
                reset();
              } catch (error) {
                setError(
                  String(error instanceof Error ? error.message : error),
                );
              }
            }}
          >
            Apply pasted lyrics
          </button>
          <small>
            Apply updates your working song. Use the normal Save action to keep
            it.
          </small>
        </div>
      )}
    </details>
  );
}
