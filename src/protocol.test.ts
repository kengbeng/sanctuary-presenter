import { describe, it, expect } from "vitest";
import { valid, transition, fresh } from "./protocol";
describe("output safety", () => {
  it("requires ready before show and reconnect resets blank", () => {
    expect(transition("OPENING", "SHOW")).toBe("OPENING");
    expect(transition("DISCONNECTED", "READY")).toBe("READY_BLANK");
    expect(transition("LIVE", "START")).toBe("OPENING");
    expect(transition("LIVE", "BLANK")).toBe("BLANKED");
  });
  it("validates protocol and payload", () => {
    const m = {
      v: 1,
      session: "s",
      instance: "i",
      seq: 1,
      type: "SHOW_SLIDE",
      slide: 0,
    };
    expect(valid(m, "s")).toBe(true);
    for (const change of [
      { v: 2 },
      { session: "old" },
      { seq: 0 },
      { seq: 1.1 },
      { slide: 99 },
      { type: "OTHER" },
      { blank: "false" },
    ])
      expect(valid({ ...m, ...change }, "s")).toBe(false);
  });
});

it("rejects stale and duplicate sequences", () => {
  expect(fresh(2, 1)).toBe(true);
  expect(fresh(1, 1)).toBe(false);
  expect(fresh(1, 2)).toBe(false);
  expect(fresh(NaN, 0)).toBe(false);
});
it("every start and recovered ready stays blank", () => {
  for (const state of [
    "IDLE",
    "OPENING",
    "POSITIONING",
    "AWAITING_FULLSCREEN",
    "READY_BLANK",
    "LIVE",
    "BLANKED",
    "DISCONNECTED",
    "STOPPED",
  ] as const) {
    expect(transition(state, "START")).toBe("OPENING");
    expect(transition(transition(state, "START"), "READY")).toBe("READY_BLANK");
    expect(transition(state, "STOP")).toBe("STOPPED");
  }
});
