/**
 * Pubblicazione dell'articolo: scrive il .md (con frontmatter), genera l'immagine
 * di copertina e — se richiesto — committa e pusha sul branch di produzione,
 * facendo scattare l'auto-deploy di Vercel.
 *
 * Variabili d'ambiente:
 *   PUBLISH_BRANCH - branch su cui pubblicare (default: main)
 *   SITE_URL       - base url del sito (default: https://www.fantalaghee.live)
 *   AUTHOR_NAME    - autore mostrato nel frontmatter (default: "L'Oracolo del Laghèe")
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { renderCover } = require('../genera_gazzetta');

const REPO_ROOT = path.join(__dirname, '../../..');
const MD_DIR = path.join(REPO_ROOT, 'public', 'articoli', 'md');
const IMG_DIR = path.join(REPO_ROOT, 'public', 'image', 'gazzetta');

const SITE_URL = process.env.SITE_URL || 'https://www.fantalaghee.live';
const PUBLISH_BRANCH = process.env.PUBLISH_BRANCH || 'main';
const AUTHOR_NAME = process.env.AUTHOR_NAME || "L'Oracolo del Laghèe";

const MESI = ['GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO',
    'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'];
const GIORNI = ['DOMENICA', 'LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ', 'SABATO'];

/** Stringa data per la top-bar della copertina, es. "GIORNATA 31 — LUNEDÌ 3 NOVEMBRE 2025" */
function topBarDate(numeroGiornata, d = new Date()) {
    return `GIORNATA ${numeroGiornata} — ${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}

function slugify(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Prepara i file dell'articolo (md + immagine) sul filesystem, SENZA git.
 * @param {object} bozza - output di Hermes { slug, title, description, body_md, cover }
 * @param {object} dati  - dati giornata (per numeroGiornata)
 * @returns {Promise<{slug, mdPath, imgPath, imageUrl, liveUrl}>}
 */
async function preparaFile(bozza, dati) {
    const numeroGiornata = dati?.numeroGiornata || '';
    const slug = bozza.slug ? slugify(bozza.slug) : `gazzetta-g${numeroGiornata}`;
    const isoDate = new Date().toISOString().slice(0, 10);

    // 1. Immagine di copertina
    const imgFilename = `${slug}.png`;
    const imgPath = path.join(IMG_DIR, imgFilename);
    const imageUrl = `/image/gazzetta/${imgFilename}`;
    const coverData = {
        data: topBarDate(numeroGiornata),
        titolo_principale: bozza.cover.titolo_principale,
        sottotitolo: bozza.cover.sottotitolo,
        img_principale: null,
        box1: bozza.cover.box1,
        box2: bozza.cover.box2,
        box3: bozza.cover.box3,
    };
    await renderCover(coverData, imgPath);

    // 2. File markdown con frontmatter
    const frontmatter = [
        '---',
        `title: ${JSON.stringify(bozza.title)}`,
        `date: ${JSON.stringify(isoDate)}`,
        `description: ${JSON.stringify(bozza.description)}`,
        `author: ${JSON.stringify(AUTHOR_NAME)}`,
        `image: ${JSON.stringify(imageUrl)}`,
        '---',
        '',
    ].join('\n');

    const mdPath = path.join(MD_DIR, `${slug}.md`);
    fs.mkdirSync(MD_DIR, { recursive: true });
    fs.writeFileSync(mdPath, frontmatter + bozza.body_md.trim() + '\n', 'utf8');

    return { slug, mdPath, imgPath, imageUrl, liveUrl: `${SITE_URL}/gazzetta/${slug}` };
}

/** Esegue git in modo sincrono dalla root del repo. */
function git(args) {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

/**
 * Committa e pusha i file sul branch di produzione -> Vercel deploya.
 * @param {{slug, mdPath, imgPath}} file
 * @param {object} dati
 */
function commitEPush(file, dati) {
    // Ci assicuriamo di essere sul branch di pubblicazione e aggiornati
    git(['checkout', PUBLISH_BRANCH]);
    try { git(['pull', '--ff-only', 'origin', PUBLISH_BRANCH]); } catch { /* offline o già aggiornato */ }

    git(['add', file.mdPath, file.imgPath]);
    const msg = `Gazzetta: articolo giornata ${dati?.numeroGiornata || ''} (${file.slug})`;
    git(['commit', '-m', msg]);

    // push con un paio di retry per errori di rete
    let ultimoErrore;
    for (let i = 0; i < 3; i++) {
        try { git(['push', 'origin', PUBLISH_BRANCH]); return; }
        catch (e) { ultimoErrore = e; }
    }
    throw ultimoErrore;
}

module.exports = { preparaFile, commitEPush, topBarDate, PUBLISH_BRANCH, SITE_URL };
