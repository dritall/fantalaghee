"use client";

/**
 * Il tema in corso, chiaro o scuro.
 *
 * Lo scrive SfondoLario sull'elemento <html> in base all'ora. Serve ai
 * componenti che calcolano colori invece di dichiararli — i colori delle
 * squadre, per esempio, che vanno schiariti di sera e scuriti di giorno.
 */

import { useEffect, useState } from 'react';
import type { Tema } from './team-colors';

export function usaTema(): Tema {
    const [tema, setTema] = useState<Tema>('scuro');

    useEffect(() => {
        const leggi = () =>
            setTema(document.documentElement.dataset.tema === 'chiaro' ? 'chiaro' : 'scuro');
        leggi();
        const osservatore = new MutationObserver(leggi);
        osservatore.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
        return () => osservatore.disconnect();
    }, []);

    return tema;
}
