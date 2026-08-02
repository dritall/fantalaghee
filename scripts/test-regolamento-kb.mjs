/**
 * Controlli dell'assistente del regolamento.
 *
 * Ogni riga è una domanda scritta come la scriverebbe un iscritto, con la
 * voce che deve uscire. `null` significa "fuori tema": l'assistente deve
 * dichiararsi incerto invece di rispondere a caso.
 *
 *   node --experimental-strip-types scripts/test-regolamento-kb.mjs
 */
import { cerca, abbastanzaSicuro, KB } from '../lib/regolamento-kb.ts';

const PROVE = [
    ['quanto costa', 'quota'],
    ['quante melanzane costa iscriversi', 'quota'],
    ['come mi iscrivo alla lega', 'come-iscriversi'],
    ['mi sono iscritto tardi', 'iscrizione-tardiva'],
    ['che app si usa', 'piattaforma'],
    ['i voti live sono veri', 'voti-live'],
    ['quanti difensori devo avere', 'quanti-difensori'],
    ['budget rosa', 'budget'],
    ['quando apre il mercato', 'quando-rosa'],
    ['plusvalenze', 'plusvalenze'],
    ['giocatori bloccati come funziona', 'giocatori-bloccati'],
    ['posso cambiare modulo?', 'cambio-modulo'],
    ['quante riserve ho', 'panchina'],
    ['quando scade la formazione', 'quando-formazione'],
    ['se non metto la formazione cosa succede', 'formazione-non-inserita'],
    ['posso mandare la formazione su whatsapp', 'formazione-whatsapp'],
    ['quanto vale un gol di un difensore', 'gol-difensore'],
    ['assist quanto vale', 'assist'],
    ['espulsione quanto toglie', 'espulsione'],
    ['autogol', 'autogol'],
    ['porta inviolata bonus', 'porta-inviolata'],
    ['come funziona il modificatore', 'modificatore'],
    ['che coppe ci sono', 'competizioni'],
    ['quanti gol si fanno con 72 punti', 'soglie-gol'],
    ['formazione coppa uguale a campionato?', 'formazione-coppe'],
    ['chi vince la giornata quanto prende', 'premio-giornata'],
    ['e se pareggiamo il punteggio', 'pari-punti-premio'],
    ['il secondo prende qualcosa?', 'secondo-giornata'],
    ['cosa sono le melanzane', 'melanzane'],
    ['partita rinviata cosa succede', 'partita-rinviata'],
    ['sei politico chi lo prende', 'sei-politico'],
    ['ce il capitano', 'capitano'],
    ['cosa sono i fantamilioni', 'fantamilioni'],
    ['posso fare mercato durante il campionato', 'mercato-riparazione'],
    ['quante squadre siamo', 'quante-squadre'],
    ['chi contatto', 'contatti'],
    ['cosa cambia questanno', 'cosa-cambia'],
    ['riassumimi tutto', 'riassunto'],
    ['quanto si vince in classifica', 'quando-premi'],
    ['chi decide se un assist e valido', 'fonte-assist'],
    ['possono spostare le giornate di coppa', 'coppe-spostamento'],
    ['perche si chiama fanta laghee', 'nome-lega'],
    ['quante melanzane sono state distribuite', 'premi-elenco'],
    ['che tempo fa domani', null],
    ['ricetta della carbonara', null],
    ['dammi la ricetta del tiramisu', null],
];

let falliti = 0;
for (const [domanda, atteso] of PROVE) {
    const migliore = cerca(domanda, 1)[0];
    const id = abbastanzaSicuro(migliore) ? migliore.voce.id : null;
    const ok = id === atteso;
    if (!ok) falliti++;
    console.log(`  ${ok ? 'ok ' : 'NO '} ${domanda.padEnd(42)} -> ${id ?? '(incerto)'}${ok ? '' : `   atteso: ${atteso ?? '(incerto)'}`}`);
}

const senzaChiavi = KB.filter((v) => v.chiavi.length === 0);
if (senzaChiavi.length) {
    console.log(`\n  NO  ${senzaChiavi.length} voci senza parole chiave`);
    falliti += senzaChiavi.length;
}

console.log(`\n${KB.length} voci · ${PROVE.length} domande · ${falliti} errori`);
process.exit(falliti === 0 ? 0 : 1);
