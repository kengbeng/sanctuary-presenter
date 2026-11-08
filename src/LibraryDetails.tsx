import type { Content } from "./model";
import { contentCompatibilityIssues } from "./model";
import { SlideFrame } from "./SlideFrame";

export function LibraryDetails({
  content,
  sectionIndex,
  pageIndex,
  onSection,
  onPage,
}: {
  content: Content;
  sectionIndex: number;
  pageIndex: number;
  onSection: (index: number) => void;
  onPage: (index: number) => void;
}) {
  const pages =
    content.kind === "song"
      ? (content.sections[sectionIndex]?.pages ?? [])
      : content.pages;
  const page = pages[pageIndex];
  const order =
    content.arrangements.find((entry) => entry.isDefault) ??
    content.arrangements[0];
  return (
    <div className="library-read-view">
      <p className="muted">
        {[
          content.indexNumber,
          content.primaryLanguage,
          content.secondaryLanguage,
          content.author,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {content.tags && <p className="library-tags">{content.tags}</p>}
      {content.kind === "song" && (
        <nav className="library-sections" aria-label="Song sections">
          {content.sections.map((section, index) => (
            <button
              key={section.id}
              aria-pressed={index === sectionIndex}
              onClick={() => onSection(index)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      )}
      {pages.length > 1 && (
        <nav className="library-sections" aria-label="Section pages">
          {pages.map((entry, index) => (
            <button
              key={entry.id}
              aria-pressed={index === pageIndex}
              onClick={() => onPage(index)}
            >
              Slide {index + 1}
            </button>
          ))}
        </nav>
      )}
      {page ? (
        <>
          <section
            className="library-lyrics"
            aria-label="Selected section lyrics"
          >
            <h3>
              {content.kind === "song"
                ? content.sections[sectionIndex]?.label
                : `Slide ${pageIndex + 1}`}
            </h3>
            {page.title && page.text && <h4>{page.title}</h4>}
            <p>{page.text || page.title || "This slide has no words."}</p>
            {page.secondary && (
              <>
                <small>{content.secondaryLanguage || "Second language"}</small>
                <p>{page.secondary}</p>
              </>
            )}
          </section>
          <details className="library-appearance">
            <summary>Slide appearance</summary>
            <div className="library-browse-preview">
              <SlideFrame page={page} />
            </div>
          </details>
        </>
      ) : (
        <p>This section has no slides. Choose Edit song to add one.</p>
      )}
      {content.kind === "song" && order && (
        <p>
          <strong>Default song order:</strong>{" "}
          {order.sectionIds
            .map(
              (id) =>
                content.sections.find((section) => section.id === id)?.label ??
                "Missing section",
            )
            .join(" → ")}
        </p>
      )}
      {contentCompatibilityIssues(content).length > 0 && (
        <p role="status">
          This imported original needs review. Choose Edit song to inspect its
          compatibility notes and create an editable copy.
        </p>
      )}
      <p className="muted">
        Browsing does not change this song or any service copy.
      </p>
    </div>
  );
}
