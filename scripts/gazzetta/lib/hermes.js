/**
 * Chiamata a Hermes (Nous Research) tramite un provider OpenAI-compatible
 * (default: OpenRouter). Restituisce la bozza dell'articolo come oggetto JS.
 *
 * Variabili d'ambiente:
 *   HERMES_API_KEY   - chiave del provider (OpenRouter/Together/Fireworks)   [RICHIESTA]
 *   HERMES_MODEL     - nome del modello (default: nousresearch/hermes-4-405b)
 *   HERMES_BASE_URL  - endpoint chat/completions (default: OpenRouter)
 */

const { buildPrompt } = require('./prompt');

const BASE_URL = process.env.HERMES_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.HERMES_MODEL || 'nousresearch/hermes-4-405b';

/**
 * Estrae il primo blocco JSON valido da una risposta testuale del modello.
 */
function estraiJson(testo) {
    if (!testo) throw new Error('Risposta vuota dal modello.');
    // togli eventuali fence ```json ... ```
    const senzaFence = testo.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const start = senzaFence.indexOf('{');
    const end = senzaFence.lastIndexOf('}');
    if (start === -1 || end === -1) {
        throw new Error('Nessun JSON trovato nella risposta del modello:\n' + testo.slice(0, 500));
    }
    const jsonStr = senzaFence.slice(start, end + 1);
    return JSON.parse(jsonStr);
}

function validaBozza(b) {
    const mancanti = [];
    for (const k of ['title', 'description', 'body_md', 'cover']) {
        if (!b[k]) mancanti.push(k);
    }
    if (b.cover) {
        for (const k of ['titolo_principale', 'sottotitolo', 'box1', 'box2', 'box3']) {
            if (!b.cover[k]) mancanti.push(`cover.${k}`);
        }
    }
    if (mancanti.length) {
        throw new Error('Bozza incompleta, campi mancanti: ' + mancanti.join(', '));
    }
    return b;
}

/**
 * Genera la bozza dell'articolo con Hermes.
 * @param {string} datiTesto - dati giornata in testo (da datiGiornataInTesto)
 * @param {object} [opts]
 * @param {string} [opts.correzione] - istruzione di correzione dell'utente
 * @returns {Promise<object>} bozza { slug, title, description, body_md, cover }
 */
async function generaArticolo(datiTesto, opts = {}) {
    const apiKey = process.env.HERMES_API_KEY;
    if (!apiKey) {
        throw new Error('HERMES_API_KEY non impostata. Configura la chiave del provider (es. OpenRouter) prima di generare.');
    }

    const { system, user } = buildPrompt(datiTesto, opts.correzione);

    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            // header consigliati da OpenRouter (facoltativi, ignorati da altri provider)
            'HTTP-Referer': process.env.SITE_URL || 'https://www.fantalaghee.live',
            'X-Title': 'Gazzetta del Laghee',
        },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0.9,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        }),
    });

    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Errore da Hermes (${res.status}): ${t.slice(0, 500)}`);
    }

    const data = await res.json();
    const testo = data?.choices?.[0]?.message?.content;
    const bozza = estraiJson(testo);
    return validaBozza(bozza);
}

module.exports = { generaArticolo, MODEL };
