"""Schema-9 service snapshots and portable packages; no v1 runtime dependencies."""
from datetime import datetime, timezone
import io
import json
import math
from pathlib import Path
import re
import stat
import tempfile
import zipfile

from convert_v1 import MB, MIMES, STYLE, bounded, content, convert, digest, flag, generated, identity, parse_json, rows, text, unique, verify_unchanged, write_backup
from sqlite_v1 import MediaResolver, convert_database, no_sidecars, read_media

THEMES = {
    "Midnight": ("#101827", "#ffffff"), "Deep Blue": ("#102a43", "#ffffff"),
    "Warm Charcoal": ("#28231f", "#fff7ea"), "Forest": ("#16312a", "#f3fff9"),
}
PROFILES = {
    "Projector": dict(name="Projector", horizontalMargin=7, verticalMargin=8, fontSize=69.12, minFontSize=36.72, secondaryScale=.82),
    "LED wall": dict(name="LED wall", horizontalMargin=4.5, verticalMargin=5.5, fontSize=77.76, minFontSize=41.04, secondaryScale=.84),
    "Livestream": dict(name="Livestream", horizontalMargin=9.5, verticalMargin=10.5, fontSize=59.4, minFontSize=33.48, secondaryScale=.8),
}


def number(row, key, default, low, high):
    value = row.get(key, default)
    if type(value) not in (int, float) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError("Invalid service numeric field: " + key)
    return value


def color(row, key, default):
    value = text(row, key, default) or default
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError("Invalid service colour: " + key)
    return value.lower()


def style_for(row, profile, foreground, background):
    preferred = number(row, "font_size", 0, 0, 140) or profile["fontSize"]
    minimum = number(row, "minimum_font_size", 0, 0, 140) or profile["minFontSize"]
    if preferred < 16 or minimum < 16:
        raise ValueError("Service font size is below the v2 supported minimum")
    style = dict(STYLE, **{key: profile[key] for key in ("horizontalMargin", "verticalMargin", "secondaryScale")})
    style.update(fontSize=preferred, minFontSize=minimum, lineSpacing=number(row, "line_spacing", 1, .8, 1.8),
        autoFit=flag(row, "auto_fit", True), fontWeight=number(row, "font_weight", 600, 400, 700),
        fontFamily=text(row, "font_family") or "system-ui", chineseFontFamily=text(row, "chinese_font_family"),
        color=color(row, "text_color", foreground), background=background, verticalAlign="center",
        outlineColor=color(row, "outline_color", "#000000"),
        outlineWidth=number(row, "outline_width", 3, 0, 8) if flag(row, "outline_enabled") else 0)
    for family in (style["fontFamily"], style["chineseFontFamily"]):
        if len(family) > 200 or re.search(r"[;{}<>\\]", family):
            raise ValueError("Invalid local font family")
    return style


def selected_scope(plan, item, slide, field, custom):
    for row in (slide, item):
        mode = row.get(field, "inherit")
        if mode not in ("inherit", *custom):
            raise ValueError("Invalid service inheritance mode: " + field)
        if mode != "inherit":
            return row
    return plan


def inspect_package(archive):
    entries = archive.infolist()
    unique([entry.filename for entry in entries], "service ZIP paths")
    if len(entries) > 10000:
        raise ValueError("Too many service ZIP entries")
    total = 0
    for entry in entries:
        name = entry.filename
        if (not name or "\\" in name or "\x00" in name or name.startswith("/") or ":" in name or
            any(part in ("..", ".") for part in name.split("/")) or entry.flag_bits & 1 or stat.S_ISLNK(entry.external_attr >> 16)):
            raise ValueError("Unsafe, linked or encrypted service ZIP entry")
        if name not in ("service.json", "manifest.json") and not name.startswith("media/"):
            raise ValueError("Unexpected service ZIP entry")
        total += entry.file_size
        if entry.file_size > 200 * MB or total > 512 * MB or (entry.file_size > MB and entry.file_size / max(entry.compress_size, 1) > 1000):
            raise ValueError("Service ZIP exceeds safety limits")


class Assets:
    def __init__(self, payload, media_bytes, resolver):
        self.payload, self.bytes, self.resolver = payload, media_bytes, resolver
        self.checks = []
        self.resolutions = {}
        self.by_hash = {(row["hash"], row["mimeType"]): row["id"] for row in payload["media"]}

    def add(self, path, kind, archive, used, manifest):
        if path in self.resolutions:
            mid = self.resolutions[path]["mediaId"]
            if next(row["kind"] for row in self.payload["media"] if row["id"] == mid) != kind:
                raise ValueError("Inconsistent service media type for repeated path")
            used.add(path)
            return mid
        if archive is not None:
            if not path.startswith("media/") or path not in archive.namelist():
                raise ValueError("Service media is missing from its package")
            value = bounded(archive, path, 200 * MB)
            used.add(path)
            listed = [row for row in manifest.get("media", []) if row.get("package_path") == path]
            if not listed or any(row.get("status") != "copied" for row in listed):
                raise ValueError("Service manifest does not mark referenced media as copied")
            for row in listed:
                if text(row, "sha256") and row["sha256"].lower() != digest(value):
                    raise ValueError("Service media checksum mismatch")
        else:
            resolved = self.resolver.resolve(path)
            value = read_media(resolved)
            self.checks.append((resolved, digest(value)))
        mime = MIMES.get(Path(path.replace("\\", "/")).suffix.lower())
        if not value or not mime or mime.split("/")[0] != kind:
            raise ValueError("Unsupported or mismatched service media type")
        hashed = digest(value)
        key = (hashed, mime)
        if key in self.by_hash:
            self.resolutions[path] = dict(mediaId=self.by_hash[key], sha256=hashed)
            return self.by_hash[key]
        mid = generated("service-media", hashed, mime)
        if any(row["id"] == mid for row in self.payload["media"]):
            raise ValueError("Service media identifier collision")
        self.payload["media"].append(dict(id=mid, title=Path(path.replace("\\", "/")).name,
            kind=kind, mimeType=mime, hash=hashed, size=len(value), createdAt=datetime.now(timezone.utc).isoformat()))
        self.bytes.append(value)
        self.by_hash[key] = mid
        self.resolutions[path] = dict(mediaId=mid, sha256=hashed)
        if sum(map(len, self.bytes)) > 255 * MB:
            raise ValueError("Combined media exceeds backup limit")
        return mid


def map_service(raw, profile, assets, archive, manifest):
    if not isinstance(raw, dict) or raw.get("schema_version") != 9:
        raise ValueError("Only service schema 9 is supported")
    service_id = identity(raw)
    title = text(raw, "title", limit=500)
    if not title.strip():
        raise ValueError("Service title is required")
    if raw.get("background_type", "theme") not in ("theme", "video") or raw.get("typography_mode", "custom") != "custom":
        raise ValueError("Invalid service master design mode")
    stamp = datetime.now(timezone.utc).isoformat()
    order = dict(id=service_id, title=title, date=text(raw, "service_date"), items=[], profile=profile.copy(),
                 createdAt=stamp, updatedAt=stamp)
    used = set()
    # Copy every saved media reference, including overrides not currently effective.
    scopes = [raw]
    for saved_item in rows(raw.get("items"), "service items"):
        scopes.append(saved_item)
        scopes.extend(rows(saved_item.get("slides"), "service slides"))
    for scope in scopes:
        if scope.get("background_type") == "video":
            assets.add(text(scope, "background_path"), "video", archive, used, manifest)
        if scope.get("content_type") in ("image", "video"):
            assets.add(text(scope, "media_path"), scope["content_type"], archive, used, manifest)
    for item in rows(raw.get("items"), "service items"):
        item_id = identity(item)
        item_title = text(item, "title", limit=500)
        if not item_title.strip():
            raise ValueError("Service item title is required")
        is_section = text(item, "item_type", "custom") == "section"
        pages = []
        input_slides = rows(item.get("slides"), "service slides")
        if is_section and input_slides:
            raise ValueError("Non-presenting section unexpectedly contains slides")
        for index, slide in enumerate(input_slides):
            theme = text(slide, "theme", "Midnight")
            if theme not in THEMES:
                raise ValueError("Unknown v1 theme; inspect before conversion")
            bg_scope = selected_scope(raw, item, slide, "background_type", ("theme", "video"))
            mode = bg_scope.get("background_type", "theme")
            background_color = color(bg_scope, "background_color", THEMES[theme][0])
            background = dict(mode="color" if mode == "theme" else "video", color=background_color,
                fit=text(bg_scope, "background_fit", "cover"), darken=number(bg_scope, "background_darken", 24, 0, 80),
                loop=flag(bg_scope, "background_loop", True))
            if background["fit"] not in ("cover", "contain"):
                raise ValueError("Invalid service background fit")
            type_ = text(slide, "content_type", "text")
            if mode == "video" and type_ == "text":
                background["mediaId"] = assets.add(text(bg_scope, "background_path"), "video", archive, used, manifest)
            if type_ != "text":
                background["mode"] = "color"
            if type_ not in ("text", "image", "video"):
                raise ValueError("Unsupported service slide type")
            language = text(slide, "language_mode", "primary")
            if language not in ("primary", "secondary", "both"):
                raise ValueError("Invalid service slide language mode")
            typography = selected_scope(raw, item, slide, "typography_mode", ("custom",))
            page = dict(id=generated(service_id, item_id, "slide", index), title="",
                text=text(slide, "text", limit=100000), secondary=text(slide, "secondary_text", limit=100000),
                languageMode=language, typographyMode="custom", backgroundDesign=background,
                style=style_for(typography, profile, THEMES[theme][1], background_color))
            if type_ != "text":
                page["mediaId"] = assets.add(text(slide, "media_path"), type_, archive, used, manifest)
                # v1 foreground media does not project its stored text fields.
                page["text"] = page["secondary"] = ""
            pages.append(page)
        if not pages and not is_section:
            raise ValueError("Presenting service item has no slides")
        snapshot_id = generated(service_id, item_id, "snapshot")
        placeholder = dict(id=generated(service_id, item_id, "section-placeholder"), title="", text="", secondary="", style=STYLE.copy())
        snapshot = content(dict(id=snapshot_id, title=item_title, slides=[dict(primary_text="")]), "slides", stamp)
        snapshot["pages"] = pages or [placeholder]
        metadata = item.get("metadata", {})
        if not isinstance(metadata, dict):
            raise ValueError("Invalid service source metadata")
        source_id = metadata.get("source_song_id", metadata.get("source_slide_item_id", metadata.get("source_prayer_id", "")))
        if not isinstance(source_id, str):
            raise ValueError("Invalid service source identifier")
        order["items"].append(dict(id=item_id, title=item_title, sourceId=source_id, snapshot=snapshot,
            sectionOrder=[], overrides={}, notes=text(item, "notes", limit=100000), nonPresenting=is_section))
    unique([row["id"] for row in order["items"]], "service item identifiers")
    if archive is not None:
        extras = [entry.filename for entry in archive.infolist() if not entry.is_dir() and entry.filename not in used | {"service.json", "manifest.json"}]
        # Preserve all packaged media even when a saved override is not currently effective.
        for path in extras:
            mime = MIMES.get(Path(path).suffix.lower())
            if not mime:
                raise ValueError("Unsupported unused packaged service media")
            assets.add(path, mime.split("/")[0], archive, used, manifest)
    return order


def convert_services(sources, destination, media_root=None, path_maps=(), profile_name="Projector", library=None, database=None):
    destination = Path(destination)
    if not sources:
        raise ValueError("Supply at least one service file")
    if destination.exists():
        raise ValueError("Output already exists; choose a new filename")
    if library and database:
        raise ValueError("Choose one library/database base")
    payload = dict(content=[], services=[], settings=[], media=[], provenance=[])
    media_bytes, source_checks, base_media_checks = [], [], []
    with tempfile.TemporaryDirectory(prefix="sanctuary-conversion-") as folder:
        if library or database:
            base = Path(folder) / "base.zip"
            if library:
                convert(library, base)
            else:
                convert_database(database, base, media_root, path_maps)
            with zipfile.ZipFile(base) as archive:
                payload = parse_json(bounded(archive, "data.json", 16 * MB))
                media_bytes = [bounded(archive, f"media/{i}.bin", 200 * MB) for i in range(len(payload["media"]))]
            source_checks.append((Path(library or database), payload["provenance"][0]["sourceHash"]))
            if database:
                original = parse_json(payload["provenance"][0]["originalJson"])
                base_media_checks = [(Path(row["resolvedPath"]), row["sha256"]) for row in original["media_resolution"]]
        assets = Assets(payload, media_bytes, MediaResolver(media_root, path_maps))
        for source in sources:
            source = Path(source)
            if source.stat().st_size > 256 * MB:
                raise ValueError("Service input exceeds 256 MB")
            value = source.read_bytes()
            hashed = digest(value)
            source_checks.append((source, hashed))
            manifest = {}
            assets.resolutions = {}
            if source.suffix.lower() == ".spservice":
                with zipfile.ZipFile(io.BytesIO(value)) as archive:
                    inspect_package(archive)
                    raw = parse_json(bounded(archive, "service.json", 16 * MB).decode("utf-8-sig"))
                    manifest = parse_json(bounded(archive, "manifest.json", MB).decode("utf-8-sig"))
                    if not isinstance(manifest, dict) or manifest.get("schema_version") != 9:
                        raise ValueError("Unsupported service package manifest")
                    entries = rows(manifest.get("media"), "manifest media")
                    if any(row.get("status") != "copied" for row in entries):
                        raise ValueError("Service package manifest contains missing media")
                    order = map_service(raw, PROFILES[profile_name], assets, archive, manifest)
            else:
                if len(value) > 16 * MB:
                    raise ValueError("Service JSON exceeds 16 MB")
                raw = parse_json(value.decode("utf-8-sig"))
                order = map_service(raw, PROFILES[profile_name], assets, None, {})
            payload["services"].append(order)
            report = [f"Converted service: {order['title']} ({len(order['items'])} items).",
                "Saved snapshots preserved; slides were not regenerated from library masters. Notes and item titles stay operator-only.",
                "Section headings are non-presenting. Language selection and secondary-to-primary fallback are retained.",
                f"Output profile: {profile_name}. v1 external application profile settings are not contained in service files.",
                "Effective v1 typography/background scopes are resolved into explicit per-slide designs. Original scope settings remain in retained JSON; edit inherited designs deliberately after conversion.",
                "Theme gradients/Qt font metrics, codec support and readability require target-display rehearsal. Review signatures are retained as source data only."]
            payload["provenance"].append(dict(id=generated(hashed, "service-provenance"), createdAt=datetime.now(timezone.utc).isoformat(),
                sourceName=source.name, sourceHash=hashed, report=report,
                originalJson=json.dumps(dict(format="sanctuary-presenter-service-source", service=raw, manifest=manifest, mediaResolution=assets.resolutions), ensure_ascii=False, allow_nan=False)))
            if len(json.dumps(payload, ensure_ascii=False, allow_nan=False).encode()) > 16 * MB:
                raise ValueError("Combined service data exceeds the 16 MB backup limit")
        unique([row["id"] for row in payload["services"]], "service identifiers")
        unique([row["id"] for row in payload["provenance"]], "source inputs")
        def verify():
            if database:
                no_sidecars(Path(database))
            for path, expected in source_checks:
                verify_unchanged(path, expected)
            for path, expected in [*base_media_checks, *assets.checks]:
                if digest(read_media(path)) != expected:
                    raise ValueError("Service media changed during conversion")
        write_backup(payload, media_bytes, destination, verify, 4)
    return [line for record in payload["provenance"] for line in record["report"]]
