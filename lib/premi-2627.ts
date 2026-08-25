/**
 * Montepremi ufficiale stagione 2026/27.
 * Totale: 4.130 € (38 squadre paganti × 110 € − 50 € referral).
 * Distribuito integralmente — riserva gestione = 0.
 */

export type VocePremio = { titolo: string; importo: number; nota?: string };

export const QUOTA            = 110;
export const SQUADRE_PAGANTI  = 38;
export const MONTEPREMI_NETTO = 4130;

/** Premio al 1° classificato di giornata */
export const PREMIO_GIORNATA_PRIMO   = 20;
/** Premio al 2° classificato di giornata (novità 2026/27) */
export const PREMIO_GIORNATA_SECONDO = 10;
/** Totale premi di giornata stagione */
export const TOTALE_GIORNATE = (PREMIO_GIORNATA_PRIMO + PREMIO_GIORNATA_SECONDO) * 38; // 1140

export const CLASSIFICA_GENERALE: VocePremio[] = [
  { titolo: '1º classificato', importo: 750 },
  { titolo: '2º classificato', importo: 550 },
  { titolo: '3º classificato', importo: 450 },
  { titolo: '4º classificato', importo: 340 },
];

export const SUPER_LEGA: VocePremio[] = [
  { titolo: 'Vincitrice',      importo: 300 },
  { titolo: 'Finalista',       importo: 200 },
  { titolo: '3° Classificato', importo: 150 },
];

export const COPPA_UEFA: VocePremio[] = [
  { titolo: 'Vincitrice', importo: 100 },
  { titolo: 'Finalista',  importo:  50 },
];

export const MIGLIOR_PUNTEGGIO: VocePremio = {
  titolo: 'Miglior punteggio stagionale',
  importo: 100,
};

// Verifica: 2090 + 100 + 650 + 150 + 1140 = 4130 ✓
