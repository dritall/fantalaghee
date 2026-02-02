# 📰 Guida Editoriale: Come Pubblicare sulla Gazzetta del Laghèe

Ciao Mister! Ecco come aggiungere nuovi articoli alla sezione Gazzetta in 3 semplici passi.

## 1. Prepara l'Articolo
Scrivi il tuo articolo e salvalo come file `.md` (Markdown) nella cartella:
`public/articoli/md/`

**Esempio nome file:** `giornata-10-pagelle.md`

Il contenuto può essere semplice testo, ma puoi usare il grassetto (`**Testo**`) o i titoli (`### Titolo`).

## 2. Prepara l'Immagine (Opzionale ma consigliato)
Carica l'immagine di copertina nella cartella:
`public/image/gazzetta/`

**Esempio nome file:** `cover-g10.jpg`

## 3. Aggiorna l'Indice (Fondamentale!)
Apri il file `public/data/articles.json` e aggiungi il blocco del nuovo articolo **in cima alla lista** (così appare per primo).

Copia e incolla questo modello:

```json
    {
        "id": "giornata-10-pagelle",
        "date": "2 Novembre 2025",
        "title": "Titolo Clamoroso del Tuo Articolo",
        "imageUrl": "/image/gazzetta/cover-g10.jpg",
        "placeholder": false
    },
```

### ⚠️ Attenzione:
- L'`id` deve essere **uguale** al nome del file `.md` (senza `.md`).
- Se non hai ancora l'immagine o l'articolo pronto, puoi mettere `"placeholder": true` e apparirà come "Coming Soon".

---
*Fatto! Salva tutto e il sito si aggiornerà in pochi secondi.* 🚀
