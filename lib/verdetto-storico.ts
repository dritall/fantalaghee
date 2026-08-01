import { toNumber } from './numbers.ts';

/**
 * Ricostruzione del verdetto per una giornata qualsiasi.
 *
 * Il foglio del Verdetto è una fotografia dello stato attuale: legge celle a
 * posizione fissa e non conserva lo storico, quindi da lì non si può tornare
 * indietro. Il foglio della classifica invece ha una colonna per giornata
 * (G1…G38) per ogni squadra: è il dato grezzo da cui tutto il resto si
 * ricava.
 *
 * Quello che si può ricalcolare: punteggi e podio di ogni giornata, classifica
 * e leader dopo N giornate, record e peggior prestazione nel periodo.
 * Quello che NON si può: il montepremi, che dipende dalle regole della lega e
 * vive solo nel foglio del Verdetto per la giornata corrente.
 */

export type SquadraRiga = Record<string, unknown> & { Team?: string };

export type PunteggioGiornata = { squadra: string; punteggio: number };

export type VerdettoGiornata = {
    giornata: number;
    /** punteggi della sola giornata, dal più alto al più basso */
    podio: PunteggioGiornata[];
    /** classifica cumulata dopo quella giornata */
    classifica: { squadra: string; punti: number; mediaPunti: number }[];
    leader: string;
    /** miglior punteggio singolo dalla 1ª alla giornata scelta */
    record: (PunteggioGiornata & { giornata: number }) | null;
    /** peggior punteggio singolo nello stesso arco */
    cucchiaio: (PunteggioGiornata & { giornata: number }) | null;
};

/** Colonne delle giornate presenti nel foglio, in ordine numerico. */
export function giornateDisponibili(righe: SquadraRiga[]): number[] {
    const trovate = new Set<number>();
    righe.forEach((r) => {
        Object.keys(r || {}).forEach((k) => {
            const m = k.trim().match(/^G\s*(\d{1,2})$/i);
            if (!m) return;
            // una giornata conta solo se almeno una squadra ha un punteggio
            const n = toNumber(r[k]);
            if (n !== null && n > 0) trovate.add(Number(m[1]));
        });
    });
    return Array.from(trovate).sort((a, b) => a - b);
}

const colonna = (riga: SquadraRiga, g: number): number | null => {
    // il foglio può scrivere "G7" o "G 7"
    const chiave = Object.keys(riga).find((k) => k.trim().replace(/\s+/g, '').toUpperCase() === `G${g}`);
    return chiave ? toNumber(riga[chiave]) : null;
};

const nomeSquadra = (riga: SquadraRiga): string => String(riga.Team ?? '').trim();

/** Punteggi di una singola giornata, ordinati dal migliore. */
export function punteggiDiGiornata(righe: SquadraRiga[], g: number): PunteggioGiornata[] {
    return righe
        .map((r) => ({ squadra: nomeSquadra(r), punteggio: colonna(r, g) }))
        .filter((x): x is PunteggioGiornata => !!x.squadra && x.punteggio !== null)
        .sort((a, b) => b.punteggio - a.punteggio);
}

/** Verdetto completo alla giornata indicata, ricalcolato da zero. */
export function verdettoAllaGiornata(righe: SquadraRiga[], g: number): VerdettoGiornata {
    const podio = punteggiDiGiornata(righe, g);

    // classifica cumulata: somma delle giornate da 1 a g
    const classifica = righe
        .map((r) => {
            const squadra = nomeSquadra(r);
            let punti = 0;
            let giocate = 0;
            for (let i = 1; i <= g; i++) {
                const v = colonna(r, i);
                if (v !== null) {
                    punti += v;
                    giocate++;
                }
            }
            return {
                squadra,
                punti: Math.round(punti * 100) / 100,
                mediaPunti: giocate > 0 ? Math.round((punti / giocate) * 100) / 100 : 0,
            };
        })
        .filter((x) => x.squadra)
        .sort((a, b) => b.punti - a.punti);

    // record e peggior prestazione nell'arco 1..g
    let record: (PunteggioGiornata & { giornata: number }) | null = null;
    let cucchiaio: (PunteggioGiornata & { giornata: number }) | null = null;
    for (let i = 1; i <= g; i++) {
        for (const p of punteggiDiGiornata(righe, i)) {
            if (!record || p.punteggio > record.punteggio) record = { ...p, giornata: i };
            if (!cucchiaio || p.punteggio < cucchiaio.punteggio) cucchiaio = { ...p, giornata: i };
        }
    }

    return {
        giornata: g,
        podio,
        classifica,
        leader: classifica[0]?.squadra ?? 'N/D',
        record,
        cucchiaio,
    };
}
