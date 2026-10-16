import { it, expect, vi } from "vitest";
import {
  PresentationLease,
  applySafeUpdate,
  withMaintenance,
  type LockProvider,
} from "./coordination";
function manager(): LockProvider {
  let shared = 0,
    exclusive = false;
  return {
    async request(name, options, callback) {
      const available =
        options.mode === "shared" ? !exclusive : !exclusive && !shared;
      if (!available) return callback(null);
      if (options.mode === "shared") shared++;
      else exclusive = true;
      try {
        return await callback({ name });
      } finally {
        if (options.mode === "shared") shared--;
        else exclusive = false;
      }
    },
  };
}
it("presentation locks block maintenance even without heartbeat activity", async () => {
  const locks = manager(),
    one = new PresentationLease(locks),
    two = new PresentationLease(locks);
  expect(await one.acquire()).toBe(true);
  expect(await two.acquire()).toBe(true);
  await expect(withMaintenance(async () => true, locks)).rejects.toThrow(
    "active",
  );
  one.release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await expect(withMaintenance(async () => true, locks)).rejects.toThrow(
    "active",
  );
  two.release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(await withMaintenance(async () => true, locks)).toBe(true);
});
it("maintenance blocks new presentation leases until it finishes", async () => {
  const locks = manager();
  let finish!: () => void;
  const operation = withMaintenance(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    locks,
  );
  const lease = new PresentationLease(locks);
  expect(await lease.acquire()).toBe(false);
  finish();
  await operation;
  expect(await lease.acquire()).toBe(true);
  lease.release();
});
it("leases release safely if a session ends before asynchronous grant", async () => {
  let grant!: () => void;
  const locks: LockProvider = {
    request: (_name, _options, callback) =>
      new Promise((resolve) => {
        grant = () => {
          void callback({ name: "test" }).then(resolve);
        };
      }),
  };
  const lease = new PresentationLease(locks);
  const pending = lease.acquire();
  lease.release();
  grant();
  expect(await pending).toBe(false);
});
it("unsupported browsers can present but cannot force maintenance activation", async () => {
  const lease = new PresentationLease(null);
  expect(await lease.acquire()).toBe(true);
  await expect(withMaintenance(async () => true, null)).rejects.toThrow(
    "unavailable",
  );
  lease.release();
});

it("activation retains exclusive maintenance until the document leaves", async () => {
  const locks = manager();
  const events = new EventTarget();
  vi.stubGlobal("navigator", { locks });
  vi.stubGlobal("window", events);
  try {
    let activated = false;
    const pending = applySafeUpdate(async () => {
      activated = true;
    });
    await Promise.resolve();
    expect(activated).toBe(true);
    expect(await new PresentationLease(locks).acquire()).toBe(false);
    events.dispatchEvent(new Event("pagehide"));
    await pending;
    const lease = new PresentationLease(locks);
    expect(await lease.acquire()).toBe(true);
    lease.release();
  } finally {
    vi.unstubAllGlobals();
  }
});
