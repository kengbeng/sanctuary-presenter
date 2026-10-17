import JSZip from "jszip";
import { db, sha256, type PresenterDatabase } from "./repository";
import {
  validateContent,
  id,
  contentCompatibilityIssues,
  validateMigration,
  type MigrationRecord,
  validateService,
  type Content,
  type ServiceOrder,
  type MediaAsset,
  mediaRefs,
  serviceMediaRefs,
  validateBackgroundMedia,
  contentBackgrounds,
  serviceBackgrounds,
} from "./model";
const LIMIT = 256 * 1024 * 1024,
  TOTAL = 512 * 1024 * 1024,
  MAX_FILE = 200 * 1024 * 1024;
interface Payload {
  provenance?: MigrationRecord[];
  content: Content[];
  services: ServiceOrder[];
  settings: { key: string; value: string }[];
  media: Omit<MediaAsset, "blob">[];
}
interface Manifest {
  format: string;
  version: number;
  exportedAt: string;
  counts: { content: number; services: number; media: number };
  files: Record<string, string>;
}
export async function exportBackup(
  repo: PresenterDatabase = db,
): Promise<Blob> {
  const snapshot = await repo.transaction(
    "r",
    [repo.content, repo.media, repo.services, repo.settings, repo.provenance],
    async () => ({
      provenance: await repo.provenance.toArray(),
      content: await repo.content.toArray(),
      media: await repo.media.toArray(),
      services: await repo.services.toArray(),
      settings: await repo.settings.toArray(),
    }),
  );
  const zip = new JSZip();
  const files: Record<string, string> = {};
  const payload: Payload = {
    ...snapshot,
    media: snapshot.media.map(({ blob: _blob, ...metadata }) => metadata),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  if (bytes.byteLength > 16 * 1024 * 1024)
    throw Error("Structured backup data exceeds 16 MB.");
  if (
    bytes.byteLength + snapshot.media.reduce((sum, m) => sum + m.size, 0) >
    LIMIT - 1024 * 1024
  )
    throw Error("Full backup exceeds the 256 MB archive limit.");
  zip.file("data.json", bytes);
  files["data.json"] = await sha256(bytes.buffer);
  for (let i = 0; i < snapshot.media.length; i++) {
    const bytes = await snapshot.media[i].blob.arrayBuffer();
    const path = `media/${i}.bin`;
    zip.file(path, bytes);
    files[path] = await sha256(bytes);
  }
  const manifest: Manifest = {
    format: "sanctuary-presenter-backup",
    version: 5,
    exportedAt: new Date().toISOString(),
    counts: {
      content: payload.content.length,
      services: payload.services.length,
      media: payload.media.length,
    },
    files,
  };
  zip.file("manifest.json", JSON.stringify(manifest));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "STORE",
  });
  if (blob.size > LIMIT)
    throw Error(
      "Backup exceeds the 256 MB archive limit. Reduce stored media before using this release.",
    );
  return blob;
}
// Check the ZIP central directory before JSZip allocates decompressed data.
function inspectZip(bytes: ArrayBuffer) {
  const v = new DataView(bytes);
  let end = -1;
  for (let p = v.byteLength - 22; p >= Math.max(0, v.byteLength - 65557); p--)
    if (v.getUint32(p, true) === 0x06054b50) {
      end = p;
      break;
    }
  if (
    end < 0 ||
    end + 22 + v.getUint16(end + 20, true) !== v.byteLength ||
    v.getUint16(end + 4, true) ||
    v.getUint16(end + 6, true)
  )
    throw Error("Invalid or multipart ZIP archive.");
  const count = v.getUint16(end + 10, true);
  let p = v.getUint32(end + 16, true);
  if (
    count > 10000 ||
    count === 65535 ||
    p + v.getUint32(end + 12, true) !== end
  )
    throw Error("Archive structure exceeds supported limits.");
  const names = new Set<string>();
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > end || v.getUint32(p, true) !== 0x02014b50)
      throw Error("Invalid ZIP entry.");
    const size = v.getUint32(p + 24, true),
      packed = v.getUint32(p + 20, true),
      n = v.getUint16(p + 28, true),
      extra = v.getUint16(p + 30, true),
      comment = v.getUint16(p + 32, true);
    if (p + 46 + n + extra + comment > end)
      throw Error("Truncated ZIP directory.");
    const name = new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(bytes, p + 46, n),
    );
    if (
      names.has(name) ||
      name.includes("..") ||
      name.includes("\\") ||
      name.startsWith("/") ||
      !/^(data\.json|manifest\.json|media\/|media\/\d+\.bin)$/.test(name)
    )
      throw Error("Duplicate or unsafe ZIP path.");
    if (
      v.getUint16(p + 8, true) & 1 ||
      ((v.getUint32(p + 38, true) >>> 16) & 0xf000) === 0xa000
    )
      throw Error("Encrypted entries and links are unsupported.");
    total += size;
    if (
      size > MAX_FILE ||
      total > TOTAL ||
      (size > 1024 * 1024 && size / Math.max(packed, 1) > 1000)
    )
      throw Error("Expanded archive exceeds safety limits.");
    names.add(name);
    p += 46 + n + extra + comment;
  }
  if (p !== end) throw Error("Unexpected ZIP directory data.");
}
async function boundedEntry(
  zip: JSZip,
  name: string,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const entry = zip.file(name);
  if (!entry) throw Error("Missing backup entry: " + name);
  return new Promise((resolve, reject) => {
    // JSZip exposes file.internalStream at runtime but omits it in its bundled types.
    const streaming = entry as typeof entry & {
      internalStream(type: "uint8array"): JSZip.JSZipStreamHelper<Uint8Array>;
    };
    const stream = streaming.internalStream("uint8array");
    const chunks: Uint8Array[] = [];
    let size = 0,
      failed = false;
    stream.on("data", (chunk: Uint8Array) => {
      if (failed) return;
      size += chunk.byteLength;
      if (size > limit) {
        failed = true;
        stream.pause();
        chunks.length = 0;
        reject(Error("Expanded backup entry exceeds safety limits."));
        return;
      }
      chunks.push(chunk);
    });
    stream.on("error", reject);
    stream.on("end", () => {
      if (failed) return;
      const result = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
      }
      resolve(result);
    });
    stream.resume();
  });
}
export async function readBackup(blob: Blob) {
  if (!blob.size || blob.size > LIMIT)
    throw Error("Choose a backup ZIP no larger than 256 MB.");
  const bytes = await blob.arrayBuffer();
  inspectZip(bytes);
  const zip = await JSZip.loadAsync(bytes, {
    checkCRC32: false,
    createFolders: false,
  });
  const manifest = JSON.parse(
    new TextDecoder().decode(
      await boundedEntry(zip, "manifest.json", 1024 * 1024),
    ),
  ) as Manifest;
  if (
    !manifest ||
    manifest.format !== "sanctuary-presenter-backup" ||
    ![1, 2, 3, 4, 5].includes(manifest.version) ||
    typeof manifest.exportedAt !== "string" ||
    !manifest.files ||
    typeof manifest.files !== "object" ||
    !manifest.counts
  )
    throw Error("Unsupported backup format or schema.");
  const entries = Object.keys(manifest.files);
  if (
    !entries.includes("data.json") ||
    entries.some((name) => !/^(data\.json|media\/\d+\.bin)$/.test(name))
  )
    throw Error("Invalid manifest paths.");
  if (
    Object.keys(zip.files).some(
      (name) =>
        !zip.files[name].dir &&
        name !== "manifest.json" &&
        !entries.includes(name),
    )
  )
    throw Error("Unlisted backup entry.");
  const contentFiles = new Map<string, Uint8Array>();
  for (const name of entries) {
    const data = await boundedEntry(
      zip,
      name,
      name === "data.json" ? 16 * 1024 * 1024 : MAX_FILE,
    );
    if (
      !data ||
      data.byteLength > MAX_FILE ||
      (await sha256(data.buffer as ArrayBuffer)) !== manifest.files[name]
    )
      throw Error("Backup checksum mismatch or missing file: " + name);
    contentFiles.set(name, data);
  }
  const data = JSON.parse(
    new TextDecoder().decode(contentFiles.get("data.json")),
  ) as Payload;
  if (
    !data ||
    ![data.content, data.services, data.settings, data.media].every(
      Array.isArray,
    ) ||
    data.content.length !== manifest.counts.content ||
    data.services.length !== manifest.counts.services ||
    data.media.length !== manifest.counts.media
  )
    throw Error("Backup content counts do not match.");
  const unique = (values: string[]) => {
    if (
      values.some((v) => typeof v !== "string" || !v) ||
      new Set(values).size !== values.length
    )
      throw Error("Duplicate or missing entity identifier.");
  };
  if (data.provenance !== undefined && !Array.isArray(data.provenance))
    throw Error("Invalid migration records.");
  if (manifest.version >= 3 && !Array.isArray(data.provenance))
    throw Error("Missing migration records.");
  data.provenance ??= [];
  unique(data.provenance.map((record) => record.id));
  for (const record of data.provenance) validateMigration(record);
  unique(data.content.map((c) => c.id));
  unique(data.services.map((s) => s.id));
  unique(data.media.map((m) => m.id));
  unique(data.settings.map((s) => s.key));
  for (const c of data.content) validateContent(c, { legacy: true });
  for (const s of data.services) validateService(s, { legacy: true });
  for (const s of data.settings)
    if (
      typeof s.value !== "string" ||
      s.value.length > 10000 ||
      !["selectedService"].includes(s.key)
    )
      throw Error("Invalid backup settings.");
  const media: MediaAsset[] = [];
  if (entries.length !== 1 + data.media.length)
    throw Error("Media count mismatch.");
  for (let i = 0; i < data.media.length; i++) {
    const m = data.media[i],
      bytes = contentFiles.get(`media/${i}.bin`);
    if (
      !bytes ||
      typeof m.title !== "string" ||
      typeof m.createdAt !== "string" ||
      m.size !== bytes.byteLength ||
      !["image", "video"].includes(m.kind) ||
      ![
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "image/bmp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ].includes(m.mimeType) ||
      m.hash !== manifest.files[`media/${i}.bin`]
    )
      throw Error("Invalid media metadata.");
    for (const field of ["width", "height", "duration"] as const)
      if (
        m[field] !== undefined &&
        (!Number.isFinite(m[field]) || m[field]! < 0)
      )
        throw Error("Invalid media dimensions or duration.");
    media.push({
      ...m,
      blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: m.mimeType }),
    });
  }
  const ids = new Set(media.map((m) => m.id));
  for (const c of [
    ...data.content,
    ...data.services.flatMap((s) => s.items.map((i) => i.snapshot)),
  ])
    if (mediaRefs(c).some((id) => !ids.has(id)))
      throw Error("Backup has a missing media reference.");
  for (const order of data.services)
    if (serviceMediaRefs(order).some((ref) => !ids.has(ref)))
      throw Error("Backup has a missing inherited background reference.");
  const mediaMap = new Map(media.map((m) => [m.id, m]));
  for (const c of data.content)
    validateBackgroundMedia(contentBackgrounds(c), mediaMap);
  for (const order of data.services)
    validateBackgroundMedia(serviceBackgrounds(order), mediaMap);
  const selected = data.settings.find((s) => s.key === "selectedService");
  if (selected && !data.services.some((s) => s.id === selected.value))
    throw Error("Backup selected service is missing.");
  const compatibilityIssues = [
    ...data.content.flatMap((c) =>
      contentCompatibilityIssues(c).map(
        (issue) => `Library “${c.title}”: ${issue}`,
      ),
    ),
    ...data.services.flatMap((s) =>
      s.items.flatMap((item) =>
        contentCompatibilityIssues(item.snapshot).map(
          (issue) => `Service “${s.title}”, item “${item.title}”: ${issue}`,
        ),
      ),
    ),
  ];
  return { data, media, manifest, compatibilityIssues };
}
export async function restoreBackup(
  prepared: Awaited<ReturnType<typeof readBackup>>,
  repo: PresenterDatabase = db,
) {
  await repo.transaction(
    "rw",
    [
      repo.content,
      repo.media,
      repo.services,
      repo.settings,
      repo.frames,
      repo.provenance,
    ],
    async () => {
      await Promise.all([
        repo.content.clear(),
        repo.media.clear(),
        repo.services.clear(),
        repo.settings.clear(),
        repo.frames.clear(),
        repo.provenance.clear(),
      ]);
      await repo.provenance.bulkAdd(prepared.data.provenance ?? []);
      await repo.content.bulkAdd(
        prepared.data.content.map((record) => ({
          ...record,
          revision: record.revision ?? 1,
          revisionToken: id(),
        })),
      );
      await repo.media.bulkAdd(prepared.media);
      await repo.services.bulkAdd(
        prepared.data.services.map((record) => ({
          ...record,
          revision: record.revision ?? 1,
          revisionToken: id(),
        })),
      );
      await repo.settings.bulkAdd(prepared.data.settings);
    },
  );
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
