#!/usr/bin/env python3
"""Convert v1 libraries, schema-15 SQLite backups and schema-9 services to a local v2 backup.

Uses only Python's standard library. Does not import or run v1 code, extract
archives, inspect private data folders, or modify the source.
"""
import argparse
import hashlib
import io
import json
import math
from pathlib import Path, PurePosixPath
import stat
import sqlite3
import uuid
import zipfile
from datetime import datetime, timezone

MB = 1024 * 1024
STYLE = dict(fontSize=64, lineSpacing=1.3, align="center", color="#ffffff", background="#101827")
MIMES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".bmp": "image/bmp", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime"}


def digest(value):
    return hashlib.sha256(value).hexdigest()


def generated(*parts):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "sanctuary-v1:" + json.dumps(parts, ensure_ascii=False)))


def text(row, key, default="", limit=10000):
    value = row.get(key, default)
    if not isinstance(value, str) or len(value) > limit:
        raise ValueError(f"Invalid text field: {key}")
    return value


def identity(row, fallback=None):
    value = row.get("id", fallback)
    if not isinstance(value, str) or not value:
        raise ValueError("Missing stable identifier")
    return value


def rows(value, name):
    if not isinstance(value, list) or any(not isinstance(row, dict) for row in value):
        raise ValueError(f"Invalid {name} collection")
    return value


def flag(row, key, default=False):
    value = row.get(key, default)
    if value not in (False, True, 0, 1):
        raise ValueError(f"Invalid flag: {key}")
    return bool(value)


def unique(values, label):
    if len(values) != len(set(values)):
        raise ValueError(f"Duplicate {label}")


def page(raw, fallback):
    # Reusable prayer slides lack stable exported IDs; synthesize deterministically.
    return dict(id=identity(raw, fallback), title="", text=text(raw, "primary_text", limit=100000),
                secondary=text(raw, "secondary_text", limit=100000), style=STYLE.copy(), typographyMode="inherit")


def content(raw, kind, stamp):
    cid = identity(raw)
    title = text(raw, "title", limit=500)
    if not title.strip():
        raise ValueError("Missing library title")
    result = dict(id=cid, kind=kind, title=title, sections=[], arrangements=[], pages=[],
                  createdAt=text(raw, "created_at", stamp), updatedAt=text(raw, "updated_at", stamp),
                  reportingEnabled=flag(raw, "reporting_enabled", True))
    for dest, source, default in [
        ("indexNumber", "song_no", ""), ("primaryLanguage", "primary_language", "English"),
        ("secondaryLanguage", "secondary_language", ""), ("author", "author", ""),
        ("copyright", "copyright", ""), ("ccliNumber", "ccli_number", ""),
        ("rightsStatus", "rights_status", "Unspecified"), ("copyrightYear", "copyright_year", ""),
        ("publisher", "publisher", ""), ("licenceNote", "licence_note", ""), ("tags", "tags", "")]:
        result[dest] = text(raw, source, default)
    if kind == "song":
        for index, section in enumerate(rows(raw.get("sections"), "sections")):
            sid = identity(section)
            label = text(section, "label")
            if not label.strip():
                raise ValueError("Empty section label")
            pages = [page(slide, generated(cid, sid, i)) for i, slide in enumerate(rows(section.get("slides"), "section slides"))]
            if not pages:
                raise ValueError("Empty song section")
            result["sections"].append(dict(id=sid, label=label, pages=pages))
        labels = [s["label"] for s in result["sections"]]
        unique([label.casefold() for label in labels], "section labels")
        section_ids = {s["label"]: s["id"] for s in result["sections"]}
        for arrangement in rows(raw.get("arrangements"), "arrangements"):
            sequence = arrangement.get("sequence")
            if not isinstance(sequence, list) or not sequence or any(not isinstance(label, str) or label not in section_ids for label in sequence):
                raise ValueError("Invalid arrangement section reference")
            name = text(arrangement, "name")
            if not name.strip():
                raise ValueError("Empty arrangement name")
            auto = flag(arrangement, "auto_generated")
            if auto and sequence != labels:
                raise ValueError("Auto arrangement sequence disagrees with section order")
            result["arrangements"].append(dict(id=identity(arrangement), name=name,
                sectionIds=[section_ids[label] for label in sequence], auto=auto,
                isDefault=flag(arrangement, "is_default")))
        if not result["sections"] or sum(a["isDefault"] for a in result["arrangements"]) != 1:
            raise ValueError("Song requires sections and exactly one default arrangement")
    else:
        result["pages"] = [page(slide, generated(cid, "reusable", i)) for i, slide in enumerate(rows(raw.get("slides"), "reusable slides"))]
        if not result["pages"]:
            raise ValueError("Empty reusable slide set")
    unique([s["id"] for s in result["sections"]] + [p["id"] for s in result["sections"] for p in s["pages"]] + [p["id"] for p in result["pages"]] + [a["id"] for a in result["arrangements"]], "content identifiers")
    return result


def inspect(archive):
    entries = archive.infolist()
    if len(entries) > 10000:
        raise ValueError("Too many ZIP entries")
    unique([entry.filename for entry in entries], "ZIP paths")
    total = 0
    for entry in entries:
        name = entry.filename
        path = PurePosixPath(name)
        if (not name or "\\" in name or "\x00" in name or path.is_absolute() or
                any(part in ("..", ".") for part in name.split("/")) or ":" in name or
                stat.S_ISLNK(entry.external_attr >> 16) or entry.flag_bits & 1):
            raise ValueError("Unsafe, linked or encrypted ZIP entry")
        if name != "library.json" and not name.startswith("media/"):
            raise ValueError("Unexpected v1 library entry")
        total += entry.file_size
        if entry.file_size > 200 * MB or total > 512 * MB or (entry.file_size > MB and entry.file_size / max(entry.compress_size, 1) > 1000):
            raise ValueError("Expanded ZIP exceeds limits")


def bounded(archive, name, limit):
    if archive.getinfo(name).file_size > limit:
        raise ValueError("ZIP entry exceeds limit")
    with archive.open(name) as stream:
        data = stream.read(limit + 1)
    if len(data) > limit:
        raise ValueError("ZIP entry exceeds limit")
    return data


def parse_json(value):
    def pairs(entries):
        result = {}
        for key, value in entries:
            if key in result:
                raise ValueError("Duplicate JSON key")
            result[key] = value
        return result
    return json.loads(value, object_pairs_hook=pairs, parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Nonfinite JSON number")))


def convert(source, destination):
    source, destination = Path(source), Path(destination)
    if destination.exists():
        raise ValueError("Output already exists; choose a new filename")
    if source.stat().st_size > 256 * MB:
        raise ValueError("Input exceeds 256 MB")
    source_bytes = source.read_bytes()
    source_hash = digest(source_bytes)
    stamp = datetime.now(timezone.utc).isoformat()
    report = ["Library export only: services, usage history and application settings are not supplied by this v1 format.",
              "Original library.json retained as inert data, including unmapped metadata and any deleted records.",
              "Text and arrangements converted; visual layout and media codecs require rehearsal on the target browser."]
    with zipfile.ZipFile(io.BytesIO(source_bytes)) as archive:
        inspect(archive)
        original_bytes = bounded(archive, "library.json", 16 * MB)
        original = original_bytes.decode("utf-8-sig")
        raw = parse_json(original)
        if not isinstance(raw, dict) or raw.get("format") != "sanctuary-presenter-library" or raw.get("format_version") != 1 or raw.get("database_schema") != 15:
            raise ValueError("Only v1 library format 1 / database schema 15 is supported")
        # The v1 export duplicates Slides under prayers; never concatenate aliases.
        reusable = raw.get("slides") if isinstance(raw.get("slides"), list) else raw.get("prayers")
        contents = []
        deleted = 0
        for kind, collection in [("song", rows(raw.get("songs"), "songs")), ("slides", rows(reusable, "slides"))]:
            for row in collection:
                if row.get("deleted_at"):
                    deleted += 1
                else:
                    contents.append(content(row, kind, stamp))
        unique([c["id"] for c in contents], "library identifiers")
        metadata, media_bytes = [], []
        consumed = {"library.json"}
        deleted_media = 0
        all_media = rows(raw.get("media"), "media")
        unique([identity(m) for m in all_media], "media identifiers")
        for media in all_media:
            member = text(media, "archive_member")
            if member:
                consumed.add(member)
            if media.get("deleted_at"):
                deleted_media += 1
                continue
            if not member or not member.startswith("media/") or member not in archive.namelist():
                raise ValueError("Media is missing from the export. Re-export v1 with media included.")
            mime = MIMES.get(PurePosixPath(member).suffix.lower())
            if not mime:
                raise ValueError("Unsupported media format: " + member)
            value = bounded(archive, member, 200 * MB)
            if not value:
                raise ValueError("Empty media file")
            hashed = digest(value)
            expected = text(media, "sha256")
            if expected and expected.lower() != hashed:
                raise ValueError("Media checksum changed: " + member)
            kind = mime.split("/")[0]
            if media.get("media_type") not in (None, kind):
                raise ValueError("Media type disagrees with packaged file")
            metadata.append(dict(id=identity(media), title=text(media, "title"), kind=kind,
                mimeType=mime, size=len(value), hash=hashed, createdAt=text(media, "added_at", stamp)))
            for target, source_key in [("width", "width"), ("height", "height"), ("duration", "duration_seconds")]:
                number = media.get(source_key)
                if number is not None:
                    if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number) or number < 0:
                        raise ValueError("Invalid media dimensions or duration")
                    metadata[-1][target] = number
            media_bytes.append(value)
        extra = [entry.filename for entry in archive.infolist() if not entry.is_dir() and entry.filename not in consumed]
        if extra:
            raise ValueError("Unreferenced packaged media; inspect the v1 export before converting")
    report += [f"Converted {len(contents)} library items and {len(metadata)} media files.",
               f"Deleted records retained in original JSON only: {deleted} content items and {deleted_media} media records. Deleted media bytes are not copied; keep the original .splibrary.",
               "Generated deterministic page IDs only where the v1 reusable slide export omits IDs."]
    payload = dict(content=contents, services=[], settings=[], media=metadata, provenance=[dict(
        id=generated(source_hash, "provenance"), createdAt=stamp, sourceName=source.name,
        sourceHash=source_hash, report=report, originalJson=original)])
    write_backup(payload, media_bytes, destination,
                 lambda: verify_unchanged(source, source_hash))
    return report


def verify_unchanged(source, expected):
    if source.stat().st_size > 256 * MB or digest(source.read_bytes()) != expected:
        raise ValueError("Source changed during conversion; no output written")


def write_backup(payload, media_bytes, destination, verify_source, version=3):
    contents, metadata = payload["content"], payload["media"]
    if len(media_bytes) > 9998:
        raise ValueError("Converted archive exceeds the 10000-entry v2 limit")
    stamp = payload["provenance"][0]["createdAt"]
    data = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode()
    if len(data) > 16 * MB or len(data) + sum(map(len, media_bytes)) > 255 * MB:
        raise ValueError("Converted backup exceeds v2 limits")
    files = {"data.json": digest(data)}
    files.update({f"media/{i}.bin": digest(value) for i, value in enumerate(media_bytes)})
    manifest = dict(format="sanctuary-presenter-backup", version=version, exportedAt=stamp,
                    counts=dict(content=len(contents), services=len(payload["services"]), media=len(metadata)), files=files)
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("data.json", data)
        archive.writestr("manifest.json", json.dumps(manifest))
        for i, value in enumerate(media_bytes):
            archive.writestr(f"media/{i}.bin", value)
    if len(output.getbuffer()) > 256 * MB:
        raise ValueError("Converted ZIP exceeds 256 MB")
    verify_source()
    # Exclusive create: never overwrite source, an existing backup, or a symlink.
    with destination.open("xb") as stream:
        stream.write(output.getvalue())



def main():
    parser = argparse.ArgumentParser(description=__doc__)
    inputs = parser.add_mutually_exclusive_group()
    inputs.add_argument("--library", type=Path)
    inputs.add_argument("--database", type=Path)
    parser.add_argument("--service", action="append", type=Path, default=[])
    parser.add_argument("--profile", choices=["Projector", "LED wall", "Livestream"], default="Projector")
    parser.add_argument("--media-root", type=Path)
    parser.add_argument("--path-map", action="append", default=[])
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        if args.service:
            from service_v1 import convert_services
            report = convert_services(args.service, args.output, args.media_root, args.path_map, args.profile, args.library, args.database)
        elif args.database:
            from sqlite_v1 import convert_database
            report = convert_database(args.database, args.output, args.media_root, args.path_map)
        else:
            if not args.library:
                raise ValueError("Supply --library, --database or at least one --service")
            if args.media_root or args.path_map:
                raise ValueError("Media path options apply only to --database or --service")
            report = convert(args.library, args.output)
        for line in report:
            print(line)
        print(f"Created {args.output}. Restore through v2 Library & planner after exporting your current backup.")
    except (ValueError, OSError, KeyError, TypeError, RecursionError, zipfile.BadZipFile, sqlite3.Error) as error:
        parser.exit(1, f"Conversion refused: {error}\n")


if __name__ == "__main__":
    main()
