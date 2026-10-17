import type { Content } from "./model";
import {
  duplicateSection,
  duplicateSlide,
  moveSection,
  moveSlide,
  transferSlide,
  type AuthoringSelection,
} from "./authoring";
type Props = {
  content: Content;
  sectionIndex: number;
  pageIndex?: number;
  onChange: (change: (content: Content) => void) => void;
  onSelect?: (selection: AuthoringSelection) => void;
};
function edit(
  props: Props,
  change: (content: Content) => AuthoringSelection | undefined,
) {
  props.onChange((content) => {
    const selection = change(content);
    if (selection) props.onSelect?.(selection);
  });
}
export function SectionTools(props: Props) {
  const section = props.content.sections[props.sectionIndex];
  if (!section) return null;
  return (
    <details className="structure-tools">
      <summary>Section options · {section.label}</summary>
      <div className="actions">
        <button
          onClick={() =>
            edit(props, (c) => duplicateSection(c, props.sectionIndex))
          }
        >
          Duplicate section
        </button>
        <button
          disabled={props.sectionIndex === 0}
          onClick={() =>
            edit(props, (c) => moveSection(c, props.sectionIndex, -1))
          }
        >
          Move section up
        </button>
        <button
          disabled={props.sectionIndex === props.content.sections.length - 1}
          onClick={() =>
            edit(props, (c) => moveSection(c, props.sectionIndex, 1))
          }
        >
          Move section down
        </button>
      </div>
      <small>
        Copies have independent slides. Custom song orders stay unchanged.
      </small>
    </details>
  );
}
export function SlideTools(props: Props) {
  const pageIndex = props.pageIndex ?? 0,
    pages =
      props.content.kind === "song"
        ? props.content.sections[props.sectionIndex]?.pages
        : props.content.pages;
  if (!pages?.[pageIndex]) return null;
  return (
    <details className="structure-tools">
      <summary>Slide options · {pageIndex + 1}</summary>
      <div className="actions">
        <button
          onClick={() =>
            edit(props, (c) => duplicateSlide(c, props.sectionIndex, pageIndex))
          }
        >
          Duplicate slide
        </button>
        <button
          disabled={pageIndex === 0}
          onClick={() =>
            edit(props, (c) => moveSlide(c, props.sectionIndex, pageIndex, -1))
          }
        >
          Move slide up
        </button>
        <button
          disabled={pageIndex === pages.length - 1}
          onClick={() =>
            edit(props, (c) => moveSlide(c, props.sectionIndex, pageIndex, 1))
          }
        >
          Move slide down
        </button>
      </div>
      {props.content.kind === "song" && props.content.sections.length > 1 && (
        <label>
          Move slide to section
          <select
            aria-label="Move slide to section"
            disabled={pages.length < 2}
            value=""
            onChange={(event) => {
              const to = Number(event.target.value);
              if (event.target.value !== "")
                edit(props, (c) =>
                  transferSlide(c, props.sectionIndex, pageIndex, to),
                );
            }}
          >
            <option value="">Choose destination</option>
            {props.content.sections.map(
              (section, index) =>
                index !== props.sectionIndex && (
                  <option key={section.id} value={index}>
                    {section.label}
                  </option>
                ),
            )}
          </select>
          {pages.length < 2 && (
            <small>
              Keep one slide in this section. Add or duplicate a slide before
              moving it.
            </small>
          )}
        </label>
      )}
    </details>
  );
}
