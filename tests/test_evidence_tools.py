import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / "ai-system/report-standards/scripts/evidence-tools.py"
spec = importlib.util.spec_from_file_location("pta_evidence", SCRIPT)
evidence = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evidence)

class EvidenceToolTest(unittest.TestCase):
    def test_safe_zip_inventory_and_hash(self):
        with tempfile.TemporaryDirectory() as root:
            base = Path(root)
            source = base/"source.zip"
            with zipfile.ZipFile(source, "w") as z:
                z.writestr("school-a/pta.txt", "PTA entry")
                z.writestr("school-b/pta.txt", "another")
            manifest = evidence.extract_zip(source, base/"unpacked")
            obj = json.loads(manifest.read_text(encoding="utf-8"))
            self.assertEqual(len(obj["files"]),2)
            self.assertFalse(obj["files"][0]["contentReviewed"])
            self.assertIsNone(obj["files"][0]["schoolId"])
            self.assertEqual(obj["files"][0]["sha256"],evidence.digest(base/"unpacked/school-a/pta.txt"))
    def test_reject_zip_path_traversal_before_extracting(self):
        with tempfile.TemporaryDirectory() as root:
            base = Path(root)
            source = base/"malicious.zip"
            with zipfile.ZipFile(source,"w") as z:
                z.writestr("../escape.txt","bad")
            with self.assertRaises(ValueError):
                evidence.extract_zip(source,base/"unpacked")
            self.assertFalse((base/"escape.txt").exists())
    def test_reject_duplicate_zip_paths(self):
        with tempfile.TemporaryDirectory() as root:
            base = Path(root)
            source = base/"duplicate.zip"
            with zipfile.ZipFile(source,"w") as z:
                z.writestr("a.txt","first")
                z.writestr("a.txt","second")
            with self.assertRaises(ValueError):
                evidence.extract_zip(source,base/"unpacked")
    def test_no_overwrite_protection(self):
        with tempfile.TemporaryDirectory() as root:
            base=Path(root)
            source=base/"source.zip"
            with zipfile.ZipFile(source,"w") as z:z.writestr("file.txt","data")
            out=base/"unpacked"
            evidence.extract_zip(source,out)
            with self.assertRaises(ValueError):
                evidence.extract_zip(source,out)
    def test_pdf_crop_with_exact_coordinates_if_available(self):
        try:
            import fitz
        except ImportError:
            self.skipTest("PyMuPDF unavailable on runner")
        with tempfile.TemporaryDirectory() as root:
            base=Path(root)
            doc=fitz.open()
            pg=doc.new_page(width=200,height=200)
            pg.insert_text((20,40),"PTA")
            source=base/"input.pdf"
            doc.save(str(source))
            doc.close()
            manifest=evidence.crop_file(source,base/"out.png",1,[10,10,90,80])
            record=json.loads(manifest.read_text(encoding="utf-8"))
            self.assertEqual(record["page"],1)
            self.assertEqual(record["crop"],[10,10,90,80])
            self.assertFalse(record["reviewedAgainstOriginal"])
            with self.assertRaises(ValueError):
                evidence.crop_file(source,base/"out.png",1,[10,10,90,80])

if __name__=="__main__":
    unittest.main()
