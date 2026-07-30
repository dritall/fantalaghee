# Automazione Gazzetta Fanta Laghèe — Documento di Riferimento

> Questo file resta nel repo apposta: è l'unico modo per portare il contesto di questo
> ragionamento in una conversazione futura (anche su un'altra sessione/agente), dato che
> le sessioni di Claude Code non condividono memoria tra loro. Leggi prima questo file,
> poi continua da qui.

## ➕ Aggiunta (30 luglio 2026) — conferma testo+immagine e rigenerazione copertina

Su richiesta: Hermes non pubblica più "di slancio". Ora il flusso ha **due conferme**
esplicite — prima sul testo (prima di pubblicare), poi sull'immagine (dopo che la Action
ha composto la copertina). L'articolo viene committato prima di vedere l'immagine, ma non
viene condiviso (WhatsApp) finché l'utente non approva anche la copertina.

Per far provare varianti dell'illustrazione **senza dare a Hermes accesso a GitHub e senza
mettere le chiavi immagine su Vercel**, è stato aggiunto **`POST /api/gazzetta/rigenera-copertina`**
(`app/api/gazzetta/rigenera-copertina/route.ts`): stessa autenticazione
(`GAZZETTA_PUBLISH_SECRET`), lato server fa partire la GitHub Action `gazzetta-cover.yml`
via `workflow_dispatch` con `slug` + un **seed nuovo** + `force`, usando `GAZZETTA_GH_TOKEN`
(già su Vercel). L'immagine continua a generarla la Action, dove le chiavi
`GEMINI_API_KEY`/`OPENROUTER_API_KEY` già vivono. Nota: il token deve poter avviare le
Action (un token classic con scope `repo` lo può; un fine-grained richiede "Actions:
Read and write") — altrimenti l'endpoint risponde `403` con istruzioni.

Rifinita anche la resa dell'illustrazione (`scripts/gazzetta/lib/imagegen.js`): stile spinto
verso la **caricatura a fumetto ricca e colorata** delle copertine storiche (non minimal/
pittorica) e riferimenti di stile di default aggiornati a tre copertine reali
(`edizione-straordinaria-2627`, `trilogia-del-potere`, `speciale-giro-di-boa`).

---

## ➕ Aggiunta (29 luglio 2026) — cancellazione articolo, a due passi

Su richiesta dell'utente (comodo per pulire un test pubblicato senza una nuova giornata
reale da raccontare): `app/api/gazzetta/publish/route.ts` espone ora anche
**`DELETE`**, stesso endpoint, stessa autenticazione (`GAZZETTA_PUBLISH_SECRET`).
Cancella l'articolo `.md` e la copertina (`.png` + eventuale hero intermedio) di una
giornata — quella indicata in `{ "giornata": N }`, o la più alta pubblicata se omessa
("ultima giornata"). **A due passi apposta**, perché è un'operazione difficile da
invertire: la prima chiamata (senza `"conferma": true`) non cancella nulla e risponde
solo con un'anteprima di cosa verrebbe rimosso; solo una seconda chiamata con
`"conferma": true` esegue davvero. Playbook aggiornato in
`docs/HERMES_PLAYBOOK.md` (sezione "Comando extra: cancella ultima giornata").

---

## ⚡ STATO AGGIORNATO (29 luglio 2026) — le tre responsabilità spostate dal modello al codice

### Il principio

Fino a questa iterazione, Hermes scriveva prosa, copiava numeri a mano, componeva YAML e
faceva un commit git — tre mestieri che non sono i suoi, e nei quali sbagliava (in
particolare: nessun token GitHub nel suo ambiente, quindi il commit finale non partiva
mai). Il principio applicato qui: **il modello scrive solo prosa e un prompt d'immagine;
ogni numero che finisce in copertina lo mette il codice, rileggendolo dalla fonte
(`/api/verdetto`).** Hermes non ha più bisogno di GitHub, non genera immagini, non
compila i box dati e non deve più sapere a memoria il numero di giornata.

### Chi fa cosa, oggi

- **Hermes** (agente Telegram dell'utente): legge `/api/gazzetta/stato`, scrive
  l'articolo e un `image_prompt` in inglese, manda la bozza su Telegram per l'OK
  dell'utente, poi pubblica con **una singola `POST /api/gazzetta/publish`**.
  **Segue `docs/HERMES_PLAYBOOK.md`** (riscritto: 5 passi invece di 8, zero YAML, zero
  git). Nessun accesso GitHub necessario.
- **`app/api/gazzetta/stato/route.ts`** (nuovo): incrocia tre fonti — calendario Serie A
  (`/api/football?endpoint=matchdays`), foglio (`/api/verdetto`), filesystem
  (`public/articoli/md/gazzetta-g{N}.md`) — e risponde con un solo verdetto:
  `PRONTA` / `FOGLIO_DA_RICALCOLARE` / `GIA_PUBBLICATA` / `NON_ANCORA`, più un `motivo`
  in italiano che Hermes può riportare così com'è all'utente. Elimina l'attesa "a occhio"
  del vecchio playbook e la domanda "che giornata è" all'utente.
- **`app/api/gazzetta/publish/route.ts`** (nuovo): riceve la bozza di Hermes (title,
  description, body_md, cover con titolo/sottotitolo/image_prompt), valida tutto a mano,
  rifiuta un payload che include `box1/2/3` (li ricalcola da solo da `/api/verdetto`),
  compone il frontmatter con `gray-matter` (mai YAML a mano) e committa il `.md` su
  `main` via GitHub Contents API, autenticato con un token server-side che Hermes non
  vede mai. Protetto da `Authorization: Bearer {GAZZETTA_PUBLISH_SECRET}`. Idempotente:
  un articolo già esistente per quella giornata risponde `409` a meno di `force:true`.
- **`scripts/gazzetta/lib/imagegen.js`** (riscritto): catena di provider
  `google` (Nano Banana 2 via Gemini, primario) → `openrouter` (Image API, scorta) →
  `pollinations` (gratis, ultima rete). I primi due ricevono in ingresso due copertine
  storiche della testata (`gazzetta-g30-sorpasso.webp`, `gazzetta-g28-triello-onda.webp`)
  come riferimento di stile, per restare coerenti con le copertine disegnate a mano.
  Firma di `generateHero()` invariata, così `build_cover_from_md.js` non ha dovuto
  cambiare la chiamata.
- **`scripts/gazzetta/build_cover_from_md.js`** (corretto): un `.md` con blocco `cover`
  ma senza illustrazione generabile ora fa fallire lo script (`exit 1`), invece di
  pubblicare in silenzio una copertina senza hero come succedeva prima. Un `.md` senza
  blocco `cover` (i vecchi articoli scritti a mano) resta un salto legittimo, non un
  errore.
- **GitHub Action** (`.github/workflows/gazzetta-cover.yml`): genera l'hero e compone la
  copertina finale con Puppeteer. Ora riceve `GEMINI_API_KEY`/`OPENROUTER_API_KEY` solo
  sullo step di build, non fa mai passare verde un fallimento reale (nessun
  `continue-on-error`), e accetta `slug`/`seed`/`force` da `workflow_dispatch` per
  rigenerare una copertina senza toccare l'articolo.
- **Vercel**: pubblica in automatico a ogni push su `main` (invariato).

### Il flusso completo, oggi

```
Utente -> messaggio a Hermes su Telegram ("fai la gazzetta")
       -> Hermes: GET /api/gazzetta/stato
          - GIA_PUBBLICATA / NON_ANCORA -> riporta il motivo, fine
          - FOGLIO_DA_RICALCOLARE -> sveglia l'Apps Script, ripolla stato ogni 60s (max 5)
          - PRONTA -> continua
       -> GET /api/verdetto -> scrive l'articolo + image_prompt (inglese)
       -> manda la BOZZA testuale su Telegram
Utente -> OK (o correzioni -> Hermes riscrive)
       -> Hermes: POST /api/gazzetta/publish { title, description, body_md, cover }
Server -> risolve la giornata, verifica idempotenza su GitHub, richiama /api/verdetto,
          costruisce box1/2/3 dai dati reali, compone il frontmatter (gray-matter),
          committa il .md su main
GitHub Action -> genera l'hero (google -> openrouter -> pollinations, con riferimento di stile)
              -> compone la copertina finale (template rosa + hero + 3 box dati)
              -> committa il PNG (o FALLISCE rumorosamente se l'hero non si genera)
Vercel        -> deploy automatico -> articolo LIVE
Hermes        -> attende ~90s, verifica che coverUrl risponda 200 (max 4 tentativi)
              -> manda la copertina su Telegram, poi il messaggio pronto per WhatsApp
```

### Variabili d'ambiente da configurare

| Variabile | Dove | A cosa serve |
|---|---|---|
| `GEMINI_API_KEY` | Secret di GitHub Actions | provider immagine primario (Nano Banana 2) |
| `OPENROUTER_API_KEY` | Secret di GitHub Actions (e config Hermes, per scrivere l'articolo) | provider immagine di scorta / LLM di Hermes |
| `GAZZETTA_PUBLISH_SECRET` | Environment Variable di Vercel + config Hermes | autentica `POST /api/gazzetta/publish` |
| `GAZZETTA_GH_TOKEN` | Environment Variable di Vercel | token GitHub server-side (`contents: write`) per il commit dell'articolo — Hermes non lo vede mai |
| `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` | Environment Variable di Vercel (opzionali, default `dritall`/`fantalaghee`) | repo target del commit |
| `APPS_SCRIPT_WEBAPP_URL` / `APPS_SCRIPT_SECRET` | config Hermes | trigger ricalcolo foglio |
| `IMAGE_PROVIDERS`, `IMAGE_STYLE_REFS`, `GEMINI_IMAGE_MODEL`, `OPENROUTER_IMAGE_MODEL`, `IMAGE_SEED` | opzionali, Secret/env di GitHub Actions | override della catena provider e dei riferimenti di stile |

### Cosa resta da fare prima di andare live

1. **Popolare i secret sopra** (`GEMINI_API_KEY`, `OPENROUTER_API_KEY` su GitHub Actions;
   `GAZZETTA_PUBLISH_SECRET`, `GAZZETTA_GH_TOKEN` su Vercel).
2. **Un test end-to-end reale** col nuovo endpoint `/api/gazzetta/publish` — non ancora
   fatto in questa sessione (nessuna chiamata di rete a Gemini/OpenRouter/GitHub è stata
   fatta durante l'implementazione, per esplicita richiesta: il codice è scritto, non
   collaudato contro le API vere).
3. **Aggiornare `APPS_SCRIPT_WEBAPP_URL`/`APPS_SCRIPT_SECRET`** in config Hermes se non
   già fatto (invariato rispetto a prima).
4. **Valutare la qualità/coerenza delle prime immagini generate da Nano Banana 2** — mai
   vista in azione. Se lo stile non convince, si aggiusta `STYLE_SUFFIX` o
   `STYLE_REF_INSTRUCTION` in `scripts/gazzetta/lib/imagegen.js`, oppure si cambia
   l'ordine dei provider via `IMAGE_PROVIDERS`.

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
