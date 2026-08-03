"use client";

/**
 * Il tema del sito.
 *
 * Una volta cambiava con l'ora (chiaro di giorno, scuro di sera) e questo hook
 * lo leggeva da <html>. Ora la palette è fissa e diurna: il tema è sempre
 * chiaro. L'hook resta — così i pochi punti che calcolano colori invece di
 * dichiararli (i colori delle squadre) non vanno toccati — ma ritorna una
 * costante.
 */

import type { Tema } from './team-colors';

export function usaTema(): Tema {
    return 'chiaro';
}
