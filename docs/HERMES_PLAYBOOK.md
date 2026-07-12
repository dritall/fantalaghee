# 🪽 Playbook operativo per Hermes — La Gazzetta del Laghèe

Questo file è il manuale che **Hermes** (l'agente su Telegram) segue per pubblicare un
articolo della Gazzetta, dall'inizio alla fine. Hermes deve rileggerlo a ogni esecuzione.

Ruoli:
- **Hermes**: orchestratore + scrittore + illustratore. Fa: trigger foglio, lettura dati,
  scrittura articolo, generazione dell'ILLUSTRAZIONE hero (tool `image_generate`), commit su
  GitHub, messaggio WhatsApp.
- **GitHub Action** (`.github/workflows/gazzetta-cover.yml`): COMPONE la copertina finale
  con Puppeteer (template rosa + hero generato da Hermes + i 3 box dati) al commit dell'articolo.
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
riferimento di stile, leggi SEMPRE 1–2 articoli reali "maturi" dal repo, es.:
`public/articoli/md/SorpassoSC.md`, `public/articoli/md/gazzetta-finali-coppe.md`.

Produci internamente: `title`, `description`, `body_md` e i dati `cover`
(titolo_principale, sottotitolo, `image_prompt` per l'illustrazione hero, e i 3 box DATI:
Top 5 giornata / Classifica generale / Verdetti — riempiti coi numeri reali). Vedi il
formato al passo 7.

### 5. Bozza all'utente (Telegram)
Manda all'utente il **testo** dell'articolo (title + description + body_md).
- Se risponde **OK / vai / 👍** → vai al passo 6.
- Se manda **correzioni** → riscrivi applicandole e rimanda la bozza.
- Se dice di rifare → rigenera da capo.
NON procedere alla pubblicazione senza l'OK.

### 6. Genera l'ILLUSTRAZIONE hero e committala
Dopo l'OK, genera l'illustrazione satirica della giornata con il tuo tool immagini
(`image_generate`), usando `cover.image_prompt` che hai preparato al passo 4:
- stile: illustrazione editoriale satirica da quotidiano sportivo vintage, scena epica e
  goliardica ispirata alla giornata (il campione come re sul trono, gli sconfitti col
  cucchiaio di legno, il lago di Como con barche e montagne sullo sfondo). NIENTE testo
  leggibile dentro l'immagine. Orizzontale ~900x520.
- salva il file e committalo come `public/image/gazzetta/gazzetta-g{N}-hero.png` sul branch `main`.

### 7. Commit dell'articolo su GitHub
Crea il file `public/articoli/md/gazzetta-g{N}.md` (N = numero giornata) sul branch `main`,
con questo frontmatter ESATTO (il blocco `cover:` guida la Action che compone la copertina):

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
  hero_image: /image/gazzetta/gazzetta-g{N}-hero.png
  box1: { title: "🏆 TOP 5 DI GIORNATA", rows: ["1. Squadra|89.5", "2. Squadra|84.5", "3. Squadra|83.0", "4. Squadra|81.5", "5. Squadra|80.0"] }
  box2: { title: "📊 CLASSIFICA GENERALE", rows: ["1. Squadra|2935.5", "2. Squadra|2930.0", "3. Squadra|2920.0", "4. Squadra|2901.0", "5. Squadra|2889.0"] }
  box3: { title: "📌 I VERDETTI", rows: ["Campione|Nome", "Record|112.5 Squadra", "Cucchiaio|Squadra 43"] }
---

{corpo dell'articolo in Markdown}
```

Regole:
- `image` = `/image/gazzetta/gazzetta-g{N}.png` → è la copertina FINALE, la compone la Action
  (non crearla tu). `hero_image` = l'illustrazione che hai generato al passo 6.
- I 3 box sono DATI reali presi da `/api/verdetto` (Top 5 giornata, Classifica, Verdetti),
  non testo libero. Formato riga: "Etichetta|Valore".
- `date` = data odierna in formato ISO.
- Il corpo usa `###` per le sezioni, `**grassetto**`, `>` per le profezie dell'Oracolo.

Il commit su `main` fa partire la GitHub Action (che incastona l'hero + i box nella copertina
finale) e Vercel (deploy).

### 8. Verifica copertina finale (mandala su Telegram)
La copertina FINALE (hero + testata + box) la compone la GitHub Action. Dopo il commit:
- attendi ~90 secondi (tempo di run della Action), poi controlla se l'immagine esiste:
  `GET https://www.fantalaghee.live/image/gazzetta/gazzetta-g{N}.png` (oppure il file
  `public/image/gazzetta/gazzetta-g{N}.png` su GitHub, branch `main`).
- Se risponde 200 / il file esiste → **mandala all'utente su Telegram** come immagine, così
  può verificarla. Se non c'è ancora, aspetta un altro minuto e riprova (max 4 tentativi).
- Se dopo i tentativi non compare, avvisa l'utente che la Action potrebbe essere fallita
  (da controllare nella tab Actions di GitHub) e prosegui comunque col messaggio WhatsApp.

### 9. Messaggio WhatsApp (copia/incolla)
Dopo aver verificato la copertina, manda all'utente su Telegram un messaggio **pronto da
incollare** nel gruppo WhatsApp. Formato consigliato:

```
📰 *La Gazzetta del Laghèe* — Giornata {N}

{title}

{description}

👉 Leggi tutto: https://www.fantalaghee.live/gazzetta/gazzetta-g{N}
```

L'articolo è live entro ~1 minuto dal commit (tempo di deploy Vercel + Action immagine).

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

---

## Config necessaria a Hermes

| Chiave | A cosa serve |
|---|---|
| `APPS_SCRIPT_WEBAPP_URL` | URL della Web App dell'Apps Script (trigger calcolo) |
| `APPS_SCRIPT_SECRET` | token segreto passato alla Web App |
| accesso GitHub (repo `dritall/fantalaghee`) | committare articolo + illustrazione su `main` |
| accesso OpenRouter | scrivere l'articolo |
| tool immagini (`image_generate`, es. FAL/Flux o gpt-image) | generare l'illustrazione hero |
| capacità di fare richieste HTTP GET | trigger foglio + lettura `/api/verdetto` |
