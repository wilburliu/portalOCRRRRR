"""Generate synthetic NTUH-style CAPTCHAs for training.

The CAPTCHA we target: 6 chars from CHARSET, solid near-black glyphs on a
white background, overlaid with a handful of thin *colored* polyline noise
strokes (red / green / blue / purple). The model learns to ignore the colored
noise, so we render that noise realistically here.

Usage:
    python generate_synthetic.py --train 20000 --val 2000
    python generate_synthetic.py --preview        # just write a preview sheet

Tune FONT_CANDIDATES / NOISE_* below to match your real samples, then
regenerate. Font fidelity is the #1 driver of real-world accuracy.
"""
import argparse
import csv
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from config import CHARSET, NUM_CHARS, IMG_W, IMG_H

HERE = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(HERE, "dataset")

# ── Style parameters (tune to match real_samples/) ───────────────────────────
# Fonts are resolved cross-platform (Windows / macOS / Linux) by filename, so
# the same code runs on a Mac laptop and a Windows desktop without edits.
# Each entry is a group of equivalent filenames for one logical font; the
# generator picks one resolved font at random per image for a little robustness.
# To pin a single best-match font, leave just its group here.
FONT_SPECS = [
    ["Arial Bold.ttf", "arialbd.ttf", "Arial-Bold.ttf"],
    ["Verdana Bold.ttf", "verdanab.ttf"],
    ["Tahoma Bold.ttf", "tahomabd.ttf"],
    ["DejaVuSans-Bold.ttf"],            # common on Linux / matplotlib
    # extra clean bold sans-serif faces for glyph-shape diversity, so the model
    # generalizes to NTUH's exact glyph shapes instead of overfitting 3 fonts.
    ["segoeuib.ttf"],                   # Segoe UI Bold
    ["calibrib.ttf"],                   # Calibri Bold
    ["trebucbd.ttf"],                   # Trebuchet MS Bold
    ["framd.ttf"],                      # Franklin Gothic Medium
    ["micross.ttf"],                    # Microsoft Sans Serif
    ["consolab.ttf"],                   # Consolas Bold (monospace, distinct digits)
]

# Directories searched for the filenames above.
FONT_DIRS = [
    # Windows
    os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts"),
    # macOS
    "/System/Library/Fonts/Supplemental",
    "/Library/Fonts",
    os.path.expanduser("~/Library/Fonts"),
    # Linux
    "/usr/share/fonts", "/usr/share/fonts/truetype", "/usr/local/share/fonts",
    os.path.expanduser("~/.fonts"),
]


def _find_font(filename):
    """Locate a font filename across FONT_DIRS (recursively where needed)."""
    for d in FONT_DIRS:
        if not d or not os.path.isdir(d):
            continue
        direct = os.path.join(d, filename)
        if os.path.exists(direct):
            return direct
        # some Linux trees nest fonts in subfolders
        for root, _dirs, files in os.walk(d):
            if filename in files:
                return os.path.join(root, filename)
    return None


def resolve_fonts():
    """Return existing absolute paths, one per FONT_SPECS group that resolves."""
    paths = []
    for group in FONT_SPECS:
        for name in group:
            p = _find_font(name)
            if p:
                paths.append(p)
                break
    return paths


FONT_CANDIDATES = resolve_fonts()
FONT_SIZE_RANGE = (36, 46)        # px
CHAR_ROTATION_DEG = 8             # +/- max per-char rotation (real glyphs ~upright)
CHAR_Y_JITTER = 5                 # +/- vertical wobble (px)

# Real NTUH glyphs are SATURATED DARK COLORS (e.g. blue "9661", purple "N5"),
# not near-black. Each glyph gets a random dark color from this palette so the
# net learns shape, not color, and matches the real distribution.
GLYPH_COLORS = [
    (30, 40, 160),   # blue
    (20, 30, 110),   # navy
    (110, 30, 120),  # purple
    (80, 20, 90),    # dark purple
    (140, 25, 30),   # dark red
    (25, 95, 35),    # dark green
    (20, 90, 105),   # teal
    (25, 25, 30),    # near-black
]

# Native render size (resized to IMG_W x IMG_H before saving so the saved
# images already match the network input distribution).
RENDER_W = 200
RENDER_H = 64

# Layout: each glyph is centered in its own 1/NUM_CHARS slot (see make_captcha),
# then every image is cropped to its glyph bounding box (crop_to_content) and
# stretched to fill IMG_W x IMG_H before saving -- the SAME normalization the
# browser/validate apply to the real captcha. This makes the 6 glyphs span the
# frame in 6 even bands, which is what the column-pooling head expects.
CROP_LUM_THR = 110                # pixels darker than this are "glyph" content
CROP_PAD = 2                      # px of margin kept around the glyph bbox

# Noise: thin LIGHT-GRAY crosshatch lines spanning the image + a few faint
# colored thin lines + fine speckle. (The real captcha's dominant noise is
# pale gray straight lines, not thick saturated polylines.)
GRAY_LINES_RANGE = (8, 16)        # number of thin gray crosshatch lines
GRAY_LINE_GRAY = (140, 205)       # gray level of those lines
COLOR_LINES_RANGE = (1, 4)        # a few faint colored thin lines
NOISE_COLORS = [
    (220, 30, 30), (30, 160, 30), (40, 60, 210),
    (150, 40, 180), (200, 120, 20), (20, 170, 170),
]
SPECKLE_PROB = 0.0020             # fraction of pixels turned into specks


def load_fonts():
    fonts = {}
    for path in FONT_CANDIDATES:
        if not os.path.exists(path):
            continue
        for size in range(FONT_SIZE_RANGE[0], FONT_SIZE_RANGE[1] + 1):
            fonts[(path, size)] = ImageFont.truetype(path, size)
    if not fonts:
        raise SystemExit(
            "No fonts found. None of the filenames in FONT_SPECS were located in "
            "FONT_DIRS. Add your font's filename/directory in generate_synthetic.py, "
            "or copy a .ttf next to this script and add its name to FONT_SPECS."
        )
    print("fonts:", ", ".join(os.path.basename(p) for p in FONT_CANDIDATES))
    return fonts


def random_code():
    return "".join(random.choice(CHARSET) for _ in range(NUM_CHARS))


def draw_glyph(char, font):
    """Render one char on a transparent tile, rotated, return RGBA image."""
    # measure
    tmp = Image.new("RGBA", (FONT_SIZE_RANGE[1] * 2, FONT_SIZE_RANGE[1] * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    bbox = d.textbbox((0, 0), char, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    tile = Image.new("RGBA", (w + 6, h + 6), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    r, g, b = random.choice(GLYPH_COLORS)
    # small per-glyph jitter on the chosen color
    jit = lambda v: max(0, min(255, v + random.randint(-15, 15)))
    d.text((3 - bbox[0], 3 - bbox[1]), char, font=font, fill=(jit(r), jit(g), jit(b), 255))
    angle = random.uniform(-CHAR_ROTATION_DEG, CHAR_ROTATION_DEG)
    return tile.rotate(angle, expand=True, resample=Image.BICUBIC)


def add_noise_lines(draw, w, h):
    # thin light-gray crosshatch lines spanning most of the width
    for _ in range(random.randint(*GRAY_LINES_RANGE)):
        gg = random.randint(*GRAY_LINE_GRAY)
        y1, y2 = random.randint(0, h), random.randint(0, h)
        x1 = random.randint(-10, int(w * 0.2))
        x2 = random.randint(int(w * 0.8), w + 10)
        draw.line([(x1, y1), (x2, y2)], fill=(gg, gg, gg), width=1)
    # a few faint colored thin lines
    for _ in range(random.randint(*COLOR_LINES_RANGE)):
        color = random.choice(NOISE_COLORS)
        pts = [(random.randint(-5, w + 5), random.randint(-5, h + 5))
               for _ in range(random.randint(2, 3))]
        draw.line(pts, fill=color, width=1, joint="curve")


def add_speckle(img):
    if SPECKLE_PROB <= 0:
        return
    px = img.load()
    w, h = img.size
    for _ in range(int(w * h * SPECKLE_PROB)):
        x, y = random.randint(0, w - 1), random.randint(0, h - 1)
        if random.random() < 0.5:
            g = random.randint(120, 200)
            px[x, y] = (g, g, g)
        else:
            px[x, y] = random.choice(NOISE_COLORS)


def crop_to_content(img, lum_thr=CROP_LUM_THR, pad=CROP_PAD):
    """Crop to the bounding box of the dark glyph pixels.

    Glyphs are saturated/dark (low luminance); the noise is pale gray lines and
    sparse colored specks. We threshold on luminance and use row/column
    projections (with a small count threshold) so isolated specks/thin lines
    don't expand the box. Must stay in sync with the JS version in App.tsx and
    the Python version in validate.py.
    """
    arr = np.asarray(img.convert("L"), dtype=np.int16)
    mask = arr < lum_thr
    h, w = mask.shape
    cols = mask.sum(axis=0)
    rows = mask.sum(axis=1)
    cthr = max(1, int(0.06 * h))
    rthr = max(1, int(0.04 * w))
    xs = np.where(cols > cthr)[0]
    ys = np.where(rows > rthr)[0]
    if xs.size == 0 or ys.size == 0:
        return img  # nothing found -> leave as-is
    x0 = max(0, int(xs[0]) - pad)
    x1 = min(w, int(xs[-1]) + 1 + pad)
    y0 = max(0, int(ys[0]) - pad)
    y1 = min(h, int(ys[-1]) + 1 + pad)
    return img.crop((x0, y0, x1, y1))


def make_captcha(code, fonts):
    img = Image.new("RGB", (RENDER_W, RENDER_H), (255, 255, 255))

    # layout glyphs across the width with jitter
    font_path = random.choice([p for p in FONT_CANDIDATES if os.path.exists(p)])
    size = random.randint(*FONT_SIZE_RANGE)
    font = fonts[(font_path, size)]

    # SLOT-based placement: each glyph is centered in its own 1/NUM_CHARS slot
    # of the width. This ENFORCES even horizontal spacing, which keeps the 6
    # glyphs aligned with the 6 columns of the AdaptiveAvgPool head. crop_to_content
    # then trims margins so the block fills the frame -- the same normalization
    # applied to the real captcha, which is also ~evenly spaced. (Sequential
    # layout instead lets wide glyphs shift their neighbors, breaking alignment.)
    slot = RENDER_W / NUM_CHARS
    for i, ch in enumerate(code):
        glyph = draw_glyph(ch, font)
        gx = int(i * slot + (slot - glyph.width) / 2 + random.randint(-3, 3))
        gy = int((RENDER_H - glyph.height) / 2 + random.randint(-CHAR_Y_JITTER, CHAR_Y_JITTER))
        img.paste(glyph, (gx, gy), glyph)

    draw = ImageDraw.Draw(img)
    add_noise_lines(draw, RENDER_W, RENDER_H)
    add_speckle(img)

    # normalize: crop to the glyph bbox, then stretch to the network input size
    # (identical preprocessing runs on the real captcha at inference time).
    img = crop_to_content(img)
    return img.resize((IMG_W, IMG_H), Image.BILINEAR)


def generate_split(split, count, fonts):
    out_dir = os.path.join(DATASET_DIR, split)
    os.makedirs(out_dir, exist_ok=True)
    rows = []
    for i in range(count):
        code = random_code()
        img = make_captcha(code, fonts)
        fname = f"{i:06d}_{code}.png"
        img.save(os.path.join(out_dir, fname))
        rows.append((fname, code))
    with open(os.path.join(out_dir, "labels.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["filename", "code"])
        w.writerows(rows)
    print(f"[{split}] wrote {count} images -> {out_dir}")


def write_preview(fonts, n=40):
    cols, rows = 5, (n + 4) // 5
    pad = 8
    sheet = Image.new("RGB", (cols * (IMG_W + pad) + pad, rows * (IMG_H + pad) + pad), (40, 40, 40))
    for k in range(n):
        img = make_captcha(random_code(), fonts)
        r, c = divmod(k, cols)
        sheet.paste(img, (pad + c * (IMG_W + pad), pad + r * (IMG_H + pad)))
    path = os.path.join(HERE, "preview.png")
    sheet.save(path)
    print(f"preview sheet -> {path}  (compare this against real_samples/)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", type=int, default=20000)
    ap.add_argument("--val", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--preview", action="store_true", help="only write preview.png")
    args = ap.parse_args()

    random.seed(args.seed)
    fonts = load_fonts()

    if args.preview:
        write_preview(fonts)
        return

    write_preview(fonts)
    generate_split("train", args.train, fonts)
    generate_split("val", args.val, fonts)


if __name__ == "__main__":
    main()
