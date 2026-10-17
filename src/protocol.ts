export const VERSION = 1;
export const slides = [
  { title: "Welcome", text: "A place to gather.\nA moment to be still." },
  {
    title: "Together",
    text: "Let everything that has breath\npraise the Lord.",
  },
  { title: "Peace", text: "Go in peace.\nServe with love." },
];
export type Phase =
  | "IDLE"
  | "OPENING"
  | "POSITIONING"
  | "AWAITING_FULLSCREEN"
  | "READY_BLANK"
  | "LIVE"
  | "BLANKED"
  | "DISCONNECTED"
  | "STOPPED";
export type Kind =
  | "CANCEL_PENDING"
  | "CANCELLED"
  | "SETUP_CONTROLS"
  | "HELLO"
  | "READY"
  | "HEARTBEAT"
  | "SYNC_STATE"
  | "SHOW_SLIDE"
  | "SET_BLANK"
  | "OUTPUT_STATUS"
  | "MEDIA_STATUS"
  | "STOP_PRESENTATION"
  | "ERROR";
export interface Message {
  v: 1;
  session: string;
  instance: string;
  seq: number;
  type: Kind;
  target?: string;
  slide?: number;
  frameId?: string;
  visibleFrameId?: string;
  cue?: boolean;
  blank?: boolean;
  fullscreen?: boolean;
  rendered?: boolean;
  error?: string;
}
const kinds: Kind[] = [
  "CANCEL_PENDING",
  "CANCELLED",
  "SETUP_CONTROLS",
  "HELLO",
  "READY",
  "HEARTBEAT",
  "SYNC_STATE",
  "SHOW_SLIDE",
  "SET_BLANK",
  "OUTPUT_STATUS",
  "MEDIA_STATUS",
  "STOP_PRESENTATION",
  "ERROR",
];
export function valid(x: unknown, session: string): x is Message {
  if (!x || typeof x !== "object") return false;
  const m = x as Message;
  return (
    m.v === VERSION &&
    m.session === session &&
    typeof m.instance === "string" &&
    m.instance.length > 0 &&
    Number.isSafeInteger(m.seq) &&
    m.seq > 0 &&
    kinds.includes(m.type) &&
    (m.target === undefined || typeof m.target === "string") &&
    (m.type !== "SHOW_SLIDE" ||
      m.slide !== undefined ||
      m.frameId !== undefined) &&
    (m.frameId === undefined ||
      (typeof m.frameId === "string" && /^[a-f0-9-]{36}$/.test(m.frameId))) &&
    (m.slide === undefined ||
      (Number.isInteger(m.slide) && m.slide >= 0 && m.slide < slides.length)) &&
    (!["CANCEL_PENDING", "CANCELLED"].includes(m.type) || !!m.frameId) &&
    (m.visibleFrameId === undefined ||
      (typeof m.visibleFrameId === "string" &&
        /^[a-f0-9-]{36}$/.test(m.visibleFrameId))) &&
    (m.cue === undefined || typeof m.cue === "boolean") &&
    (m.blank === undefined || typeof m.blank === "boolean") &&
    (m.fullscreen === undefined || typeof m.fullscreen === "boolean") &&
    (m.rendered === undefined || typeof m.rendered === "boolean") &&
    (m.error === undefined || typeof m.error === "string")
  );
}
export function transition(
  phase: Phase,
  event: "START" | "READY" | "SHOW" | "BLANK" | "LOST" | "STOP",
): Phase {
  if (event === "START") return "OPENING";
  if (event === "STOP") return "STOPPED";
  if (event === "LOST")
    return phase === "IDLE" || phase === "STOPPED" ? phase : "DISCONNECTED";
  if (event === "READY")
    return phase === "OPENING" ||
      phase === "DISCONNECTED" ||
      phase === "POSITIONING" ||
      phase === "AWAITING_FULLSCREEN"
      ? "READY_BLANK"
      : phase;
  if (event === "SHOW")
    return ["READY_BLANK", "BLANKED", "LIVE"].includes(phase) ? "LIVE" : phase;
  if (event === "BLANK") return phase === "LIVE" ? "BLANKED" : phase;
  return phase;
}
export function outputUrl(session: string, test: boolean, fullscreen: boolean) {
  const u = new URL(import.meta.env.BASE_URL, location.origin);
  u.hash = `/output?session=${encodeURIComponent(session)}&test=${test ? 1 : 0}&fullscreen=${fullscreen ? 1 : 0}`;
  return u.href;
}
export function channelName() {
  return `sanctuary:${import.meta.env.BASE_URL}`;
}

export function fresh(sequence: number, last: number) {
  return Number.isSafeInteger(sequence) && sequence > last;
}
