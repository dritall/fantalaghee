/**
 * Controlli sui colori squadra: leggibilità sul fondo notturno e distinzione
 * fra le due squadre di una partita.
 *
 *   node --experimental-strip-types scripts/test-team-colors.mjs
 */
import { matchColors, readableOnDark, areDistinct, contrast, paletteOf, teamKey } from '../lib/team-colors.ts';

let failures = 0;
const check = (name, cond, extra) => {
    if (cond) console.log(`  ok  ${name}`);
    else { failures++; console.log(`  FAIL ${name}`, extra ?? ''); }
};

const BG = '#080c20'; // fondo delle schedine

console.log('\nriconoscimento dei nomi');
check('nome semplice', paletteOf('Inter')?.primary === '#0068A8');
check('con suffisso', paletteOf('Genoa CFC')?.primary === '#A21C24');
check('con anno', paletteOf('Como 1907')?.primary === '#005AA7');
check('con prefisso', paletteOf('Hellas Verona')?.primary === '#FFD400');
check('maiuscole e spazi', paletteOf('  MILAN ')?.primary === '#FB090B');
check('squadra sconosciuta', paletteOf('Squadra Inventata') === null);
check('nome vuoto', paletteOf('') === null);
check('chiave normalizzata', teamKey('Pisa Sporting Club') === 'pisa', teamKey('Pisa Sporting Club'));

console.log('\nleggibilità sul fondo notturno (contrasto minimo 4.5)');
const squadre = ['Inter','Milan','Juventus','Napoli','Roma','Lazio','Atalanta','Fiorentina','Bologna','Torino',
                 'Genoa','Udinese','Lecce','Verona','Cagliari','Parma','Sassuolo','Como','Pisa','Monza',
                 'Empoli','Venezia','Cremonese','Frosinone'];
let peggiore = { nome: '', c: 99 };
for (const s of squadre) {
    const col = readableOnDark(paletteOf(s).primary);
    const c = contrast(col, BG);
    if (c < peggiore.c) peggiore = { nome: s, c };
    if (c < 4.5) { failures++; console.log(`  FAIL ${s}: contrasto ${c.toFixed(2)} (${col})`); }
}
check(`tutte le ${squadre.length} squadre superano 4.5 (peggiore: ${peggiore.nome} ${peggiore.c.toFixed(2)})`, peggiore.c >= 4.5);

console.log('\nil nero e il granata diventano visibili');
check('Juventus non resta nera', contrast(readableOnDark('#1D1D1B'), BG) > 4.5);
check('Torino non resta granata scuro', contrast(readableOnDark('#881600'), BG) > 4.5);

console.log('\nsquadre con colori simili: il secondo deve cambiare');
const scontri = [
    ['Inter', 'Atalanta'],   // due blu
    ['Inter', 'Como'],       // due blu
    ['Como', 'Pisa'],        // due blu
    ['Milan', 'Monza'],      // due rossi
    ['Milan', 'Cremonese'],  // due rossi
    ['Genoa', 'Cagliari'],   // due rossi scuri
    ['Lecce', 'Verona'],     // due gialli
    ['Parma', 'Frosinone'],  // due gialli
    ['Juventus', 'Udinese'], // due bianconere
];
for (const [h, a] of scontri) {
    const { home, away } = matchColors(h, a);
    const ok = areDistinct(home, away);
    check(`${h} vs ${a} -> ${home} / ${away}`, ok, ok ? '' : 'colori troppo vicini');
}

console.log('\ntutte le coppie possibili restano distinguibili');
let conflitti = 0, coppie = 0;
for (const h of squadre) {
    for (const a of squadre) {
        if (h === a) continue;
        coppie++;
        const { home, away } = matchColors(h, a);
        if (!areDistinct(home, away)) { conflitti++; if (conflitti <= 3) console.log(`    conflitto: ${h} vs ${a} -> ${home}/${away}`); }
        if (contrast(home, BG) < 4.5 || contrast(away, BG) < 4.5) {
            failures++; console.log(`  FAIL contrasto basso in ${h} vs ${a}`);
        }
    }
}
check(`${coppie} coppie, 0 conflitti di colore`, conflitti === 0, `${conflitti} conflitti`);

console.log('\nsquadre fuori elenco');
const ignote = matchColors('Squadra X', 'Squadra Y');
check('due sconosciute restano distinte', areDistinct(ignote.home, ignote.away), ignote);
check('sconosciute leggibili', contrast(ignote.home, BG) > 4.5 && contrast(ignote.away, BG) > 4.5);
const misto = matchColors('Inter', null);
check('avversaria mancante', areDistinct(misto.home, misto.away), misto);

console.log(failures === 0 ? '\nTutti i controlli superati.' : `\n${failures} controlli falliti.`);
process.exit(failures === 0 ? 0 : 1);
