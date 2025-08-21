# Istruzioni per Aggiungere un Nuovo Articolo

Per aggiungere un nuovo articolo alla "Gazzetta del Laghèe", segui questi due semplici passaggi.

## Passaggio 1: Preparare i File

1.  **Prepara l'immagine di copertina:**
    -   Scegli l'immagine per la copertina del tuo articolo.
    -   Salvala con un nome descrittivo (es. `cover-nuovo-bomber.jpg`).
    -   Carica l'immagine nella cartella `/image/gazzetta/`.

2.  **Crea il file dell'articolo:**
    -   Vai nella cartella `/articoli/md/`.
    -   Crea un nuovo file di testo con estensione `.md` (es. `il-mio-nuovo-articolo.md`).
    -   Scrivi il contenuto del tuo articolo in questo file usando il formato Markdown (es. `###` per i sottotitoli, `**` per il grassetto, ecc.).

## Passaggio 2: Aggiungere l'Articolo all'Elenco

1.  Apri il file `/data/articles.json`. Questo file contiene l'elenco di tutti gli articoli.
2.  **Per mostrare l'articolo più recente per primo, aggiungi i suoi dati in cima all'elenco.** Copia e incolla il blocco di codice seguente all'inizio del file (prima degli altri articoli) e modifica i valori.

```json
{
    "id": "il-mio-nuovo-articolo",
    "date": "21 Agosto 2025",
    "title": "Il Titolo del Mio Nuovo Articolo",
    "imageUrl": "/image/gazzetta/cover-nuovo-bomber.jpg",
    "placeholder": false
},
```

### Spiegazione dei Campi:

-   `"id"`: Deve corrispondere **esattamente** al nome del tuo file `.md` (senza l'estensione `.md`).
-   `"date"`: La data che apparirà sulla scheda.
-   `"title"`: Il titolo che apparirà sulla scheda.
-   `"imageUrl"`: Il percorso locale dell'immagine che hai caricato. Deve iniziare con `/image/gazzetta/`.
-   `"placeholder"`: Lascia questo valore su `false`.

**Importante:** Assicurati che il tuo nuovo blocco di codice termini con una virgola `,` se ci sono altri articoli dopo. L'ultimo articolo di tutto il file non deve avere la virgola.

Una volta salvati entrambi i file, il nuovo articolo apparirà automaticamente in cima alla pagina della Gazzetta.
