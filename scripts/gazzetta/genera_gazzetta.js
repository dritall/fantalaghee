const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '../..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const MASTHEAD_SVG = path.join(PUBLIC_DIR, 'image', 'gazzetta', 'masthead.svg');

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
 * Legge la testata vettoriale committata in /public e ne estrae viewBox + tracciati,
 * così la copertina usa lo stesso identico marchio del sito (e non dipende dai font).
 * @returns {{viewBox: string, paths: string}|null}
 */
function readMasthead() {
    if (!fs.existsSync(MASTHEAD_SVG)) return null;
    const svg = fs.readFileSync(MASTHEAD_SVG, 'utf8');
    const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1];
    const paths = (svg.match(/<g[^>]*>([\s\S]*?)<\/g>/) || [])[1];
    if (!viewBox || !paths) return null;
    return { viewBox, paths: paths.trim() };
}

/**
 * Renderizza la copertina "prima pagina" della Gazzetta e la salva come PNG.
 *
 * @param {object} datiGiornata
 *   - data                 stringa top-bar (es. "GIORNATA 38 — ...")
 *   - titolo_principale     titolo grande (un ":" iniziale diventa occhiello)
 *   - sottotitolo           sommario/catenaccio
 *   - didascalia            (opzionale) didascalia sotto l'illustrazione
 *   - img_principale        hero: URL / data URI / path repo (/image/...) / file locale
 *   - box1/box2/box3        { title: string, rows: string[] }  (Top5, Classifica, Verdetti)
 *                           righe nel formato "nome|valore", con "1." iniziale opzionale
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
        await page.setViewport({ width: 1000, height: 2000, deviceScaleFactor: 2 });

        const htmlPath = path.join(__dirname, 'template.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Risolviamo hero e testata PRIMA di entrare nel browser
        const heroSrc = toImgSrc(datiGiornata.img_principale);
        const masthead = readMasthead();

        await page.evaluate((dati, heroSrc, masthead) => {
            const $ = (id) => document.getElementById(id);
            const set = (id, text) => { const el = $(id); if (el) el.innerText = text; };

            // Via le emoji: su carta stampata stonano, gli iconcini sono già nel template
            const clean = (s) => String(s || '')
                .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, '')
                .replace(/\s+/g, ' ')
                .trim();

            // ---- Testata vettoriale ----------------------------------------
            if (masthead) {
                const svg = document.querySelector('.wordmark');
                svg.setAttribute('viewBox', masthead.viewBox);
                $('masthead-paths').innerHTML = masthead.paths;
            }

            // ---- Filetto superiore + occhiello ------------------------------
            const dataStr = clean(dati.data);
            set('top-date', dataStr);

            const nGiornata = (dataStr.match(/GIORNATA\s+(\d+)/i) || [])[1];
            set('ear-giornata', nGiornata || '—');
            $('kicker-tag').innerText = nGiornata ? `Giornata ${nGiornata}` : 'Speciale';

            // Un titolo tipo "STOKE AZZO RE DEL LARIO: FINALE AL FILO DI LANA"
            // diventa occhiello + titolo, come in prima pagina.
            let titolo = clean(dati.titolo_principale);
            let occhiello = '';
            const tagli = titolo.split(/:\s+/);
            if (tagli.length > 1) {
                const testa = tagli[0].trim();
                const coda = tagli.slice(1).join(': ').trim();
                if (testa.length <= 42 && coda.length >= 12) { occhiello = testa; titolo = coda; }
            }
            set('kicker-text', occhiello || 'Il racconto della giornata');

            // Titolo: il nome della squadra va in rosso, come in prima pagina.
            // L'evidenza si può forzare anche a mano scrivendo *così* nel titolo.
            const h = $('main-headline');
            const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
            const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            if (/\*[^*]+\*/.test(titolo)) {
                h.innerHTML = esc(titolo).replace(/\*([^*]+)\*/g, '<em>$1</em>');
            } else {
                // squadre citate nei riquadri, dalla più lunga (evita match parziali)
                const squadre = ['box1', 'box2', 'box3']
                    .flatMap((id) => ((dati[id] && dati[id].rows) || []))
                    .map((r) => String(r).split('|')[0].replace(/^\d{1,2}\s*[.)°-]?\s*/, '').trim())
                    .filter((n) => n.length >= 4)
                    .sort((a, b) => b.length - a.length);
                const citata = squadre.find((n) => new RegExp(`\\b${rx(n)}\\b`, 'i').test(titolo));
                h.innerHTML = citata
                    ? esc(titolo).replace(new RegExp(`(${rx(citata)})`, 'i'), '<em>$1</em>')
                    : esc(titolo);
            }

            // ---- Catenaccio: prima frase in evidenza ------------------------
            const sotto = clean(dati.sottotitolo);
            const p = $('sub-headline');
            const taglioFrase = sotto.match(/^(.{20,70}?[.;!?])\s+(.+)$/);
            if (taglioFrase) {
                p.innerHTML = '';
                const b = document.createElement('span');
                b.className = 'dropline';
                b.innerText = taglioFrase[1] + ' ';
                p.appendChild(b);
                p.appendChild(document.createTextNode(taglioFrase[2]));
            } else {
                p.innerText = sotto;
            }
            // il sommario non deve mai spingere fuori la foto: si stringe da solo
            // e passa su due colonne solo quando è abbastanza lungo da reggerle
            if (sotto.length > 230) p.parentElement.style.fontSize = '15.5px';
            else if (sotto.length > 165) p.parentElement.style.fontSize = '16.5px';
            if (sotto.length > 190) p.parentElement.classList.add('two-col');

            // ---- Titolo: corpo calcolato per riempire il blocco -------------
            const maxAltezza = 210;     // ~3 righe
            let corpo = 92;
            h.style.fontSize = corpo + 'px';
            while (corpo > 38 && h.scrollHeight > maxAltezza) {
                corpo -= 2;
                h.style.fontSize = corpo + 'px';
            }

            // ---- Foto d'apertura --------------------------------------------
            if (heroSrc) {
                const img = $('main-img-tag');
                img.src = heroSrc;
                img.style.display = 'block';
                $('main-placeholder-text').style.display = 'none';
            }
            if (dati.didascalia) set('hero-caption-text', clean(dati.didascalia));
            else if (nGiornata) set('hero-caption-text', `Giornata ${nGiornata} del Fanta Laghèe, raccontata dalle sponde del Lario.`);

            // ---- Riquadri dati -----------------------------------------------
            ['box1', 'box2', 'box3'].forEach((id) => {
                const box = dati[id];
                if (!box) return;
                set(`${id}-title`, clean(box.title));

                const ul = $(`${id}-rows`);
                ul.innerHTML = '';
                (box.rows || []).forEach((riga) => {
                    const li = document.createElement('li');
                    const testo = String(riga);

                    if (!testo.includes('|')) {
                        li.className = 'plain';
                        li.innerText = testo;
                        ul.appendChild(li);
                        return;
                    }

                    const [sinistra, ...resto] = testo.split('|');
                    let nome = sinistra.trim();
                    const valore = resto.join('|').trim();

                    // "1. Sove1907" -> pallino con la posizione + nome
                    const pos = nome.match(/^(\d{1,2})\s*[.)°-]?\s+(.*)$/);
                    if (pos) {
                        const badge = document.createElement('span');
                        badge.className = `rank r${pos[1]}`;
                        badge.innerText = pos[1];
                        li.appendChild(badge);
                        nome = pos[2];
                    }

                    const spanNome = document.createElement('span');
                    spanNome.className = pos ? 'name' : 'name strong';
                    spanNome.innerText = nome;
                    li.appendChild(spanNome);

                    const leader = document.createElement('span');
                    leader.className = 'leader';
                    li.appendChild(leader);

                    const spanVal = document.createElement('span');
                    spanVal.className = 'value';
                    spanVal.innerText = valore;
                    li.appendChild(spanVal);

                    ul.appendChild(li);
                });
            });
        }, datiGiornata, heroSrc, masthead);

        // Attendi font e immagini prima dello scatto
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img[src]:not([src=""])'));
            return Promise.all(imgs.map(img => img.complete ? Promise.resolve()
                : new Promise(r => { img.onload = r; img.onerror = r; })));
        });
        await new Promise(r => setTimeout(r, 600));

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
        data: 'GIORNATA 38 — GIOVEDÌ 30 LUGLIO 2026',
        titolo_principale: 'STOKE AZZO RE DEL LARIO: FINALE AL FILO DI LANA',
        sottotitolo: 'Scudetto a Stoke Azzo per 5,5 punti sui Raga di Oporto. Ultima giornata a Sove1907 (89.5); Cippalippa e Oporto sul podio di G38.',
        img_principale: process.env.HERO || null,
        box1: { title: '🏆 TOP 5 DI GIORNATA', rows: ['1. Sove1907|89.5', '2. Cippalippa1418|84.5', '3. Raga di Oporto|83.0', '4. Fantagiulia|81.5', '5. Caniggia Vola|80.0'] },
        box2: { title: '📊 CLASSIFICA GENERALE', rows: ['1. Stoke Azzo|2935.5', '2. Raga di Oporto|2930.0', '3. Cuccioloni|2920.0', '4. Fantagiulia|2901.0', '5. Caniggia Vola|2889.0'] },
        box3: { title: '📌 I VERDETTI', rows: ['Campione|Stoke Azzo', 'Record|112.5 Cippalippa', 'Cucchiaio|Fantamagica 43'] },
    };
    const out = path.join(__dirname, '../../public/image/gazzetta/gazzetta_test.png');
    renderCover(datiDiProva, out)
        .then(p => console.log(`✓ Immagine generata: ${p}`))
        .catch(err => { console.error(err); process.exit(1); });
}
