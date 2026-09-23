#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from gtts import gTTS
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
TOPICS = ROOT / "topics.json"
OUTPUT = ROOT / "output"
WORK = ROOT / ".work"
WIDTH, HEIGHT = 1080, 1920
FPS = 30

FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "C:/Windows/Fonts/YuGothB.ttc",
]


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def ffprobe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path)
        ],
        check=True, capture_output=True, text=True
    )
    return max(float(result.stdout.strip()), 0.05)


def find_font() -> str:
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return candidate
    raise FileNotFoundError("Japanese font not found. Install fonts-noto-cjk.")


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for ch in text:
        trial = current + ch
        bbox = draw.textbbox((0, 0), trial, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = ch
    if current:
        lines.append(current)
    return lines


def make_background(title: str, out: Path, font_path: str) -> None:
    img = Image.new("RGB", (WIDTH, HEIGHT), (18, 28, 45))
    draw = ImageDraw.Draw(img)
    title_font = ImageFont.truetype(font_path, 78)
    label_font = ImageFont.truetype(font_path, 38)
    footer_font = ImageFont.truetype(font_path, 44)

    draw.rectangle((0, 0, 26, HEIGHT), fill=(47, 132, 255))
    draw.text((90, 120), "PTA適正化推進委員会", font=label_font, fill=(180, 204, 235))

    y = 270
    for line in wrap_text(draw, title, title_font, 880):
        draw.text((90, y), line, font=title_font, fill=(255, 255, 255))
        y += 112

    draw.line((90, y + 28, 990, y + 28), fill=(79, 101, 132), width=3)
    draw.text((90, 1760), "詳しい資料 → ptaorg.com", font=footer_font, fill=(235, 240, 248))
    img.save(out, quality=95)


def ass_time(seconds: float) -> str:
    cs = int(round(seconds * 100))
    h, rem = divmod(cs, 360000)
    m, rem = divmod(rem, 6000)
    s, cs = divmod(rem, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")


def write_ass(segments: list[tuple[float, float, str]], path: Path, font_name: str = "Noto Sans CJK JP") -> None:
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {WIDTH}
PlayResY: {HEIGHT}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,{font_name},62,&H00FFFFFF,&H000000FF,&H00121C2D,&HAA121C2D,-1,0,0,0,100,100,0,0,1,4,0,2,80,80,250,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    lines = [header]
    for start, end, text in segments:
        lines.append(
            f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{ass_escape(text)}\n"
        )
    path.write_text("".join(lines), encoding="utf-8")


def render_topic(topic: dict) -> Path:
    topic_id = topic["id"]
    title = topic["title"]
    segments_text = topic["segments"]
    if not segments_text:
        raise ValueError(f"{topic_id}: segments is empty")

    font_path = find_font()
    topic_work = WORK / topic_id
    shutil.rmtree(topic_work, ignore_errors=True)
    topic_work.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    background = topic_work / "background.jpg"
    make_background(title, background, font_path)

    audio_files: list[Path] = []
    timed_segments: list[tuple[float, float, str]] = []
    cursor = 0.0

    for i, text in enumerate(segments_text, 1):
        mp3 = topic_work / f"segment-{i:02d}.mp3"
        gTTS(text=text, lang="ja", slow=False).save(str(mp3))
        duration = ffprobe_duration(mp3)
        audio_files.append(mp3)
        timed_segments.append((cursor, cursor + duration, text))
        cursor += duration

    concat_file = topic_work / "concat.txt"
    concat_file.write_text(
        "".join(f"file '{p.name}'\n" for p in audio_files),
        encoding="utf-8"
    )
    narration = topic_work / "narration.m4a"
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_file.name,
        "-c:a", "aac", "-b:a", "160k", narration.name
    ] if Path.cwd() == topic_work else [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_file),
        "-c:a", "aac", "-b:a", "160k", str(narration)
    ])

    subtitles = topic_work / "subtitles.ass"
    write_ass(timed_segments, subtitles)

    output = OUTPUT / f"{topic_id}.mp4"
    ass_filter = f"ass={subtitles.as_posix()}"
    run([
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", str(FPS), "-i", str(background),
        "-i", str(narration),
        "-vf", ass_filter,
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        "-shortest", "-movflags", "+faststart",
        str(output)
    ])

    metadata = {
        "id": topic_id,
        "title": title,
        "source": topic.get("source", ""),
        "duration_seconds": round(ffprobe_duration(output), 2),
        "output": str(output.relative_to(ROOT)),
    }
    (OUTPUT / f"{topic_id}.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    return output


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", default="", help="Generate only this topic id")
    args = parser.parse_args()

    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print("ffmpeg/ffprobe are required.", file=sys.stderr)
        return 2

    topics = json.loads(TOPICS.read_text(encoding="utf-8"))
    selected = [t for t in topics if not args.topic or t["id"] == args.topic]
    if not selected:
        print(f"Topic not found: {args.topic}", file=sys.stderr)
        return 3

    WORK.mkdir(parents=True, exist_ok=True)
    for topic in selected:
        output = render_topic(topic)
        print(f"Generated: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
