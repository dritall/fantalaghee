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
| `template.html` | Template grafico della copertina |
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
