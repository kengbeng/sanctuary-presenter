"""Read a private copy of a schema-15 database; never open the source in SQLite."""
import base64
from collections import defaultdict
from contextlib import closing
from datetime import datetime, timezone
import json
import math
from pathlib import Path, PurePosixPath
import re
import sqlite3
import tempfile

from convert_v1 import MB, MIMES, content, digest, generated, identity, text, unique, verify_unchanged, write_backup

REQUIRED = {
    "songs": "id title author copyright ccli_number song_no tags primary_language secondary_language rights_status copyright_year publisher licence_note reporting_enabled created_at updated_at deleted_at",
    "song_sections": "id song_id position label",
    "song_slides": "id section_id position primary_text secondary_text",
    "arrangements": "id song_id name position is_default auto_generated",
    "arrangement_entries": "id arrangement_id section_id position",
    "prayers": "id title tags primary_language secondary_language created_at updated_at deleted_at",
    "prayer_slides": "id prayer_id position primary_text secondary_text",
    "media_assets": "id title path media_type tags added_at sha256 file_size mime_type width height duration_seconds modified_at last_verified_at status deleted_at storage_mode original_path",
    "song_usage": "id usage_key service_id song_id song_title author copyright ccli_number arrangement_name service_date service_title used_at",
    "service_catalog": "id path_key file_path title service_date church_name content_hash schema_version item_count is_missing created_at last_opened_at last_saved_at",
    "library_settings": "key value updated_at",
    "schema_migrations": "version migration_name applied_at",
    "app_seed_catalog": "seed_key installed_at",
}


def no_sidecars(source):
    for suffix in ("-wal", "-journal"):
        path = Path(str(source) + suffix)
        if path.exists() and path.stat().st_size:
            raise ValueError("Database has a WAL/journal sidecar. Use a closed, consistent v1 database backup.")


def json_value(value):
    if isinstance(value, bytes):
        return {"$sqlite_blob_base64": base64.b64encode(value).decode("ascii")}
    return value


def snapshot(source_bytes):
    with tempfile.TemporaryDirectory(prefix="sanctuary-sqlite-") as folder:
        copied = Path(folder) / "snapshot.db"
        copied.write_bytes(source_bytes)
        with closing(sqlite3.connect(copied.as_uri() + "?mode=ro&immutable=1", uri=True)) as db:
            db.row_factory = sqlite3.Row
            db.execute("PRAGMA trusted_schema=OFF")
            db.execute("PRAGMA query_only=ON")
            db.execute("PRAGMA foreign_keys=ON")
            db.setlimit(sqlite3.SQLITE_LIMIT_LENGTH, 16 * MB)
            operations = 0
            def progress():
                nonlocal operations
                operations += 1
                return operations > 20000
            db.set_progress_handler(progress, 1000)
            schema = [dict(row) for row in db.execute("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name")]
            tables = {row["name"] for row in schema if row["type"] == "table"}
            if set(REQUIRED) - tables:
                raise ValueError("Missing schema-15 tables: " + ", ".join(sorted(set(REQUIRED) - tables)))
            if tables - set(REQUIRED) - {"sqlite_sequence"}:
                raise ValueError("Unknown database tables; inspect schema before conversion")
            if any(row["type"] == "table" and re.search(r"\bVIRTUAL\s+TABLE\b", row["sql"] or "", re.I) for row in schema):
                raise ValueError("Virtual tables are unsupported")
            version = db.execute("PRAGMA user_version").fetchone()[0]
            for table, expected in REQUIRED.items():
                columns = {row["name"] for row in db.execute(f'PRAGMA table_info("{table}")')}
                if set(expected.split()) - columns:
                    raise ValueError("Missing required columns in " + table)
            recorded = db.execute("SELECT max(version) FROM schema_migrations").fetchone()[0]
            if version != 15 or recorded != 15:
                raise ValueError("Only SQLite schema 15 with matching migration history is supported")
            if [row[0] for row in db.execute("PRAGMA quick_check")] != ["ok"]:
                raise ValueError("Database integrity check failed")
            if db.execute("PRAGMA foreign_key_check").fetchone():
                raise ValueError("Database foreign-key violation")
            result, size, count = {}, 0, 0
            for table in sorted(tables):
                result[table] = []
                for row in db.execute(f'SELECT * FROM "{table}"'):
                    entry = {key: json_value(value) for key, value in dict(row).items()}
                    size += len(json.dumps(entry, ensure_ascii=False, allow_nan=False).encode())
                    count += 1
                    if size > 16 * MB or count > 100000:
                        raise ValueError("Database structured data exceeds conversion limits")
                    result[table].append(entry)
            return dict(format="sanctuary-presenter-sqlite-snapshot", database_schema=version, schema=schema, tables=result)


def index_children(tables, table, owner, parents):
    grouped = defaultdict(list)
    positions = set()
    for row in tables[table]:
        position = row["position"]
        if row[owner] not in parents or type(position) is not int or position < 0:
            raise ValueError("Invalid owner or position in " + table)
        key = (row[owner], position)
        if key in positions:
            raise ValueError("Duplicate position in " + table)
        positions.add(key)
        grouped[row[owner]].append(row)
    for items in grouped.values():
        items.sort(key=lambda row: row["position"])
    return grouped


def map_content(tables, stamp):
    ids = {}
    for table in ("songs", "song_sections", "song_slides", "arrangements", "arrangement_entries", "prayers"):
        unique([identity(row) for row in tables[table]], table + " identifiers")
        ids[table] = {row["id"]: row for row in tables[table]}
    sections = index_children(tables, "song_sections", "song_id", ids["songs"])
    slides = index_children(tables, "song_slides", "section_id", ids["song_sections"])
    arrangements = index_children(tables, "arrangements", "song_id", ids["songs"])
    entries = index_children(tables, "arrangement_entries", "arrangement_id", ids["arrangements"])
    prayers = index_children(tables, "prayer_slides", "prayer_id", ids["prayers"])
    for entry in tables["arrangement_entries"]:
        section = ids["song_sections"].get(entry["section_id"])
        if not section or section["song_id"] != ids["arrangements"][entry["arrangement_id"]]["song_id"]:
            raise ValueError("Arrangement references a section owned by another song")
    result = []
    for row in tables["songs"]:
        if row["deleted_at"]:
            continue
        raw = dict(row, sections=[], arrangements=[])
        for section in sections[row["id"]]:
            raw["sections"].append(dict(section, slides=slides[section["id"]]))
        for arrangement in arrangements[row["id"]]:
            sequence = [ids["song_sections"][entry["section_id"]]["label"] for entry in entries[arrangement["id"]]]
            raw["arrangements"].append(dict(arrangement, sequence=sequence))
        result.append(content(raw, "song", stamp))
    for row in tables["prayers"]:
        if row["deleted_at"]:
            continue
        pages = []
        for slide in prayers[row["id"]]:
            if type(slide["id"]) is not int or slide["id"] <= 0:
                raise ValueError("Invalid legacy prayer slide ID")
            pages.append(dict(slide, id=generated("prayer-slide", row["id"], slide["id"])))
        result.append(content(dict(row, slides=pages), "slides", stamp))
    unique([row["id"] for row in result], "library identifiers")
    return result


def normalized(path):
    value = str(path).replace("\\", "/")
    if not value or "\x00" in value or any(part in (".", "..") for part in value.split("/")):
        raise ValueError("Unsafe stored media path")
    return value.rstrip("/")


class MediaResolver:
    def __init__(self, root=None, path_maps=()):
        self.root = Path(root).resolve(strict=True) if root is not None else None
        self.maps = []
        for mapping in path_maps:
            old, separator, new = mapping.partition("=")
            if not separator or not new:
                raise ValueError("Path maps use OLD_PREFIX=NEW_DIRECTORY")
            self.maps.append((normalized(old), Path(new).resolve(strict=True)))
        unique([old for old, _ in self.maps], "path-map prefixes")
        if any(not directory.is_dir() for directory in [*([self.root] if self.root else []), *[new for _, new in self.maps]]):
            raise ValueError("Media roots must be directories")
        self.maps.sort(key=lambda entry: len(entry[0]), reverse=True)

    def resolve(self, stored):
        value = normalized(stored)
        for old, root in self.maps:
            if value.startswith(old + "/"):
                candidate = root / value[len(old) + 1:]
                break
        else:
            if self.root is None:
                raise ValueError("Media needs an explicit --media-root or --path-map")
            root = self.root
            if re.match(r"^[a-zA-Z]:", value):
                raise ValueError("Windows media paths require --path-map")
            candidate = Path(value) if value.startswith("/") else root / value
        actual = candidate.resolve(strict=True)
        if not actual.is_relative_to(root) or not actual.is_file():
            raise ValueError("Media path escapes the authorized root or is not a file")
        return actual


def read_media(path):
    with path.open("rb") as stream:
        value = stream.read(200 * MB + 1)
    if not value or len(value) > 200 * MB:
        raise ValueError("Media is empty or exceeds 200 MB")
    return value


def convert_database(source, destination, media_root=None, path_maps=()):
    source, destination = Path(source), Path(destination)
    if destination.exists():
        raise ValueError("Output already exists; choose a new filename")
    no_sidecars(source)
    if source.stat().st_size > 256 * MB:
        raise ValueError("Database exceeds 256 MB")
    source_bytes = source.read_bytes()
    source_hash = digest(source_bytes)
    original = snapshot(source_bytes)
    tables = original["tables"]
    stamp = datetime.now(timezone.utc).isoformat()
    contents = map_content(tables, stamp)
    resolver = MediaResolver(media_root, path_maps)
    metadata, media_bytes, checks = [], [], []
    unique([identity(row) for row in tables["media_assets"]], "media identifiers")
    for row in tables["media_assets"]:
        if row["deleted_at"]:
            continue
        path = resolver.resolve(text(row, "path"))
        mime = MIMES.get(path.suffix.lower())
        if not mime or row["media_type"] != mime.split("/")[0]:
            raise ValueError("Unsupported media format or inconsistent media type")
        value = read_media(path)
        hashed = digest(value)
        if text(row, "sha256") and row["sha256"].lower() != hashed:
            raise ValueError("Media checksum changed")
        if row["file_size"] is not None and row["file_size"] != len(value):
            raise ValueError("Media file size changed")
        record = dict(id=row["id"], title=text(row, "title"), kind=row["media_type"], mimeType=mime,
                      hash=hashed, size=len(value), createdAt=text(row, "added_at"))
        for target, key in [("width", "width"), ("height", "height"), ("duration", "duration_seconds")]:
            number = row[key]
            if number is not None:
                if type(number) not in (int, float) or not math.isfinite(number) or number < 0:
                    raise ValueError("Invalid media dimensions or duration")
                record[target] = number
        metadata.append(record)
        media_bytes.append(value)
        checks.append((path, hashed))
        if sum(map(len, media_bytes)) > 255 * MB:
            raise ValueError("Combined media exceeds backup limit")
    report = [f"Converted SQLite schema 15: {len(contents)} active library items and {len(metadata)} media files.",
              "All database table rows and SQL schema definitions retained as inert JSON; BLOBs use tagged base64.",
              "Usage history, deleted records, service catalogue and library settings are archive-only; they are not active v2 features.",
              "Service catalogue paths are an index, not service contents. Service files were not opened or converted.",
              "Deleted media bytes are not copied. Retain the original database, service files and media folders.",
              "Text and arrangements require review; typography, codecs and offline output need target-browser rehearsal."]
    report += [f"Source rows: {table} = {len(tables[table])}" for table in sorted(tables)]
    original["media_resolution"] = [dict(mediaId=row["id"], resolvedPath=str(path), sha256=hashed)
        for row, (path, hashed) in zip(metadata, checks)]
    payload = dict(content=contents, services=[], settings=[], media=metadata, provenance=[dict(
        id=generated(source_hash, "sqlite-provenance"), createdAt=stamp, sourceName=source.name,
        sourceHash=source_hash, report=report, originalJson=json.dumps(original, ensure_ascii=False, allow_nan=False))])
    def verify():
        no_sidecars(source)
        verify_unchanged(source, source_hash)
        for path, expected in checks:
            if digest(read_media(path)) != expected:
                raise ValueError("Media changed during conversion; no output written")
    write_backup(payload, media_bytes, destination, verify)
    return report
