#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from gtts import gTTS

ROOT = Path(__file__).resolve().parent
TOPICS = ROOT / "topics.json"
OUTPUT = ROOT / "output"
WORK = ROOT / ".work"
REMOTION = ROOT / "remotion"
PUBLIC_GENERATED = REMOTION / "public" / "generated"
FPS = 30
VOICEVOX_URL = os.environ.get("VOICEVOX_URL", "http://127.0.0.1:50021").rstrip("/")


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("+", " ".join(str(x) for x in cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def ffprobe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return max(float(result.stdout.strip()), 0.05)


def post_json(url: str, payload: dict | None = None) -> bytes:
    data = b"" if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        return response.read()


def voicevox_available() -> bool:
    try:
        with urllib.request.urlopen(f"{VOICEVOX_URL}/version", timeout=3) as response:
            return response.status == 200
    except Exception:
        return False


def voicevox_credit(speaker_id: int) -> str:
    try:
        with urllib.request.urlopen(f"{VOICEVOX_URL}/speakers", timeout=10) as response:
            speakers = json.loads(response.read().decode("utf-8"))
        for speaker in speakers:
            for style in speaker.get("styles", []):
                if int(style.get("id", -1)) == speaker_id:
                    return f"VOICEVOX:{speaker.get('name', '音声')}"
    except Exception:
        pass
    return "VOICEVOX"


def synthesize_voicevox(text: str, out: Path, speaker: int, speed: float) -> None:
    params = urllib.parse.urlencode({"text": text, "speaker": speaker})
    query_bytes = post_json(f"{VOICEVOX_URL}/audio_query?{params}")
    query = json.loads(query_bytes.decode("utf-8"))
    query["speedScale"] = speed
    query["intonationScale"] = 1.0
    query["volumeScale"] = 1.0
    query["prePhonemeLength"] = 0.08
    query["postPhonemeLength"] = 0.08
    audio = post_json(f"{VOICEVOX_URL}/synthesis?speaker={speaker}", query)
    out.write_bytes(audio)


def synthesize_gtts(text: str, out: Path) -> None:
    gTTS(text=text, lang="ja", slow=False).save(str(out))


def normalize_with_padding(source: Path, out: Path, pad_seconds: float = 0.30) -> None:
    raw_duration = ffprobe_duration(source)
    target = raw_duration + pad_seconds
    run([
        "ffmpeg", "-y", "-i", str(source),
        "-af", f"aresample=48000,apad=pad_dur={pad_seconds}",
        "-t", f"{target:.3f}",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        str(out),
    ])


def write_concat(paths: list[Path], out: Path) -> None:
    lines = []
    for path in paths:
        safe = path.as_posix().replace("'", "'\\''")
        lines.append("file '" + safe + "'\n")
    out.write_text("".join(lines), encoding="utf-8")


def make_previews(video: Path, preview_dir: Path) -> list[str]:
    preview_dir.mkdir(parents=True, exist_ok=True)
    duration = ffprobe_duration(video)
    fractions = [0.06, 0.24, 0.44, 0.64, 0.84]
    names: list[str] = []
    for i, fraction in enumerate(fractions, 1):
        at = max(0.05, min(duration - 0.05, duration * fraction))
        target = preview_dir / f"preview-{i:02d}.jpg"
        run([
            "ffmpeg", "-y", "-ss", f"{at:.3f}", "-i", str(video),
            "-frames:v", "1", "-q:v", "2", str(target)
        ])
        names.append(str(target.relative_to(ROOT)))
    return names


def render_topic(topic: dict, requested_provider: str) -> Path:
    topic_id = topic["id"]
    scenes = topic["scenes"]
    if not scenes:
        raise ValueError(f"{topic_id}: scenes is empty")

    narrator = topic.get("narrator", {})
    speaker = int(narrator.get("speaker", 3))
    speed = float(narrator.get("speed", 1.08))

    provider = requested_provider
    if provider == "auto":
        provider = "voicevox" if voicevox_available() else "gtts"
    if provider == "voicevox" and not voicevox_available():
        raise RuntimeError("VOICEVOX requested but engine is not reachable.")

    topic_work = WORK / topic_id
    shutil.rmtree(topic_work, ignore_errors=True)
    topic_work.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    static_dir = PUBLIC_GENERATED / topic_id
    shutil.rmtree(static_dir, ignore_errors=True)
    static_dir.mkdir(parents=True, exist_ok=True)

    padded_wavs: list[Path] = []
    rendered_scenes: list[dict] = []
    cursor_frames = 0

    for index, scene in enumerate(scenes, 1):
        text = scene["voice"].strip()
        source_audio = topic_work / (f"voice-{index:02d}.wav" if provider == "voicevox" else f"voice-{index:02d}.mp3")
        if provider == "voicevox":
            synthesize_voicevox(text, source_audio, speaker=speaker, speed=speed)
        else:
            synthesize_gtts(text, source_audio)

        padded = topic_work / f"segment-{index:02d}.wav"
        normalize_with_padding(source_audio, padded, pad_seconds=0.30)
        duration = ffprobe_duration(padded)
        duration_frames = max(45, int(math.ceil(duration * FPS)))
        padded_wavs.append(padded)

        rendered = dict(scene)
        rendered["startFrame"] = cursor_frames
        rendered["durationFrames"] = duration_frames
        rendered_scenes.append(rendered)
        cursor_frames += duration_frames

    concat_file = topic_work / "concat.txt"
    write_concat(padded_wavs, concat_file)
    narration = static_dir / "narration.wav"
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1",
        str(narration),
    ])

    total_frames = cursor_frames
    credit = voicevox_credit(speaker) if provider == "voicevox" else ""
    props = {
        "id": topic_id,
        "title": topic["title"],
        "source": topic.get("source", "https://ptaorg.com/"),
        "accent": topic.get("accent", "#4EB5FF"),
        "audioFile": f"generated/{topic_id}/narration.wav",
        "totalFrames": total_frames,
        "scenes": rendered_scenes,
        "voiceCredit": credit,
    }
    props_file = topic_work / "props.json"
    props_file.write_text(json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")

    output = OUTPUT / f"{topic_id}.mp4"
    run([
        "npx", "remotion", "render",
        "src/index.tsx", "PTAShort", str(output.resolve()),
        "--props", str(props_file.resolve()),
        "--duration", str(total_frames),
        "--codec", "h264",
        "--pixel-format", "yuv420p",
        "--crf", "18",
        "--concurrency", "2",
    ], cwd=REMOTION)

    previews = make_previews(output, OUTPUT / f"{topic_id}-previews")
    metadata = {
        "id": topic_id,
        "title": topic["title"],
        "source": topic.get("source", ""),
        "voice_provider": provider,
        "voicevox_speaker": speaker if provider == "voicevox" else None,
        "voice_credit": credit,
        "duration_seconds": round(ffprobe_duration(output), 2),
        "total_frames": total_frames,
        "scene_count": len(scenes),
        "output": str(output.relative_to(ROOT)),
        "previews": previews,
    }
    (OUTPUT / f"{topic_id}.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", default="", help="Generate only this topic id")
    parser.add_argument(
        "--voice-provider",
        choices=["auto", "voicevox", "gtts"],
        default="auto",
        help="Narration engine. auto prefers VOICEVOX when available.",
    )
    args = parser.parse_args()

    for binary in ("ffmpeg", "ffprobe", "node", "npx"):
        if shutil.which(binary) is None:
            print(f"{binary} is required.", file=sys.stderr)
            return 2

    topics = json.loads(TOPICS.read_text(encoding="utf-8"))
    selected = [t for t in topics if not args.topic or t["id"] == args.topic]
    if not selected:
        print(f"Topic not found: {args.topic}", file=sys.stderr)
        return 3

    WORK.mkdir(parents=True, exist_ok=True)
    for topic in selected:
        output = render_topic(topic, args.voice_provider)
        print(f"Generated: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
