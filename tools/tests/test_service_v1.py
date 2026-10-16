import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from service_v1 import convert_services
from test_convert_v1 import PNG, write_fixture
from test_sqlite_v1 import write_database


def fixture():
    return dict(id="service-1", schema_version=9, title="Saved v1 service", service_date="2026-10-16",
        background_type="theme", background_color="#16312a", typography_mode="custom", font_size=72,
        items=[dict(id="section-1", title="PRIVATE SECTION", item_type="section", slides=[], notes="Private section note"),
               dict(id="song-item", title="PRIVATE ITEM TITLE", item_type="song", notes="PRIVATE OPERATOR NOTES",
                    metadata=dict(source_song_id="song-1", source_signature="unverified", rehearsal_status="ready"),
                    slides=[dict(text="Service-only edited verse", secondary_text="保存的服务歌词", label="V1", language_mode="both"),
                            dict(text="Do not project primary", secondary_text="只显示第二语言", label="C", language_mode="secondary"),
                            dict(text="Fallback primary", secondary_text="", label="C", language_mode="secondary")])])


def write_service(path, raw=None, packaged=False):
    raw = copy.deepcopy(raw if raw is not None else fixture())
    image = dict(text="HIDDEN MEDIA TEXT", secondary_text="HIDDEN SECONDARY", content_type="image", media_path="media/pixel.png")
    raw["items"].append(dict(id="image-item", title="PRIVATE IMAGE TITLE", item_type="media", slides=[image]))
    if packaged:
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("service.json", json.dumps(raw, ensure_ascii=False))
            archive.writestr("manifest.json", json.dumps(dict(application="Sanctuary Presenter", schema_version=9,
                media=[dict(source="/never/opened/pixel.png", package_path="media/pixel.png", status="copied")])) )
            archive.writestr("media/pixel.png", PNG)
    else:
        media = path.parent / "media"
        media.mkdir(exist_ok=True)
        (media / "pixel.png").write_bytes(PNG)
        path.write_text(json.dumps(raw, ensure_ascii=False), encoding="utf-8")
    return raw


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.output = self.root / "service.spservice", self.root / "converted.zip"

    def read(self):
        with zipfile.ZipFile(self.output) as archive:
            return json.loads(archive.read("data.json"))

    def refused(self, raw, pattern):
        write_service(self.source, raw, packaged=True)
        before = self.source.read_bytes()
        with self.assertRaisesRegex(ValueError, pattern):
            convert_services([self.source], self.output)
        self.assertEqual(before, self.source.read_bytes())
        self.assertFalse(self.output.exists())

    def test_package_snapshots_languages_sections_notes_source_hash(self):
        original = write_service(self.source, packaged=True)
        before = self.source.read_bytes()
        convert_services([self.source], self.output)
        self.assertEqual(before, self.source.read_bytes())
        data = self.read(); order = data["services"][0]
        self.assertEqual(len(data["media"]), 1)
        self.assertEqual(order["id"], "service-1")
        self.assertEqual(order["items"][0]["nonPresenting"], True)
        item = order["items"][1]
        self.assertEqual(item["sourceId"], "song-1")
        self.assertEqual(item["notes"], "PRIVATE OPERATOR NOTES")
        self.assertEqual(item["snapshot"]["pages"][0]["text"], "Service-only edited verse")
        self.assertEqual(item["snapshot"]["pages"][1]["languageMode"], "secondary")
        self.assertEqual(item["snapshot"]["pages"][0]["title"], "")
        self.assertEqual(item["snapshot"]["pages"][0]["backgroundDesign"]["color"], "#16312a")
        self.assertEqual(data["services"][0]["items"][2]["snapshot"]["pages"][0]["text"], "")
        self.assertEqual(json.loads(data["provenance"][0]["originalJson"])["service"], original)
        self.assertEqual(data["provenance"][0]["sourceHash"], hashlib.sha256(before).hexdigest())
        with zipfile.ZipFile(self.output) as archive:
            manifest = json.loads(archive.read("manifest.json"))
            self.assertEqual(manifest["version"], 4)
            self.assertEqual(manifest["counts"], dict(content=0, services=1, media=1))
        again = self.root / "again.zip"; convert_services([self.source], again)
        with zipfile.ZipFile(again) as archive:
            self.assertEqual(json.loads(archive.read("data.json"))["services"][0]["items"][1]["snapshot"]["pages"][0]["id"], item["snapshot"]["pages"][0]["id"])

    def test_combines_library_and_service_media_without_regenerating_service(self):
        library = self.root / "library.splibrary"; write_fixture(library)
        write_service(self.source, packaged=True)
        convert_services([self.source], self.output, library=library)
        data = self.read()
        self.assertEqual(len(data["content"]), 2)
        self.assertEqual(len(data["services"]), 1)
        self.assertEqual(len(data["media"]), 1)
        self.assertEqual(len(data["provenance"]), 2)
        self.assertEqual(data["services"][0]["items"][1]["snapshot"]["pages"][0]["text"], "Service-only edited verse")
        self.assertNotEqual(data["content"][0]["sections"][0]["pages"][0]["text"], "Service-only edited verse")

    def test_combines_sqlite_and_service(self):
        database = self.root / "library.db"; media = self.root / "media"
        write_database(database, media)
        write_service(self.source, packaged=True)
        convert_services([self.source], self.output, database=database, media_root=media)
        self.assertEqual(len(self.read()["provenance"]), 2)
        self.assertEqual(len(self.read()["media"]), 1)

    def test_plain_json_needs_explicit_media_root(self):
        source = self.root / "service.json"; write_service(source)
        with self.assertRaisesRegex(ValueError, "explicit"):
            convert_services([source], self.output)
        self.assertFalse(self.output.exists())
        convert_services([source], self.output, media_root=self.root)
        self.assertEqual(len(self.read()["services"]), 1)

    def test_multiple_services(self):
        write_service(self.source, packaged=True)
        second = self.root / "second.spservice"
        raw = fixture(); raw["id"] = "service-2"
        write_service(second, raw, packaged=True)
        convert_services([self.source, second], self.output)
        self.assertEqual(len(self.read()["services"]), 2)
        self.assertEqual(len(self.read()["media"]), 1)

    def test_duplicate_service_ids(self):
        write_service(self.source, packaged=True)
        second = self.root / "duplicate.spservice"; second.write_bytes(self.source.read_bytes())
        with self.assertRaisesRegex(ValueError, "Duplicate service"):
            convert_services([self.source, second], self.output)
        self.assertFalse(self.output.exists())

    def test_typography_whole_scope_zero_uses_profile(self):
        raw = fixture(); raw["items"][1].update(typography_mode="custom", font_size=0, text_color="#ff0000")
        raw["items"][1]["slides"][1].update(typography_mode="custom", font_size=82, minimum_font_size=40, text_color="#00ff00")
        write_service(self.source, raw, packaged=True)
        convert_services([self.source], self.output, profile_name="LED wall")
        pages = self.read()["services"][0]["items"][1]["snapshot"]["pages"]
        self.assertEqual(pages[0]["style"]["fontSize"], 77.76)
        self.assertEqual(pages[0]["style"]["color"], "#ff0000")
        self.assertEqual(pages[1]["style"]["fontSize"], 82)
        self.assertEqual(pages[1]["style"]["color"], "#00ff00")

    def test_video_background_packaging_inheritance(self):
        raw = fixture(); raw.update(background_type="video", background_path="media/test.webm")
        raw["items"][1]["slides"][1].update(background_type="theme", background_color="#123456")
        write_service(self.source, raw, packaged=True)
        with zipfile.ZipFile(self.source, "r") as archive:
            entries = {name: archive.read(name) for name in archive.namelist()}
        manifest = json.loads(entries["manifest.json"])
        manifest["media"].append(dict(package_path="media/test.webm", status="copied"))
        entries["manifest.json"] = json.dumps(manifest).encode()
        entries["media/test.webm"] = b"Synthetic metadata test only, not a playable codec fixture"
        with zipfile.ZipFile(self.source, "w") as archive:
            for name, value in entries.items(): archive.writestr(name, value)
        convert_services([self.source], self.output)
        pages = self.read()["services"][0]["items"][1]["snapshot"]["pages"]
        self.assertEqual(pages[0]["backgroundDesign"]["mode"], "video")
        self.assertEqual(pages[1]["backgroundDesign"]["mode"], "color")
        self.assertEqual(pages[1]["backgroundDesign"]["color"], "#123456")
        self.assertEqual(pages[0]["backgroundDesign"]["mediaId"], pages[2]["backgroundDesign"]["mediaId"])

    def test_unknown_schema(self):
        raw = fixture(); raw["schema_version"] = 10
        self.refused(raw, "schema 9")

    def test_invalid_language(self):
        raw = fixture(); raw["items"][1]["slides"][0]["language_mode"] = "unknown"
        self.refused(raw, "language")

    def test_duplicate_item_id(self):
        raw = fixture(); raw["items"][1]["id"] = "section-1"
        self.refused(raw, "Duplicate service item")

    def test_empty_presenting_item(self):
        raw = fixture(); raw["items"][1]["slides"] = []
        self.refused(raw, "no slides")

    def test_section_with_slides(self):
        raw = fixture(); raw["items"][0]["slides"] = [dict(text="unexpected")]
        self.refused(raw, "section unexpectedly")

    def test_bad_style(self):
        raw = fixture(); raw["font_size"] = 5
        self.refused(raw, "supported minimum")

    def test_unsafe_font(self):
        raw = fixture(); raw["font_family"] = "bad; font"
        self.refused(raw, "font family")

    def test_unknown_theme(self):
        raw = fixture(); raw["items"][1]["slides"][0]["theme"] = "unknown"
        self.refused(raw, "Unknown v1 theme")

    def test_missing_package_asset(self):
        raw = fixture(); raw.update(background_type="video", background_path="media/missing.webm")
        self.refused(raw, "missing from")

    def test_zip_traversal(self):
        write_service(self.source, packaged=True)
        with zipfile.ZipFile(self.source, "a") as archive:
            archive.writestr("media/../escape", "x")
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            convert_services([self.source], self.output)
        self.assertFalse(self.output.exists())

    def test_manifest_missing_status(self):
        write_service(self.source, packaged=True)
        with zipfile.ZipFile(self.source) as archive:
            entries = {name: archive.read(name) for name in archive.namelist()}
        manifest = json.loads(entries["manifest.json"])
        manifest["media"][0]["status"] = "missing"
        entries["manifest.json"] = json.dumps(manifest).encode()
        with zipfile.ZipFile(self.source, "w") as archive:
            for name, value in entries.items(): archive.writestr(name, value)
        with self.assertRaisesRegex(ValueError, "missing media"):
            convert_services([self.source], self.output)
        self.assertFalse(self.output.exists())

    def test_duplicate_package_members(self):
        import warnings
        write_service(self.source, packaged=True)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with zipfile.ZipFile(self.source, "a") as archive: archive.writestr("service.json", "{}")
        with self.assertRaisesRegex(ValueError, "Duplicate service ZIP"):
            convert_services([self.source], self.output)
        self.assertFalse(self.output.exists())

    def test_existing_destination(self):
        write_service(self.source, packaged=True)
        self.output.write_bytes(b"existing")
        with self.assertRaisesRegex(ValueError, "already exists"):
            convert_services([self.source], self.output)
        self.assertEqual(self.output.read_bytes(), b"existing")

    def test_source_changed_before_write(self):
        import service_v1
        original_write = service_v1.write_backup
        write_service(self.source, packaged=True)
        def changed(*args):
            with self.source.open("ab") as stream: stream.write(b"changed")
            original_write(*args)
        with patch("service_v1.write_backup", side_effect=changed):
            with self.assertRaisesRegex(ValueError, "Source changed"):
                convert_services([self.source], self.output)
        self.assertFalse(self.output.exists())


if __name__ == "__main__": unittest.main()
