# 🤖 Automazione Gazzetta del Laghèe

Pipeline che, tramite un comando su Telegram, legge i dati della giornata dal foglio,
fa scrivere l'articolo a **Hermes (Nous Research)** nello stile della Gazzetta, te lo
manda in bozza, e — dopo il tuo **OK** — genera la copertina e pubblica live.

## Flusso

```
  /gazzetta  ─►  legge la giornata dal foglio (/api/verdetto)
                        │
                        ▼
                 Hermes scrive l'articolo (stile Gazzetta + Oracolo)
                        │
                        ▼
             📱  ti arriva la BOZZA testuale su Telegram
                        │
        ┌───────────────┼────────────────┐
        │ rispondi OK   │  mandi correzioni │
        ▼               ▼                    
   genera copertina   rigenera la bozza     
   commit + push      e te la rimanda        
        │
        ▼
   🚀 Vercel deploya ─► articolo LIVE
```

## File

| File | Ruolo |
|---|---|
| `bot.js` | Bot Telegram: orchestrazione + flusso di approvazione |
| `genera_articolo.js` | CLI di test (genera la bozza senza Telegram, ha `--mock`) |
| `genera_gazzetta.js` | Rende la copertina "prima pagina" in PNG (Puppeteer) — esporta `renderCover()` |
| `template.html` | Template grafico della copertina (impaginato da quotidiano) |
| `tools/build_masthead.py` | Rigenera la testata vettoriale `public/image/gazzetta/masthead.svg` |
| `tools/build_paper.py` | Rigenera la texture della carta (`carta.jpg` + `carta-velo.png`) |
| `lib/fetchGiornata.js` | Legge i dati giornata da `/api/verdetto` |
| `lib/prompt.js` | Prompt + voce editoriale (usa articoli reali come few-shot) |
| `lib/hermes.js` | Chiamata a Hermes via provider OpenAI-compatible |
| `lib/publish.js` | Scrive `.md` + immagine, commit & push |
| `lib/telegram.js` | Client minimale Telegram Bot API (solo fetch) |

## Setup

1. Copia `.env.example` in `.env` e riempi i valori (chiave Hermes, token Telegram…).
2. Prova la generazione senza chiavi:
   ```bash
   node scripts/gazzetta/genera_articolo.js --mock --cover
   ```
3. Prova la generazione reale (serve `HERMES_API_KEY`):
   ```bash
   node scripts/gazzetta/genera_articolo.js
   ```
4. Avvia il bot (serve anche `TELEGRAM_BOT_TOKEN`):
   ```bash
   node scripts/gazzetta/bot.js
   ```

## La grafica della prima pagina

La copertina è impaginata come una prima pagina vera: filetto con data, testata a
tutta larghezza, titolo di richiamo, catenaccio, foto con didascalia, tre riquadri di
dati e piede di pagina. Cosa conviene sapere quando si scrivono i dati per
`renderCover()`:

- **`titolo_principale`** — va in pagina intero, e il corpo si ricalcola da solo per
  riempire il blocco (fino a tre righe): non serve stare corti a tutti i costi.
- **Evidenza in rosso** — il nome di una squadra citata nei riquadri viene colorato di
  rosso in automatico; per forzarla si scrive `*fra asterischi*` nel titolo.
- **`sottotitolo`** — catenaccio nella stessa famiglia condensata del titolo, con la
  prima frase in neretto; oltre i ~165 caratteri si stringe da solo.
- **`box*.rows`** — formato `"nome|valore"`. Una posizione iniziale (`"1. Sove1907|89.5"`)
  diventa un pallino numerato, oro/argento/bronzo per le prime tre.
- **`didascalia`** (opzionale) — il testo nella barra nera sotto l'illustrazione.
- Le **emoji nei titoli dei riquadri vengono rimosse**: al loro posto ci sono icone
  disegnate, coerenti con la stampa.

La **carta** non è un fondo piatto: `public/image/gazzetta/carta.jpg` è una texture
generata con rumore filtrato in frequenza (grana, macchie, fibre orizzontali,
granelli), ripetibile senza cuciture, che viene fusa col rosa in `multiply`.
`carta-velo.png` è la stessa trama in nero trasparente, stesa sopra tutto: serve a
far prendere la grana anche alla fotografia, così l'illustrazione sembra stampata
sul foglio e non incollata sopra. Si rigenerano con:

```bash
pip install numpy pillow
python3 scripts/gazzetta/tools/build_paper.py
```

La testata **non è testo**: è `public/image/gazzetta/masthead.svg`, un tracciato
vettoriale generato una volta sola da Playfair Display Black. Così la copertina PNG e
il sito mostrano lo stesso marchio anche se Google Fonts non risponde. Si rigenera solo
se cambiano le parole o la crenatura:

```bash
pip install fonttools brotli uharfbuzz
python3 scripts/gazzetta/tools/build_masthead.py
```

## Note / scelte

- **Approvazione = Telegram.** Il tuo "OK" è la review: dopo, il push va diretto su
  `PUBLISH_BRANCH` (default `main`) e Vercel deploya. Se preferisci un gate extra via
  Pull Request, si cambia in `lib/publish.js`.
- **Hermes fa il cronista, il codice fa il resto.** Hermes genera testo + dati copertina;
  lettura foglio, immagine, git e Telegram sono codice deterministico (più robusto ed
  economico di un agente full tool-calling — che resta un'evoluzione possibile).
- **Il bot ha bisogno di girare da qualche parte** (un piccolo servizio sempre attivo,
  o una macchina che tieni accesa). Vercel serverless non va bene per il long-polling +
  Puppeteer + git. In alternativa si può trasformare `/gazzetta` in un trigger schedulato.
