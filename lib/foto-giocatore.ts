"use client";

import { useEffect, useState } from 'react';
import type { NormalizedPlayer } from './lega-normalize';

/**
 * Sceglie la foto del giocatore scendendo lungo gli indirizzi possibili.
 *
 * Lega pubblica la stessa faccia su due host e in tre inquadrature, e non
 * sempre tutte esistono: `NormalizedPlayer.photos` le elenca in ordine, qui si
 * tiene il posto nella lista e si passa alla successiva ogni volta che il
 * browser fallisce. Quando finiscono, `src` è `null` e chi chiama mostra il
 * numero di maglia. È lo stesso comportamento degli stemmi in `TeamLogo`.
 */
export function usaFotoGiocatore(player: NormalizedPlayer | null | undefined) {
    // le vecchie risposte in cache hanno solo `photo`: non lasciamole senza foto
    const urls = player?.photos?.length ? player.photos : player?.photo ? [player.photo] : [];
    const chiave = urls[0] ?? '';
    const [indice, setIndice] = useState(0);

    // cambiando giocatore si riparte dal primo indirizzo
    useEffect(() => setIndice(0), [chiave]);

    return {
        src: indice < urls.length ? urls[indice] : null,
        onError: () => setIndice((i) => i + 1),
    };
}
