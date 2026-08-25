/**
 * Lettura dei numeri che arrivano dai fogli di calcolo della lega.
 *
 * Le celle sono compilate a mano: possono contenere la virgola decimale, il
 * punto delle migliaia, spazi unificatori incollati da Google Sheets e — nelle
 * prime posizioni — emoji messe come decorazione. `parseFloat` su una di
 * queste stringhe restituisce un numero sbagliato o NaN, quindi qui la
 * conversione è esplicita.
 */

// Emoji, simboli e segni di punteggiatura decorativi: tutto cio' che non e'
// cifra, separatore o segno meno.
const NON_NUMERIC = /[^\d.,-]/g;

// Le emoji-tastierino (1\u20e3 con la cifra davanti) contengono una cifra
// vera: vanno tolte per intere, altrimenti quella cifra si attacca al
// punteggio e "4 tastierino, 66" diventerebbe 466. Questa sostituzione deve
// precedere ogni altra pulizia.
const KEYCAP = /[\d#*]\ufe0f?\u20e3/gu;
const PICTOGRAPHIC = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\ufe0f\u200d]/gu;

/** Toglie emoji e decorazioni lasciando il testo che l'utente ha scritto. */
export function stripDecorations(raw: unknown): string {
    if (raw === null || raw === undefined) return '';
    return String(raw)
        .replace(KEYCAP, '')
        .replace(PICTOGRAPHIC, '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Converte una cella in numero, o null se non ne contiene uno.
 *
 * Riconosce sia "78,5" sia "78.5", e distingue il punto delle migliaia
 * ("2.530") da quello decimale ("78.5") dalla forma del numero.
 */
export function toNumber(raw: unknown): number | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

    // prima le emoji (per via dei tastierini), poi il resto del rumore
    let s = stripDecorations(raw).replace(NON_NUMERIC, '');
    if (s === '' || s === '-' || s === '.' || s === ',') return null;

    const hasDot = s.includes('.');
    const hasComma = s.includes(',');

    if (hasDot && hasComma) {
        // convivono entrambi: l'ultimo che compare è il separatore decimale
        const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
        const thousands = decimal === ',' ? '.' : ',';
        s = s.split(thousands).join('');
        s = s.replace(decimal, '.');
    } else if (hasComma) {
        s = s.replace(',', '.');
    } else if (hasDot) {
        // "2.530" sono migliaia, "78.5" è un decimale
        if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.split('.').join('');
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

/**
 * Totale di una riga di classifica. Se la colonna Generale è vuota (formule
 * del foglio non ancora calcolate, o CSV pubblicato senza i valori) si somma
 * G1…G38. Così una giornata caricata a mano non sparisce dal sito.
 */
export function puntiGenerali(riga: Record<string, unknown> | null | undefined): number {
    const dichiarato = toNumber(riga?.Generale);
    if (dichiarato !== null) return dichiarato;
    let somma = 0;
    for (const [chiave, valore] of Object.entries(riga || {})) {
        if (!/^G\s*\d{1,2}$/i.test(String(chiave).trim())) continue;
        const n = toNumber(valore);
        if (n !== null) somma += n;
    }
    return Math.round(somma * 100) / 100;
}

/** Numero riformattato all'italiana, per mostrarlo com'è stato scritto. */
export function formatNumber(n: number | null): string {
    if (n === null) return '-';
    return new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2, useGrouping: true }).format(n);
}

/**
 * Punto delle migliaia per un intero, senza passare da Intl/toLocaleString.
 * La resa di `toLocaleString('it-IT')` senza opzioni dipende dalla build di
 * ICU del runtime che lo esegue: si è visto in produzione un mismatch di
 * idratazione React vero e proprio, "4130" lato server e "4.130" lato
 * client per lo stesso numero. Questa è deterministica ovunque.
 */
export function formattaMigliaia(n: number): string {
    const negativo = n < 0;
    const cifre = Math.round(Math.abs(n)).toString();
    const raggruppato = cifre.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return negativo ? `-${raggruppato}` : raggruppato;
}
