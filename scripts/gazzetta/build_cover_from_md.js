#!/usr/bin/env node
/**
 * Genera l'immagine di copertina leggendo i dati dal frontmatter di un articolo .md.
 *
 * È il pezzo eseguito dalla GitHub Action: quando Hermes committa un articolo con un
 * blocco `cover:` nel frontmatter e un `image:` che punta a un PNG non ancora esistente,
 * questo script rende il PNG e lo salva al percorso indicato da `image`.
 *
 * Uso:
 *   node scripts/gazzetta/build_cover_from_md.js <file.md>     # un file specifico
 *   node scripts/gazzetta/build_cover_from_md.js --all         # tutti gli .md con immagine mancante
 *
 * Frontmatter atteso:
 *   image: /image/gazzetta/gazzetta-g31.png
 *   cover:
 *     giornata: 31
 *     titolo_principale: "..."
 *     sottotitolo: "..."
 *     box1: { tag: "...", titolo: "...", testo: "..." }
 *     box2: { ... }
 *     box3: { ... }
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { renderCover } = require('./genera_gazzetta');
const { topBarDate } = require('./lib/publish');

const REPO_ROOT = path.join(__dirname, '../..');
const MD_DIR = path.join(REPO_ROOT, 'public', 'articoli', 'md');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

function imageAbsPath(imageUrl) {
    // imageUrl è tipo "/image/gazzetta/gazzetta-g31.png" -> lo mappo dentro /public
    return path.join(PUBLIC_DIR, imageUrl.replace(/^\//, ''));
}

/** @returns {Promise<string|null>} percorso PNG generato, o null se saltato */
async function buildOne(mdPath, { force = false } = {}) {
    const raw = fs.readFileSync(mdPath, 'utf8');
    const { data } = matter(raw);

    if (!data.cover || !data.image) {
        console.log(`· salto ${path.basename(mdPath)} (nessun blocco cover/image)`);
        return null;
    }
    const outPath = imageAbsPath(data.image);
    if (fs.existsSync(outPath) && !force) {
        console.log(`· salto ${path.basename(mdPath)} (immagine già presente: ${data.image})`);
        return null;
    }

    const c = data.cover;
    const coverData = {
        data: c.data || topBarDate(c.giornata ?? ''),
        titolo_principale: c.titolo_principale,
        sottotitolo: c.sottotitolo,
        img_principale: c.img_principale || null,
        box1: c.box1,
        box2: c.box2,
        box3: c.box3,
    };

    await renderCover(coverData, outPath);
    console.log(`✓ generata ${data.image}  (da ${path.basename(mdPath)})`);
    return outPath;
}

async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');

    let files;
    if (args.includes('--all')) {
        files = fs.readdirSync(MD_DIR).filter(f => f.endsWith('.md')).map(f => path.join(MD_DIR, f));
    } else {
        files = args.filter(a => a.endsWith('.md')).map(a => path.isAbsolute(a) ? a : path.join(REPO_ROOT, a));
        if (!files.length) {
            console.error('Uso: node build_cover_from_md.js <file.md> [--force]  |  --all');
            process.exit(1);
        }
    }

    const generati = [];
    for (const f of files) {
        const out = await buildOne(f, { force });
        if (out) generati.push(out);
    }
    console.log(`\nFatto. Immagini generate: ${generati.length}`);
    // esporta l'elenco per la Action (per capire se c'è qualcosa da committare)
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `generated=${generati.length}\n`);
    }
}

main().catch(err => { console.error(err); process.exit(1); });
