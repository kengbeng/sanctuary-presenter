import base64
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from convert_v1 import convert

# Synthetic public-domain test text; no private library content.
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC')


def fixture():
    slide = dict(primary_text="Primary\nHard break", secondary_text="测试\n第二行")
    song = dict(id="song-1", title="Synthetic song", song_no="H-007", sections=[
        dict(id="section-v", label="V1", slides=[dict(id="page-v", **slide)]),
        dict(id="section-c", label="C", slides=[dict(id="page-c", primary_text="Refrain", secondary_text="副歌")])],
        arrangements=[dict(id="arrangement-1", name="Repeated", sequence=["V1", "C", "C"], is_default=True, auto_generated=False)])
    reusable = dict(id="slides-1", title="Synthetic slides", slides=[slide], source_origin="legacy_prayer")
    return dict(format="sanctuary-presenter-library", format_version=1, database_schema=15,
        songs=[song], slides=[reusable], prayers=[copy.deepcopy(reusable)], media=[dict(id="media-1", title="Test pixel", media_type="image", archive_member="media/media-1.png", sha256=hashlib.sha256(PNG).hexdigest())])


def write_fixture(path, raw=None, extras=None):
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("library.json", json.dumps(raw if raw is not None else fixture(), ensure_ascii=False))
        archive.writestr("media/media-1.png", PNG)
        for name, value in (extras or {}).items():
            archive.writestr(name, value)


class ConversionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "synthetic.splibrary"
        self.output = self.root / "converted.zip"

    def refused(self, raw=None, extras=None, pattern=""):
        write_fixture(self.source, raw, extras)
        before = self.source.read_bytes()
        with self.assertRaisesRegex(ValueError, pattern):
            convert(self.source, self.output)
        self.assertFalse(self.output.exists())
        self.assertEqual(self.source.read_bytes(), before)

    def test_roundtrip_structure_nonmutation_and_provenance(self):
        raw = fixture()
        raw["songs"].append(dict(id="deleted", deleted_at="2026-01-01", title="Archived"))
        write_fixture(self.source, raw)
        before = self.source.read_bytes()
        convert(self.source, self.output)
        self.assertEqual(self.source.read_bytes(), before)
        with zipfile.ZipFile(self.output) as archive:
            data = json.loads(archive.read("data.json"))
            manifest = json.loads(archive.read("manifest.json"))
            for name, checksum in manifest["files"].items():
                self.assertEqual(hashlib.sha256(archive.read(name)).hexdigest(), checksum)
        self.assertEqual(manifest["version"], 3)
        self.assertEqual(manifest["counts"], dict(content=2, services=0, media=1))
        song = data["content"][0]
        self.assertEqual(song["indexNumber"], "H-007")
        self.assertEqual(song["arrangements"][0]["sectionIds"], ["section-v", "section-c", "section-c"])
        self.assertEqual(song["sections"][0]["pages"][0]["secondary"], "测试\n第二行")
        self.assertEqual(json.loads(data["provenance"][0]["originalJson"]), raw)
        self.assertEqual(data["provenance"][0]["sourceHash"], hashlib.sha256(before).hexdigest())
        second = self.root / "second.zip"
        convert(self.source, second)
        with zipfile.ZipFile(second) as archive:
            again = json.loads(archive.read("data.json"))
        self.assertEqual(data["content"][1]["pages"][0]["id"], again["content"][1]["pages"][0]["id"])
        with self.assertRaisesRegex(ValueError, "already exists"):
            convert(self.source, self.output)

    def test_unknown_schema(self):
        raw = fixture(); raw["database_schema"] = 16
        self.refused(raw, pattern="schema 15")

    def test_missing_media(self):
        raw = fixture(); raw["media"][0]["archive_member"] = ""
        self.refused(raw, pattern="missing")

    def test_changed_hash(self):
        raw = fixture(); raw["media"][0]["sha256"] = "0" * 64
        self.refused(raw, pattern="checksum")

    def test_ambiguous_labels(self):
        raw = fixture(); raw["songs"][0]["sections"][1]["label"] = "v1"
        self.refused(raw, pattern="Duplicate section")

    def test_missing_section_reference(self):
        raw = fixture(); raw["songs"][0]["arrangements"][0]["sequence"] = ["missing"]
        self.refused(raw, pattern="reference")

    def test_duplicate_entities(self):
        raw = fixture(); raw["songs"].append(copy.deepcopy(raw["songs"][0]))
        self.refused(raw, pattern="Duplicate library")

    def test_traversal(self):
        self.refused(extras={"media/../escape": b"x"}, pattern="Unsafe")

    def test_duplicate_zip_members(self):
        import warnings
        write_fixture(self.source)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with zipfile.ZipFile(self.source, "a") as archive:
                archive.writestr("library.json", "{}")
        with self.assertRaisesRegex(ValueError, "Duplicate ZIP"):
            convert(self.source, self.output)
        self.assertFalse(self.output.exists())

    def test_symlink_entry(self):
        write_fixture(self.source)
        with zipfile.ZipFile(self.source, "a") as archive:
            info = zipfile.ZipInfo("media/link.png")
            info.create_system = 3
            info.external_attr = 0o120777 << 16
            archive.writestr(info, "../../outside")
        with self.assertRaisesRegex(ValueError, "linked"):
            convert(self.source, self.output)
        self.assertFalse(self.output.exists())

    def test_auto_arrangement_disagreement(self):
        raw = fixture(); raw["songs"][0]["arrangements"][0]["auto_generated"] = True
        self.refused(raw, pattern="Auto arrangement")

    def test_nonfinite_json(self):
        raw = fixture(); raw["media"][0]["width"] = float("nan")
        self.refused(raw, pattern="Nonfinite")

    def test_prayers_fallback(self):
        raw = fixture(); del raw["slides"]
        write_fixture(self.source, raw)
        convert(self.source, self.output)
        with zipfile.ZipFile(self.output) as archive:
            self.assertEqual(len(json.loads(archive.read("data.json"))["content"]), 2)


if __name__ == "__main__":
    unittest.main()
