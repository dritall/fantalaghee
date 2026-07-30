#!/usr/bin/env node
/**
 * Generazione dell'illustrazione hero della copertina.
 *
 * Catena di provider, in ordine (si scende al successivo solo quando quello sopra
 * ha esaurito i tentativi):
 *   1. google       - Nano Banana 2 via Gemini API (GEMINI_API_KEY) - primario
 *   2. openrouter   - Image API unificata (OPENROUTER_API_KEY) - scorta
 *   3. pollinations - gratis, senza chiave, nessun riferimento di stile - ultima rete
 *
 * I provider "google" e "openrouter" ricevono in ingresso, insieme al prompt, due
 * copertine storiche della testata come riferimento di stile (vedi loadStyleRefs),
 * così la nuova illustrazione nasce nello stesso linguaggio visivo.
 *
 * Env opzionali:
 *   IMAGE_PROVIDERS      - lista provider separata da virgole (default "google,openrouter,pollinations")
 *   IMAGE_STYLE_REFS     - lista path (relativi a /public) separata da virgole per i riferimenti di stile
 *   IMAGE_WIDTH          - default 900 (solo pollinations)
 *   IMAGE_HEIGHT         - default 520 (solo pollinations)
 *   GEMINI_API_KEY       - chiave Gemini
 *   GEMINI_IMAGE_MODEL   - default "gemini-3.1-flash-image"
 *   OPENROUTER_API_KEY   - chiave OpenRouter
 *   OPENROUTER_IMAGE_MODEL - default "google/gemini-3.1-flash-image"
 *
 * CLI di test (nessuna scrittura nel repo):
 *   GEMINI_API_KEY=... node scripts/gazzetta/lib/imagegen.js "<prompt>" /tmp/hero.png
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '../../..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

const WIDTH = parseInt(process.env.IMAGE_WIDTH || '900', 10);
const HEIGHT = parseInt(process.env.IMAGE_HEIGHT || '520', 10);

const DEFAULT_PROVIDERS = ['google', 'openrouter', 'pollinations'];
// Copertine storiche di riferimento: sono quelle nello stile fumetto-caricatura ricco e
// affollato che vogliamo imitare. Sovrascrivibili con IMAGE_STYLE_REFS.
const DEFAULT_STYLE_REFS = [
    '/image/gazzetta/edizione-straordinaria-2627.webp',
    '/image/gazzetta/trilogia-del-potere.webp',
    '/image/gazzetta/speciale-giro-di-boa.webp',
];
const DEFAULT_TENTATIVI = 2;
const SEED_STEP = 1000;
const MIN_BYTES = 20000;

const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const OPENROUTER_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-3.1-flash-image';

// Risoluzione dell'immagine. Il riquadro hero del template è 900x520 renderizzato a 2x
// (~1800px reali): a "1K" (~1024px) l'immagine viene ingrandita e risulta morbida, quindi
// il default è "2K" per una copertina nitida. Override con GEMINI_IMAGE_SIZE / OPENROUTER_RESOLUTION
// (rimetti "1K" se un modello non accetta "2K").
const GEMINI_IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE || '2K';
const OPENROUTER_RESOLUTION = process.env.OPENROUTER_RESOLUTION || '2K';

// Suffisso di stile per mantenere coerenza grafica con le vecchie copertine.
// Descrive la testata (non la scena, che la scrive Hermes nel prompt).
// Obiettivo: fumetto MODERNO, pulito e leggibile - ogni personaggio e oggetto si deve
// riconoscere a colpo d'occhio. Da evitare come la peste il look "vignetta retrò da
// settimanale enigmistico" (texture di stampa vintage, retini, xilografia, colori spenti),
// che è quello che il modello produceva prima.
const STYLE_SUFFIX =
    'Modern polished full-color comic illustration for the front page of a satirical ' +
    'fantasy-football newspaper. Contemporary digital cartoon art with crisp clean ink outlines, ' +
    'bright saturated colors, smooth cel shading and highlights, expressive caricatured characters ' +
    'and mascots with big readable faces. ' +
    'CLARITY IS ESSENTIAL: every character, animal, object and prop must be drawn cleanly and be ' +
    'instantly recognizable for what it is - solid well-defined shapes, correct anatomy and ' +
    'proportions, no vague blobs, no mushy or scribbly details, no ambiguous shapes. ' +
    'The scene must be BUSY and PACKED, not sparse: one clear hero action in the foreground, PLUS ' +
    'several extra comic elements around it - side characters reacting, mascot animals, sight-gag ' +
    'props relevant to the story. Many things to look at, but each one crisply drawn. ' +
    'Setting: Lake Como (Lario) with mountains, a rowing boat and lakeside villages in the background. ' +
    'Irreverent, cheeky, fun modern humor - never mean-spirited, never dated. ' +
    'ABSOLUTELY AVOID: vintage or retro print look, old newspaper cartoon style, halftone dot ' +
    'texture, woodcut / engraving / linocut / risograph, aged paper texture, muted washed-out ' +
    'palette, sketchy scratchy linework, painterly realism, photorealism, 3D render, ' +
    'single isolated subject on an empty background. ' +
    'Loose free edges suitable for cropping. ' +
    'NO readable text, letters, numbers, watermark, signature or logo of any kind.';

// Istruzione testuale che accompagna i riferimenti di stile (solo google/openrouter)
const STYLE_REF_INSTRUCTION =
    'The attached images are past covers of "La Gazzetta del Laghèe", a satirical fantasy-football ' +
    'newspaper. Match their style very closely: the same modern, clean, brightly colored comic ' +
    'illustration look, crisp ink outlines, expressive caricatured faces, recurring mascots, and ' +
    'the same BUSY composition with several elements sharing the frame. Note especially how every ' +
    'single element in them is drawn clearly and is immediately recognizable, and how bright and ' +
    'contemporary the colors are - not faded, not retro-print, not a vintage newspaper cartoon. ' +
    'Do NOT copy their exact subject or layout: the scene comes only from the prompt below.';

const MIME_BY_EXT = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/**
 * Carica le copertine storiche di riferimento come base64, per guidare lo stile.
 * Salta silenziosamente i file mancanti; se non ne resta nessuno logga un avviso.
 * @returns {{mime: string, data: string, path: string}[]}
 */
function loadStyleRefs() {
    const refs = process.env.IMAGE_STYLE_REFS
        ? process.env.IMAGE_STYLE_REFS.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_STYLE_REFS;

    const out = [];
    for (const rel of refs) {
        const filePath = path.join(PUBLIC_DIR, rel.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) continue;
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_BY_EXT[ext] || 'image/webp';
        out.push({ mime, data: fs.readFileSync(filePath).toString('base64'), path: filePath });
    }
    if (out.length === 0) {
        console.warn('⚠ Nessun riferimento di stile trovato: la coerenza grafica con le copertine storiche non è garantita.');
    }
    return out;
}

/** Valida il buffer immagine: dimensione minima e magic bytes di PNG/JPEG/WEBP. */
function isValidImageBuffer(buf) {
    if (!buf || buf.length < MIN_BYTES) return false;
    if (buf[0] === 0x89 && buf[1] === 0x50) return true; // PNG
    if (buf[0] === 0xff && buf[1] === 0xd8) return true; // JPEG
    if (buf.slice(0, 4).toString('ascii') === 'RIFF') return true; // WEBP
    return false;
}

// --- Provider: Google (Nano Banana 2 via Gemini API) ---

async function generaConGoogle(prompt, seed, styleRefs) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY non configurata');

    const parts = [{ text: STYLE_REF_INSTRUCTION }];
    for (const ref of styleRefs) {
        parts.push({ inline_data: { mime_type: ref.mime, data: ref.data } });
    }
    parts.push({ text: `${prompt} ${STYLE_SUFFIX}` });

    const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: '16:9', imageSize: GEMINI_IMAGE_SIZE },
                seed,
            },
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Gemini ha risposto ${res.status}: ${body.slice(0, 300)}`);
    }

    const json = await res.json();
    const cand = json?.candidates?.[0];
    const resParts = cand?.content?.parts || [];
    for (const p of resParts) {
        const inline = p.inlineData || p.inline_data;
        if (inline?.data) return Buffer.from(inline.data, 'base64');
    }
    throw new Error(`Gemini non ha restituito un'immagine (finishReason: ${cand?.finishReason || 'sconosciuto'})`);
}

// --- Provider: OpenRouter Image API (scorta) ---

async function generaConOpenRouter(prompt, seed, styleRefs) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY non configurata');

    const body = {
        model: OPENROUTER_MODEL,
        prompt: `${prompt} ${STYLE_SUFFIX}`,
        aspect_ratio: '16:9',
        resolution: OPENROUTER_RESOLUTION,
        output_format: 'png',
        seed,
    };
    if (styleRefs.length > 0) {
        body.input_references = styleRefs.map(ref => ({
            type: 'image_url',
            image_url: { url: `data:${ref.mime};base64,${ref.data}` },
        }));
    }

    const res = await fetch('https://openrouter.ai/api/v1/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenRouter ha risposto ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenRouter non ha restituito b64_json');
    if (json?.usage?.cost != null) {
        console.log(`  ↳ costo generazione OpenRouter: $${json.usage.cost}`);
    }
    return Buffer.from(b64, 'base64');
}

// --- Provider: Pollinations (gratis, senza chiave, nessun riferimento di stile) ---

async function generaConPollinations(prompt, seed) {
    const fullPrompt = `${prompt} ${STYLE_SUFFIX}`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}`
        + `?width=${WIDTH}&height=${HEIGHT}&nologo=true&model=flux&seed=${seed}&referrer=fantalaghee`;

    const res = await fetch(url, { headers: { 'Accept': 'image/*' } });
    if (!res.ok) {
        throw new Error(`Pollinations ha risposto ${res.status} ${res.statusText}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

const PROVIDERS = {
    google: generaConGoogle,
    openrouter: generaConOpenRouter,
    pollinations: (prompt, seed) => generaConPollinations(prompt, seed),
};

/**
 * Genera l'hero da un prompt, provando la catena di provider in ordine, e lo salva su outPath.
 * @param {string} prompt - descrizione (in inglese) della scena
 * @param {string} outPath - percorso assoluto del file immagine da scrivere
 * @param {object} [opts]
 * @param {number} [opts.seed] - seed base per riproducibilità (incrementato di 1000 a ogni tentativo)
 * @param {number} [opts.tentativi] - tentativi per provider (default 2)
 * @returns {Promise<string>} outPath
 */
async function generateHero(prompt, outPath, opts = {}) {
    const providers = process.env.IMAGE_PROVIDERS
        ? process.env.IMAGE_PROVIDERS.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_PROVIDERS;
    const tentativi = opts.tentativi ?? DEFAULT_TENTATIVI;
    const seedBase = opts.seed ?? Math.floor(Math.random() * 1e6);
    const styleRefs = loadStyleRefs();

    const errori = [];
    for (const nome of providers) {
        const fn = PROVIDERS[nome];
        if (!fn) {
            errori.push(`${nome}: provider sconosciuto`);
            continue;
        }
        for (let i = 0; i < tentativi; i++) {
            const seed = seedBase + i * SEED_STEP;
            try {
                const buf = await fn(prompt, seed, styleRefs);
                if (!isValidImageBuffer(buf)) {
                    throw new Error(`buffer non valido (${buf ? buf.length : 0} byte)`);
                }
                fs.mkdirSync(path.dirname(outPath), { recursive: true });
                fs.writeFileSync(outPath, buf);
                console.log(`✓ hero generato con ${nome} (tentativo ${i + 1}/${tentativi}, seed ${seed})`);
                return outPath;
            } catch (e) {
                console.warn(`⚠ ${nome} tentativo ${i + 1}/${tentativi} fallito: ${e.message}`);
                errori.push(`${nome} (tentativo ${i + 1}): ${e.message}`);
            }
        }
    }

    throw new Error(`Tutti i provider immagine sono falliti:\n${errori.join('\n')}`);
}

module.exports = { generateHero, loadStyleRefs, STYLE_SUFFIX };

// --- CLI: `node imagegen.js "<prompt>" <outPath>` - prova un prompt senza toccare il repo ---
if (require.main === module) {
    const [, , prompt, outPath] = process.argv;
    if (!prompt || !outPath) {
        console.error('Uso: node scripts/gazzetta/lib/imagegen.js "<prompt>" <outPath>');
        process.exit(1);
    }
    generateHero(prompt, outPath)
        .then(p => console.log(`✓ Immagine salvata: ${p}`))
        .catch(err => { console.error(err.message); process.exit(1); });
}
