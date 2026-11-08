import { useEffect, useRef, useState, type ReactNode } from "react";

export function EditorMenu({
  label,
  children,
  inline = false,
  className = "",
  summaryText,
  closeOnSelect = true,
}: {
  label: string;
  children: ReactNode;
  inline?: boolean;
  className?: string;
  summaryText?: string;
  closeOnSelect?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (inline) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node) && ref.current)
        ref.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        event.preventDefault();
        event.stopPropagation();
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape, true);
    };
  }, [inline]);
  return (
    <details
      ref={ref}
      className={`editor-popover ${inline ? "editor-menu-inline" : ""} ${className}`}
      open={inline ? true : undefined}
      onClick={(event) => {
        if (!inline && (event.target as HTMLElement).closest("button")) {
          const element = ref.current;
          queueMicrotask(() => {
            if (element) {
              element.open = false;
              element.querySelector("summary")?.focus();
            }
          });
        }
      }}
      onChange={(event) => {
        if (
          !inline &&
          closeOnSelect &&
          (event.target as HTMLElement).tagName === "SELECT" &&
          ref.current
        )
          ref.current.open = false;
      }}
    >
      <summary aria-label={label}>
        {summaryText ?? (inline ? label : "⋯")}
      </summary>
      <div className="editor-popover-body">{children}</div>
    </details>
  );
}

export function ReorderNavigation({
  items,
  selectedId,
  onSelect,
  onMove,
  label,
  horizontal = false,
  selectedTools,
}: {
  items: { id: string; label: string; detail?: string; excerpt?: string }[];
  selectedId?: string;
  onSelect: (index: number) => void;
  onMove: (from: number, to: number) => void;
  label: string;
  horizontal?: boolean;
  selectedTools?: ReactNode;
}) {
  const dragged = useRef<string | null>(null);
  const [edge, setEdge] = useState<{ index: number; after: boolean } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLElement>(null);
  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || to >= items.length) return;
    onMove(from, to);
    setAnnouncement(
      `${items[from].label} moved to position ${to + 1} of ${items.length}. Unsaved changes.`,
    );
    const key = items[from].id;
    requestAnimationFrame(() => {
      const handles =
        root.current?.querySelectorAll<HTMLButtonElement>("[data-reorder-id]");
      Array.from(handles ?? [])
        .find((handle) => handle.dataset.reorderId === key)
        ?.focus();
    });
  }
  return (
    <nav
      ref={root}
      aria-label={label}
      className={`editor-reorder ${horizontal ? "editor-reorder-horizontal" : ""}`}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`editor-reorder-item ${edge?.index === index ? (edge.after ? "drop-after" : "drop-before") : ""}`}
          onDragOver={(event) => {
            if (!dragged.current) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            const box = event.currentTarget.getBoundingClientRect();
            setEdge({
              index,
              after: horizontal
                ? event.clientX > box.left + box.width / 2
                : event.clientY > box.top + box.height / 2,
            });
          }}
          onDrop={(event) => {
            event.preventDefault();
            const key = dragged.current;
            if (key && event.dataTransfer.getData("text/plain") === key) {
              const from = items.findIndex((entry) => entry.id === key);
              const box = event.currentTarget.getBoundingClientRect();
              const after = horizontal
                ? event.clientX > box.left + box.width / 2
                : event.clientY > box.top + box.height / 2;
              const insertion = index + (after ? 1 : 0);
              move(from, insertion - (from < insertion ? 1 : 0));
            }
            dragged.current = null;
            setEdge(null);
          }}
        >
          <button
            type="button"
            className="editor-drag-handle"
            draggable
            data-reorder-id={item.id}
            aria-label={`Reorder ${item.label}`}
            title="Drag to reorder. Alt + arrow keys also move this item."
            onDragStart={(event) => {
              dragged.current = item.id;
              event.dataTransfer.setData("text/plain", item.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => {
              dragged.current = null;
              setEdge(null);
            }}
            onKeyDown={(event) => {
              if (
                event.altKey &&
                ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                  event.key,
                )
              ) {
                event.preventDefault();
                event.stopPropagation();
                move(
                  index,
                  index +
                    (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1),
                );
              }
            }}
          >
            ⠿
          </button>
          <button
            type="button"
            className="editor-reorder-select"
            aria-label={item.label}
            aria-pressed={selectedId === item.id}
            title={item.excerpt}
            onClick={() => onSelect(index)}
          >
            {item.label}
            {item.detail && <small>{item.detail}</small>}
          </button>
          {selectedId === item.id && selectedTools}
        </div>
      ))}
      <span className="editor-reorder-status" role="status" aria-live="polite">
        {announcement}
      </span>
    </nav>
  );
}
