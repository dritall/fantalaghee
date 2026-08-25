/**
 * Montepremi della stagione 2025/26, ricostruito dal Verdetto dell'ultima
 * giornata.
 *
 * Serve come riferimento finché i premi 2026/27 non vengono comunicati (entro
 * l'inizio della 5ª giornata, perché dipendono dal numero di iscritti). Il
 * regolamento non li scrive: questi numeri sono quelli realmente assegnati.
 *
 * Verifica che tiene in piedi tutto il resto: i premi di giornata sommano
 * 950 🍆, cioè esattamente 25 × 38 giornate. Da lì si ricava che il premio di
 * giornata vale 25 🍆, diviso in parti uguali quando due o più squadre
 * chiudono il turno a pari punteggio.
 */

export type VocePremio = { titolo: string; importo: number; nota?: string };

export const STAGIONE_RIFERIMENTO = '2025/26';
/** Squadre della stagione di riferimento. Per quella in corso: `SQUADRE_ISCRITTE`. */
export const ISCRITTI_RIFERIMENTO = 50;
export const QUOTA = 110;
export const GIORNATE = 38;

/** Quello che ogni giornata mette in palio per il miglior punteggio. */
export const PREMIO_GIORNATA = 25;

export const CLASSIFICA_GENERALE: VocePremio[] = [
    { titolo: '1º classificato', importo: 850 },
    { titolo: '2º classificato', importo: 650 },
    { titolo: '3º classificato', importo: 500 },
    { titolo: '4º classificato', importo: 350 },
    { titolo: '5º classificato', importo: 220 },
];

export const SUPER_LEGA: VocePremio[] = [
    { titolo: 'Vincitrice', importo: 350 },
    { titolo: 'Finalista', importo: 250 },
    { titolo: 'Semifinaliste', importo: 150, nota: 'a testa' },
];

export const COPPA_UEFA: VocePremio[] = [
    { titolo: 'Vincitrice', importo: 100 },
    { titolo: 'Finalista', importo: 50 },
];

export const MIGLIOR_PUNTEGGIO: VocePremio = {
    titolo: 'Miglior punteggio stagionale',
    importo: 100,
    nota: 'Cippalippa1418, 112,5 punti alla 24ª',
};

const somma = (voci: VocePremio[]) =>
    voci.reduce((t, v) => t + v.importo * (v.nota === 'a testa' ? 2 : 1), 0);

export const TOTALE_GIORNATE = PREMIO_GIORNATA * GIORNATE;
export const TOTALE_CLASSIFICA = somma(CLASSIFICA_GENERALE);
export const TOTALE_COPPE = somma(SUPER_LEGA) + somma(COPPA_UEFA);
export const TOTALE_DISTRIBUITO =
    TOTALE_GIORNATE + TOTALE_CLASSIFICA + TOTALE_COPPE + MIGLIOR_PUNTEGGIO.importo;
export const MONTEPREMI_LORDO = ISCRITTI_RIFERIMENTO * QUOTA;
export const GESTIONE_LEGA = MONTEPREMI_LORDO - TOTALE_DISTRIBUITO;
