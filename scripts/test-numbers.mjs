/**
 * Controlli sulla lettura delle celle del foglio classifica.
 *
 *   node --experimental-strip-types scripts/test-numbers.mjs
 */
import { toNumber, stripDecorations, formatNumber } from '../lib/numbers.ts';

let failures = 0;
const eq = (name, got, want) => {
    if (Object.is(got, want)) {
        console.log(`  ok  ${name}`);
    } else {
        failures++;
        console.log(`  FAIL ${name}: ottenuto ${JSON.stringify(got)}, atteso ${JSON.stringify(want)}`);
    }
};

console.log('\nnumeri semplici');
eq('intero', toNumber('78'), 78);
eq('decimale col punto', toNumber('78.5'), 78.5);
eq('decimale con la virgola', toNumber('78,5'), 78.5);
eq('numero vero e proprio', toNumber(78.5), 78.5);
eq('negativo', toNumber('-3,5'), -3.5);

console.log('\nrumore intorno al numero');
eq('spazi', toNumber('  78,5  '), 78.5);
eq('spazio unificatore', toNumber('78,5 '), 78.5);
eq('medaglia davanti', toNumber('🥇 78,5'), 78.5);
eq('medaglia dietro', toNumber('78,5 🥈'), 78.5);
eq('coppa e testo', toNumber('🏆 2.530,5'), 2530.5);
eq('emoji con selettore di stile', toNumber('4️⃣ 66'), 66);
eq('piu emoji', toNumber('🥇🔥 91'), 91);

console.log('\nmigliaia e decimali');
eq('migliaia col punto', toNumber('2.530'), 2530);
eq('migliaia e decimale', toNumber('2.530,5'), 2530.5);
eq('formato inglese', toNumber('2,530.5'), 2530.5);
eq('decimale col punto non e migliaia', toNumber('78.5'), 78.5);
eq('quattro cifre senza separatori', toNumber('2530'), 2530);

console.log('\ncelle senza numero');
eq('vuota', toNumber(''), null);
eq('trattino', toNumber('-'), null);
eq('solo emoji', toNumber('🥇'), null);
eq('testo', toNumber('n.d.'), null);
eq('nullo', toNumber(null), null);
eq('non definito', toNumber(undefined), null);

console.log('\npulizia per la visualizzazione');
eq('toglie la medaglia', stripDecorations('🥇 78,5'), '78,5');
eq('toglie emoji in coda', stripDecorations('78,5 🥈'), '78,5');
eq('toglie il numero-emoji', stripDecorations('4️⃣ 66'), '66');
eq('lascia il testo normale', stripDecorations('  Stoke Azzo '), 'Stoke Azzo');
eq('cella vuota', stripDecorations(''), '');

console.log('\nformattazione');
eq('decimale', formatNumber(78.5), '78,5');
eq('migliaia', formatNumber(2530.5), '2.530,5');
eq('nullo', formatNumber(null), '-');

// il caso che ha rotto la classifica: il primo in graduatoria ha la medaglia,
// gli altri no. Senza la pulizia il massimo di giornata finiva sulla riga
// sbagliata e l'ordinamento della vista "giornata" era falsato.
console.log('\nscenario reale: colonna di giornata con i primi tre decorati');
const colonna = ['🥇 84,5', '🥈 81', '🥉 79,5', '77', '75,5', ''];
const numeri = colonna.map(toNumber);
eq('valori letti', JSON.stringify(numeri), JSON.stringify([84.5, 81, 79.5, 77, 75.5, null]));
eq('massimo di giornata', Math.max(...numeri.filter((n) => n !== null)), 84.5);

console.log(failures === 0 ? '\nTutti i controlli superati.' : `\n${failures} controlli falliti.`);
process.exit(failures === 0 ? 0 : 1);
