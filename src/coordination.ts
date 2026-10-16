interface LockHandle {
  readonly name: string;
}
export interface LockProvider {
  request<T>(
    name: string,
    options: { mode: "shared" | "exclusive"; ifAvailable: true },
    callback: (lock: LockHandle | null) => Promise<T>,
  ): Promise<T>;
}
const lockName = "sanctuary-maintenance:" + import.meta.env.BASE_URL;
function browserLocks(): LockProvider | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.locks;
}
export class PresentationLease {
  private cancel?: () => void;
  constructor(
    private locks: LockProvider | null | undefined = browserLocks(),
  ) {}
  acquire(): Promise<boolean> {
    this.release();
    if (!this.locks) return Promise.resolve(true);
    return new Promise((resolve) => {
      let cancelled = false;
      let releaseHold: () => void = () => {};
      this.cancel = () => {
        cancelled = true;
        releaseHold();
      };
      void this.locks!.request(
        lockName,
        { mode: "shared", ifAvailable: true },
        async (lock) => {
          if (!lock || cancelled) {
            resolve(false);
            return;
          }
          const hold = new Promise<void>((release) => {
            releaseHold = release;
          });
          resolve(true);
          await hold;
        },
      ).catch(() => resolve(false));
    });
  }
  release() {
    this.cancel?.();
    this.cancel = undefined;
  }
}
export async function withMaintenance<T>(
  action: () => Promise<T>,
  locks: LockProvider | null | undefined = browserLocks(),
): Promise<T> {
  if (!locks)
    throw Error(
      "Safe cross-window maintenance is unavailable. Close all app windows to apply updates. Use a browser with Web Locks for restore.",
    );
  return locks.request(
    lockName,
    { mode: "exclusive", ifAvailable: true },
    async (lock) => {
      if (!lock)
        throw Error(
          "Another presentation or maintenance task is active. Stop all outputs and retry.",
        );
      return action();
    },
  );
}
export async function applySafeUpdate(activate: () => Promise<void>) {
  return withMaintenance(async () => {
    let finish!: () => void;
    const leaving = new Promise<void>((resolve) => {
      finish = resolve;
    });
    window.addEventListener("pagehide", finish, { once: true });
    try {
      await activate();
      // A timer must not reopen presentation while activation/reload is pending.
      await leaving;
    } finally {
      window.removeEventListener("pagehide", finish);
    }
  });
}
