#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate static OGP cards for Atsugi school archive pages."""

from __future__ import annotations

import html
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_DIR = ROOT / "archive" / "atsugi"
OGP_DIR = ROOT / "assets" / "ogp" / "atsugi"
SITE = "https://ptaorg.com"

WIDTH = 1200
HEIGHT = 630

NAVY = "#0b2a4a"
NAVY_DARK = "#071a33"
GOLD = "#d6ae2b"
GOLD_LIGHT = "#f4d86b"
TEXT = "#0f2742"
SOFT = "#607184"
LINE = "#dce3ea"
CARD = "#f7f9fb"
WHITE = "#ffffff"

EVAL_STYLES = {
    "重大リスク": ("#e60012", "#ffffff", "#e60012"),
    "問題あり": ("#f97316", "#ffffff", "#f97316"),
    "要確認": ("#facc15", NAVY, "#facc15"),
    "資料不足": ("#fef3c7", "#92400e", "#f59e0b"),
    "適正化モデル": ("#2563eb", "#ffffff", "#2563eb"),
    "未評価": ("#dbeafe", "#1e3a8a", "#93c5fd"),
    "評価準備中": ("#dbeafe", "#1e3a8a", "#93c5fd"),
}

DESCRIPTIONS = {
    "echi-es": "PTAカード提出をもって加入扱いとされる資料を確認。入会申込書は資料上確認できず、任意性に重大な確認事項があります。",
    "atsugi-es": "PTA会員確認カードとみられる資料を確認。入会契約の成立を基礎づける申込・承諾の記録は資料上確認できません。",
    "kamiogino-es": "PTA会員カードに、提出をもってPTA入会・継続とする旨が確認されます。入会申込書との分離確認が必要です。",
    "aikawa-es": "学校説明会の流れでPTA説明・役員決めへ移行した相談記録を確認。任意加入と学校関与に重大な確認事項があります。",
    "aikawa-jhs": "学校連絡手段、口座振替、教職員関与が複合して確認されます。学校とPTAの分離について重大な確認事項があります。",
}

DATA_OVERRIDES = {
    "echi-es": {
        "documentName": "PTAカード（役員希望調査）",
        "applicationStatus": "なし",
        "pdfStatus": "掲載あり",
    },
    "atsugi-es": {
        "documentName": "厚木小学校_06.pdf",
        "applicationStatus": "開示資料上確認できない",
        "pdfStatus": "準備中",
    },
    "kamiogino-es": {
        "documentName": "上荻野小学校_13.pdf",
        "applicationStatus": "開示資料上確認できない",
        "pdfStatus": "準備中",
    },
    "aikawa-es": {
        "documentName": "相川小学校 相談受付記録_01.pdf",
        "applicationStatus": "開示資料上確認できない",
        "pdfStatus": "準備中",
    },
    "aikawa-jhs": {
        "documentName": "相川中学校 会議録_04.pdf",
        "applicationStatus": "開示資料上確認できない",
        "pdfStatus": "準備中",
    },
}


def font_path(*names: str) -> str:
    for name in names:
        path = Path("C:/Windows/Fonts") / name
        if path.exists():
            return str(path)
    for fallback in ("meiryo.ttc", "YuGothM.ttc", "msgothic.ttc"):
        path = Path("C:/Windows/Fonts") / fallback
        if path.exists():
            return str(path)
    raise FileNotFoundError("Japanese font not found")


FONT_REGULAR = font_path("meiryo.ttc", "YuGothM.ttc", "msgothic.ttc")
FONT_BOLD = font_path("meiryob.ttc", "YuGothB.ttc", "meiryo.ttc")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> int:
    return int(draw.textbbox((0, 0), text, font=fnt)[2])


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: int,
    max_lines: int | None = None,
) -> list[str]:
    words: list[str] = []
    current = ""
    for ch in text:
        trial = current + ch
        if current and text_width(draw, trial, fnt) > max_width:
            words.append(current)
            current = ch
        else:
            current = trial
    if current:
        words.append(current)
    if max_lines and len(words) > max_lines:
        clipped = words[:max_lines]
        clipped[-1] = clipped[-1].rstrip("、。 ") + "…"
        while text_width(draw, clipped[-1], fnt) > max_width and len(clipped[-1]) > 2:
            clipped[-1] = clipped[-1][:-2] + "…"
        return clipped
    return words


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 8,
    max_lines: int | None = None,
) -> int:
    x, y = xy
    lines = wrap_text(draw, text, fnt, max_width, max_lines=max_lines)
    line_height = int(fnt.size * 1.25)
    for i, line in enumerate(lines):
        draw.text((x, y + i * (line_height + line_gap)), line, font=fnt, fill=fill)
    return y + len(lines) * (line_height + line_gap)


def strip_tags(value: str) -> str:
    value = re.sub(r"<[^>]+>", "", value)
    return html.unescape(value).strip()


def field_from_html(page: str, label: str) -> str | None:
    patterns = [
        rf"<dt>{re.escape(label)}</dt><dd>(.*?)</dd>",
        rf'<div class="(?:archive-label|l)">{re.escape(label)}</div><div class="(?:archive-value|v)">(.*?)</div>',
    ]
    for pattern in patterns:
        hit = re.search(pattern, page, re.S)
        if hit:
            return strip_tags(hit.group(1))
    return None


def page_data(file_path: Path) -> dict[str, str]:
    slug = file_path.parent.name
    page = file_path.read_text(encoding="utf-8")
    h1 = strip_tags(re.search(r"<h1>(.*?)</h1>", page, re.S).group(1))
    school_name = h1.replace(" PTA関連資料・評価", "")
    school_type = field_from_html(page, "学校区分") or ("中学校" if slug.endswith("-jhs") else "小学校")
    evaluation = field_from_html(page, "評価状況") or "評価準備中"
    document = field_from_html(page, "確認資料") or "未確認"
    application = field_from_html(page, "入会申込書") or "未確認"
    pdf_status = field_from_html(page, "PDF") or ("掲載あり" if "既存の評価書PDFを開く" in page else "準備中")

    overrides = DATA_OVERRIDES.get(slug, {})
    document = overrides.get("documentName", document)
    application = overrides.get("applicationStatus", application)
    pdf_status = overrides.get("pdfStatus", pdf_status)

    description = DESCRIPTIONS.get(
        slug,
        f"{school_name}のPTA関連資料について、資料確認状況と評価を整理しています。確認済み資料に基づき順次更新します。",
    )

    return {
        "schoolSlug": slug,
        "schoolName": school_name,
        "schoolType": school_type,
        "municipality": "厚木市",
        "evaluationLabel": evaluation,
        "documentName": document,
        "applicationStatus": application,
        "pdfStatus": pdf_status,
        "description": description,
    }


def draw_status_card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    label: str,
    value: str,
    fnt_label: ImageFont.FreeTypeFont,
    fnt_value: ImageFont.FreeTypeFont,
    *,
    bg: str = CARD,
    fg: str = TEXT,
    border: str = LINE,
) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=18, fill=bg, outline=border, width=3)
    draw.text((x1 + 18, y1 + 12), label, font=fnt_label, fill=fg if bg != CARD else SOFT)
    value_font = fnt_value
    lines = wrap_text(draw, value, value_font, x2 - x1 - 36, max_lines=2)
    available_height = y2 - (y1 + 35) - 8
    while len(lines) * int(value_font.size * 1.08) > available_height and value_font.size > 17:
        value_font = font(value_font.size - 1, True)
        lines = wrap_text(draw, value, value_font, x2 - x1 - 36, max_lines=2)
    line_height = int(value_font.size * 1.08)
    y = y1 + 35
    for line in lines:
        draw.text((x1 + 18, y), line, font=value_font, fill=fg)
        y += line_height


def generate_card(data: dict[str, str], out_path: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#f4f7fa")
    draw = ImageDraw.Draw(image)

    # Hero block
    draw.rectangle((0, 0, WIDTH, 310), fill=NAVY)
    draw.rectangle((0, 300, WIDTH, 310), fill=GOLD)
    draw.polygon([(780, 0), (1200, 0), (1200, 310), (930, 310)], fill=NAVY_DARK)

    draw.text((60, 48), f"ATSUGI {data['schoolType']}", font=font(28, True), fill=GOLD_LIGHT)
    draw_wrapped(
        draw,
        (60, 96),
        f"{data['schoolName']} PTA関連資料・評価",
        font(58, True),
        WHITE,
        1000,
        line_gap=2,
        max_lines=2,
    )
    draw_wrapped(
        draw,
        (60, 226),
        "PTA入会案内、PTA入会申込書、学校納入金・会費徴収資料等の確認状況を整理します。",
        font(25, False),
        "#d9e6f2",
        880,
        line_gap=2,
        max_lines=2,
    )

    # Summary panel
    draw.rounded_rectangle((54, 334, 1146, 584), radius=26, fill=WHITE, outline=LINE, width=2)
    draw.text((90, 360), "資料確認状況", font=font(32, True), fill=TEXT)

    label_font = font(18, True)
    value_font = font(24, True)
    x0 = 90
    y0 = 410
    gap_x = 18
    gap_y = 12
    col_w = 326
    row_h = 76
    fields = [
        ("自治体", data["municipality"], CARD, TEXT, LINE),
        ("学校区分", data["schoolType"], CARD, TEXT, LINE),
        ("評価状況", data["evaluationLabel"], *EVAL_STYLES.get(data["evaluationLabel"], EVAL_STYLES["評価準備中"])),
        ("確認資料", data["documentName"], CARD, TEXT, LINE),
        ("入会申込書", data["applicationStatus"], CARD, TEXT, LINE),
        ("PDF", data["pdfStatus"], CARD, TEXT, LINE),
    ]
    for idx, (label, value, bg, fg, border) in enumerate(fields):
        row = idx // 3
        col = idx % 3
        x = x0 + col * (col_w + gap_x)
        y = y0 + row * (row_h + gap_y)
        draw_status_card(draw, (x, y, x + col_w, y + row_h), label, value, label_font, value_font, bg=bg, fg=fg, border=border)

    draw.text((60, 598), "PTA適正化推進委員会", font=font(24, True), fill=SOFT)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(out_path, "PNG", optimize=True)


def meta_block(data: dict[str, str], image_url: str) -> str:
    title = f"{data['schoolName']} PTA関連資料・評価"
    url = f"{SITE}/archive/atsugi/{data['schoolSlug']}/"
    desc = data["description"]
    alt = title

    def esc(value: str) -> str:
        return html.escape(value, quote=True)

    return "\n".join(
        [
            '  <meta property="og:type" content="article">',
            '  <meta property="og:site_name" content="PTA適正化推進委員会">',
            f'  <meta property="og:title" content="{esc(title)}">',
            f'  <meta property="og:description" content="{esc(desc)}">',
            f'  <meta property="og:url" content="{esc(url)}">',
            f'  <meta property="og:image" content="{esc(image_url)}">',
            '  <meta property="og:image:width" content="1200">',
            '  <meta property="og:image:height" content="630">',
            f'  <meta property="og:image:alt" content="{esc(alt)}">',
            '  <meta name="twitter:card" content="summary_large_image">',
            f'  <meta name="twitter:title" content="{esc(title)}">',
            f'  <meta name="twitter:description" content="{esc(desc)}">',
            f'  <meta name="twitter:image" content="{esc(image_url)}">',
        ]
    )


def update_meta(file_path: Path, data: dict[str, str], image_path: Path) -> None:
    page = file_path.read_text(encoding="utf-8")
    page = re.sub(
        r'(?im)^[ \t]*<meta\s+(?:property|name)=["\'](?:og:[^"\']+|twitter:[^"\']+)["\'][^>]*>[ \t]*\r?\n?',
        "",
        page,
    )
    image_url = f"{SITE}/assets/og-image.png"  # Unified site-wide X/Open Graph card
    block = meta_block(data, image_url)
    if re.search(r'  <meta name="description" content="[^"]*">\n', page):
        page = re.sub(r'(  <meta name="description" content="[^"]*">\n)', r"\1" + block + "\n", page, count=1)
    else:
        page = page.replace("</title>\n", "</title>\n" + block + "\n", 1)
    file_path.write_text(page, encoding="utf-8")


def generate_default() -> None:
    data = {
        "schoolSlug": "default",
        "schoolName": "厚木市 PTA関連資料",
        "schoolType": "資料館",
        "municipality": "厚木市",
        "evaluationLabel": "評価準備中",
        "documentName": "学校別ページで確認",
        "applicationStatus": "学校別ページで確認",
        "pdfStatus": "ページをPDF保存",
        "description": "厚木市内のPTA関連資料について、学校別に確認状況と評価を整理しています。",
    }
    generate_card(data, OGP_DIR / "default.png")


def main() -> None:
    OGP_DIR.mkdir(parents=True, exist_ok=True)
    generate_default()
    pages = sorted(ARCHIVE_DIR.glob("*/index.html"))
    for file_path in pages:
        data = page_data(file_path)
        image_path = OGP_DIR / f"{data['schoolSlug']}.png"
        generate_card(data, image_path)
        update_meta(file_path, data, image_path)
    print(f"Generated {len(pages)} OGP cards plus default.")


if __name__ == "__main__":
    main()
