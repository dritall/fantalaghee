#!/usr/bin/env python3
"""
Genera la texture della carta usata dalla Gazzetta del Laghèe.

Il rumore fatto in CSS resta morbido e "digitale" perché viene ingrandito dal
deviceScaleFactor di Puppeteer. Qui invece la carta è una vera texture raster,
generata una volta sola e committata in `public/image/gazzetta/carta.jpg`:

  - grana fine        -> il tono ruvido della cellulosa
  - macchie ampie     -> la disomogeneità dell'impasto (le "nuvole" della carta)
  - fibre orizzontali -> i filamenti che si vedono in controluce

La texture è **ripetibile senza cuciture**: il rumore è filtrato in frequenza con
la FFT, quindi il risultato è periodico per costruzione e si può affiancare.
Va usata in multiply sopra il rosa, così scurisce senza spegnere il colore.

    pip install numpy pillow
    python3 scripts/gazzetta/tools/build_paper.py
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "public" / "image" / "gazzetta" / "carta.jpg"
OUT_VELO = REPO / "public" / "image" / "gazzetta" / "carta-velo.png"

SIZE = 900          # lato della piastrella, in pixel
SEED = 1907         # fisso: la carta non deve cambiare a ogni run


def rumore_periodico(rng: np.random.Generator, size: int, sigma: float) -> np.ndarray:
    """Rumore gaussiano filtrato passa-basso via FFT -> periodico, quindi affiancabile."""
    campo = rng.standard_normal((size, size))
    f = np.fft.fft2(campo)

    # griglia di frequenze (in cicli/pixel) con wrap corretto
    fy = np.fft.fftfreq(size)[:, None]
    fx = np.fft.fftfreq(size)[None, :]
    r2 = fx ** 2 + fy ** 2

    # gaussiana nello spazio delle frequenze = sfocatura gaussiana di raggio sigma
    f *= np.exp(-2 * (np.pi * sigma) ** 2 * r2)
    out = np.real(np.fft.ifft2(f))
    return out / (np.abs(out).max() + 1e-9)


def main() -> int:
    rng = np.random.default_rng(SEED)

    # 1) grana fine: quasi bianco, appena filtrata per non sembrare rumore TV
    grana = rumore_periodico(rng, SIZE, 0.45) * 1.0

    # 2) macchie: variazioni ampie e morbide del tono della carta
    macchie = rumore_periodico(rng, SIZE, 22.0) * 1.0
    macchie += rumore_periodico(rng, SIZE, 7.0) * 0.5

    # 3) fibre: rumore stirato in orizzontale (sfocatura forte su x, minima su y)
    base = rng.standard_normal((SIZE, SIZE))
    f = np.fft.fft2(base)
    fy = np.fft.fftfreq(SIZE)[:, None]
    fx = np.fft.fftfreq(SIZE)[None, :]
    f *= np.exp(-2 * (np.pi ** 2) * ((14.0 ** 2) * fx ** 2 + (0.8 ** 2) * fy ** 2))
    fibre = np.real(np.fft.ifft2(f))
    fibre /= np.abs(fibre).max() + 1e-9

    # Composizione attorno al bianco (1.0 = carta pulita, <1 = zona più scura)
    carta = 1.0 - (0.105 * grana + 0.075 * macchie + 0.065 * fibre)

    # qualche puntino di impurità, come i granelli scuri della carta riciclata
    punti = rng.random((SIZE, SIZE))
    carta[punti > 0.99965] -= 0.22
    carta[punti < 0.00025] += 0.12

    carta = np.clip(carta, 0.0, 1.0)
    img = Image.fromarray((carta * 255).astype(np.uint8), mode="L")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, quality=92, optimize=True, progressive=True)
    print(f"✓ {OUT.relative_to(REPO)}  ({SIZE}×{SIZE}, {OUT.stat().st_size // 1024} KB)")

    # Versione "velo": nero con alfa = quanto la fibra scurisce. Sovrapposta in
    # blending normale fa lo stesso lavoro di un multiply, ma senza dipendere da
    # mix-blend-mode (che in cattura d'elemento con Puppeteer non è affidabile).
    # Serve a far prendere la grana della carta anche alla fotografia.
    alfa = np.clip((1.0 - carta) * 255 * 1.6, 0, 255)
    alfa = (np.round(alfa / 8) * 8).astype(np.uint8)   # meno livelli = PNG più leggero
    velo = Image.merge("RGBA", [
        Image.new("L", (SIZE, SIZE), 26),   # nero d'inchiostro, non nero pieno
        Image.new("L", (SIZE, SIZE), 20),
        Image.new("L", (SIZE, SIZE), 22),
        Image.fromarray(alfa, mode="L"),
    ])
    velo.save(OUT_VELO, optimize=True, compress_level=9)
    print(f"✓ {OUT_VELO.relative_to(REPO)}  ({SIZE}×{SIZE}, {OUT_VELO.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
