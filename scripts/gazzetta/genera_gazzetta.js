const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generaPrimaPagina(datiGiornata) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1600, deviceScaleFactor: 2 });

    const htmlPath = path.join(__dirname, 'template.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.evaluate((dati) => {
        document.getElementById('top-date').innerText = dati.data;
        document.getElementById('main-headline').innerText = dati.titolo_principale;
        document.getElementById('sub-headline').innerText = dati.sottotitolo;

        if (dati.img_principale) {
            const mainImg = document.getElementById('main-img-tag');
            mainImg.src = dati.img_principale;
            mainImg.style.display = 'block';
            document.getElementById('main-placeholder-text').style.display = 'none';
        }

        ['box1', 'box2', 'box3'].forEach((id, i) => {
            const box = dati[id];
            document.getElementById(`${id}-tag`).innerText = box.tag;
            document.getElementById(`${id}-title`).innerText = box.titolo;
            document.getElementById(`${id}-text`).innerText = box.testo;
            if (box.img) {
                const img = document.getElementById(`${id}-img-tag`);
                img.src = box.img;
                img.style.display = 'block';
                document.getElementById(`${id}-placeholder`).style.display = 'none';
            }
        });
    }, datiGiornata);

    // Aspetta che le immagini siano caricate (se presenti)
    await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img[src]:not([src=""])'));
        return Promise.all(
            imgs.map(img =>
                img.complete
                    ? Promise.resolve()
                    : new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    })
            )
        );
    });

    // Piccolo delay per il rendering dei font
    await new Promise(r => setTimeout(r, 1500));

    const outputDir = path.join(__dirname, '../../public/image/gazzetta');
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, datiGiornata.output_filename || 'gazzetta_preview.png');

    const container = await page.$('.page-container');
    await container.screenshot({ path: outputPath });

    console.log(`✓ Immagine generata: ${outputPath}`);

    await browser.close();
    return outputPath;
}

// Dati di prova — sostituire ad ogni esecuzione
const datiGiornata = {
    output_filename: 'gazzetta_test.png',
    data: "EDIZIONE STRAORDINARIA — LUNEDÌ 30 GIUGNO 2026",
    titolo_principale: "IL LARIO TREMA, IL FANTA LAGHÈE RIPARTE!",
    sottotitolo: "Aperti ufficialmente i cancelli per la stagione 2026/27. Sito nuovo fiammante, la rivoluzione del 'Secondo Classificato' e il grande ritorno delle pagelle.",
    img_principale: null,
    box1: {
        tag: "SPECIALE COPPE",
        titolo: "IL RITORNO DELLA GAZZETTA",
        testo: "L'inchiostro (e il veleno) scorrerà di nuovo. Preparatevi a pagelle chirurgiche, analisi spietate e sfottò.",
        img: null,
    },
    box2: {
        tag: "L'EDITORIALE",
        titolo: "LA RIVOLUZIONE DEL 'SECONDO'",
        testo: "Arrivare a un soffio dalla gloria fa male, ma da oggi l'argento vale qualcosa in più.",
        img: null,
    },
    box3: {
        tag: "MERCATO",
        titolo: "RITIRI E AVVERTENZE VARIE",
        testo: "Per chi deve ancora ritirare dall'anno scorso... le procedure non sono cambiate. Scrivete al Vale.",
        img: null,
    },
};

generaPrimaPagina(datiGiornata).catch(console.error);
