#!/usr/bin/env python3
"""Offline municipal PTA evidence utility: safe ZIP inventory, exact PDF/image crops.
No network/Google access, OCR, automatic evidence finding or publication.
All crop coordinates are explicit and must be verified by a reviewer.
"""
import argparse
import hashlib
import json
from pathlib import Path
import stat
import sys
import zipfile

def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as inp:
        for chunk in iter(lambda: inp.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def relative_member(name):
    p = Path(name.replace("\\", "/"))
    if p.is_absolute() or not p.parts or any(x in (".", "..") for x in p.parts):
        raise ValueError("Unsafe ZIP entry path: " + name)
    if ":" in p.parts[0] or "\x00" in name:
        raise ValueError("Invalid ZIP entry name: " + name)
    return p

def extract_zip(source, outdir, max_files=2000, max_unpacked=400_000_000):
    source, outdir = Path(source), Path(outdir)
    if not source.is_file():
        raise FileNotFoundError(source)
    if outdir.exists() and any(outdir.iterdir()):
        raise ValueError("Output folder must be absent or empty (no overwrites)")
    manifest = {
        "input": str(source),
        "zipSha256": digest(source),
        "files": [],
        "note": "Inventory and hashes only. Content, school identity and public suitability unverified."
    }
    # Validate full central directory BEFORE writing any bytes.
    with zipfile.ZipFile(source) as z:
        entries = [m for m in z.infolist() if not m.is_dir()]
        if len(entries) > max_files or sum(m.file_size for m in entries) > max_unpacked:
            raise ValueError("Archive exceeds allowed count/uncompressed byte limits")
        used = set()
        for m in entries:
            p = relative_member(m.filename)
            if str(p).casefold() in used:
                raise ValueError("Duplicate ZIP path: " + m.filename)
            used.add(str(p).casefold())
            if m.flag_bits & 1:
                raise ValueError("Encrypted ZIP entry unsupported: " + m.filename)
            if stat.S_ISLNK((m.external_attr >> 16) & 0xffff):
                raise ValueError("ZIP symbolic link prohibited: " + m.filename)
            if m.file_size > max_unpacked:
                raise ValueError("Oversized ZIP entry: " + m.filename)
        outdir.mkdir(parents=True, exist_ok=True)
        for m in entries:
            rel = relative_member(m.filename)
            target = outdir / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            h = hashlib.sha256()
            size = 0
            with z.open(m) as inp, open(target, "xb") as out:
                while chunk := inp.read(1024 * 1024):
                    size += len(chunk)
                    if size > m.file_size or size > max_unpacked:
                        raise ValueError("ZIP expanded size limit exceeded: " + m.filename)
                    out.write(chunk)
                    h.update(chunk)
            if size != m.file_size:
                raise ValueError("Unpacked byte count differs from ZIP metadata")
            manifest["files"].append({
                "path": str(rel), "bytes": size, "sha256": h.hexdigest(),
                "sourceEntry": m.filename, "contentReviewed": False,
                "schoolId": None
            })
    output = outdir / "inventory.json"
    with open(output, "x", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return output

def crop_file(source, output, page, rect, scale=2):
    source, output = Path(source), Path(output)
    if source.resolve() == output.resolve() or output.exists():
        raise ValueError("Do not overwrite original or existing evidence")
    x0,y0,x1,y1 = rect
    if min(rect) < 0 or x1 <= x0 or y1 <= y0:
        raise ValueError("Invalid [x0,y0,x1,y1]")
    if scale < 1 or scale > 4:
        raise ValueError("Scale must be 1..4")
    if source.suffix.lower() == ".pdf":
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is required for PDF cropping") from exc
        with fitz.open(source) as pdf:
            if page < 1 or page > len(pdf):
                raise ValueError("Page out of bounds (1-based)")
            pg = pdf[page - 1]
            boundary = pg.rect
            r = fitz.Rect(rect)
            if not boundary.contains(r):
                raise ValueError("Crop lies outside PDF page: " + str(boundary))
            pix = pg.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=r, alpha=False)
            if output.suffix.lower() != ".png":
                raise ValueError("PDF crops must use .png")
            output.parent.mkdir(parents=True, exist_ok=True)
            pix.save(str(output))
    else:
        try:
            from PIL import Image
        except ImportError as exc:
            raise RuntimeError("Pillow is required for image cropping") from exc
        if page != 1:
            raise ValueError("Raster images only have page 1")
        with Image.open(source) as im:
            if x1 > im.width or y1 > im.height:
                raise ValueError("Crop lies outside image")
            output.parent.mkdir(parents=True, exist_ok=True)
            im.crop((x0,y0,x1,y1)).save(output)
    record = {
        "sourcePath": str(source), "sourceSha256": digest(source),
        "page": page, "crop": rect, "unit": "PDF points" if source.suffix.lower()==".pdf" else "source pixels",
        "clipPath": str(output), "clipSha256": digest(output),
        "claim": None, "adoption": "held",
        "reviewedAgainstOriginal": False,
        "note": "Crop requires review of surrounding original text; no automatic legal finding."
    }
    manifest = output.with_suffix(output.suffix + ".json")
    with open(manifest, "x", encoding="utf-8") as f:
        json.dump(record, f, ensure_ascii=False, indent=2)
        f.write("\n")
    return manifest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    i = sub.add_parser("ingest", help="Extract ZIP without traversal/overwrite, record hashes")
    i.add_argument("zip")
    i.add_argument("output_dir")
    c = sub.add_parser("crop", help="Cut ONLY exact reviewer-selected passage")
    c.add_argument("source")
    c.add_argument("output")
    c.add_argument("--page", type=int, required=True, help="1-based PDF page")
    c.add_argument("--rect", nargs=4, type=float, required=True, metavar=("X0","Y0","X1","Y1"))
    c.add_argument("--scale", type=float, default=2.0)
    args = parser.parse_args()
    try:
        if args.command == "ingest":
            result = extract_zip(args.zip, args.output_dir)
        else:
            result = crop_file(args.source, args.output, args.page, args.rect, args.scale)
        print(result)
    except Exception as exc:
        print("ERROR:", str(exc), file=sys.stderr)
        sys.exit(2)
if __name__ == "__main__":
    main()
