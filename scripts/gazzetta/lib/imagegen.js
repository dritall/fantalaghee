/**
 * Generazione dell'illustrazione hero della copertina.
 *
 * Di default usa Pollinations.ai: gratis, senza chiave API, via semplice URL.
 * Il backend è Flux. In futuro si può passare a un provider a pagamento (FAL, OpenAI)
 * cambiando solo questa funzione e leggendo una chiave da GitHub Secret.
 *
 * Env opzionali:
 *   IMAGE_PROVIDER  - "pollinations" (default)
 *   IMAGE_WIDTH     - default 900
 *   IMAGE_HEIGHT    - default 520
 */

const fs = require('fs');
const path = require('path');

const WIDTH = parseInt(process.env.IMAGE_WIDTH || '900', 10);
const HEIGHT = parseInt(process.env.IMAGE_HEIGHT || '520', 10);

// Suffisso di stile per mantenere coerenza grafica con le vecchie copertine
const STYLE_SUFFIX =
    'vintage satirical sports newspaper editorial illustration, hand-drawn colored ink style, ' +
    'epic and humorous scene set on Lake Como (Lario) with mountains and rowing boats, ' +
    'dramatic lighting, rich detail, NO readable text, no watermark';

/**
 * Genera l'hero da un prompt e lo salva su outPath.
 * @param {string} prompt - descrizione (in inglese) della scena
 * @param {string} outPath - percorso assoluto del file immagine da scrivere
 * @param {object} [opts]
 * @param {number} [opts.seed] - seed per riproducibilità
 * @returns {Promise<string>} outPath
 */
async function generateHero(prompt, outPath, opts = {}) {
    const provider = process.env.IMAGE_PROVIDER || 'pollinations';
    if (provider !== 'pollinations') {
        throw new Error(`IMAGE_PROVIDER "${provider}" non supportato (per ora solo pollinations).`);
    }

    const fullPrompt = `${prompt}. ${STYLE_SUFFIX}`;
    const seed = opts.seed ?? Math.floor(Math.random() * 1e6);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}`
        + `?width=${WIDTH}&height=${HEIGHT}&nologo=true&model=flux&seed=${seed}&referrer=fantalaghee`;

    const res = await fetch(url, { headers: { 'Accept': 'image/*' } });
    if (!res.ok) {
        throw new Error(`Pollinations ha risposto ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) {
        throw new Error(`Immagine generata troppo piccola (${buf.length} byte): probabile errore.`);
    }
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buf);
    return outPath;
}

module.exports = { generateHero };
