#!/usr/bin/env node
/**
 * CLI di test — genera la bozza dell'articolo SENZA Telegram, per provare la
 * pipeline (dati -> Hermes -> bozza) da terminale.
 *
 * Uso:
 *   node scripts/gazzetta/genera_articolo.js            # usa Hermes reale (serve HERMES_API_KEY)
 *   node scripts/gazzetta/genera_articolo.js --mock     # usa una bozza finta (nessuna chiave necessaria)
 *   node scripts/gazzetta/genera_articolo.js --mock --cover   # ...e genera anche l'immagine di copertina
 *
 * Non committa nulla: stampa la bozza e, con --cover, salva solo il PNG di anteprima.
 */

const path = require('path');
const { fetchGiornata, datiGiornataInTesto } = require('./lib/fetchGiornata');
const { renderCover } = require('./genera_gazzetta');
const { topBarDate } = require('./lib/publish');

const args = process.argv.slice(2);
const MOCK = args.includes('--mock');
const DO_COVER = args.includes('--cover');

// Dati finti, per provare il flusso senza foglio/chiave
const DATI_MOCK = {
    numeroGiornata: 31,
    leaderAttuale: 'Stoke Azzo',
    campioneDiGiornata: 'Mojito FC',
    podio: [
        { squadra: 'Mojito FC', punteggio: '91.5' },
        { squadra: 'Fantagiulia', punteggio: '88.0' },
        { squadra: 'Caniggia Vola', punteggio: '85.5' },
    ],
    classifica: [
        { squadra: 'Stoke Azzo', punti: 2401.5, mediaPunti: 77.5 },
        { squadra: 'Raga di Oporto', punti: 2390.0, mediaPunti: 77.1 },
        { squadra: 'Cuccioloni', punti: 2372.0, mediaPunti: 76.5 },
    ],
    recordAssoluto: { punteggio: '112.5', squadra: 'Cippalippa1418', giornata: '30' },
    cucchiaioDiLegno: { punteggio: '48.0', squadra: 'Bayer Nargen', giornata: '31' },
    premi: { giornata: [{ squadra: 'Mojito FC', premio: 'Miglior punteggio' }] },
};

function bozzaMock(dati) {
    return {
        slug: `gazzetta-g${dati.numeroGiornata}`,
        title: 'MOJITO FC UBRIACA IL LARIO, STOKE AZZO RESISTE',
        description: 'Mojito FC domina la giornata con 91.5, ma in vetta comanda ancora Stoke Azzo. Notte fonda per Bayer Nargen.',
        body_md: [
            '### La Lente d\'Ingrandimento: il cocktail perfetto di Mojito FC',
            'Giornata numero ' + dati.numeroGiornata + ' e c\'è una squadra che ha deciso di servire da bere a tutti: **Mojito FC** stappa un roboante **91.5** e si prende l\'oro 🥇 di giornata. Dietro, **Fantagiulia** (88.0) e **Caniggia Vola** (85.5) completano un podio di lusso.',
            '',
            '### Il Processo del Lunedì: naufragio Bayer Nargen',
            'Mentre in cima si brinda, nei bassifondi si mastica amaro. Il 🥄 cucchiaio di legno va ai **Bayer Nargen**, fermi a un mesto **48.0**: una prestazione da dimenticare in fretta.',
            '',
            '### Numeri & Sussurri: Stoke Azzo non molla',
            'In classifica generale comanda sempre **Stoke Azzo** (2401.5), tallonato dai **Raga di Oporto** (2390.0). Resta lassù, intoccabile, il Record Assoluto di **Cippalippa1418**: quel mostruoso **112.5** della G30 che ancora fa paura.',
            '',
            '### L\'Oracolo del Laghèe',
            '> **Il cerchio dell\'acqua:** Mojito FC ha acceso i motori troppo tardi? L\'Oracolo vede una fiammata, non un incendio.',
            '> **La resa dei conti:** Stoke Azzo e Raga di Oporto si giocheranno tutto sul filo di lana. Sarà macelleria.',
        ].join('\n'),
        cover: {
            titolo_principale: 'MOJITO FC UBRIACA IL LARIO',
            sottotitolo: 'Giornata da 91.5 per Mojito FC, ma in vetta comanda ancora Stoke Azzo. Notte fonda per Bayer Nargen col cucchiaio di legno.',
            box1: { tag: 'IL VERDETTO', titolo: 'ORO A MOJITO FC', testo: '91.5 e primo posto di giornata. Fantagiulia e Caniggia Vola sul podio.' },
            box2: { tag: 'IL PROCESSO', titolo: 'NAUFRAGIO NARGEN', testo: 'Solo 48 punti: cucchiaio di legno e tanta amarezza per Bayer Nargen.' },
            box3: { tag: 'CLASSIFICA', titolo: 'STOKE AZZO AL COMANDO', testo: 'Vetta blindata a 2401.5, ma i Raga di Oporto sono a un soffio.' },
        },
    };
}

(async () => {
    const dati = MOCK ? DATI_MOCK : await fetchGiornata();

    console.log('=== DATI GIORNATA ===');
    console.log(datiGiornataInTesto(dati));
    console.log('\n=== GENERAZIONE BOZZA ===');

    let bozza;
    if (MOCK) {
        bozza = bozzaMock(dati);
    } else {
        const { generaArticolo } = require('./lib/hermes');
        bozza = await generaArticolo(datiGiornataInTesto(dati));
    }

    console.log(JSON.stringify(bozza, null, 2));

    if (DO_COVER) {
        const out = path.join(__dirname, '../../public/image/gazzetta', `${bozza.slug}_preview.png`);
        const coverData = {
            data: topBarDate(dati.numeroGiornata),
            titolo_principale: bozza.cover.titolo_principale,
            sottotitolo: bozza.cover.sottotitolo,
            img_principale: null,
            box1: bozza.cover.box1, box2: bozza.cover.box2, box3: bozza.cover.box3,
        };
        await renderCover(coverData, out);
        console.log(`\n✓ Copertina di anteprima: ${out}`);
    }
})().catch(err => { console.error(err); process.exit(1); });
