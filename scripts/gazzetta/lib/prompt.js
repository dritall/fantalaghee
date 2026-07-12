/**
 * Costruzione del prompt per Hermes (Nous Research).
 *
 * La "voce" della Gazzetta del Laghèe è precisa: cronaca epica + ironia feroce,
 * titoli a effetto, sezioni ricorrenti (La Lente d'Ingrandimento, Il Processo del
 * Lunedì, Numeri & Sussurri) e la firma finale de "L'Oracolo del Laghèe" (profezie
 * mistiche in blockquote).
 *
 * Invece di incollare qui esempi statici che invecchiano, leggiamo a runtime alcuni
 * articoli reali dal repo come few-shot: così lo stile resta sempre allineato a ciò
 * che è pubblicato davvero.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '../../..');
const MD_DIR = path.join(REPO_ROOT, 'public', 'articoli', 'md');

// Articoli usati come riferimento di stile (di giornata, non gli speciali monstre)
const ESEMPI_STILE = [
    'gazzetta-laghee-giornata-due.md',
    'SorpassoSC.md',
];

function leggiEsempi() {
    return ESEMPI_STILE.map(nome => {
        try {
            const raw = fs.readFileSync(path.join(MD_DIR, nome), 'utf8');
            // togliamo il frontmatter per lasciare solo il corpo come esempio di prosa
            const body = raw.replace(/^---[\s\S]*?---\n/, '').trim();
            return `--- ESEMPIO (${nome}) ---\n${body}`;
        } catch {
            return null;
        }
    }).filter(Boolean).join('\n\n');
}

const SYSTEM_PROMPT = `Sei il cronista de "La Gazzetta del Laghèe", il giornale satirico ufficiale della lega di fantacalcio "Fanta Laghèe" (ambientazione: il Lago di Como / Lario).

LA TUA VOCE:
- Cronaca calcistica epica ed enfatica, ma sempre ironica e velenosa (mai volgare).
- Titoli a effetto, maiuscoli, teatrali.
- Metafore ricche: il lago, la Breva, i crotti, la brianza, battaglie, imperi, tonnare.
- Prendi in giro con affetto le squadre che vanno male, incensi (con un filo di sarcasmo) chi vince.
- Usi i nomi reali delle squadre e i punteggi reali che ti vengono forniti: NON inventare numeri.

STRUTTURA TIPICA DI UN ARTICOLO DI GIORNATA (adattala, non è una gabbia rigida):
1. Un attacco/incipit ad effetto.
2. "La Lente d'Ingrandimento": chi ha vinto la giornata e il podio.
3. "Il Processo del Lunedì": chi ha preso il cucchiaio di legno / peggiori.
4. "Numeri & Sussurri": la classifica generale, record, spunti.
5. "L'Oracolo del Laghèe": chiusura con 2-3 profezie mistiche e ironiche (in stile blockquote, ">").

REGOLE FERREE:
- Scrivi in italiano.
- Usa SOLO i dati numerici che ti fornisco. Se un dato non c'è, non inventarlo.
- Il corpo dell'articolo va in Markdown (usa ### per i titoli di sezione, ** per il grassetto, > per le profezie dell'Oracolo).
- NON includere il frontmatter YAML: quello lo aggiunge il sistema.

OLTRE ALL'ARTICOLO devi produrre anche i dati per la COPERTINA "prima pagina" del giornale:
- titolo_principale: max ~50 caratteri, maiuscolo, a effetto.
- sottotitolo: max ~180 caratteri, il sommario della giornata.
- 3 box (box1, box2, box3), ognuno con: tag (max ~18 caratteri, es. "IL VERDETTO", "L'EDITORIALE", "MERCATO"), titolo (max ~38 caratteri), testo (max ~140 caratteri, sintetico).

FORMATO DI OUTPUT — restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza testo prima o dopo, con questa forma esatta:
{
  "slug": "gazzetta-gNN",            // NN = numero giornata, es. gazzetta-g31
  "title": "Titolo dell'articolo",   // conciso, a effetto
  "description": "Sommario in 1 frase (max ~160 caratteri)",
  "body_md": "Il corpo completo dell'articolo in Markdown",
  "cover": {
    "titolo_principale": "...",
    "sottotitolo": "...",
    "box1": { "tag": "...", "titolo": "...", "testo": "..." },
    "box2": { "tag": "...", "titolo": "...", "testo": "..." },
    "box3": { "tag": "...", "titolo": "...", "testo": "..." }
  }
}`;

/**
 * @param {string} datiTesto - output di datiGiornataInTesto()
 * @param {string} [correzione] - eventuale istruzione di correzione dell'utente
 * @returns {{system: string, user: string}}
 */
function buildPrompt(datiTesto, correzione) {
    const esempi = leggiEsempi();

    let user = `Ecco alcuni esempi dello stile della Gazzetta del Laghèe, per calibrarti:\n\n${esempi}\n\n`;
    user += `============================\n`;
    user += `Ora scrivi l'articolo della NUOVA giornata usando questi dati reali:\n\n${datiTesto}\n\n`;

    if (correzione && correzione.trim()) {
        user += `\nISTRUZIONI DI CORREZIONE DALL'EDITORE (applicale rigorosamente rispetto alla bozza precedente):\n${correzione.trim()}\n\n`;
    }

    user += `Restituisci solo il JSON richiesto.`;

    return { system: SYSTEM_PROMPT, user };
}

module.exports = { buildPrompt, SYSTEM_PROMPT };
