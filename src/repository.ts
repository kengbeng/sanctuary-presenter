import Dexie, { type Table } from "dexie";
import {
  type Content,
  type MigrationRecord,
  type MediaAsset,
  type ServiceOrder,
  type RenderRecord,
  type Page,
  mediaRefs,
  serviceMediaRefs,
  backgroundRefs,
  validateBackgroundMedia,
  contentBackgrounds,
  serviceBackgrounds,
  validateContent,
  validateService,
  id,
  now,
} from "./model";
export class PresenterDatabase extends Dexie {
  provenance!: Table<MigrationRecord, string>;
  content!: Table<Content, string>;
  media!: Table<MediaAsset, string>;
  services!: Table<ServiceOrder, string>;
  settings!: Table<{ key: string; value: string }, string>;
  frames!: Table<RenderRecord, string>;
  constructor(name = "sanctuary:" + import.meta.env.BASE_URL) {
    super(name);
    this.version(1).stores({
      content: "id,kind,title,updatedAt",
      media: "id,hash,title",
      services: "id,title,updatedAt",
      settings: "key",
      frames: "id,sessionId,createdAt",
    });
    this.version(2).stores({ provenance: "id,createdAt" });
  }
  async saveContent(c: Content) {
    validateContent(c);
    await this.transaction("rw", this.content, this.media, async () => {
      await this.assertMedia(mediaRefs(c));
      validateBackgroundMedia(
        contentBackgrounds(c),
        new Map((await this.media.toArray()).map((m) => [m.id, m])),
      );
      await this.content.put({
        ...structuredClone(c),
        title: c.title.trim(),
        updatedAt: now(),
      });
    });
  }
  async saveService(s: ServiceOrder) {
    validateService(s);
    await this.transaction("rw", this.services, this.media, async () => {
      await this.assertMedia(serviceMediaRefs(s));
      validateBackgroundMedia(
        serviceBackgrounds(s),
        new Map((await this.media.toArray()).map((m) => [m.id, m])),
      );
      await this.services.put({
        ...structuredClone(s),
        title: s.title.trim(),
        updatedAt: now(),
      });
    });
  }
  async assertMedia(refs: string[]) {
    for (const ref of new Set(refs))
      if (!(await this.media.get(ref)))
        throw Error(
          "Referenced media is missing. Reimport the asset or remove its reference.",
        );
  }
  async references(mediaId: string) {
    const content = (await this.content.toArray())
      .filter((c) => mediaRefs(c).includes(mediaId))
      .map((c) => `Library: ${c.title}`);
    const services = (await this.services.toArray())
      .filter((s) => serviceMediaRefs(s).includes(mediaId))
      .map((s) => `Service: ${s.title}`);
    const frames = (await this.frames.toArray()).some(
      (f) =>
        f.page.mediaId === mediaId ||
        backgroundRefs(f.page.backgroundDesign).includes(mediaId),
    )
      ? ["Prepared output snapshot"]
      : [];
    return [...content, ...services, ...frames];
  }
  async deleteMedia(mediaId: string) {
    await this.transaction(
      "rw",
      this.content,
      this.services,
      this.media,
      this.frames,
      async () => {
        const refs = await this.references(mediaId);
        if (refs.length) throw Error("Media is in use: " + refs.join(", "));
        await this.media.delete(mediaId);
      },
    );
  }
  async prepareFrame(page: Page, sessionId = "test") {
    const clean: Page = {
      id: page.id,
      title: page.title,
      text: page.text,
      secondary: page.secondary,
      ...(page.languageMode ? { languageMode: page.languageMode } : {}),
      style: { ...page.style },
      ...(page.backgroundDesign
        ? { backgroundDesign: { ...page.backgroundDesign } }
        : {}),
      ...(page.mediaId ? { mediaId: page.mediaId } : {}),
    };
    const key = id();
    await this.frames.put({
      id: key,
      sessionId,
      page: clean,
      createdAt: now(),
    });
    return key;
  }
  async importMedia(file: File) {
    const image = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "image/bmp",
    ];
    const video = ["video/mp4", "video/webm", "video/quicktime"];
    if (![...image, ...video].includes(file.type))
      throw Error(
        "Use PNG, JPEG, WebP, GIF, BMP, MP4, WebM or MOV. Codec support depends on your browser.",
      );
    if (!file.size || file.size > 200 * 1024 * 1024)
      throw Error("Choose a non-empty media file smaller than 200 MB.");
    if (
      video.includes(file.type) &&
      !document.createElement("video").canPlayType(file.type)
    )
      throw Error(
        "This browser cannot play this video format. Try MP4/H.264 or WebM.",
      );
    const bytes = await file.arrayBuffer();
    const hash = await sha256(bytes);
    const existing = await this.media.where("hash").equals(hash).first();
    if (existing) return existing;
    const metadata = await inspectMedia(
      file,
      image.includes(file.type) ? "image" : "video",
    );
    const asset: MediaAsset = {
      ...metadata,
      id: id(),
      title: file.name,
      kind: image.includes(file.type) ? "image" : "video",
      mimeType: file.type,
      size: file.size,
      hash,
      blob: file,
      createdAt: now(),
    };
    await this.media.put(asset);
    return asset;
  }
}
export const db = new PresenterDatabase();
export async function sha256(bytes: ArrayBuffer) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function inspectMedia(
  blob: Blob,
  kind: "image" | "video",
): Promise<{ width: number; height: number; duration?: number }> {
  const url = URL.createObjectURL(blob);
  const element =
    kind === "image" ? new Image() : document.createElement("video");
  try {
    return await new Promise((resolve, reject) => {
      let done = false;
      const finish = (error?: string) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        element.onload = null;
        element.onerror = null;
        element.onloadedmetadata = null;
        if (error) {
          reject(Error(error));
          return;
        }
        const width =
          element instanceof HTMLVideoElement
            ? element.videoWidth
            : element.naturalWidth;
        const height =
          element instanceof HTMLVideoElement
            ? element.videoHeight
            : element.naturalHeight;
        if (!width || !height) {
          reject(
            Error(
              "Media has no usable dimensions. Choose a supported image or video.",
            ),
          );
          return;
        }
        const duration =
          element instanceof HTMLVideoElement &&
          Number.isFinite(element.duration)
            ? element.duration
            : undefined;
        resolve({
          width,
          height,
          ...(duration !== undefined ? { duration } : {}),
        });
      };
      const timer = setTimeout(
        () =>
          finish(
            "Media inspection timed out. Try a smaller file or a supported format.",
          ),
        10000,
      );
      element.onerror = () =>
        finish(
          "Media could not be opened. Try PNG/JPEG or MP4/H.264 in this browser.",
        );
      if (element instanceof HTMLVideoElement) {
        element.preload = "metadata";
        element.onloadedmetadata = () => finish();
      } else element.onload = () => finish();
      element.src = url;
    });
  } finally {
    if (element instanceof HTMLVideoElement) {
      element.pause();
      element.removeAttribute("src");
      element.load();
    } else element.src = "";
    URL.revokeObjectURL(url);
  }
}
