# Automazione Gazzetta Fanta Laghèe — Documento di Riferimento

> Questo file resta nel repo apposta: è l'unico modo per portare il contesto di questo
> ragionamento in una conversazione futura (anche su un'altra sessione/agente), dato che
> le sessioni di Claude Code non condividono memoria tra loro. Leggi prima questo file,
> poi continua da qui.

## ⚡ STATO AGGIORNATO (12 luglio 2026) — architettura definitiva, manca solo un token

### L'architettura scelta (cambiata rispetto alla prima idea)

Il piano iniziale prevedeva un bot Telegram standalone scritto da noi (`scripts/gazzetta/bot.js`,
sempre acceso, lettura HERMES_API_KEY su OpenRouter). **Quel bot esiste ancora nel repo ma non è
più la via scelta**: l'utente ha già un agente proprio, "Hermes" (Nous), collegato a Telegram,
GitHub e OpenRouter. Quindi Hermes stesso fa da orchestratore — non serve un bot separato sempre
acceso. Il ruolo di ogni pezzo:

- **Hermes** (agente Telegram dell'utente): legge i dati, scrive l'articolo, scrive il prompt
  dell'immagine, committa il `.md` su GitHub, manda la bozza e il messaggio WhatsApp finale.
  **Segue `docs/HERMES_PLAYBOOK.md`** (letto dal branch `main` a ogni esecuzione).
- **GitHub Action** (`.github/workflows/gazzetta-cover.yml`): quando arriva un commit con un
  articolo che ha il blocco `cover:`, genera l'illustrazione hero (Pollinations.ai, gratis,
  nessuna chiave) e compone la copertina finale PNG con Puppeteer, poi la committa.
- **Vercel**: pubblica in automatico a ogni push su `main` (già configurato da prima, non
  toccato da questo lavoro).

Verificato con ricerca: **Hermes 4 di Nous è un modello di solo testo**, non genera immagini
nativamente — per questo la generazione dell'illustrazione è stata spostata dalla Action
(Pollinations) invece che da Hermes via tool `image_generate` (che richiederebbe una `FAL_KEY`
non disponibile nell'ambiente di Hermes).

### Il flusso completo, oggi

```
Utente -> messaggio a Hermes su Telegram ("fai la gazzetta")
       -> Hermes accende il calcolo sul Google Sheet (Apps Script Web App)
       -> attende ~3 min
       -> legge i dati da /api/verdetto (nessuna credenziale, CSV pubblico)
       -> scrive l'articolo (voce Buffa/Ziliani/Pardo) + un "image_prompt"
       -> manda la BOZZA testuale su Telegram
Utente -> OK (o correzioni -> Hermes riscrive)
       -> Hermes committa SOLO il file .md su GitHub (branch main), con:
            - il testo dell'articolo
            - cover.image_prompt (descrizione in inglese dell'illustrazione satirica)
            - cover.box1/2/3 = DATI reali (Top 5 giornata, Classifica, Verdetti)
GitHub Action -> genera l'hero da image_prompt (Pollinations) 
              -> compone la copertina finale (template rosa + hero + 3 box dati)
              -> committa il PNG
Vercel        -> deploy automatico -> articolo LIVE
Hermes        -> recupera la copertina e la manda su Telegram per verifica
              -> prepara il messaggio pronto da incollare su WhatsApp
```

### ✅ Cosa è stato costruito e testato (tutto già su `main`)

| Pezzo | File | Stato |
|---|---|---|
| Template grafico copertina (rosa, logo, testata) | `scripts/gazzetta/template.html` | ✅ testato |
| Motore di rendering PNG (Puppeteer) | `scripts/gazzetta/genera_gazzetta.js` | ✅ testato |
| Generazione hero da testo (Pollinations, gratis) | `scripts/gazzetta/lib/imagegen.js` | ✅ scritto, non testabile nel sandbox (host bloccato dal proxy), ma è l'endpoint pubblico documentato |
| Composizione copertina da frontmatter `.md` (usato dalla Action) | `scripts/gazzetta/build_cover_from_md.js` | ✅ testato |
| GitHub Action che scatta al commit di un articolo | `.github/workflows/gazzetta-cover.yml` | ✅ attiva su `main` (verificato via API GitHub) |
| Manuale operativo che Hermes legge e segue | `docs/HERMES_PLAYBOOK.md` | ✅ letto con successo da Hermes su `main` |
| Prompt/voce editoriale (stile Buffa/Ziliani/Pardo, dai tuoi articoli veri) | `scripts/gazzetta/lib/prompt.js` | ✅ (usato dal bot standalone, non da Hermes — vedi nota sotto) |
| Lettura dati giornata dal foglio | `/api/verdetto` (già esistente) + `scripts/gazzetta/lib/fetchGiornata.js` | ✅ |
| **Prova end-to-end reale con Hermes** | — | ⚠️ **fatta parzialmente**: Hermes ha scritto un articolo di giornata 38 (stagione 2526, dati reali) col vecchio formato box, la Action ha generato la copertina correttamente. Poi il formato box è cambiato (ora sono dati, non testo) e quel test è stato rimosso dal repo (era di prova). **Va rifatto da capo col formato nuovo.** |

### ❌ Cosa manca davvero (il vero "cosa devo risolvere")

1. **GITHUB_TOKEN per Hermes.** Nell'ultimo tentativo Hermes ha scritto l'articolo ma
   **non è riuscito a committarlo**: "l'autenticazione MCP GitHub è fallita (nessun token
   configurato in questa sessione)". Senza un token con permesso di scrittura sul repo
   `dritall/fantalaghee`, Hermes non può completare il passo 6 del playbook (commit).
   **Questo è il blocco numero 1, quello che rompe l'automazione end-to-end oggi.**
   Va risolto configurando l'accesso GitHub nel profilo/ambiente di Hermes (token con
   permesso `contents: write` su quel repo).

2. **Apps Script pubblicato come Web App** (per il trigger automatico del calcolo giornata).
   Non risulta ancora confermato che sia stato fatto. Serve:
   - pubblicare lo script del foglio come Web App (istruzioni già date in questa
     conversazione: `Estensioni → Apps Script → doGet(e) con token → Distribuisci → App web`)
   - dare a Hermes `APPS_SCRIPT_WEBAPP_URL` e `APPS_SCRIPT_SECRET`
   Nota: **non blocca i test** — si può sempre saltare il passo 1 e leggere direttamente
   `/api/verdetto?stagione=2526` (dati reali archiviati) per provare tutto il resto.

3. **Un test end-to-end completo col formato definitivo** (hero da `image_prompt` + 3 box
   dati). Non ancora fatto per intero: il test precedente usava il formato vecchio dei box
   ed è stato rimosso. Da rifare una volta risolto il punto 1.

4. **Qualità/coerenza dell'immagine generata da Pollinations** — mai vista in azione (solo
   documentata). Da valutare alla prima immagine vera: se lo stile non convince o Pollinations
   ha limiti di rate/qualità, si passa a un provider a pagamento (pochi centesimi/immagine)
   cambiando solo `scripts/gazzetta/lib/imagegen.js`.

### Riepilogo in una frase

**Il sistema è scritto, collaudato a pezzi, e Hermes sa leggere le istruzioni e scrivere
correttamente — l'unica cosa che blocca l'automazione reale oggi è che Hermes non ha ancora
un permesso di scrittura (token) sul repo GitHub per completare da solo il commit finale.**
Sistemato quello, si può fare un test end-to-end pulito e poi è operativo.

---

## 0. Punto di partenza (cosa esiste già oggi)

| Pezzo | Stato | Dove |
|---|---|---|
| Inserimento punteggi fantacalcio nel Google Sheet | **Già automatizzato** da un Google Apps Script scritto dall'utente, dentro il foglio stesso | Google Sheet (non in questo repo) |
| Foglio "Classifica" e "Verdetto" pubblicati come CSV | Già live, letti da `/api/classifica` e `/api/verdetto` | `app/api/classifica/route.ts`, `app/api/verdetto/route.ts`, `lib/seasons.ts` |
| Articoli Gazzetta | File Markdown statici nel repo, con frontmatter (title, date, description, author, image) | `public/articoli/md/*.md` |
| Generazione screenshot/immagini di pagine | Script Puppeteer esistente, ma usato solo per preview di pagine intere, non per generare la copertina di un articolo | `take_screenshot.js` |
| Dati Serie A (calendario/risultati) | Scraping diretto delle API pubbliche di Lega Serie A | `app/api/football/route.ts` |

**Cosa manca:** il pezzo che prende i dati già pronti nel Google Sheet e li trasforma in un
articolo pubblicato sul sito, con immagine di copertina, senza editing manuale.

---

## 1. Pipeline proposta, end-to-end

```
1. Google Sheet aggiornato (già automatico via Apps Script)
        │
2. Tu mandi un comando ("Aggiorna la gazzetta della giornata 31")
        │  → a un agente (chat/Telegram/CLI), non serve aprire l'editor
        ▼
3. L'agente legge i dati della giornata dal Google Sheet
   (via Sheets API, o leggendo il CSV pubblicato — già disponibile)
        ▼
4. L'agente genera il TESTO dell'articolo (LLM)
        ▼
5. L'agente genera l'IMMAGINE di copertina (template HTML + Puppeteer,
   NON immagine generativa — per branding consistente)
        ▼
6. L'agente crea una PR su GitHub con il .md + l'immagine
        ▼
7. Tu ricevi una notifica, leggi la PR, eventualmente correggi una riga,
   e fai merge
        ▼
8. Vercel fa auto-deploy → articolo pubblicato
```

Il punto 7 (review umana prima della pubblicazione) resta com'era stato deciso: niente
pubblicazione automatica senza un tuo OK.

---

## 2. Il comando "tramite mio comando" — come funziona in pratica

Hai due strade, non per forza alternative:

### A) Dentro questa stessa interfaccia (Claude Code on the web)
Questo è esattamente l'ambiente in cui stiamo parlando ora. Puoi:
- aprire una sessione e scrivere "Aggiorna la gazzetta della giornata 31"
- l'agente (io, o un agente equivalente) esegue i passi 3-6 sopra e apre la PR
- ricevi la PR su GitHub, la rivedi, fai merge

Questo **funziona già con l'infrastruttura che hai ora** (questo stesso prodotto), non
richiede di costruire nulla di nuovo: basta che io (o un nuovo agente, leggendo questo
file) abbia accesso al Google Sheet (serve condividere un modo di leggerlo: link CSV
pubblico, che probabilmente già hai, oppure credenziali Google Sheets API) e al repo
(che ho già).

### B) Un bot esterno dedicato (Telegram/WhatsApp/comando da telefono)
Se vuoi poter scrivere il comando da telefono senza aprire Claude Code:
- un piccolo bot Telegram (o un webhook) riceve il messaggio "/gazzetta 31"
- il bot chiama un endpoint `/api/auto-gazzetta` su Vercel con un token segreto
- l'endpoint fa il lavoro (legge sheet, chiama l'LLM, genera immagine, apre PR via GitHub API)
- il bot ti risponde con il link della PR

La via B è più "thin client" (un comando da telefono) ma richiede di costruire e
mantenere un endpoint server-side con accesso a: Google Sheets API, un LLM, Puppeteer
(che su Vercel serverless ha dei limiti — meglio eseguirlo come GitHub Action o su un
piccolo servizio sempre attivo), e GitHub API per la PR.

**Consiglio:** parti dalla via A (zero infrastruttura nuova, usi quello che hai già).
Se in futuro vuoi il comando da telefono senza passare dal browser, costruiamo la B
come secondo passo — è un'estensione, non una riscrittura.

---

## 3. Quale LLM per generare l'articolo — la questione "Hermes di Nous"

Hai detto di voler usare **Hermes (Nous Research)** come agente. Punti da sapere:

- Hermes è un modello **open-weight**, non è ospitato da Anthropic: per usarlo da codice
  serve chiamarlo tramite un provider che lo mette a disposizione via API — i più comuni
  sono **OpenRouter**, **Together.ai**, **Fireworks.ai** (richiede una chiave API e un
  account su uno di questi, con relativo costo a consumo, generalmente basso).
- La chiamata è una semplice POST HTTP in stile OpenAI-compatible:
  ```ts
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nousresearch/hermes-3-llama-3.1-405b', // esempio, va verificato il nome esatto disponibile
      messages: [
        { role: 'system', content: 'Sei il cronista della Gazzetta del Fanta Laghèe...' },
        { role: 'user', content: datiGiornataInTestoStrutturato },
      ],
    }),
  });
  ```
- Se invece intendevi "Hermes" come nome che hai dato tu a un tuo agente/persona (cioè
  vuoi che IO, nelle sessioni di Claude Code, mi comporti seguendo quello stile/voce),
  questo non richiede nessuna integrazione tecnica: basta scrivere un file
  `docs/VOCE_GAZZETTA.md` con le istruzioni di tono/stile e linkarlo da `CLAUDE.md`, così
  ogni sessione futura lo legge automaticamente e scrive in quello stile.

**Domanda da chiarire con te (non blocco il resto del lavoro per questo):** vuoi
davvero il modello Hermes via API esterna (costo + chiave da gestire), oppure ti basta
che l'agente che usi già qui (Claude, dentro Claude Code) scriva nello stile che hai in
mente? Se è la seconda, risparmi un'integrazione intera.

---

## 4. Generazione immagine di copertina

Riusando `take_screenshot.js` come base:
- creare un template HTML statico (`/app/og/gazzetta-template` o un file HTML standalone)
  con placeholder per: titolo, sottotitolo, immagine di sfondo, numero giornata, data
- uno script Puppeteer apre il template con i dati della giornata iniettati via querystring
  o file temporaneo, e fa lo screenshot → PNG salvato in `public/image/gazzetta/`
- niente immagini generative: il branding resta sempre identico, cambiano solo i dati

---

## 5. Pubblicazione con review (GitHub PR)

- L'agente crea un branch `gazzetta/giornata-XX`
- Aggiunge il file `.md` in `public/articoli/md/` e l'immagine in `public/image/gazzetta/`
- Apre una PR (uso già gli strumenti GitHub MCP per questo)
- Tu ricevi la PR, la leggi, eventualmente editi una riga direttamente su GitHub, fai merge
- Vercel fa auto-deploy al merge

Questo è già lo schema che usiamo abitualmente in questo ambiente (Claude Code apre PR,
tu rivedi, merge = pubblicazione) — non serve costruire nulla di nuovo per questa parte.

---

## 6. Cosa serve da te per partire (via A, la più semplice)

1. Confermare se per "Hermes" intendevi il modello esterno o solo lo stile (vedi §3)
2. Il link al Google Sheet (o conferma che il CSV pubblicato già usato da `/api/verdetto`
   contiene già tutti i dati che vuoi nell'articolo — probabilmente sì, visto che
   `parseSheetData` in `app/api/verdetto/route.ts` estrae già podio, record, premi, ecc.)
3. 2-3 articoli passati come esempio di tono/stile (alcuni sono già in
   `public/articoli/md/`, posso analizzarli io stesso come riferimento)
4. Dirmi "ok, costruiscilo" quando vuoi che lo implementi per davvero — questo documento
   è solo il piano, non ho ancora scritto codice per la pipeline.

---

## 7. Stima tempi (invariata rispetto alla prima stesura del piano)

| Step | Complessità | Tempo |
|---|---|---|
| Lettura dati giornata dal Sheet (riuso `/api/verdetto` esistente) | Bassa | 1h |
| Generazione articolo via LLM (con stile coerente) | Media | 3-4h |
| Template HTML + script immagine copertina | Media | 3-4h |
| Apertura PR automatica con branch/file/immagine | Bassa-Media | 2-3h |
| Comando "via A" (chiedere qui in chat) | Zero — funziona già con questo documento come contesto | 0h |
| Bot Telegram/comando da telefono (via B, opzionale, dopo) | Media-Alta | 6-8h |
