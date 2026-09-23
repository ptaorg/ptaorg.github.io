#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent

def ffprobe(path: Path) -> dict:
    p = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries",
            "format=duration,size:stream=codec_name,width,height,r_frame_rate",
            "-of", "json", str(path)
        ],
        capture_output=True, text=True, check=True
    )
    return json.loads(p.stdout)

def validate(video: Path, job: dict, probe: dict) -> list[str]:
    errors = []
    if not video.exists():
        errors.append("video file does not exist")

    streams = probe.get("streams", [])
    v = next((s for s in streams if "width" in s and "height" in s), None)
    codecs = [s.get("codec_name") for s in streams]

    if not v:
        errors.append("video stream not found")
    else:
        if int(v["height"]) <= int(v["width"]):
            errors.append("video is not vertical")

    duration = float(probe.get("format", {}).get("duration", 0) or 0)
    if duration <= 0:
        errors.append("invalid duration")
    if duration > 180:
        errors.append("duration exceeds 180 seconds")

    if "h264" not in codecs:
        errors.append("H.264 video stream not found")
    if "aac" not in codecs:
        errors.append("AAC audio stream not found")

    required = ["job_id", "title", "description", "visibility", "made_for_kids"]
    for key in required:
        if key not in job:
            errors.append(f"job.json missing: {key}")

    if job.get("visibility") not in {"public", "unlisted", "private"}:
        errors.append("visibility must be public, unlisted, or private")

    return errors

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--job", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    video = Path(args.video).resolve()
    job_path = Path(args.job).resolve()
    out = Path(args.out).resolve()

    job = json.loads(job_path.read_text(encoding="utf-8"))
    probe = ffprobe(video)
    errors = validate(video, job, probe)
    if errors:
        raise SystemExit("Validation failed:\n- " + "\n- ".join(errors))

    digest = hashlib.sha256(video.read_bytes()).hexdigest()
    checks = {
        "sha256": digest,
        "ffprobe": probe,
        "validation": "passed"
    }

    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        shutil.copy2(video, d / "video.mp4")
        (d / "job.json").write_text(
            json.dumps(job, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        shutil.copy2(HERE / "WORK_UPLOAD.md", d / "WORK_UPLOAD.md")
        shutil.copy2(HERE / "WORK_PROMPT.txt", d / "WORK_PROMPT.txt")
        (d / "checks.json").write_text(
            json.dumps(checks, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        out.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as z:
            for name in [
                "video.mp4", "job.json", "WORK_UPLOAD.md",
                "WORK_PROMPT.txt", "checks.json"
            ]:
                z.write(d / name, arcname=name)

    print(out)
    print(f"sha256={digest}")

if __name__ == "__main__":
    main()
