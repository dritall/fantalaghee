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
const { generateHero } = require('./lib/imagegen');

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

    // Risoluzione dell'HERO:
    // 1) se Hermes ha già fornito/committato un file hero -> lo usiamo;
    // 2) altrimenti, se c'è image_prompt -> lo generiamo qui e lo salviamo;
    // 3) altrimenti -> nessun hero (placeholder).
    let heroSrc = c.hero_image || c.img_principale || null;
    const heroFile = heroSrc && heroSrc.startsWith('/') ? imageAbsPath(heroSrc) : null;
    const heroMancante = !heroSrc || (heroFile && !fs.existsSync(heroFile));

    if (heroMancante && c.image_prompt) {
        const slug = path.basename(mdPath, '.md');
        // heroUrl è la forma PUBBLICO-relativa (es. /image/gazzetta/gazzetta-g7-hero.png):
        // è quella che renderCover/toImgSrc risolvono correttamente. genPath (assoluto)
        // serve SOLO per scrivere il file su disco. Attenzione: NON passare genPath come
        // img_principale, perché toImgSrc interpreta ogni stringa che inizia con "/" come
        // relativa a /public e con un path assoluto non troverebbe il file, rendendo il
        // placeholder al posto dell'illustrazione.
        const heroUrl = heroSrc && heroSrc.startsWith('/') ? heroSrc : `/image/gazzetta/${slug}-hero.png`;
        const genPath = imageAbsPath(heroUrl);
        const seedEnv = process.env.IMAGE_SEED;
        const seed = seedEnv !== undefined && seedEnv !== '' ? Number(seedEnv) : (Number(c.giornata) || undefined);
        await generateHero(c.image_prompt, genPath, { seed });
        heroSrc = heroUrl;
        console.log(`  ↳ hero generato: ${path.basename(genPath)}`);
    }

    const coverData = {
        data: c.data || topBarDate(c.giornata ?? ''),
        titolo_principale: c.titolo_principale,
        sottotitolo: c.sottotitolo,
        img_principale: heroSrc,
        box1: c.box1,   // { title, rows: [...] }
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
    const errori = [];
    for (const f of files) {
        try {
            const out = await buildOne(f, { force });
            if (out) generati.push(out);
        } catch (e) {
            console.error(`✗ errore su ${path.basename(f)}: ${e.message}`);
            errori.push(`${path.basename(f)}: ${e.message}`);
        }
    }
    console.log(`\nFatto. Immagini generate: ${generati.length}`);
    // esporta l'elenco per la Action (per capire se c'è qualcosa da committare)
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `generated=${generati.length}\n`);
    }

    if (errori.length > 0) {
        console.error(`\n${errori.length} copertina/e non generata/e:`);
        errori.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { buildOne };
