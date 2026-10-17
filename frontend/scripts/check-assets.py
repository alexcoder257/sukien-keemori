#!/usr/bin/env python3
"""Nghiệm thu asset của một mẫu thiệp trong MỘT lượt, không cần mở từng ảnh.

    python3 scripts/check-assets.py <slug> [--sheet]

Đọc bảng manifest trong `docs/templates/<slug>.md`, đối chiếu với file thật
trong `public/images/templates/<slug>/`, rồi in một bảng kết quả. Kiểm được
bằng máy: có mặt/thừa file, kích thước, nền alpha hay đặc, định dạng, cặp phong
bì trùng khít, tile liền mạch bốn cạnh.

Còn đúng hai tiêu chí phải nhìn — "đúng một vật, không phải lưới 4 ô" và "không
có chữ". `--sheet` gộp toàn bộ asset thành MỘT ảnh contact sheet để nhìn một
lần, thay vì mở lần lượt từng file.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SPEC_DIR = ROOT.parent / "docs" / "templates"
ASSET_DIR = ROOT / "public" / "images" / "templates"

# Mọi asset của mẫu đều là .avif — AVIF chở được cả nền đặc lẫn alpha, nên luật
# hai định dạng cũ (.webp cho plate và ba vai cố định, .png cho hoạ tiết alpha)
# đã gộp làm một.
ASSET_SUFFIX = ".avif"
SIZE_RE = re.compile(r"(\d{2,5})\s*[×x]\s*(\d{2,5})")
FILE_RE = re.compile(r"`([\w./-]+\.(?:avif|png|webp|jpg))`")
# Chênh lệch TRUNG BÌNH cho phép giữa hai mép của một tile. Dùng trung bình chứ
# không dùng max: max bắt cả nhiễu một pixel, nên texture giấy nào cũng trượt.
TILE_SEAM_TOLERANCE = 10


class Row:
    """Một dòng manifest đã parse."""

    def __init__(self, path: str, w: int, h: int, bg: str, note: str):
        self.path = path
        self.w = w
        self.h = h
        self.bg = bg
        self.note = note
        self.seamless = "seamless" in note.lower() or "tile" in path.lower()


def text_of(spec: Path) -> str:
    return spec.read_text(encoding="utf-8")


def parse_manifest(spec: Path) -> list[Row]:
    """Rút mọi dòng bảng có <file> + <WxH> trong mục Manifest asset."""
    text = spec.read_text(encoding="utf-8")
    start = text.find("## Manifest asset")
    if start == -1:
        sys.exit(f"không thấy mục '## Manifest asset' trong {spec.name}")
    end = text.find("\n## ", start + 1)
    section = text[start : end if end != -1 else len(text)]

    rows: list[Row] = []
    for line in section.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        joined = " ".join(cells)
        size_match = SIZE_RE.search(joined)
        paths = [p for p in FILE_RE.findall(joined) if not p.endswith(".md")]
        if not paths or not size_match:
            continue

        # Nền phải đọc từ ĐÚNG ô của nó. Quét cả dòng thì một chữ "đặc" trong
        # phần mô tả ("berries đặc và fern") lật ngược cả phép kiểm alpha.
        bg = ""
        for cell in cells:
            key = cell.strip("*` ").lower()
            if key in {"alpha", "đặc", "trong suốt"}:
                bg = "alpha" if key != "đặc" else "đặc"
                break

        # Một dòng có thể khai cả cặp: `envelope-closed.avif` / `envelope-open.avif`.
        for path in paths:
            rows.append(
                Row(path, int(size_match.group(1)), int(size_match.group(2)), bg, joined)
            )
    return rows


def tile_seam_gap(im: Image.Image) -> float:
    """Chênh lệch trung bình giữa mép trái↔phải và trên↔dưới của một tile.

    So một dải 4px mỗi mép chứ không so đúng 1px: mép ngoài cùng của ảnh sinh ra
    hay bị viền nén, và một cột nhiễu không phải là hở mạch.
    """
    rgb = im.convert("RGB")
    w, h = rgb.size
    pairs = [
        (rgb.crop((0, 0, 4, h)), rgb.crop((w - 4, 0, w, h))),
        (rgb.crop((0, 0, w, 4)), rgb.crop((0, h - 4, w, h))),
    ]
    worst = 0.0
    for a, b in pairs:
        band = ImageChops.difference(a, b).convert("L")
        worst = max(worst, sum(band.getdata()) / (band.width * band.height))
    return worst


def check(slug: str) -> tuple[list[str], list[str], list[Path]]:
    spec = SPEC_DIR / f"{slug}.md"
    folder = ASSET_DIR / slug
    if not spec.exists():
        sys.exit(f"không có spec: {spec}")
    if not folder.exists():
        sys.exit(f"không có thư mục asset: {folder}")

    rows = parse_manifest(spec)
    errors: list[str] = []
    warnings: list[str] = []

    if not rows:
        # Spec cũ viết manifest bằng văn xuôi. Không có kích thước khai báo thì
        # không đối chiếu được gì — nói thẳng thay vì báo cả thư mục là thừa.
        print(
            f"\n{slug} — manifest KHÔNG ở dạng bảng, bỏ qua toàn bộ phép kiểm.\n"
            "Viết lại mục '## Manifest asset' thành bảng `file | kích thước | nền`\n"
            "theo bước 6 của skill thiep-extract rồi chạy lại."
        )
        return [], [], []
    seen: set[Path] = set()
    opened: dict[str, Image.Image] = {}

    todo = re.search(r"^status:\s*$.*?^\s*assets:\s*todo", text_of(spec), re.M | re.S)
    print(
        f"\n{slug} — {len(rows)} dòng manifest"
        + ("  [status.assets: todo — asset còn thiếu là bình thường]" if todo else "")
        + "\n"
    )
    print(f"{'file':<46} {'kích thước':>12}  {'nền':<6} kết quả")
    print("-" * 92)

    for row in rows:
        target = folder / row.path
        seen.add(target)
        if not target.exists():
            errors.append(f"{row.path}: manifest khai nhưng chưa có file")
            print(f"{row.path:<46} {'—':>12}  {'—':<6} THIẾU FILE")
            continue

        notes: list[str] = []
        with Image.open(target) as im:
            im.load()
            opened[row.path] = im.copy()
            actual = im.size
            if actual != (row.w, row.h):
                errors.append(
                    f"{row.path}: manifest {row.w}×{row.h}, file {actual[0]}×{actual[1]}"
                )
                notes.append(f"SAI CỠ ({actual[0]}×{actual[1]})")

            if row.bg:
                alpha = im.convert("RGBA").getchannel("A").getextrema()
                if row.bg == "alpha" and alpha[0] != 0:
                    errors.append(f"{row.path}: khai alpha nhưng không có pixel trong")
                    notes.append("KHÔNG TRONG SUỐT")
                if row.bg == "đặc" and alpha[0] != 255:
                    errors.append(f"{row.path}: khai nền đặc nhưng có pixel trong")
                    notes.append("LỦNG NỀN")

            if row.seamless:
                gap = tile_seam_gap(im)
                if gap > TILE_SEAM_TOLERANCE:
                    # Cảnh báo chứ không phải lỗi: đây là phép đo xấp xỉ, mắt
                    # trên contact sheet mới chốt được là mạch có lộ hay không.
                    warnings.append(
                        f"{row.path}: mép tile chênh {gap:.0f}/255 — ghép 2×2 nhìn lại"
                    )
                    notes.append(f"nghi hở mạch ({gap:.0f})")

        if target.suffix != ASSET_SUFFIX:
            errors.append(f"{row.path}: asset của mẫu phải là {ASSET_SUFFIX}")
            notes.append("SAI ĐỊNH DẠNG")

        status = " · ".join(notes) if notes else "ok"
        print(f"{row.path:<46} {row.w:>5}×{row.h:<6}  {row.bg or '—':<6} {status}")

    # Cặp phong bì phải là cùng một vật ở hai trạng thái.
    closed, opened_env = opened.get("envelope-closed.avif"), opened.get("envelope-open.avif")
    if closed and opened_env:
        if closed.size != opened_env.size:
            errors.append("phong bì: hai trạng thái khác kích thước canvas")
        else:
            diff = ImageChops.difference(closed.convert("RGB"), opened_env.convert("RGB"))
            changed = sum(1 for p in diff.convert("L").getdata() if p > 24)
            ratio = changed / (closed.width * closed.height)
            if ratio > 0.55:
                errors.append(
                    f"phong bì: {ratio:.0%} khung hình đổi giữa closed/open — "
                    "nhiều khả năng là hai thiết kế khác nhau, không phải hai trạng thái"
                )
            elif ratio < 0.02:
                warnings.append("phong bì: hai file gần như trùng nhau, nắp có mở không?")
    elif not (closed or opened_env):
        errors.append("thiếu cặp phong bì riêng của mẫu (bắt buộc với mọi mẫu)")

    # File có trên đĩa mà manifest không khai.
    on_disk = {
        p
        for p in folder.rglob("*")
        if p.is_file() and p.suffix in {".avif", ".png", ".webp", ".jpg"}
    }
    for extra in sorted(on_disk - seen):
        rel = extra.relative_to(folder).as_posix()
        if rel == "thumbnail.avif":
            continue  # thiep-build chụp sau khi dựng
        errors.append(f"{rel}: có trên đĩa nhưng manifest không khai")

    decor = [r for r in rows if r.path.startswith("decor/")]
    if 0 < len(decor) < 6 and "Giải trình sàn decor" not in spec.read_text(encoding="utf-8"):
        warnings.append(
            f"chỉ {len(decor)} decor — đếm lại từng lần hoạ tiết xuất hiện, "
            "hoặc viết mục **Giải trình sàn decor:** trong spec"
        )

    return errors, warnings, sorted(seen & on_disk)


def contact_sheet(slug: str, files: list[Path], cell: int = 260) -> Path:
    """Gộp mọi asset thành một ảnh để kiểm hai tiêu chí phải nhìn bằng mắt."""
    cols = 4
    rows_n = (len(files) + cols - 1) // cols
    pad, label = 8, 16
    sheet = Image.new(
        "RGB", (cols * (cell + pad) + pad, rows_n * (cell + pad + label) + pad), "#3a3a3a"
    )
    draw = ImageDraw.Draw(sheet)

    for i, path in enumerate(files):
        x = pad + (i % cols) * (cell + pad)
        y = pad + (i // cols) * (cell + pad + label)
        # Ô caro để phân biệt nền trong suốt thật với nền trắng đặc.
        tile = Image.new("RGB", (cell, cell), "#cfcfcf")
        td = ImageDraw.Draw(tile)
        for cy in range(0, cell, 16):
            for cx in range(0, cell, 16):
                if (cx // 16 + cy // 16) % 2:
                    td.rectangle([cx, cy, cx + 15, cy + 15], fill="#f0f0f0")
        with Image.open(path) as im:
            thumb = im.convert("RGBA")
            thumb.thumbnail((cell, cell), Image.LANCZOS)
            tile.paste(
                thumb, ((cell - thumb.width) // 2, (cell - thumb.height) // 2), thumb
            )
        sheet.paste(tile, (x, y))
        draw.text((x + 2, y + cell + 3), path.name[:38], fill="#ffffff")

    out = ROOT / ".template-raw" / f"{slug}-review-sheet.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument(
        "--sheet",
        action="store_true",
        help="gộp mọi asset thành một contact sheet để nhìn một lần",
    )
    args = ap.parse_args()

    errors, warnings, files = check(args.slug)

    for w in warnings:
        print(f"\ncảnh báo · {w}")
    for e in errors:
        print(f"\nlỗi · {e}")

    if args.sheet and files:
        print(f"\ncontact sheet · {contact_sheet(args.slug, files)}")
        print("mở đúng file đó để kiểm: đúng một vật mỗi ô, không ô nào có chữ")

    print(f"\n{len(errors)} lỗi · {len(warnings)} cảnh báo")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
