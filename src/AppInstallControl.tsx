import { useEffect, useRef, useState } from "react";
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function AppInstallControl({
  update,
  updating,
  locked,
  onUpdate,
}: {
  update: boolean;
  updating: boolean;
  locked: boolean;
  onUpdate: () => void;
}) {
  const [prompt, setPrompt] = useState<InstallPrompt>();
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)");
    const detect = () =>
      setInstalled(
        standalone.matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(undefined);
      setInstalling(false);
      setMessage("Sanctuary Presenter installed.");
    };
    detect();
    standalone.addEventListener("change", detect);
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => {
      standalone.removeEventListener("change", detect);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  useEffect(() => {
    if (!help || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
      trigger.current?.focus({ preventScroll: true });
    };
  }, [help]);
  async function install() {
    if (!prompt) {
      setHelp(true);
      return;
    }
    setInstalling(true);
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setPrompt(undefined);
      setMessage(
        choice.outcome === "accepted"
          ? "Installation requested. Complete any remaining browser steps."
          : "Installation cancelled. You can continue in the browser.",
      );
    } catch {
      setPrompt(undefined);
      setMessage(
        "The browser could not open installation. Use its install menu or try again.",
      );
      setHelp(true);
    } finally {
      setInstalling(false);
    }
  }
  return (
    <div className="app-install-control">
      <button
        ref={trigger}
        className="header-update"
        aria-label={
          update ? "Apply update after stopping all output windows" : undefined
        }
        aria-busy={updating || installing}
        disabled={updating || installing || (update ? locked : installed)}
        title={
          update && locked
            ? "Stop all output windows before updating"
            : update
              ? "Apply the downloaded app update"
              : installed
                ? "Running as an installed app"
                : "Install Sanctuary Presenter"
        }
        onClick={() => {
          if (update) {
            if (!locked && !updating) onUpdate();
          } else void install();
        }}
      >
        {updating
          ? "Updating…"
          : update
            ? "Update"
            : installing
              ? "Installing…"
              : installed
                ? "Installed"
                : "Install"}
      </button>
      <span className="install-announcement" role="status" aria-live="polite">
        {updating
          ? "Updating Sanctuary Presenter. Keep output windows stopped until reload."
          : message}
      </span>
      <dialog
        ref={dialog}
        className="install-dialog"
        aria-label="Install Sanctuary Presenter"
        onCancel={(event) => {
          event.preventDefault();
          setHelp(false);
        }}
        onClose={() => setHelp(false)}
      >
        <div className="install-dialog-heading">
          <h2>Install Sanctuary Presenter</h2>
          <button onClick={() => setHelp(false)}>Close</button>
        </div>
        <p>
          Install adds an app shortcut. Your songs and services stay local to
          this browser or app.
        </p>
        {message && <p role="status">{message}</p>}
        <ul>
          <li>
            In Chrome or Edge, use the browser’s install app option when
            available.
          </li>
          <li>
            In Safari on Mac, choose File → Add to Dock, if available.{" "}
            <a
              href="https://support.apple.com/en-us/104996"
              target="_blank"
              rel="noreferrer"
            >
              Apple instructions
            </a>
          </li>
          <li>
            On iPhone or iPad, use Share → Add to Home Screen, if available.
          </li>
        </ul>
        <p>
          Keep an external Library backup before changing browsers or opening a
          newly installed app. If your saved content is missing there, restore
          the backup into that app. Installation does not replace a backup.
        </p>
        <p>You can also continue using Sanctuary Presenter in this browser.</p>
      </dialog>
    </div>
  );
}
