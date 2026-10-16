import base64
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlite_v1 import REQUIRED, convert_database
from test_convert_v1 import PNG

NUMERIC = {"position", "is_default", "auto_generated", "reporting_enabled", "file_size", "width", "height", "duration_seconds", "schema_version", "item_count", "is_missing", "version"}
NULLABLE = {"deleted_at", "file_size", "width", "height", "duration_seconds", "song_id"}


def write_database(path, media_folder):
    media_folder.mkdir(exist_ok=True)
    pixel = media_folder / "pixel.png"
    pixel.write_bytes(PNG)
    with closing(sqlite3.connect(path)) as db, db:
        for table, columns in REQUIRED.items():
            definitions = []
            for column in columns.split():
                kind = "INTEGER" if column in NUMERIC or (column == "id" and table in ("song_usage", "prayer_slides")) else "TEXT"
                definitions.append(f'"{column}" {kind}')
            db.execute(f'CREATE TABLE "{table}" ({", ".join(definitions)})')
        def add(table, **values):
            row = {}
            for col in REQUIRED[table].split():
                row[col] = values.get(col, None if col in NULLABLE else 0 if col in NUMERIC else "")
            db.execute(f'INSERT INTO "{table}" ({", ".join(row)}) VALUES ({", ".join("?" for _ in row)})', list(row.values()))
        add("schema_migrations", version=15, migration_name="Synthetic current schema", applied_at="2026-10-16")
        db.execute("PRAGMA user_version=15")
        add("songs", id="song-1", title="SQLite synthetic song", song_no="007A", reporting_enabled=1)
        add("songs", id="deleted-song", title="Deleted synthetic song", deleted_at="2026-01-01")
        add("song_sections", id="section-v", song_id="song-1", position=0, label="V1")
        add("song_sections", id="section-c", song_id="song-1", position=1, label="C")
        add("song_slides", id="page-v", section_id="section-v", primary_text="Primary\nLine two", secondary_text="测试\n第二行")
        add("song_slides", id="page-c", section_id="section-c", primary_text="Refrain", secondary_text="副歌")
        add("arrangements", id="arrangement-1", song_id="song-1", name="Repeated", is_default=1, auto_generated=0)
        for i, section in enumerate(["section-v", "section-c", "section-c"]):
            add("arrangement_entries", id=f"entry-{i}", arrangement_id="arrangement-1", section_id=section, position=i)
        add("prayers", id="slides-1", title="SQLite synthetic slides")
        add("prayer_slides", id=42, prayer_id="slides-1", primary_text="Standalone", secondary_text="独立")
        add("song_usage", id=1, usage_key="history", song_id=None, song_title="Historical title", service_title="Historical service")
        add("library_settings", key="synthetic", value="retained value")
        add("service_catalog", id="catalog-1", file_path="/not/opened/service.json", title="Catalogue only")
        add("media_assets", id="media-1", title="SQLite pixel", path=str(pixel), media_type="image", sha256=hashlib.sha256(PNG).hexdigest(), file_size=len(PNG), width=1, height=1, storage_mode="linked")
    return pixel


class SQLiteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.output = self.root / "library.db", self.root / "converted.zip"
        self.media = self.root / "media"
        self.pixel = write_database(self.source, self.media)

    def mutate(self, sql, args=()):
        with closing(sqlite3.connect(self.source)) as db, db:
            db.execute(sql, args)

    def read(self):
        with zipfile.ZipFile(self.output) as archive:
            return json.loads(archive.read("data.json"))

    def refused(self, pattern, **kwargs):
        before = self.source.read_bytes()
        with self.assertRaisesRegex((ValueError, OSError, sqlite3.Error), pattern):
            convert_database(self.source, self.output, **kwargs)
        self.assertFalse(self.output.exists())
        self.assertEqual(before, self.source.read_bytes())

    def test_mapping_and_complete_archive_only_rows(self):
        before, media_before = self.source.read_bytes(), self.pixel.read_bytes()
        convert_database(self.source, self.output, self.media)
        self.assertEqual(self.source.read_bytes(), before)
        self.assertEqual(self.pixel.read_bytes(), media_before)
        data = self.read()
        self.assertEqual(len(data["content"]), 2)
        self.assertEqual(data["content"][0]["indexNumber"], "007A")
        self.assertEqual(data["content"][0]["arrangements"][0]["sectionIds"], ["section-v", "section-c", "section-c"])
        self.assertEqual(data["content"][0]["sections"][0]["pages"][0]["secondary"], "测试\n第二行")
        self.assertEqual(data["services"], [])
        original = json.loads(data["provenance"][0]["originalJson"])
        self.assertEqual(original["tables"]["song_usage"][0]["song_title"], "Historical title")
        self.assertEqual(len(original["tables"]["songs"]), 2)
        self.assertEqual(original["tables"]["library_settings"][0]["value"], "retained value")
        self.assertEqual(len(original["tables"]["service_catalog"]), 1)
        self.assertEqual(data["provenance"][0]["sourceHash"], hashlib.sha256(before).hexdigest())
        self.assertEqual(data["media"][0]["width"], 1)
        self.assertFalse(Path(str(self.source) + "-wal").exists())
        second = self.root / "second.zip"
        convert_database(self.source, second, self.media)
        with zipfile.ZipFile(second) as archive:
            again = json.loads(archive.read("data.json"))
        self.assertEqual(data["content"][1]["pages"][0]["id"], again["content"][1]["pages"][0]["id"])

    def test_explicit_media_authorization_required(self):
        self.refused("explicit")

    def test_windows_mapping(self):
        self.mutate("UPDATE media_assets SET path=?", (r"C:\old\media\pixel.png",))
        convert_database(self.source, self.output, path_maps=["C:/old/media=" + str(self.media)])
        self.assertEqual(len(self.read()["media"]), 1)

    def test_relative_media_root(self):
        self.mutate("UPDATE media_assets SET path='pixel.png'")
        convert_database(self.source, self.output, self.media)
        self.assertEqual(len(self.read()["media"]), 1)

    def test_symlink_escape(self):
        outside = self.root / "outside.png"; outside.write_bytes(PNG)
        self.pixel.unlink(); self.pixel.symlink_to(outside)
        self.refused("escapes", media_root=self.media)

    def test_parent_traversal(self):
        self.mutate("UPDATE media_assets SET path='../outside.png'")
        self.refused("Unsafe", media_root=self.media)

    def test_missing_media(self):
        self.pixel.unlink()
        self.refused("No such file", media_root=self.media)

    def test_changed_media(self):
        self.pixel.write_bytes(b"changed")
        self.refused("checksum", media_root=self.media)

    def test_sidecar(self):
        Path(str(self.source) + "-wal").write_bytes(b"uncheckpointed")
        self.refused("sidecar", media_root=self.media)

    def test_newer_schema(self):
        self.mutate("PRAGMA user_version=16")
        self.refused("schema 15", media_root=self.media)

    def test_missing_schema_column(self):
        self.mutate("ALTER TABLE songs DROP COLUMN song_no")
        self.refused("required columns", media_root=self.media)

    def test_unknown_table(self):
        self.mutate("CREATE TABLE unexpected(data TEXT)")
        self.refused("Unknown database tables", media_root=self.media)

    def test_cross_song_ownership(self):
        self.mutate("UPDATE song_sections SET song_id='deleted-song' WHERE id='section-c'")
        self.refused("another song", media_root=self.media)

    def test_duplicate_position(self):
        self.mutate("UPDATE arrangement_entries SET position=0")
        self.refused("Duplicate position", media_root=self.media)

    def test_invalid_parent(self):
        self.mutate("UPDATE song_slides SET section_id='missing'")
        self.refused("Invalid owner", media_root=self.media)

    def test_blob_preservation(self):
        self.mutate("UPDATE library_settings SET value=?", (sqlite3.Binary(b"\x00\xff"),))
        convert_database(self.source, self.output, self.media)
        raw = json.loads(self.read()["provenance"][0]["originalJson"])
        self.assertEqual(raw["tables"]["library_settings"][0]["value"], {"$sqlite_blob_base64": base64.b64encode(b"\x00\xff").decode()})

    def test_source_changed_before_write(self):
        from sqlite_v1 import write_backup as original_write
        def changed(*args):
            with self.source.open("ab") as stream:
                stream.write(b"change")
            original_write(*args)
        with patch("sqlite_v1.write_backup", side_effect=changed):
            with self.assertRaisesRegex(ValueError, "Source changed"):
                convert_database(self.source, self.output, self.media)
        self.assertFalse(self.output.exists())

    def test_media_changed_before_write(self):
        from sqlite_v1 import write_backup as original_write
        def changed(*args):
            self.pixel.write_bytes(b"new media bytes")
            original_write(*args)
        with patch("sqlite_v1.write_backup", side_effect=changed):
            with self.assertRaisesRegex(ValueError, "Media changed during"):
                convert_database(self.source, self.output, self.media)
        self.assertFalse(self.output.exists())

    def test_migration_history_disagreement(self):
        self.mutate("UPDATE schema_migrations SET version=14")
        self.refused("matching migration history", media_root=self.media)

    def test_readonly_copy_can_read_a_closed_wal_mode_database(self):
        with closing(sqlite3.connect(self.source)) as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        before = self.source.read_bytes()
        convert_database(self.source, self.output, self.media)
        self.assertEqual(self.source.read_bytes(), before)
        self.assertEqual(len(self.read()["content"]), 2)

    def test_existing_output(self):
        self.output.write_bytes(b"existing")
        with self.assertRaisesRegex(ValueError, "already exists"):
            convert_database(self.source, self.output, self.media)
        self.assertEqual(self.output.read_bytes(), b"existing")


if __name__ == "__main__":
    unittest.main()
