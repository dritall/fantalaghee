# Fanta Laghèe — note per chi lavora su questo repo

Sito Next.js (App Router) della Fanta Laghèe, lega di fantacalcio amatoriale
reale (40 squadre, premi in euro veri). Lo sviluppa un solo proprietario nel
tempo libero, con l'aiuto di **più sessioni AI diverse che si alternano nel
tempo senza vedersi tra loro**. Questo file esiste per dare continuità a
quelle sessioni: leggilo prima di toccare regole, premi o logica di
classifica/verdetto, e aggiungi una riga al changelog in fondo quando hai
finito un cambiamento degno di nota.

## Cos'è, in breve

- I dati (classifica, verdetto) arrivano da due fogli Google Sheets
  pubblicati come CSV, uno per stagione: gli URL sono in `lib/seasons.ts`
  (`SEASONS[slug].classificaUrl` / `.verdettoUrl`).
- Il foglio **classifica** ha una colonna `G1`…`G38` per squadra: è il dato
  grezzo e affidabile, da cui si ricalcola tutto lo storico
  (`lib/verdetto-storico.ts`).
- Il foglio **verdetto** (tab "Dashboard") è invece una fotografia a celle
  fisse dello stato attuale (leader, record, cucchiaio, podio, premi). Le
  sue formule possono restare ferme su un valore vecchio o sbagliato **senza
  risultare vuote** — è già successo con il Cucchiaio di Legno. Quando è
  possibile, ricalcola dalle colonne `G1…G38` invece di fidarti della cella
  (vedi `arricchisciDaClassifica` in `app/api/verdetto/route.ts`).
- La Gazzetta è generata da un'AI esterna ("Hermes") secondo le istruzioni
  in `scripts/gazzetta/lib/prompt.js`; gli articoli finiti sono file
  markdown in `public/articoli/md/`.

## Fonti di verità — non duplicare questi numeri altrove

- **`lib/premi-2627.ts`** — unica fonte per gli importi dei premi della
  stagione in corso (quota, premio di giornata 1°/2°, classifica generale,
  coppe, montepremi). `lib/premi-riferimento.ts` è **storico, congelato
  alla 2025/26**: non aggiornarlo con numeri nuovi, non importarlo per la
  stagione corrente.
- **`lib/seasons.ts`** — `SQUADRE_ISCRITTE`, `GIORNATE`, `CURRENT_SEASON`.
- **Chi è 1° e 2° di giornata (e quanto vince)**: prima di aggiungere
  un'altra implementazione, controlla se esiste già in
  `lib/verdetto-storico.ts` (`premioDiGiornata`) — questa logica è stata
  duplicata tre volte in punti diversi ed è la causa diretta di più bug
  reali (conteggio premi disallineato dal testo che lo descriveva).

Quando cambiano regole o importi ufficiali: aggiorna la fonte di verità,
poi grep dell'intero repo per il valore vecchio (`lib/regolamento-kb.ts` è
il posto dove più spesso resta un numero superato, perché è testo libero,
non un import).

## Convenzioni

- Tutto il codice, i commenti e i testi verso l'utente sono in italiano.
- Colori: variabili CSS in `app/globals.css` (`--calce`, `--pece`,
  `--viola`, `--lario`, `--vermiglio`, `--fumo`, …). Non introdurre hex
  fissi nel resto del sito — eccezione deliberata: le pagine della Gazzetta
  (`app/gazzetta/[id]/page.tsx`) usano una palette fissa da "giornale di
  carta", non i token del sito.
- 🍆 (melanzana) è l'unità con cui la lega mostra quota e premi da sempre,
  anche ora che gli importi sono euro veri — è un vezzo del brand, non
  toglierlo senza che te lo chieda l'utente.
- Commenti solo dove spiegano un PERCHÉ non ovvio (un vincolo nascosto, una
  formula del foglio che si comporta in modo strano); non descrivere cosa
  fa il codice quando i nomi già lo dicono.

## Workflow di questo repo

- Si sviluppa sul branch assegnato dalla sessione (`claude/...`), mai
  direttamente su `main`.
- Prima di ogni push: `npx tsc --noEmit` e `npm run build` devono passare.
- **"Live" per questo utente significa produzione**, non solo il branch:
  Vercel fa deploy di produzione (su `fantalaghee.co` / `fantalaghee.live`)
  solo dai push su `main`; un branch `claude/...` genera solo una preview.
  Il pattern osservato in questo repo è: push sul branch assegnato, poi
  fast-forward di `main` sullo stesso commit (nessun rebase, nessuna
  riscrittura di storia) e push di `main`. Fallo solo se il branch è già
  verificato (build pulita) — è un'azione che va in produzione reale.

## Changelog a staffetta

- 2026-08-25 — Roadmap dell'audit del 25/08 eseguita in un colpo solo:
  logica primo/secondo di giornata unificata in `primoESecondo`
  (`lib/verdetto-storico.ts`), usata ora anche da Tabellone e dalla
  pagina Classifica (che prima la duplicavano, con Tabellone che tra
  l'altro ignorava i pari merito al 1° posto — corretto anche quello);
  CI minima aggiunta (`.github/workflows/ci.yml`); title/description
  per pagina su Classifica, Verdetto, Regolamento, Gazzetta, Serie A;
  `Cache-Control` su `/api/classifica`, `/api/verdetto`, `/api/articles`
  (prima nessuno dei tre, tutti richiamati più volte per pagina);
  nuova pagina `/coppe` (stato d'attesa + struttura, in attesa di dati
  veri dalla G9). Trovato e corretto per strada un mismatch di
  idratazione React reale in produzione: `toLocaleString('it-IT')` senza
  opzioni esplicite rende "4130" lato server e "4.130" lato client a
  seconda della build di ICU — sostituito con `formattaMigliaia` in
  `lib/numbers.ts`, deterministico, in tutti e 4 i punti dove compariva.

Una riga per sessione/cambiamento degno di nota, più recente in cima. Non
è un log di dettaglio (c'è git per quello): serve a far sapere alla
prossima sessione "cosa è già stato toccato di recente e perché", per non
ripetere un fix che un'altra sessione ha già fatto in parallelo — è
esattamente il tipo di collisione che ha causato il bug del titolo doppio
nell'articolo di Gazzetta (due sessioni diverse hanno tolto lo stesso H1
duplicato, senza sapere l'una dell'altra, cancellando l'unico titolo
rimasto).

- 2026-08-25 — Corretto il Cucchiaio di Legno: ora è sempre ricalcolato
  come minimo reale su tutte le giornate G1…G38, mai letto dalla cella
  Dashboard!F50:G53 (poteva restare su un valore vecchio senza apparire
  "vuota"). File: `app/api/verdetto/route.ts`.
- 2026-08-25 — Aggiunta CI minima (build + typecheck) e questo file.
- 2026-08-25 — Sistemate le inconsistenze nate da due fix indipendenti in
  parallelo: il conteggio "🍆 vinte" ora include davvero il premio al 2°
  di giornata (prima il testo lo dichiarava, il calcolo no); ripristinato
  il titolo dell'articolo Gazzetta (due fix diversi lo avevano tolto
  entrambi, lasciando l'articolo senza); allineate al regolamento
  definitivo alcune voci rimaste indietro nell'assistente (`iscrizioni
  tardive` erano segnate come chiuse ma sono ammesse fino alla 3ª
  giornata; soglia giocatori bloccati è 6 fisso, non un sesto delle
  squadre).
- 2026-08-25 — Introdotto `lib/premi-2627.ts` come fonte di verità dei
  premi ufficiali 2026/27 (20€/10€ di giornata, montepremi 4.130€),
  sostituito il PDF del regolamento con la versione definitiva.
- 2026-08-25 — Homepage: tolto il banner "il campionato è cominciato" a
  favore dell'ultima uscita della Gazzetta; classifica: contrasto del 2°
  posto di giornata; Gazzetta: rimosso il titolo duplicato sopra la
  copertina.
