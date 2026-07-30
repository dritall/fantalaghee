#!/usr/bin/env python3
"""
Genera la testata vettoriale (logo) de "La Gazzetta del Laghèe".

Il logo NON è testo renderizzato a runtime: viene convertito una volta sola in
tracciati SVG e committato in `public/image/gazzetta/masthead.svg`. Così la
copertina PNG e il sito mostrano sempre lo stesso identico marchio, anche se
Google Fonts non risponde o il font non è installato sulla macchina che renderizza.

Rilancialo solo se vuoi cambiare le parole o la crenatura del marchio:

    pip install fonttools brotli uharfbuzz
    python3 scripts/gazzetta/tools/build_masthead.py

Font sorgente: Playfair Display Black (SIL Open Font License 1.1) — didone dal
contrasto marcato, la stessa famiglia di grazie usata dalle testate sportive.
"""

import os
import subprocess
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "public" / "image" / "gazzetta" / "masthead.svg"
CACHE = Path(os.environ.get("MASTHEAD_CACHE", "/tmp/masthead-fonts"))

FONTS = {
    "roman": (
        "pf-black.woff2",
        "https://fonts.gstatic.com/s/playfairdisplay/v40/"
        "nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKfsunDXbtM.woff2",
    ),
    "italic": (
        "pf-black-italic.woff2",
        "https://fonts.gstatic.com/s/playfairdisplay/v40/"
        "nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_gGUXtHA-Q.woff2",
    ),
}

# Le parole del marchio: (testo, stile, crenatura extra in unità/em ×1000).
# Tutto in tondo e ben serrato, come sulle copertine storiche della Gazzetta
# del Laghèe: la testata deve occupare la riga da un margine all'altro.
WORDS = [
    ("La", "roman", -20),
    ("Gazzetta", "roman", -24),
    ("del", "roman", -20),
    ("Laghèe", "roman", -24),
]
WORD_SPACE = 165      # spazio fra parole, in unità/em ×1000
UPEM_TARGET = 1000    # tutto normalizzato su una em da 1000
CONDENSE = 0.94       # leggera compressione orizzontale: più "peso" da testata


def fetch(name: str, url: str) -> Path:
    """Scarica il woff2 e lo decomprime in .ttf (HarfBuzz non legge il woff2)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / name
    if not dest.exists():
        subprocess.run(
            ["curl", "-sSf", "-A", "Mozilla/5.0 (X11; Linux x86_64) Chrome/120", "-o", str(dest), url],
            check=True,
        )
    ttf = dest.with_suffix(".ttf")
    if not ttf.exists():
        f = TTFont(dest)
        f.flavor = None
        f.save(ttf)
    return ttf


def shape(path: Path, text: str):
    """Restituisce (glyph_id, x_advance, x_offset) crenati da HarfBuzz."""
    blob = hb.Blob.from_file_path(str(path))
    face = hb.Face(blob)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    return [
        (info.codepoint, pos.x_advance, pos.x_offset)
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions)
    ], face.upem


def main() -> int:
    ttfs, upems, glyph_orders = {}, {}, {}
    for style, (name, url) in FONTS.items():
        p = fetch(name, url)
        tt = TTFont(p)
        ttfs[style] = tt
        upems[style] = tt["head"].unitsPerEm
        glyph_orders[style] = tt.getGlyphOrder()

    paths, x = [], 0
    for text, style, tracking in WORDS:
        tt, upem = ttfs[style], upems[style]
        glyphset = tt.getGlyphSet()
        shaped, hb_upem = shape(fetch(*FONTS[style]), text)
        scale = UPEM_TARGET / upem
        for gid, adv, off in shaped:
            gname = glyph_orders[style][gid]
            pen = SVGPathPen(glyphset)
            glyphset[gname].draw(pen)
            d = pen.getCommands()
            if d:
                # y va invertito: le coordinate font salgono, quelle SVG scendono
                paths.append(
                    f'<path transform="translate({(x + off * scale) * CONDENSE:.1f} 0) '
                    f'scale({scale * CONDENSE:.5f} {-scale:.5f})" d="{d}"/>'
                )
            x += adv * scale + tracking
        x += WORD_SPACE
    x *= CONDENSE

    width = round(x - WORD_SPACE * CONDENSE)
    # cap-height + discendenti di Playfair: riquadro generoso, ritagliato dal viewBox
    top, bottom = -760, 220
    height = bottom - top

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {top} {width} {height}" width="{width}" height="{height}" role="img" aria-label="La Gazzetta del Laghèe">
  <title>La Gazzetta del Laghèe</title>
  <g fill="currentColor">
{chr(10).join('    ' + p for p in paths)}
  </g>
</svg>
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(svg, encoding="utf-8")
    print(f"✓ {OUT.relative_to(REPO)}  ({width}×{height}, {len(paths)} glifi)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
