const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '../..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

/**
 * Normalizza la sorgente immagine per il rendering in Puppeteer.
 * - URL http(s) o data: -> restituita così com'è
 * - percorso tipo "/image/gazzetta/x.png" -> letta da /public e trasformata in data URI
 * - percorso file locale esistente -> data URI
 * - null/undefined -> null
 */
function toImgSrc(src) {
    if (!src) return null;
    if (/^(https?:|data:)/i.test(src)) return src;

    let filePath = null;
    if (src.startsWith('/')) filePath = path.join(PUBLIC_DIR, src.replace(/^\//, ''));
    else if (fs.existsSync(src)) filePath = path.isAbsolute(src) ? src : path.join(REPO_ROOT, src);

    if (!filePath || !fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'image/png';
    const b64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mime};base64,${b64}`;
}

/**
 * Renderizza la copertina "prima pagina" della Gazzetta e la salva come PNG.
 *
 * @param {object} datiGiornata
 *   - data                 stringa top-bar (es. "GIORNATA 38 — ...")
 *   - titolo_principale     titolo grande
 *   - sottotitolo           sommario
 *   - img_principale        hero: URL / data URI / path repo (/image/...) / file locale
 *   - box1/box2/box3        { title: string, rows: string[] }  (Top5, Classifica, Verdetti)
 * @param {string} outputPath   percorso assoluto del PNG di destinazione
 * @returns {Promise<string>} outputPath
 */
async function renderCover(datiGiornata, outputPath) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 1600, deviceScaleFactor: 2 });

        const htmlPath = path.join(__dirname, 'template.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Risolviamo l'hero in data URI PRIMA di passarlo nel browser
        const heroSrc = toImgSrc(datiGiornata.img_principale);

        await page.evaluate((dati, heroSrc) => {
            document.getElementById('top-date').innerText = dati.data || '';
            document.getElementById('main-headline').innerText = dati.titolo_principale || '';
            document.getElementById('sub-headline').innerText = dati.sottotitolo || '';

            // Hero
            if (heroSrc) {
                const mainImg = document.getElementById('main-img-tag');
                mainImg.src = heroSrc;
                mainImg.style.display = 'block';
                document.getElementById('main-placeholder-text').style.display = 'none';
            }

            // Box dati (title + rows)
            ['box1', 'box2', 'box3'].forEach((id) => {
                const box = dati[id];
                if (!box) return;
                document.getElementById(`${id}-title`).innerText = box.title || '';
                const ul = document.getElementById(`${id}-rows`);
                ul.innerHTML = '';
                (box.rows || []).forEach(riga => {
                    const li = document.createElement('li');
                    // supporta un separatore "chiave|valore" -> chiave in grassetto
                    if (typeof riga === 'string' && riga.includes('|')) {
                        const [k, v] = riga.split('|');
                        const b = document.createElement('b');
                        b.innerText = k.trim();
                        li.appendChild(b);
                        li.appendChild(document.createTextNode(' ' + v.trim()));
                    } else {
                        li.innerText = String(riga);
                    }
                    ul.appendChild(li);
                });
            });
        }, datiGiornata, heroSrc);

        // Attendi il caricamento dell'eventuale hero
        await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img[src]:not([src=""])'));
            return Promise.all(imgs.map(img => img.complete ? Promise.resolve()
                : new Promise(r => { img.onload = r; img.onerror = r; })));
        });
        await new Promise(r => setTimeout(r, 1500)); // rendering font

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const container = await page.$('.page-container');
        await container.screenshot({ path: outputPath });
        return outputPath;
    } finally {
        await browser.close();
    }
}

module.exports = { renderCover, toImgSrc };

// --- CLI: `node genera_gazzetta.js` genera una preview di prova ---
if (require.main === module) {
    const datiDiProva = {
        data: 'GIORNATA 38 — DOMENICA 12 LUGLIO 2026',
        titolo_principale: 'STOKE AZZO CAMPIONE DEL LAGHÈE 2526',
        sottotitolo: 'Il verdetto finale: Stoke Azzo in vetta con 2935.5. Raga di Oporto e Cuccioloni completano il podio.',
        img_principale: null,
        box1: { title: '🏆 TOP 5 DI GIORNATA', rows: ['1. Sove1907|89.5', '2. Cippalippa1418|84.5', '3. Raga di Oporto|83.0', '4. Fantagiulia|81.5', '5. Caniggia Vola|80.0'] },
        box2: { title: '📊 CLASSIFICA GENERALE', rows: ['1. Stoke Azzo|2935.5', '2. Raga di Oporto|2930.0', '3. Cuccioloni|2920.0', '4. Fantagiulia|2901.0', '5. Caniggia Vola|2889.0'] },
        box3: { title: '📌 I VERDETTI', rows: ['Campione|Stoke Azzo', 'Record|112.5 Cippalippa', 'Cucchiaio|Fantamagica 43'] },
    };
    const out = path.join(__dirname, '../../public/image/gazzetta/gazzetta_test.png');
    renderCover(datiDiProva, out)
        .then(p => console.log(`✓ Immagine generata: ${p}`))
        .catch(err => { console.error(err); process.exit(1); });
}
