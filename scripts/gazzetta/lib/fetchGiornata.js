/**
 * Legge i dati della giornata dal foglio Google, riusando la logica di parsing
 * già collaudata in app/api/verdetto/route.ts.
 *
 * Strategia: chiama l'endpoint /api/verdetto del sito già deployato (che fa da
 * "source of truth" per il parsing delle celle del foglio). Così non duplichiamo
 * qui gli indici hardcoded delle celle, che sono fragili.
 *
 * Se il sito non è raggiungibile, si può passare a un parsing diretto del CSV
 * (fallback non ancora implementato: per ora l'endpoint è la via unica).
 */

const SITE_URL = process.env.SITE_URL || 'https://www.fantalaghee.live';
const STAGIONE = process.env.STAGIONE || '2627';

/**
 * @param {object} [opts]
 * @param {string} [opts.stagione] - slug stagione (default: env STAGIONE o 2627)
 * @returns {Promise<object>} dati strutturati della giornata (podio, premi, record, ...)
 */
async function fetchGiornata(opts = {}) {
    const stagione = opts.stagione || STAGIONE;
    const url = `${SITE_URL}/api/verdetto?stagione=${stagione}&_t=${Date.now()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error(`Impossibile leggere i dati della giornata da ${url}: ${res.status} ${res.statusText}`);
    }
    const dati = await res.json();

    if (!dati || !dati.numeroGiornata) {
        throw new Error('I dati della giornata sono vuoti o non contengono numeroGiornata. Foglio non ancora aggiornato?');
    }

    return dati;
}

/**
 * Rende i dati grezzi in un blocco di testo compatto e leggibile,
 * pensato per essere passato come contesto all'LLM (Hermes).
 */
function datiGiornataInTesto(d) {
    const podio = (d.podio || [])
        .map((p, i) => `  ${i + 1}. ${p.squadra} — ${p.punteggio}`)
        .join('\n');

    const classifica = (d.classifica || [])
        .map((c, i) => `  ${i + 1}. ${c.squadra} — ${c.punti} pt (media ${c.mediaPunti})`)
        .join('\n');

    const premiGiornata = (d.premi?.giornata || [])
        .filter(p => p.squadra || p.premio)
        .map(p => `  ${p.squadra}: ${p.premio}`)
        .join('\n');

    return `
GIORNATA: ${d.numeroGiornata}
LEADER ATTUALE (classifica generale): ${d.leaderAttuale}
CAMPIONE DI GIORNATA: ${d.campioneDiGiornata}

PODIO DI GIORNATA:
${podio || '  (n/d)'}

CLASSIFICA GENERALE (top squadre):
${classifica || '  (n/d)'}

RECORD ASSOLUTO: ${d.recordAssoluto?.punteggio || 'n/d'} pt (${d.recordAssoluto?.squadra || 'n/d'}, giornata ${d.recordAssoluto?.giornata || 'n/d'})
CUCCHIAIO DI LEGNO (peggiore): ${d.cucchiaioDiLegno?.punteggio || 'n/d'} pt (${d.cucchiaioDiLegno?.squadra || 'n/d'}, giornata ${d.cucchiaioDiLegno?.giornata || 'n/d'})

PREMI DI GIORNATA:
${premiGiornata || '  (n/d)'}
`.trim();
}

module.exports = { fetchGiornata, datiGiornataInTesto };
