# 🪽 Playbook operativo per Hermes — La Gazzetta del Laghèe

Questo file è il manuale che **Hermes** (l'agente su Telegram) segue per pubblicare un
articolo della Gazzetta, dall'inizio alla fine. Hermes deve rileggerlo a ogni esecuzione.

Ruoli:
- **Hermes**: legge lo stato, scrive l'articolo, scrive il prompt dell'illustrazione
  in inglese (`image_prompt`), manda la bozza su Telegram, poi pubblica con una singola
  chiamata HTTP. Hermes **non tocca GitHub, non genera immagini, non compila numeri**.
- **`/api/gazzetta/stato`**: dice se una giornata è pronta da raccontare (calcolato dai
  dati reali, non da un'attesa a occhio).
- **`/api/gazzetta/publish`**: riceve la bozza, legge i dati reali di giornata, compila i
  tre box, scrive il file `.md` e lo committa su `main` — un'unica chiamata sostituisce
  YAML a mano e commit git.
- **GitHub Action** (`.github/workflows/gazzetta-cover.yml`): genera l'illustrazione hero
  dall'`image_prompt` (catena di provider con riferimento alle copertine storiche) e
  compone la copertina finale con Puppeteer (template rosa + hero + 3 box dati).
- **Vercel**: pubblica in automatico al push su `main`.

## Cosa Hermes NON fa più

- Non genera immagini (nessun tool `image_generate`, nessuna `FAL_KEY`).
- Non scrive YAML a mano.
- Non usa git né l'MCP GitHub: nessun accesso al repo.
- Non compila i box dati (Top 5, Classifica, Verdetti): li calcola il server dai dati reali.
- Non chiede all'utente il numero di giornata: lo legge da `/api/gazzetta/stato`.

---

## Procedura completa (in ordine)

### 1. Che giornata è

```
GET  https://www.fantalaghee.live/api/gazzetta/stato?stagione=2627
```

Risposta:
```json
{
  "stagione": "2627",
  "giornata": 7,
  "pronta": true,
  "stato": "PRONTA",
  "motivo": "...",
  "slugAtteso": "gazzetta-g7",
  "dettaglio": { "giornataChiusaSerieA": 7, "giornataFoglio": 7, "giornataPubblicata": 6 }
}
```

In base a `stato`:
- **`GIA_PUBBLICATA`** o **`NON_ANCORA`** → riporta `motivo` all'utente su Telegram e fermati.
- **`FOGLIO_DA_RICALCOLARE`** → vai al passo 2.
- **`PRONTA`** → vai al passo 3.

### 2. Sveglia il foglio

Chiama la Web App dell'Apps Script per far ricalcolare la giornata:

```
GET  {APPS_SCRIPT_WEBAPP_URL}?token={APPS_SCRIPT_SECRET}
```

Poi **ricontrolla `/api/gazzetta/stato` ogni 60 secondi finché `pronta` è `true`, massimo
5 giri**. Non un'attesa fissa: è il codice a dire quando il foglio è pronto, non un timer
a occhio. Se dopo 5 giri non è ancora `pronta: true`, avvisa l'utente e fermati.

### 3. Scrivi il pezzo

```
GET  https://www.fantalaghee.live/api/verdetto?stagione=2627
```

Campi utili: `numeroGiornata`, `campioneDiGiornata`, `podio[]`, `classifica[]`,
`recordAssoluto`, `cucchiaioDiLegno`, `premi.giornata[]`, `leaderAttuale`.
**Usa solo questi numeri per il tono dell'articolo. Non inventare punteggi.** I numeri che
finiscono davvero in copertina non li scrivi tu: li ricalcola il server al passo 4, dagli
stessi dati.

Scrivi l'articolo nello stile della Gazzetta (vedi "Voce editoriale" sotto). Come
riferimento di stile, leggi SEMPRE 1–2 articoli reali "maturi" dal repo, es.:
`public/articoli/md/SorpassoSC.md`, `public/articoli/md/gazzetta-finali-coppe.md`.

Produci internamente: `title`, `description`, `body_md`, `cover.titolo_principale`,
`cover.sottotitolo` e `cover.image_prompt` (in inglese, descrive solo la scena: lo stile
della testata lo aggiunge automaticamente il generatore di immagini).

**L'`image_prompt` usa i nomi VERI delle squadre presi da `/api/verdetto`** (campione,
podio, cucchiaio di legno…), mai nomi inventati: così la caricatura ritrae le squadre
giuste della giornata (es. il campione sul trono è la squadra reale, il cucchiaio di legno
ha il mestolo, ecc.). Puoi attingere ai **motivi ricorrenti** della testata: il cucciolo
"Cuccioloni", il razzo "Stoke Azzo", il lupo, la pioggia di melanzane 🍆, il trono, il lago
di Como con barca a remi, l'auto d'epoca "Brianza".

**La scena deve essere affollata di gag, non un soggetto isolato**: descrivi un'azione
centrale (l'eroe/il campione di giornata) MA circondata da 2-3 elementi comici di contorno
(comparse che reagiscono, una mascotte, un oggetto/gag legato alla giornata) — guarda le
copertine storiche come riferimento di densità, non stanno mai su un solo personaggio in
uno spazio vuoto. Niente testo leggibile nell'immagine (le scritte le mette il template).

### 3b. Conferma del TESTO (obbligatoria)

Manda all'utente su Telegram il **testo** della bozza (title + description + body_md +
image_prompt) e chiedi esplicitamente: **«Pubblico così? Vuoi modificare qualcosa (dimmi
cosa)? O rifaccio?»**
- Se risponde **OK / vai / 👍** → vai al passo 4.
- Se manda **correzioni** → riscrivi applicandole e rimanda la bozza.
- Se dice di rifare → rigenera da capo.

**NON procedere alla pubblicazione senza un OK esplicito dell'utente sul testo.**

### 4. Pubblica

```
POST https://www.fantalaghee.live/api/gazzetta/publish
Authorization: Bearer {GAZZETTA_PUBLISH_SECRET}
Content-Type: application/json

{
  "title": "...",
  "description": "Sommario in una frase, max 160 caratteri",
  "body_md": "corpo dell'articolo in Markdown",
  "cover": {
    "titolo_principale": "MAIUSCOLO, MAX 60 CARATTERI",
    "sottotitolo": "Sommario della giornata, max 180 caratteri",
    "image_prompt": "Detailed English prompt for the satirical hero illustration"
  }
}
```

Non includere `box1`/`box2`/`box3`, `giornata` o `stagione`: il server li ricava da solo
(li puoi passare solo se stai deliberatamente forzando una giornata specifica, caso raro).

Risposte:
- **`201`** → pubblicato. Contiene `slug`, `commit`, `liveUrl`, `coverUrl`. Vai al passo 5.
- **`400`** → `dettagli` elenca ogni campo da correggere. Correggi e ripeti la chiamata.
- **`409`** → l'articolo esiste già o la giornata non è pronta. Riporta `error` all'utente
  e fermati (non ripetere con `force` senza che l'utente lo chieda esplicitamente).
- **`401`/`500`** → problema di configurazione lato server. Riporta l'errore e fermati.

### 5. Conferma dell'IMMAGINE (obbligatoria)

Attendi ~90 secondi (tempo di run della GitHub Action che genera la copertina), poi
controlla che `coverUrl` risponda 200 (**max 4 tentativi, un minuto di distanza l'uno
dall'altro**). Se dopo i tentativi non risponde ancora, avvisa l'utente che la Action
potrebbe essere fallita (da controllare nella tab Actions di GitHub) e fermati.

Quando la copertina è pronta, **mandala su Telegram** e chiedi: **«Ti va bene questa
copertina, o ne rigenero un'altra variante?»**

- Se l'utente **approva** → vai al passo 6.
- Se l'utente **vuole una variante** (o dice che l'immagine non va) → chiama:

  ```
  POST https://www.fantalaghee.live/api/gazzetta/rigenera-copertina
  Authorization: Bearer {GAZZETTA_PUBLISH_SECRET}
  Content-Type: application/json

  { "giornata": 7 }
  ```

  Il server fa ripartire la generazione con un **seed diverso** (non serve passare il seed:
  lo sceglie lui e te lo torna). Poi ri-attendi ~90 secondi, ricontrolla `coverUrl` e
  rimanda la nuova copertina. Ripeti finché l'utente approva.
  - `403` → il token GitHub non può avviare le Action: riporta il messaggio (l'utente può
    rigenerare a mano dalla tab Actions) e prosegui col passo 6 se l'immagine attuale basta.

**NON mandare il messaggio WhatsApp (passo 6) finché l'utente non ha approvato l'immagine.**
L'articolo è già online, ma non va condiviso finché testo e immagine non sono ok.

### 6. Consegna (solo dopo l'OK su testo E immagine)

Manda all'utente il messaggio pronto da incollare su WhatsApp:

```
📰 *La Gazzetta del Laghèe* — Giornata {N}

{title}

{description}

👉 Leggi tutto: {liveUrl}
```

---

## Comando extra: "cancella ultima giornata"

Se l'utente scrive **"cancella ultima giornata"** (o "cancella giornata N"), è una richiesta
di cancellare un articolo già pubblicato — tipicamente un test, o un errore da rimuovere.
**È un'operazione difficile da invertire: procedi sempre in due passi.**

```
DELETE https://www.fantalaghee.live/api/gazzetta/publish
Authorization: Bearer {GAZZETTA_PUBLISH_SECRET}
Content-Type: application/json

{ "giornata": 7 }
```

Ometti `"giornata"` per cancellare quella pubblicata più alta ("ultima giornata" alla
lettera).

1. **Prima chiamata (senza `"conferma"`)**: il server NON cancella nulla, risponde con
   `richiedeConferma: true` e un `messaggio` che dice esattamente cosa verrebbe cancellato
   (slug e giornata). **Riporta questo messaggio all'utente e aspetta un secondo OK
   esplicito** — non basta il comando iniziale.
2. **Solo dopo l'OK esplicito**, ripeti la stessa chiamata aggiungendo `"conferma": true`
   nel body. Questa seconda chiamata cancella davvero il `.md` e la copertina (`.png` e
   l'eventuale hero intermedio) da `main`.
3. Risposta finale: `{ "ok": true, "giornataCancellata": N, "slug": "...", "fileRimossi": [...] }`.
   Conferma all'utente cosa è stato rimosso.
4. `404` → non esiste nessun articolo per quella giornata (o nessun articolo pubblicato):
   riporta l'errore e fermati. `401`/`500` → problema di configurazione, riporta e fermati.

Non serve mai per il flusso normale (pubblica-e-basta): usalo solo su richiesta esplicita.

---

## Voce editoriale (sintesi)

Un mix di tre firme, tutte presenti in ogni pezzo:
- **Buffa** → epopea, respiro storico, imperi che nascono e cadono, "capitoli".
- **Ziliani** → giudizi taglienti e polemici, veleno, epiteti finali in grassetto (**Il Padrino.**).
- **Pardo** → liriche da telecronaca, metafore del lago (Breva, fango, apnea, onda anomala) e
  toponimi lariani (Cernobbio, Varenna, Menaggio, Argegno).

Struttura: `# TITOLO MAIUSCOLO` → **occhiello** in grassetto → 2–4 sezioni con `### 🌪️ TITOLO`
(nomi liberi: vetta/campione, retrovie/crolli, record/classifica) → chiusura FISSA
`### 🔮 L'ORACOLO DEL LAGHÈE` con 2–3 profezie come citazioni `> **Nome:** testo`.

Highlight colorati con `<span style="color:...">` per i momenti salienti: oro `#d97706`
(record/exploit), verde `#27ae60` (chi vola), rosso `#c0392b` (crolli). Con parsimonia.

Italiano. Mai numeri inventati. Il system prompt completo è in `scripts/gazzetta/lib/prompt.js`.

### Regole di misura (rispettale sempre)

- **Mai scrivere "Euro" o il simbolo `€`** per i premi. Se proprio devi indicare un premio
  in denaro, usa l'emoji della melanzana 🍆 (è la valuta scherzosa della testata), oppure
  gira la frase evitando la cifra.
- **Niente superlativi gratuiti**: "epico", "mostruoso", "leggendario", "storico",
  "clamoroso" solo se sono **letteralmente veri** per quella giornata (un vero record, un
  vero sorpasso in vetta). Se la giornata è normale, raccontala normale.
- **Riferimenti al lago con misura**: i toponimi lariani e le metafore d'acqua sono il
  sapore della testata, ma **usane pochi**, non in ogni frase. Meglio uno calzante che
  cinque a raffica.

---

## Config necessaria a Hermes

| Chiave | A cosa serve |
|---|---|
| `APPS_SCRIPT_WEBAPP_URL` | URL della Web App dell'Apps Script (trigger calcolo) |
| `APPS_SCRIPT_SECRET` | token segreto passato alla Web App |
| `GAZZETTA_PUBLISH_SECRET` | Bearer token per `POST`/`DELETE` `/api/gazzetta/publish` e `POST /api/gazzetta/rigenera-copertina` |
| accesso HTTP GET | trigger foglio + lettura `/api/gazzetta/stato` e `/api/verdetto` |
| accesso HTTP POST | pubblicazione, rigenerazione copertina |
| accesso OpenRouter | scrivere l'articolo (LLM) |

> **Nessun accesso GitHub.** Hermes non ha bisogno di un token GitHub né dell'MCP GitHub:
> il commit lo fa il server dietro `/api/gazzetta/publish`.
> Nessun tool di generazione immagini né `FAL_KEY`: l'illustrazione hero la genera la
> GitHub Action dall'`image_prompt`.
