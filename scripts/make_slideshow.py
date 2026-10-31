#!/usr/bin/env python3
"""Build screenshots/slideshow.gif from the already-blurred screenshot PNGs.

Run from the repository root:   python3 scripts/make_slideshow.py [--dump DIR]
Needs Pillow. FONT_PATH (environment variable) overrides the font search.
"""
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

# ---- settings (edit these) ------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "screenshots"
OUT = SHOTS / "slideshow.gif"

# Slide order. The caption is made from the file name: erp-audit -> "ERP AUDIT".
IMAGES = [
    "platform-hub.png",
    "register.png",
    "account.png",
    "uidai-grievance-form.png",
    "uidai-grievance-submitted.png",
    "erp-dashboard.png",
    "erp-received-records.png",
    "erp-citizens.png",
    "erp-audit.png",
]

# Calibri first, then Carlito (metric-compatible clone), then DejaVu Sans.
FONT_PATHS = [
    os.environ.get("FONT_PATH", ""),
    "calibri.ttf", "Calibri.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "/Library/Fonts/Calibri.ttf", "/System/Library/Fonts/Supplemental/Calibri.ttf",
    "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf",
    "/usr/share/fonts/truetype/carlito/Carlito-Regular.ttf",
    "/usr/share/fonts/TTF/Carlito-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
FONT_SIZE = 15
LETTER_SPACING = 1          # px between letters
CAPTION_HEX = "#1d4ed8"     # --accent in frontend/erp-console/views/layout-head.ejs
CAPTION_H = 30
WIDTHS = [1000, 900, 800]   # never below 800
FRAME_MS = 3000
TARGET_BYTES = 2 * 1024 * 1024
HARD_BYTES = 5 * 1024 * 1024
# ---------------------------------------------------------------------------

QUANTIZERS = [("LIBIMAGEQUANT", Image.Quantize.LIBIMAGEQUANT),
              ("FASTOCTREE", Image.Quantize.FASTOCTREE),
              ("MEDIANCUT", Image.Quantize.MEDIANCUT)]


def to_rgb(img):
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, img)
    return img.convert("RGB")


def quantize(img, method, dither, colors=256):
    base = img.quantize(colors=colors, method=method, dither=Image.Dither.NONE)
    if dither:
        base = img.quantize(palette=base, dither=Image.Dither.FLOYDSTEINBERG)
    # LIBIMAGEQUANT hands back an RGBA palette; GIF frames must carry a plain
    # RGB palette or Pillow treats them as transparent.
    plain = Image.new("P", base.size)
    pal = base.getpalette("RGB")
    plain.putpalette(pal + [0] * (768 - len(pal)))   # always a full 256-entry table
    plain.frombytes(base.tobytes())
    return plain


def mean_error(src_rgb, gif_frame):          # 0-255 per channel, lower is better
    d = ImageChops.difference(src_rgb, gif_frame.convert("RGB"))
    return sum(ImageStat.Stat(d).mean) / 3


def saturation(img_rgb):                     # 0-255, higher means more vivid
    return ImageStat.Stat(img_rgb.convert("HSV").split()[1]).mean[0]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def load_font():
    for p in FONT_PATHS:
        if not p:
            continue
        try:
            f = ImageFont.truetype(p, FONT_SIZE)
            return f, p
        except OSError:
            continue
    raise SystemExit("no usable font found; set FONT_PATH")


def title_of(name):
    return Path(name).stem.replace("-", " ").upper()


def fit(img, width, height):
    """Scale to `width` (LANCZOS), then crop or pad (edge colour) to `height`."""
    h = round(img.height * width / img.width)
    img = img.resize((width, h), Image.LANCZOS)
    if h == height:
        return img
    if h > height:
        return img.crop((0, 0, width, height))
    edge = img.getpixel((0, h - 1))
    out = Image.new("RGB", (width, height), edge)
    out.paste(img, (0, 0))
    return out


def build_frames(width, font):
    shots = [to_rgb(Image.open(SHOTS / n)) for n in IMAGES]
    body_h = round(shots[0].height * width / shots[0].width)
    cap = hex_rgb(CAPTION_HEX)
    frames = []
    for i, (name, im) in enumerate(zip(IMAGES, shots)):
        body = fit(im, width, body_h)
        frame = Image.new("RGB", (width, body_h + CAPTION_H), cap)
        frame.paste(body, (0, 0))
        d = ImageDraw.Draw(frame)
        title = title_of(name)
        advs = [font.getlength(c) + LETTER_SPACING for c in title]
        x = (width - (sum(advs) - LETTER_SPACING)) / 2
        cy = body_h + CAPTION_H / 2
        for c, a in zip(title, advs):
            d.text((x, cy), c, font=font, fill=(255, 255, 255), anchor="lm")
            x += a
        r, gap = 3, 14
        dim =tuple(round(cap[j] * 0.55 + 255 * 0.45) for j in range(3))
        x0 = width - 18 - (len(IMAGES) - 1) * gap
        for j in range(len(IMAGES)):
            cx = x0 + j * gap
            d.ellipse((cx - r, cy - r, cx + r, cy + r),
                      fill=(255, 255, 255) if j == i else dim)
        frames.append(frame)
    return frames, body_h


def top_tiles(img, body_h, n=5, t=40):
    hsv = img.crop((0, 0, img.width, body_h)).convert("HSV")
    scored = []
    for y in range(0, body_h - t + 1, t):
        for x in range(0, img.width - t + 1, t):
            s = ImageStat.Stat(hsv.crop((x, y, x + t, y + t)).split()[1]).mean[0]
            scored.append((s, x, y))
    return sorted(scored, reverse=True)[:n]


def tile_mean(img, x, y, t=40):
    return ImageStat.Stat(img.crop((x, y, x + t, y + t))).mean


def verify(frames, body_h, path):
    cap = hex_rgb(CAPTION_HEX)
    results, ok_all = [], True
    gif = Image.open(path)
    for i, src in enumerate(frames):
        gif.seek(i)
        dec = gif.convert("RGB")
        err = mean_error(src, dec)
        ratio = saturation(dec) / max(saturation(src), 1e-6)
        px = dec.getpixel((6, body_h + CAPTION_H // 2))
        cap_ok = all(abs(a - b) <= 3 for a, b in zip(px, cap))
        tiles_ok = all(
            all(abs(a - b) <= 12 for a, b in zip(tile_mean(src, x, y), tile_mean(dec, x, y)))
            for _, x, y in top_tiles(src, body_h))
        ok = err <= 4 and ratio >= 0.95 and cap_ok and tiles_ok
        ok_all &= ok
        results.append((i, err, ratio, px, cap_ok, tiles_ok, ok))
    return ok_all, results


def main():
    dump = sys.argv[sys.argv.index("--dump") + 1] if "--dump" in sys.argv else None
    font, font_path = load_font()
    print(f"font: {font_path}  size {FONT_SIZE}  letter spacing {LETTER_SPACING}px")
    print(f"caption colour: {CAPTION_HEX}")
    best = None
    for width in WIDTHS:
        frames, body_h = build_frames(width, font)
        for qname, q in QUANTIZERS:
            for dither in (False, True):
                try:
                    pframes = [quantize(f, q, dither) for f in frames]
                except Exception as e:      # quantizer not available
                    print(f"  {qname}: unavailable ({e})")
                    break
                pframes[0].save(OUT, save_all=True, append_images=pframes[1:],
                                duration=FRAME_MS, loop=0, optimize=False, disposal=1)
                ok, res = verify(frames, body_h, OUT)
                size = OUT.stat().st_size
                tag = f"width {width} {qname} dither={'FS' if dither else 'off'}"
                print(f"{tag}: {size/1e6:.2f} MB, colour checks {'PASS' if ok else 'FAIL'}")
                if ok and (best is None or size < best[0]) and size <= HARD_BYTES:
                    best = (size, width, qname, dither, res, frames, pframes, body_h)
                if ok:
                    break
            else:
                continue
            break
        if best and best[1] == width and best[0] <= TARGET_BYTES:
            break
    if not best:
        raise SystemExit("no build passed every colour check")
    size, width, qname, dither, res, frames, pframes, body_h = best
    pframes[0].save(OUT, save_all=True, append_images=pframes[1:],
                    duration=FRAME_MS, loop=0, optimize=False, disposal=1)
    ok, res = verify(frames, body_h, OUT)
    gif = Image.open(OUT)
    print(f"\nFINAL: {OUT}  {OUT.stat().st_size/1e6:.2f} MB  width {width}  "
          f"frames {gif.n_frames}  size {gif.size}  loop={gif.info.get('loop')}  "
          f"quantizer {qname}  dither={'FS' if dither else 'off'}")
    for i, p in enumerate(pframes):
        gif.seek(i)
        print(f"  frame {i + 1} {IMAGES[i]:32s} palette {len(p.getpalette()) // 3:3d}  "
              f"duration {gif.info.get('duration')} ms  "
              f"error {res[i][1]:.2f}  sat ratio {res[i][2]:.3f}  caption px {res[i][3]}  "
              f"caption {'ok' if res[i][4] else 'BAD'}  tiles {'ok' if res[i][5] else 'BAD'}  "
              f"{'PASS' if res[i][6] else 'FAIL'}")
        if dump:
            Path(dump).mkdir(parents=True, exist_ok=True)
            gif.convert("RGB").save(Path(dump) / f"frame{i + 1:02d}.png")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
