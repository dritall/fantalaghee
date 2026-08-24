/**
 * Controlli sul ricalcolo del verdetto per giornata a partire dal foglio
 * classifica (le colonne G1..G38).
 *
 *   node --experimental-strip-types scripts/test-verdetto-storico.mjs
 */
import { verdettoAllaGiornata, punteggiDiGiornata, giornateDisponibili, premioDiGiornata } from '../lib/verdetto-storico.ts';

let failures = 0;
const eq = (name, got, want) => {
    const g = JSON.stringify(got), w = JSON.stringify(want);
    if (g === w) console.log(`  ok  ${name}`);
    else { failures++; console.log(`  FAIL ${name}: ottenuto ${g}, atteso ${w}`); }
};
const check = (name, cond, extra) => { if (cond) console.log(`  ok  ${name}`); else { failures++; console.log(`  FAIL ${name}`, extra ?? ''); } };

// foglio realistico: virgole decimali, medaglie sui primi, giornate future vuote
const righe = [
    { Team: 'Stoke Azzo',  Generale: '🥇 240', G1: '80',       G2: '🏆 85,5', G3: '74,5', G4: '' },
    { Team: 'Cuccioloni',  Generale: '🥈 236', G1: '🏆 82,5',  G2: '78',      G3: '76',   G4: '' },
    { Team: 'Fantagiulia', Generale: '🥉 222', G1: '70',       G2: '81',      G3: '71',   G4: '' },
    { Team: 'Raga',        Generale: '210',    G1: '68,5',     G2: '69',      G3: '72,5', G4: '' },
];

console.log('\ngiornate disponibili');
eq('solo quelle con punteggi veri', giornateDisponibili(righe), [1, 2, 3]);
eq('foglio vuoto', giornateDisponibili([]), []);

console.log('\npunteggi di una giornata');
eq('G2 ordinata, medaglia ignorata',
   punteggiDiGiornata(righe, 2).map(p => `${p.squadra} ${p.punteggio}`),
   ['Stoke Azzo 85.5', 'Fantagiulia 81', 'Cuccioloni 78', 'Raga 69']);
eq('giornata non giocata', punteggiDiGiornata(righe, 4), []);

console.log('\nverdetto alla giornata 1');
const g1 = verdettoAllaGiornata(righe, 1);
eq('podio G1', g1.podio.map(p => p.squadra), ['Cuccioloni', 'Stoke Azzo', 'Fantagiulia', 'Raga']);
eq('leader dopo G1', g1.leader, 'Cuccioloni');
eq('record dopo G1', [g1.record.squadra, g1.record.punteggio, g1.record.giornata], ['Cuccioloni', 82.5, 1]);
eq('peggiore dopo G1', [g1.cucchiaio.squadra, g1.cucchiaio.punteggio], ['Raga', 68.5]);

console.log('\nverdetto alla giornata 3 (cumulato)');
const g3 = verdettoAllaGiornata(righe, 3);
// Stoke 80+85,5+74,5 = 240 ; Cuccioloni 82,5+78+76 = 236,5 ; Fanta 70+81+71 = 222 ; Raga 68,5+69+72,5 = 210
eq('classifica cumulata', g3.classifica.map(c => `${c.squadra} ${c.punti}`),
   ['Stoke Azzo 240', 'Cuccioloni 236.5', 'Fantagiulia 222', 'Raga 210']);
eq('leader dopo G3', g3.leader, 'Stoke Azzo');
eq('media dopo 3 giornate', g3.classifica[0].mediaPunti, 80);
eq('record complessivo', [g3.record.squadra, g3.record.punteggio, g3.record.giornata], ['Stoke Azzo', 85.5, 2]);
eq('peggiore complessivo', [g3.cucchiaio.squadra, g3.cucchiaio.punteggio, g3.cucchiaio.giornata], ['Raga', 68.5, 1]);

console.log('\nil leader puo cambiare strada facendo');
check('leader G1 diverso da leader G3', g1.leader !== g3.leader, [g1.leader, g3.leader]);

console.log('\npremio di giornata: primo e, dal 26/27, secondo');
{
    const p2 = premioDiGiornata(punteggiDiGiornata(righe, 2));
    eq('vincitore G2', p2.vincitori, ['Stoke Azzo']);
    eq('quota intera al vincitore unico', p2.quota, 25);
    eq('secondo di G2', [p2.secondi.squadre, p2.secondi.punteggio], [['Fantagiulia'], 81]);

    // parita in testa: il premio si divide e il "secondo" e' il primo punteggio piu basso
    const pari = premioDiGiornata([
        { squadra: 'A', punteggio: 90 },
        { squadra: 'B', punteggio: 90 },
        { squadra: 'C', punteggio: 80 },
        { squadra: 'D', punteggio: 80 },
    ]);
    eq('primi a pari merito', pari.vincitori, ['A', 'B']);
    eq('quota dimezzata', pari.quota, 12.5);
    eq('chi pareggia in vetta non e secondo', pari.secondi, { squadre: ['C', 'D'], punteggio: 80 });

    eq('nessun secondo se giocano tutti lo stesso punteggio',
       premioDiGiornata([{ squadra: 'A', punteggio: 70 }, { squadra: 'B', punteggio: 70 }]).secondi, null);
    eq('nessun secondo con una sola squadra',
       premioDiGiornata([{ squadra: 'A', punteggio: 70 }]).secondi, null);
    eq('giornata senza punteggi', premioDiGiornata([]), null);
}

console.log('\ncasi limite');
const vuoto = verdettoAllaGiornata([], 5);
check('foglio vuoto non esplode', vuoto.podio.length === 0 && vuoto.leader === 'N/D' && vuoto.record === null);
const conBuchi = verdettoAllaGiornata([{ Team: 'Solo', G1: '70', G2: '', G3: '80' }], 3);
eq('le giornate saltate non contano nella media', conBuchi.classifica[0].mediaPunti, 75);
eq('somma con buchi', conBuchi.classifica[0].punti, 150);
const spazi = verdettoAllaGiornata([{ Team: 'X', 'G 1': '66' }], 1);
eq('intestazione con spazio', spazi.classifica[0].punti, 66);

console.log(failures === 0 ? '\nTutti i controlli superati.' : `\n${failures} controlli falliti.`);
process.exit(failures === 0 ? 0 : 1);
