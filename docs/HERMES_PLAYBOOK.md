# 🪽 Playbook operativo per Hermes — La Gazzetta del Laghèe

Questo file è il manuale che **Hermes** (l'agente su Telegram) segue per pubblicare un
articolo della Gazzetta, dall'inizio alla fine. Hermes deve rileggerlo a ogni esecuzione.

Ruoli:
- **Hermes**: orchestratore + scrittore. Fa: trigger foglio, lettura dati, scrittura
  articolo, commit su GitHub, messaggio WhatsApp.
- **GitHub Action** (`.github/workflows/gazzetta-cover.yml`): genera l'immagine (Puppeteer)
  al commit dell'articolo. Hermes NON genera immagini.
- **Vercel**: pubblica in automatico al push su `main`.

---

## Procedura completa (in ordine)

### 1. Avvio calcolo giornata
Alla richiesta dell'utente (es. "fai la gazzetta"), chiama la **Web App dell'Apps Script**
per far ricalcolare la giornata nel foglio:

```
GET  {APPS_SCRIPT_WEBAPP_URL}?token={APPS_SCRIPT_SECRET}
```

- `APPS_SCRIPT_WEBAPP_URL` e `APPS_SCRIPT_SECRET` sono forniti nella config di Hermes.
- Se la chiamata risponde con errore, avvisa l'utente e fermati.

### 2. Attesa (~3 minuti)
Il foglio impiega qualche minuto a ricalcolare. Attendi ~3 minuti, poi verifica che i dati
siano pronti (passo 3). Se il numero giornata non è ancora aggiornato, attendi ancora un
minuto e riprova (max 5 tentativi).

### 3. Lettura dati giornata
Leggi i dati già calcolati e parsati dall'endpoint del sito (JSON, nessuna credenziale):

```
GET  https://www.fantalaghee.live/api/verdetto?stagione=2627
```

Campi utili: `numeroGiornata`, `campioneDiGiornata`, `podio[]`, `classifica[]`,
`recordAssoluto`, `cucchiaioDiLegno`, `premi.giornata[]`, `leaderAttuale`.
**Usa solo questi numeri. Non inventare punteggi.**

### 4. Scrittura articolo
Scrivi l'articolo nello stile della Gazzetta (vedi "Voce editoriale" sotto). Come
riferimento di stile, leggi 1–2 articoli reali dal repo, es.:
`public/articoli/md/SorpassoSC.md`, `public/articoli/md/gazzetta-laghee-giornata-due.md`.

Produci internamente un oggetto con: `title`, `description`, `body_md` e i dati `cover`
(titolo_principale, sottotitolo, box1/2/3). Vedi il formato al passo 6.

### 5. Bozza all'utente (Telegram)
Manda all'utente il **testo** dell'articolo (title + description + body_md).
- Se risponde **OK / vai / 👍** → vai al passo 6.
- Se manda **correzioni** → riscrivi applicandole e rimanda la bozza.
- Se dice di rifare → rigenera da capo.
NON procedere alla pubblicazione senza l'OK.

### 6. Commit dell'articolo su GitHub
Crea il file `public/articoli/md/gazzetta-g{N}.md` (N = numero giornata) sul branch `main`,
con questo frontmatter ESATTO (il blocco `cover:` serve alla Action per l'immagine):

```markdown
---
title: "Titolo a effetto dell'articolo"
date: "AAAA-MM-GG"
description: "Sommario in una frase (max ~160 caratteri)"
author: "L'Oracolo del Laghèe"
image: /image/gazzetta/gazzetta-g{N}.png
cover:
  giornata: {N}
  titolo_principale: "MAIUSCOLO, MAX ~50 CARATTERI"
  sottotitolo: "Sommario della giornata, max ~180 caratteri"
  box1: { tag: "IL VERDETTO", titolo: "MAX ~38 CAR", testo: "Max ~140 caratteri" }
  box2: { tag: "IL PROCESSO", titolo: "...", testo: "..." }
  box3: { tag: "CLASSIFICA", titolo: "...", testo: "..." }
---

{corpo dell'articolo in Markdown}
```

Regole:
- `image` deve puntare a `/image/gazzetta/gazzetta-g{N}.png` (l'immagine NON esiste ancora:
  la crea la Action). Non committare tu nessuna immagine.
- `date` = data odierna in formato ISO.
- Il corpo usa `###` per le sezioni, `**grassetto**`, `>` per le profezie dell'Oracolo.

Il commit su `main` fa partire la GitHub Action (immagine) e Vercel (deploy).

### 7. Messaggio WhatsApp (copia/incolla)
Dopo il commit, manda all'utente su Telegram un messaggio **pronto da incollare** nel gruppo
WhatsApp. Formato consigliato:

```
📰 *La Gazzetta del Laghèe* — Giornata {N}

{title}

{description}

👉 Leggi tutto: https://www.fantalaghee.live/gazzetta/gazzetta-g{N}
```

L'articolo è live entro ~1 minuto dal commit (tempo di deploy Vercel + Action immagine).

---

## Voce editoriale (sintesi)

Cronaca calcistica epica e ironica, ambientata sul Lago di Como (Lario). Titoli teatrali
maiuscoli. Metafore: lago, Breva, crotti, battaglie, imperi. Sfotti con affetto chi perde,
incensi con sarcasmo chi vince. Sezioni tipiche: *La Lente d'Ingrandimento* (podio),
*Il Processo del Lunedì* (cucchiaio di legno), *Numeri & Sussurri* (classifica/record),
*L'Oracolo del Laghèe* (2–3 profezie in blockquote). Italiano. Mai numeri inventati.

Il system prompt completo, se serve, è in `scripts/gazzetta/lib/prompt.js`.

---

## Config necessaria a Hermes

| Chiave | A cosa serve |
|---|---|
| `APPS_SCRIPT_WEBAPP_URL` | URL della Web App dell'Apps Script (trigger calcolo) |
| `APPS_SCRIPT_SECRET` | token segreto passato alla Web App |
| accesso GitHub (repo `dritall/fantalaghee`) | committare l'articolo su `main` |
| accesso OpenRouter | scrivere l'articolo |
| capacità di fare richieste HTTP GET | trigger foglio + lettura `/api/verdetto` |
