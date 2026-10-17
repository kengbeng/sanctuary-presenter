import { refreshedItem, sameContent } from "./sourceRefresh";
import Dexie, { type Table } from "dexie";
import {
  type Content,
  type Revisioned,
  makeItem,
  servicePages,
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
  contentCompatibilityIssues,
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
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        for (const store of ["content", "services"])
          await tx
            .table(store)
            .toCollection()
            .modify((record) => {
              record.revision = 1;
              record.revisionToken = id();
            });
      });
  }
  private nextRevision(
    incoming: Revisioned,
    existing?: Revisioned,
  ): Required<Revisioned> {
    if (existing) {
      if (
        incoming.revision !== existing.revision ||
        incoming.revisionToken !== existing.revisionToken
      )
        throw Error(
          "This record changed in another window or was restored. Your edits are retained. Reload the saved version or keep a separate copy before retrying.",
        );
    } else if (
      incoming.revision !== undefined ||
      incoming.revisionToken !== undefined
    ) {
      throw Error(
        "This record was deleted or replaced. Your edits are retained; create a separate copy instead of overwriting it.",
      );
    }
    if (existing?.revision === Number.MAX_SAFE_INTEGER)
      throw Error(
        "Record revision limit reached. Export a backup and create a separate copy.",
      );
    return { revision: (existing?.revision ?? 0) + 1, revisionToken: id() };
  }
  async saveContent(c: Content): Promise<Content> {
    validateContent(c);
    const saved = await this.transaction(
      "rw",
      this.content,
      this.media,
      async () => {
        const revision = this.nextRevision(c, await this.content.get(c.id));
        await this.assertMedia(mediaRefs(c));
        validateBackgroundMedia(
          contentBackgrounds(c),
          new Map((await this.media.toArray()).map((m) => [m.id, m])),
        );
        const saved = {
          ...structuredClone(c),
          ...revision,
          title: c.title.trim(),
          updatedAt: now(),
        };
        await this.content.put(saved);
        return saved;
      },
    );
    Object.assign(c, {
      revision: saved.revision,
      revisionToken: saved.revisionToken,
      updatedAt: saved.updatedAt,
    });
    return saved;
  }
  async saveService(s: ServiceOrder): Promise<ServiceOrder> {
    validateService(s, { legacy: true });
    const saved = await this.transaction(
      "rw",
      this.services,
      this.media,
      async () => {
        const previous = await this.services.get(s.id);
        const revision = this.nextRevision(s, previous);
        // Existing legacy snapshots can be retained exactly, never silently rewritten.
        for (const item of s.items) {
          if (!contentCompatibilityIssues(item.snapshot).length) continue;
          const old = previous?.items.find(
            (candidate) => candidate.id === item.id,
          );
          if (
            !old ||
            JSON.stringify(old.snapshot) !== JSON.stringify(item.snapshot)
          )
            validateContent(item.snapshot);
        }
        await this.assertMedia(serviceMediaRefs(s));
        validateBackgroundMedia(
          serviceBackgrounds(s),
          new Map((await this.media.toArray()).map((m) => [m.id, m])),
        );
        const saved = {
          ...structuredClone(s),
          ...revision,
          title: s.title.trim(),
          updatedAt: now(),
        };
        await this.services.put(saved);
        return saved;
      },
    );
    Object.assign(s, {
      revision: saved.revision,
      revisionToken: saved.revisionToken,
      updatedAt: saved.updatedAt,
    });
    return saved;
  }
  async refreshServiceItem(
    order: ServiceOrder,
    itemId: string,
    reviewedSource: Content,
    arrangementId?: string,
  ): Promise<ServiceOrder> {
    const saved = await this.transaction(
      "rw",
      this.content,
      this.services,
      this.media,
      async () => {
        const source = await this.content.get(reviewedSource.id);
        if (!source)
          throw Error(
            "Source no longer in Library. The service copy was not changed.",
          );
        if (
          source.revision !== reviewedSource.revision ||
          source.revisionToken !== reviewedSource.revisionToken ||
          !sameContent(source, reviewedSource)
        )
          throw Error(
            "The Library source changed after comparison. Reopen the comparison before replacing.",
          );
        const next = structuredClone(order),
          index = next.items.findIndex((item) => item.id === itemId);
        if (index < 0)
          throw Error("The selected service item no longer exists.");
        next.items[index] = refreshedItem(
          next.items[index],
          source,
          arrangementId,
        );
        return this.saveService(next);
      },
    );
    Object.assign(order, saved);
    return saved;
  }
  async deleteContent(c: Content) {
    await this.transaction("rw", this.content, async () => {
      const saved = await this.content.get(c.id);
      if (!saved) throw Error("This library item was already deleted.");
      this.nextRevision(c, saved);
      await this.content.delete(c.id);
    });
  }
  async deleteService(s: ServiceOrder) {
    await this.transaction("rw", this.services, this.settings, async () => {
      const saved = await this.services.get(s.id);
      if (!saved) throw Error("This service was already deleted.");
      this.nextRevision(s, saved);
      await this.services.delete(s.id);
      if ((await this.settings.get("selectedService"))?.value === s.id)
        await this.settings.delete("selectedService");
    });
  }
  /** itemId is a retry-stable operation identity supplied by the authoring action. */
  async saveSongAndAdd(
    c: Content,
    s: ServiceOrder,
    itemId: string,
    arrangementId?: string,
  ) {
    const result = await this.transaction(
      "rw",
      this.content,
      this.services,
      this.media,
      async () => {
        const previous = await this.services.get(s.id);
        const existingItem = previous?.items.find((item) => item.id === itemId);
        if (existingItem) {
          if (
            existingItem.sourceId !== c.id ||
            JSON.stringify(existingItem.snapshot) !== JSON.stringify(c)
          )
            throw Error(
              "This add operation was already used for different content.",
            );
          // Verify the caller still owns the current versions; no stale success after restore/edit.
          this.nextRevision(s, previous);
          this.nextRevision(c, await this.content.get(c.id));
          return { content: c, service: previous! };
        }
        const content = await this.saveContent(structuredClone(c));
        const item = makeItem(content, arrangementId);
        item.id = itemId;
        const service = await this.saveService({
          ...structuredClone(s),
          items: [...s.items, item],
        });
        return { content, service };
      },
    );
    Object.assign(c, result.content);
    Object.assign(s, result.service);
    return result;
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
  async pinServiceSnapshot(
    order: ServiceOrder,
    sessionId: string,
    verifySource = false,
    retireSession?: string,
  ) {
    validateService(order);
    return this.transaction(
      "rw",
      this.frames,
      this.services,
      this.media,
      async () => {
        if (verifySource) {
          const saved = await this.services.get(order.id);
          if (
            !saved ||
            saved.revisionToken !== order.revisionToken ||
            saved.revision !== order.revision
          )
            throw Error(
              "The staged service changed during preparation. Apply the latest saved version again.",
            );
        }
        await this.assertMedia(serviceMediaRefs(order));
        validateBackgroundMedia(
          serviceBackgrounds(order),
          new Map(
            (await this.media.toArray()).map((asset) => [asset.id, asset]),
          ),
        );
        const frames = [];
        const omitted = order.items.flatMap((item) => {
          const sectionOrder = item.snapshot.sections
            .map((section) => section.id)
            .filter((sectionId) => !item.sectionOrder.includes(sectionId));
          return sectionOrder.length
            ? servicePages({ ...order, items: [{ ...item, sectionOrder }] })
            : [];
        });
        for (const page of [...servicePages(order), ...omitted])
          frames.push(await this.prepareFrame(page, sessionId));
        if (retireSession && retireSession !== sessionId)
          await this.frames.where("sessionId").equals(retireSession).delete();
        return frames;
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
