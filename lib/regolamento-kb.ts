/**
 * Base di conoscenza dell'assistente del regolamento.
 *
 * Niente modello linguistico e niente rete: le risposte sono scritte a mano e
 * la domanda viene abbinata alla voce più vicina per parole chiave. Il prezzo
 * è che risponde solo su ciò che è previsto qui; il vantaggio è che non
 * inventa nulla, funziona offline e non costa niente per richiesta.
 *
 * Ogni voce ha:
 *  - `domanda`  la formulazione canonica, usata anche come suggerimento
 *  - `risposta` il testo mostrato (**grassetto** consentito)
 *  - `chiavi`   parole e frasi che devono farla emergere
 *  - `sezione`  a quale parte del regolamento rimanda
 */

export type Sezione = 'novita' | 'iscrizione' | 'rosa' | 'coppe' | 'premi' | 'bonus' | 'casi' | 'sito';

export type VoceKB = {
    id: string;
    sezione: Sezione;
    domanda: string;
    risposta: string;
    chiavi: string[];
    /** mostrata fra i suggerimenti iniziali */
    inEvidenza?: boolean;
};

export const KB: VoceKB[] = [
    /* ------------------------------------------------------------ iscrizione */
    {
        id: 'quota',
        sezione: 'iscrizione',
        domanda: 'Quanto costa iscriversi?',
        risposta:
            'La quota è di **110 🍆**. Va saldata **prima dell\'inizio della 1ª giornata**: chi non versa viene escluso senza rimborso.\nContribuisce al montepremi finale e alla gestione della lega: la scorsa stagione, su 50 iscritti, l\'85% del raccolto è tornato in premi.',
        chiavi: ['quanto costa', 'quota', 'prezzo', 'costo iscrizione', 'quanto si paga', 'quanto pago', 'iscrizione costo', '110'],
        inEvidenza: true,
    },
    {
        id: 'pagamento-come',
        sezione: 'iscrizione',
        domanda: 'Come si paga la quota?',
        risposta:
            'A mano. Se davvero non è possibile, si contattano gli organizzatori e si trova un\'alternativa.',
        chiavi: ['come pago', 'come si paga', 'pagamento', 'bonifico', 'satispay', 'contanti', 'pagare quota', 'modalita pagamento'],
    },
    {
        id: 'pagamento-quando',
        sezione: 'iscrizione',
        domanda: 'Entro quando devo pagare?',
        risposta:
            'Entro **l\'inizio della 1ª giornata**. Dopo quel momento senza pagamento si è fuori, e la quota non viene rimborsata.',
        chiavi: ['entro quando pago', 'scadenza pagamento', 'quando pagare', 'termine pagamento', 'deadline quota'],
    },
    {
        id: 'non-pago',
        sezione: 'iscrizione',
        domanda: 'Cosa succede se non pago?',
        risposta:
            '**Esclusione dalla lega, senza rimborso.** Il regolamento non prevede eccezioni: il versamento è la condizione per partecipare.',
        chiavi: ['non pago', 'se non pago', 'mancato pagamento', 'non ho pagato', 'esclusione', 'rimborso'],
    },
    {
        id: 'come-iscriversi',
        sezione: 'iscrizione',
        domanda: 'Come mi iscrivo?',
        risposta:
            'Tre passi: **compili il form** di iscrizione → **ricevi una mail di conferma** con il link alla lega su Fantaclub → **inserisci la rosa** e giochi.',
        chiavi: ['come mi iscrivo', 'iscrizione', 'iscriversi', 'come partecipare', 'voglio giocare', 'come entro', 'procedura iscrizione', 'form'],
        inEvidenza: true,
    },
    {
        id: 'link-form',
        sezione: 'iscrizione',
        domanda: 'Dove trovo il form di iscrizione?',
        risposta:
            'Il pulsante **Iscriviti alla Lega** è in cima a questa pagina e in fondo a ogni schermata. Porta direttamente al modulo da compilare.',
        chiavi: ['dove trovo il form', 'link iscrizione', 'modulo iscrizione', 'dove mi iscrivo', 'link form'],
    },
    {
        id: 'iscrizione-tardiva',
        sezione: 'iscrizione',
        domanda: 'Posso iscrivermi a campionato iniziato?',
        risposta:
            'Sì, **fino all\'inizio della 3ª giornata**. Chi entra dopo la 1ª giornata riceve **66 punti d\'ufficio** per ogni giornata saltata.',
        chiavi: ['iscrizione tardiva', 'iscrivermi dopo', 'campionato iniziato', 'in ritardo', 'terza giornata', 'ritardatari', 'entrare dopo'],
        inEvidenza: true,
    },
    {
        id: 'punti-ufficio',
        sezione: 'iscrizione',
        domanda: 'Quanti punti prendo per le giornate saltate?',
        risposta:
            '**66 punti d\'ufficio** per ogni giornata non giocata, se ti sei iscritto dopo la 1ª giornata.',
        chiavi: ['punti ufficio', 'punti dufficio', 'giornate saltate', '66 punti', 'punti giornate perse'],
    },
    {
        id: 'termine-iscrizioni',
        sezione: 'iscrizione',
        domanda: 'Fino a quando si può entrare nella lega?',
        risposta:
            'Le iscrizioni chiudono **all\'inizio della 3ª giornata**. Dopo non si entra più, per nessun motivo.',
        chiavi: ['fino a quando iscrizioni', 'chiusura iscrizioni', 'ultimo giorno iscrizione', 'quando chiudono iscrizioni'],
    },

    /* ------------------------------------------------------ piattaforma e voti */
    {
        id: 'piattaforma',
        sezione: 'iscrizione',
        domanda: 'Su che piattaforma si gioca?',
        risposta: 'Si gioca su **Fantaclub**. Il link alla lega arriva nella mail di conferma dopo l\'iscrizione.',
        chiavi: ['piattaforma', 'fantaclub', 'app', 'dove si gioca', 'sito di gioco', 'fantacalcio app'],
        inEvidenza: true,
    },
    {
        id: 'quotazioni',
        sezione: 'iscrizione',
        domanda: 'Che quotazioni si usano?',
        risposta: 'Le quotazioni della **Redazione Milano**.',
        chiavi: ['quotazioni', 'listone', 'prezzi giocatori', 'redazione milano', 'quotazione'],
    },
    {
        id: 'voti',
        sezione: 'iscrizione',
        domanda: 'Chi assegna i voti?',
        risposta:
            '**Fantaclub Classic**, cioè la media ponderata fra le redazioni di Milano e Roma.',
        chiavi: ['voti', 'chi da i voti', 'pagelle', 'fantaclub classic', 'media voto redazione', 'gazzetta o corriere'],
    },
    {
        id: 'voti-live',
        sezione: 'iscrizione',
        domanda: 'I voti live sono definitivi?',
        risposta:
            'No. I **Voti Live** durante le partite sono provvisori: diventano definitivi **la mattina dopo**. Non fidarti del punteggio della domenica sera.',
        chiavi: ['voti live', 'live', 'punteggio provvisorio', 'quando definitivi', 'punteggio cambia', 'voti cambiano'],
        inEvidenza: true,
    },

    /* ------------------------------------------------------------------ rosa */
    {
        id: 'rosa-composizione',
        sezione: 'rosa',
        domanda: 'Da quanti giocatori è composta la rosa?',
        risposta:
            '**24 giocatori**: 3 portieri, 8 difensori, 8 centrocampisti, 5 attaccanti.',
        chiavi: ['quanti giocatori', 'composizione rosa', 'quanti calciatori', 'rosa', 'quanti in rosa', '24'],
        inEvidenza: true,
    },
    {
        id: 'quanti-portieri',
        sezione: 'rosa',
        domanda: 'Quanti portieri servono?',
        risposta: '**3 portieri**.',
        chiavi: ['quanti portieri', 'portieri', 'numero portieri'],
    },
    {
        id: 'quanti-difensori',
        sezione: 'rosa',
        domanda: 'Quanti difensori servono?',
        risposta: '**8 difensori**.',
        chiavi: ['quanti difensori', 'difensori', 'numero difensori'],
    },
    {
        id: 'quanti-centrocampisti',
        sezione: 'rosa',
        domanda: 'Quanti centrocampisti servono?',
        risposta: '**8 centrocampisti**.',
        chiavi: ['quanti centrocampisti', 'centrocampisti', 'numero centrocampisti', 'mediani'],
    },
    {
        id: 'quanti-attaccanti',
        sezione: 'rosa',
        domanda: 'Quanti attaccanti servono?',
        risposta: '**5 attaccanti**.',
        chiavi: ['quanti attaccanti', 'attaccanti', 'numero attaccanti', 'punte'],
    },
    {
        id: 'budget',
        sezione: 'rosa',
        domanda: 'Qual è il budget per la rosa?',
        risposta: '**600 Fantamilioni** per costruire tutti e 24 i giocatori, salvo cambi nelle quotazioni di Fantaclub.',
        chiavi: ['budget', 'crediti', 'quanto ho da spendere', '600', 'soldi rosa', 'budget rosa'],
        inEvidenza: true,
    },
    {
        id: 'quando-rosa',
        sezione: 'rosa',
        domanda: 'Quando posso costruire la rosa?',
        risposta:
            'Dal **1 agosto 2026** fino a **15 minuti prima della 1ª giornata**. In quella finestra le modifiche sono illimitate.',
        chiavi: ['quando rosa', 'quando costruire rosa', 'apertura mercato', 'apre il mercato', 'quando apre', 'primo agosto', 'quando inserire rosa', 'da quando'],
    },
    {
        id: 'mercato-libero',
        sezione: 'rosa',
        domanda: 'Posso cambiare la rosa prima dell\'inizio?',
        risposta:
            'Sì: nel mercato pre-campionato le modifiche sono **illimitate e senza plusvalenze**, fino a 15 minuti prima della 1ª giornata.',
        chiavi: ['cambiare rosa', 'modifiche rosa', 'mercato libero', 'posso cambiare', 'rifare rosa', 'mercato pre campionato'],
    },
    {
        id: 'plusvalenze',
        sezione: 'rosa',
        domanda: 'Le plusvalenze sono ammesse?',
        risposta:
            'No. Il mercato pre-campionato è **senza plusvalenze**. Se Fantaclub dovesse consentirle per errore, le rose vengono resettate e vanno reinserite una volta.',
        chiavi: ['plusvalenze', 'plusvalenza', 'rivendere giocatori', 'guadagnare crediti', 'reset rose'],
    },
    {
        id: 'giocatori-bloccati',
        sezione: 'rosa',
        domanda: 'Cosa sono i giocatori bloccati?',
        risposta:
            'Dopo l\'inizio della 1ª giornata un giocatore diventa **non acquistabile** se è già posseduto da almeno **totale iscritti ÷ 6** squadre. Resta bloccato finché non scende sotto quella soglia.',
        chiavi: ['giocatori bloccati', 'bloccato', 'non acquistabile', 'soglia possesso', 'diviso 6', 'blocco giocatore'],
        inEvidenza: true,
    },
    {
        id: 'sblocco',
        sezione: 'rosa',
        domanda: 'Quando si sblocca un giocatore?',
        risposta:
            'Appena il numero di squadre che lo possiedono scende **sotto la soglia** di iscritti ÷ 6. Non c\'è una data fissa: dipende dal mercato.',
        chiavi: ['sblocca', 'sbloccare giocatore', 'quando torna acquistabile', 'giocatore libero'],
    },
    {
        id: 'mercato-riparazione',
        sezione: 'rosa',
        domanda: 'Quando si può fare mercato a campionato iniziato?',
        risposta:
            'Il mercato si muove **fra una giornata e l\'altra**: a giornata in corso è chiuso. Valgono comunque le due regole di sempre — niente plusvalenze e i **giocatori bloccati** restano non acquistabili finché sono posseduti da almeno un sesto degli iscritti.',
        chiavi: ['mercato di riparazione', 'riparazione', 'mercato invernale', 'gennaio', 'seconda sessione mercato', 'mercato durante il campionato', 'quando fare mercato', 'mercato aperto', 'scambi', 'svincolati'],
    },

    /* ------------------------------------------------------------- formazione */
    {
        id: 'moduli',
        sezione: 'rosa',
        domanda: 'Quali moduli posso usare?',
        risposta:
            'Otto: **343, 352, 361, 433, 442, 451, 532, 541**. Il cambio modulo **non è consentito**.',
        chiavi: ['moduli', 'modulo', 'quali moduli', 'schieramento', '343', '442', '352', 'formazioni possibili'],
        inEvidenza: true,
    },
    {
        id: 'cambio-modulo',
        sezione: 'rosa',
        domanda: 'Posso cambiare modulo durante la stagione?',
        risposta: 'No. Il **cambio modulo non è consentito**: si sceglie e si tiene.',
        chiavi: ['cambiare modulo', 'cambio modulo', 'posso cambiare modulo', 'modulo diverso'],
    },
    {
        id: 'panchina',
        sezione: 'rosa',
        domanda: 'Quante riserve e sostituzioni ci sono?',
        risposta:
            '**11 riserve** in panchina e **5 sostituzioni**, che scattano secondo l\'ordine in cui hai messo la panchina. Il cambio avviene **solo fra giocatori dello stesso ruolo**.',
        chiavi: ['riserve', 'panchina', 'sostituzioni', 'quante sostituzioni', 'cambi', '5 sostituzioni'],
        inEvidenza: true,
    },
    {
        id: 'ordine-panchina',
        sezione: 'rosa',
        domanda: 'Come funziona l\'ordine della panchina?',
        risposta:
            'Le sostituzioni seguono **la priorità che hai dato in panchina**: fra le riserve dello stesso ruolo del titolare senza voto, entra quella che hai messo più in alto.',
        chiavi: ['ordine panchina', 'priorita panchina', 'come entrano riserve', 'chi entra prima'],
    },
    {
        id: 'quando-formazione',
        sezione: 'rosa',
        domanda: 'Entro quando devo schierare la formazione?',
        risposta:
            'Fino a **15 minuti prima del primo anticipo** della giornata, su Fantaclub.',
        chiavi: ['entro quando formazione', 'quando schierare', 'scadenza formazione', 'orario formazione', '15 minuti', 'anticipo'],
        inEvidenza: true,
    },
    {
        id: 'formazione-non-inserita',
        sezione: 'rosa',
        domanda: 'Cosa succede se non schiero la formazione?',
        risposta:
            'Vale **la formazione della giornata precedente**. Non si viene esclusi, ma si gioca con quella vecchia.',
        chiavi: ['non schiero', 'formazione non inserita', 'dimenticato formazione', 'se non metto formazione', 'formazione precedente'],
        inEvidenza: true,
    },
    {
        id: 'formazione-whatsapp',
        sezione: 'rosa',
        domanda: 'Posso mandare la formazione su WhatsApp?',
        risposta:
            'Sì, ma **una sola volta a stagione per squadra** e solo per problemi tecnici. Va scritta nel gruppo WhatsApp.',
        chiavi: ['whatsapp', 'formazione manuale', 'mandare formazione', 'problema tecnico', 'app non funziona', 'inserimento manuale'],
    },

    /* ------------------------------------------------------------ bonus/malus */
    {
        id: 'gol-difensore',
        sezione: 'bonus',
        domanda: 'Quanto vale un gol di un difensore?',
        risposta: '**+4.0**. Stesso bonus per il gol del portiere.',
        chiavi: ['gol difensore', 'rete difensore', 'bonus difensore', 'gol portiere', '+4'],
    },
    {
        id: 'gol-centrocampista',
        sezione: 'bonus',
        domanda: 'Quanto vale un gol di un centrocampista?',
        risposta: '**+3.5**.',
        chiavi: ['gol centrocampista', 'rete centrocampista', 'bonus centrocampista'],
    },
    {
        id: 'gol-attaccante',
        sezione: 'bonus',
        domanda: 'Quanto vale un gol di un attaccante?',
        risposta: '**+3.0**.',
        chiavi: ['gol attaccante', 'rete attaccante', 'bonus attaccante', 'gol punta'],
        inEvidenza: true,
    },
    {
        id: 'assist',
        sezione: 'bonus',
        domanda: 'Quanto vale un assist?',
        risposta: '**+1.0**, per qualsiasi ruolo.',
        chiavi: ['assist', 'quanto vale assist', 'bonus assist'],
    },
    {
        id: 'rigore-parato',
        sezione: 'bonus',
        domanda: 'Quanto vale un rigore parato?',
        risposta: '**+3.0** al portiere.',
        chiavi: ['rigore parato', 'para rigore', 'bonus rigore parato', 'portiere para'],
    },
    {
        id: 'rigore-sbagliato',
        sezione: 'bonus',
        domanda: 'Quanto pesa un rigore sbagliato?',
        risposta: '**−3.0**. È il malus più pesante del regolamento.',
        chiavi: ['rigore sbagliato', 'sbaglia rigore', 'malus rigore', 'rigore fallito'],
    },
    {
        id: 'ammonizione',
        sezione: 'bonus',
        domanda: 'Quanto pesa un\'ammonizione?',
        risposta: '**−0.5**.',
        chiavi: ['ammonizione', 'giallo', 'cartellino giallo', 'malus ammonizione'],
    },
    {
        id: 'espulsione',
        sezione: 'bonus',
        domanda: 'Quanto pesa un\'espulsione?',
        risposta: '**−1.0**.',
        chiavi: ['espulsione', 'rosso', 'cartellino rosso', 'espulso', 'malus espulsione'],
    },
    {
        id: 'gol-subito',
        sezione: 'bonus',
        domanda: 'Quanto pesa un gol subito dal portiere?',
        risposta: '**−1.0** per ogni gol subito.',
        chiavi: ['gol subito', 'portiere gol subito', 'malus portiere', 'subisce gol'],
    },
    {
        id: 'autogol',
        sezione: 'bonus',
        domanda: 'Quanto pesa un autogol?',
        risposta: '**−2.0**.',
        chiavi: ['autogol', 'auto rete', 'malus autogol'],
    },
    {
        id: 'lista-bonus',
        sezione: 'bonus',
        domanda: 'Qual è la lista completa di bonus e malus?',
        risposta:
            '**Bonus** — gol difensore o portiere +4.0 · gol centrocampista +3.5 · gol attaccante +3.0 · rigore parato +3.0 · assist +1.0.\n**Malus** — ammonizione −0.5 · espulsione −1.0 · gol subito dal portiere −1.0 · autogol −2.0 · rigore sbagliato −3.0.',
        chiavi: ['bonus e malus', 'lista bonus', 'tutti i bonus', 'tabella bonus', 'malus', 'punteggi bonus'],
        inEvidenza: true,
    },

    /* ------------------------------------------------------ modificatore difesa */
    {
        id: 'modificatore',
        sezione: 'bonus',
        domanda: 'Come funziona il modificatore di difesa?',
        risposta:
            'Si applica se schieri **almeno 4 difensori**. Si prende la media voto di **portiere + i 3 migliori difensori**: media **≥ 7 → +6**, da **6.5 a 7 (esclusa) → +3**, da **6 a 6.5 (esclusa) → +1**.',
        chiavi: ['modificatore difesa', 'modificatore', 'come funziona modificatore', 'bonus difesa', 'media difesa'],
        inEvidenza: true,
    },
    {
        id: 'modificatore-quando',
        sezione: 'bonus',
        domanda: 'Quando si applica il modificatore?',
        risposta:
            'Solo con **4 o più difensori** in campo. Con tre difensori non si applica.',
        chiavi: ['quando modificatore', 'quanti difensori modificatore', 'modificatore 3 difensori', 'serve per modificatore'],
    },
    {
        id: 'modificatore-soglie',
        sezione: 'bonus',
        domanda: 'Quali sono le soglie del modificatore?',
        risposta:
            'Media **≥ 7 → +6** · **≥ 6.5 e < 7 → +3** · **≥ 6 e < 6.5 → +1**. Sotto 6 non si prende nulla.',
        chiavi: ['soglie modificatore', 'quanto da il modificatore', 'valori modificatore', '+6', 'media 7'],
    },
    {
        id: 'modificatore-calcolo',
        sezione: 'bonus',
        domanda: 'Su quali giocatori si calcola il modificatore?',
        risposta:
            'Sulla media voto di **portiere + 3 migliori difensori**. Se ne schieri quattro o cinque, contano i tre con voto più alto.',
        chiavi: ['calcolo modificatore', 'quali difensori modificatore', 'migliori difensori', 'portiere modificatore'],
    },

    /* ----------------------------------------------------------------- coppe */
    {
        id: 'competizioni',
        sezione: 'coppe',
        domanda: 'Quali competizioni ci sono?',
        risposta:
            'Quattro: il **Campionato Generale** (classifica a punteggio su tutta la stagione), una **Fase Iniziale Coppe** di qualificazione, e poi **Coppa Super Lega** per le squadre più forti e **Coppa UEFA** per tutte le altre.',
        chiavi: ['competizioni', 'quali coppe', 'tornei', 'campionato e coppe', 'quante competizioni'],
        inEvidenza: true,
    },
    {
        id: 'super-lega',
        sezione: 'coppe',
        domanda: 'Cos\'è la Coppa Super Lega?',
        risposta: 'La coppa riservata alle **squadre più forti**, che escono dalla fase iniziale di qualificazione.',
        chiavi: ['super lega', 'superlega', 'coppa super lega', 'champions'],
    },
    {
        id: 'coppa-uefa',
        sezione: 'coppe',
        domanda: 'Cos\'è la Coppa UEFA?',
        risposta: 'La coppa per **tutte le altre squadre**, quelle che non entrano in Super Lega.',
        chiavi: ['coppa uefa', 'uefa', 'europa league', 'seconda coppa'],
    },
    {
        id: 'struttura-coppe',
        sezione: 'coppe',
        domanda: 'Come sono strutturate le coppe?',
        risposta:
            'Struttura e date definitive vengono comunicate **entro l\'inizio della 5ª giornata**: dipendono dal numero ufficiale di squadre iscritte.',
        chiavi: ['struttura coppe', 'come funzionano coppe', 'formato coppe', 'quando si sa', 'quinta giornata', 'girone'],
    },
    {
        id: 'soglie-gol',
        sezione: 'coppe',
        domanda: 'Come si trasformano i punti in gol nelle coppe?',
        risposta:
            'Sotto 66 punti **0 gol** · 66–70 **1 gol** · 70.5–74 **2 gol** · 74.5–78 **3 gol** · 78.5–82 **4 gol**, e così via **ogni 4 punti**.',
        chiavi: ['soglie gol', 'punti in gol', 'quanti gol', 'gol si fanno', 'gol con', 'conversione gol', '66', 'tabella gol', 'come si segna', 'trasformano'],
        inEvidenza: true,
    },
    {
        id: 'formazione-coppe',
        sezione: 'coppe',
        domanda: 'La formazione delle coppe è la stessa del campionato?',
        risposta:
            'No. La formazione delle coppe è **libera e indipendente** da quella del campionato: puoi schierare undici diversi.',
        chiavi: ['formazione coppe', 'stessa formazione', 'formazione diversa coppa', 'schierare in coppa'],
        inEvidenza: true,
    },

    /* ----------------------------------------------------------------- premi */
    {
        id: 'premio-giornata',
        sezione: 'premi',
        domanda: 'Quanto si vince facendo il miglior punteggio di giornata?',
        risposta:
            'Il miglior punteggio di giornata vale **25 🍆**. A pari punteggio il premio si **divide** fra tutte le squadre in testa.\nNel 25/26 questo ha distribuito **950 🍆** in tutto, cioè 25 × 38 giornate. Gli importi 26/27 si confermano entro la 5ª giornata, ma la struttura resta simile.',
        chiavi: ['premio giornata', 'quanto si vince', 'miglior punteggio giornata', '25', 'vincitore giornata', 'vince la giornata', 'premio settimanale', 'primo di giornata'],
        inEvidenza: true,
    },
    {
        id: 'pari-punti-premio',
        sezione: 'premi',
        domanda: 'Cosa succede se due squadre fanno lo stesso punteggio?',
        risposta:
            'Il premio di giornata si **smezza**: se due squadre pareggiano in testa prendono metà a testa, se sono tre un terzo, e così via.',
        chiavi: ['pari punti', 'stesso punteggio', 'punteggio uguale', 'pareggio premio', 'pareggiamo', 'pareggio', 'smezzare', 'dividere premio', 'ex aequo', 'parimerito', 'pari merito'],
    },
    {
        id: 'secondo-giornata',
        sezione: 'novita',
        domanda: 'Anche il secondo di giornata prende un premio?',
        risposta:
            'Sì, è **la novità del 2026/27**: oltre al primo, anche il **secondo miglior punteggio di giornata** riceve un premio ogni turno. Gli importi definitivi vengono comunicati entro l\'inizio della 5ª giornata.',
        chiavi: ['secondo classificato', 'secondo giornata', 'premio secondo', 'novita premi', 'nuovo premio'],
        inEvidenza: true,
    },
    {
        id: 'premi-elenco',
        sezione: 'premi',
        domanda: 'Quali premi ci sono in totale?',
        risposta:
            'Tre famiglie: **premi di giornata** (1° e 2° classificato di ogni turno, più il miglior punteggio stagionale), **premi di classifica generale** per le prime posizioni del Campionato, e **premi coppe** per Super Lega e UEFA.\nNel 25/26 sono stati distribuiti **4.670 🍆** su 5.500 raccolti: 950 in giornate, 2.570 in classifica, 1.050 nelle coppe, 100 al record.',
        chiavi: ['quali premi', 'premi', 'montepremi', 'lista premi', 'cosa si vince', 'distribuzione premi', 'melanzane distribuite', 'totale premi', 'totale montepremi', 'quanto si distribuisce'],
        inEvidenza: true,
    },
    {
        id: 'miglior-punteggio-stagionale',
        sezione: 'premi',
        domanda: 'C\'è un premio per il miglior punteggio della stagione?',
        risposta:
            'Sì. Nel 25/26 valeva **100 🍆** ed è andato a Cippalippa1418 con **112,5 punti alla 24ª giornata**.',
        chiavi: ['miglior punteggio stagionale', 'record stagione', 'punteggio piu alto', 'premio record'],
    },
    {
        id: 'quando-premi',
        sezione: 'premi',
        domanda: 'Quando si sanno i premi di campionato e coppe?',
        risposta:
            'Si assegnano sulla **classifica finale**, quindi all\'ultima giornata. Gli importi 26/27 arrivano entro l\'inizio della 5ª giornata, perché dipendono dagli iscritti.\nRiferimento 25/26: classifica **850 · 650 · 500 · 350 · 220 🍆** alle prime cinque; Super Lega **350 · 250 · 150 · 150**; Coppa UEFA **100 · 50**.',
        chiavi: ['quando premi', 'quando si pagano', 'premi finali', 'fine campionato', 'ultima giornata premi', 'premi classifica', 'vince in classifica', 'premio campionato', 'premi coppe'],
    },
    {
        id: 'melanzane',
        sezione: 'premi',
        domanda: 'Cosa sono le melanzane?',
        risposta:
            '🍆 è l\'unità di conto della lega: la quota d\'iscrizione e tutti i premi si contano in melanzane.',
        chiavi: ['melanzane', 'melanzana', 'cosa sono le melanzane', 'emoji melanzana', 'unita di conto', 'cosa significa', 'valuta'],
    },

    /* -------------------------------------------------------- casi speciali */
    {
        id: 'partita-rinviata',
        sezione: 'casi',
        domanda: 'Cosa succede se una partita viene rinviata?',
        risposta:
            'Dipende da quando si recupera. **Dentro il range della giornata**: voti contati normalmente. **Fuori dal range**: **6 politico** per tutti i giocatori coinvolti.',
        chiavi: ['partita rinviata', 'rinvio', 'rinviata', 'recupero', 'posticipata', 'partita spostata'],
        inEvidenza: true,
    },
    {
        id: 'sei-politico',
        sezione: 'casi',
        domanda: 'Chi prende il 6 politico?',
        risposta:
            '**Tutti i giocatori coinvolti** nella partita fuori range — compresi infortunati, squalificati e riserve.',
        chiavi: ['6 politico', 'sei politico', 'chi prende 6', 'politico', 'infortunati squalificati'],
    },
    {
        id: 'politico-modificatore',
        sezione: 'casi',
        domanda: 'Il 6 politico conta nel modificatore di difesa?',
        risposta: 'Sì, **conta normalmente** nel calcolo del modificatore.',
        chiavi: ['politico modificatore', '6 politico difesa', 'conta nel modificatore'],
    },
    {
        id: 'anticipi',
        sezione: 'casi',
        domanda: 'Come vengono gestiti gli anticipi?',
        risposta:
            'Un anticipo dentro il range della giornata conta normalmente. La formazione va comunque inserita **prima del primo anticipo**, quindi un anticipo al venerdì sposta in avanti la scadenza.',
        chiavi: ['anticipi', 'anticipo', 'venerdi', 'partita anticipata', 'primo anticipo'],
    },

    /* -------------------------------------------------------------- il sito */
    {
        id: 'dove-classifica',
        sezione: 'sito',
        domanda: 'Dove vedo la classifica?',
        risposta:
            'Nella sezione **Classifica** del sito: c\'è la tabella completa con il punteggio di ogni giornata e il vincitore di giornata evidenziato in oro.',
        chiavi: ['dove classifica', 'vedere classifica', 'classifica', 'punteggi', 'tabella'],
    },
    {
        id: 'dove-verdetto',
        sezione: 'sito',
        domanda: 'Cos\'è la sezione Verdetto?',
        risposta:
            'Il riepilogo della giornata: podio, leader, record, cucchiaio di legno e premi. C\'è anche un **selettore delle giornate** per rivedere qualsiasi turno passato.',
        chiavi: ['verdetto', 'sezione verdetto', 'podio', 'riepilogo giornata'],
    },
    {
        id: 'scarica-pdf',
        sezione: 'sito',
        domanda: 'Dove scarico il regolamento in PDF?',
        risposta:
            'Il pulsante **Scarica PDF Completo** è in cima a questa pagina e ripetuto in fondo.',
        chiavi: ['pdf', 'scaricare regolamento', 'download', 'regolamento pdf', 'documento'],
    },
    {
        id: 'risultati-serie-a',
        sezione: 'sito',
        domanda: 'Il sito mostra i risultati di Serie A?',
        risposta:
            'Sì, nella sezione **Risultati Serie A**: calendario, classifica e la schedina di ogni partita con formazioni, eventi, momento e statistiche, presi dai dati ufficiali della Lega.',
        chiavi: ['risultati serie a', 'serie a', 'partite', 'calendario', 'tabellino'],
    },
    {
        id: 'contatti',
        sezione: 'sito',
        domanda: 'Chi contatto se ho un problema?',
        risposta:
            'Gli organizzatori, attraverso il **gruppo WhatsApp** della lega. È anche il canale per l\'inserimento manuale della formazione in caso di guasti.',
        chiavi: ['contatti', 'chi contatto', 'aiuto', 'problema', 'organizzatori', 'assistenza', 'gruppo'],
    },
    {
        id: 'stagione',
        sezione: 'sito',
        domanda: 'Che stagione è questa?',
        risposta:
            'La **seconda edizione**, stagione **2026/27**. Le stagioni precedenti restano consultabili dal selettore in alto a destra.',
        chiavi: ['stagione', 'che anno', 'edizione', 'stagioni precedenti', '2026', 'archivio'],
    },

    /* ----------------------------------------------------------- differenze */
    {
        id: 'cosa-cambia',
        sezione: 'novita',
        domanda: 'Cosa cambia rispetto alla scorsa stagione?',
        risposta:
            'Quasi nulla: il regolamento è **praticamente identico** al 2025/26. L\'unica novità sostanziale è il **premio al secondo classificato di giornata**, che prima non esisteva.',
        chiavi: ['cosa cambia', 'novita', 'differenze', 'nuovo regolamento', 'rispetto scorso anno', 'cambiamenti'],
        inEvidenza: true,
    },

    /* ------------------------------------------------- situazioni di partita */
    {
        id: 'senza-voto',
        sezione: 'rosa',
        domanda: 'Cosa succede se un mio giocatore non prende voto?',
        risposta:
            'Entra una riserva **dello stesso ruolo**, seguendo l\'ordine che hai dato in panchina. Le sostituzioni automatiche sono **5**: un portiere entra solo per un portiere, un difensore solo per un difensore.',
        chiavi: ['senza voto', 'non prende voto', 'non gioca', 'sv', 'giocatore in panchina', 'non convocato'],
        inEvidenza: true,
    },
    {
        id: 'infortunato',
        sezione: 'rosa',
        domanda: 'Se schiero un infortunato cosa succede?',
        risposta:
            'Non prende voto, quindi entra una riserva **dello stesso ruolo**, se ne hai una disponibile in panchina. Se non ce l\'hai o hai finito i 5 cambi, resti in dieci.',
        chiavi: ['infortunato', 'infortunio', 'squalificato', 'squalifica', 'schiero infortunato'],
    },
    {
        id: 'sostituzioni-finite',
        sezione: 'rosa',
        domanda: 'Cosa succede se finisco le sostituzioni?',
        risposta:
            'I giocatori senza voto restano tali e non portano punti. Le sostituzioni disponibili sono **5**, non di più — e ognuna vale solo fra giocatori dello stesso ruolo.',
        chiavi: ['sostituzioni finite', 'esaurite sostituzioni', 'piu di 5', 'sesta sostituzione'],
    },
    {
        id: 'capitano',
        sezione: 'rosa',
        domanda: 'Si usa il capitano?',
        risposta:
            'No, **il capitano non si usa** in questa lega: nella lista dei bonus non compare, e non ci sono moltiplicatori di alcun tipo. Ogni giocatore vale il suo voto più i suoi bonus, punto.',
        chiavi: ['capitano', 'jolly', 'raddoppio', 'moltiplicatore', 'fascia'],
    },
    {
        id: 'fantamilioni',
        sezione: 'rosa',
        domanda: 'Cosa sono i Fantamilioni?',
        risposta:
            'Sono la moneta con cui si compra la rosa: ne hai **600** per i tuoi 24 giocatori. Non c\'entrano con le melanzane 🍆, che sono invece la quota e i premi veri.',
        chiavi: ['fantamilioni', 'fantamilione', 'crediti rosa', 'moneta', 'con cosa compro', 'fm'],
    },
    {
        id: 'porta-inviolata',
        sezione: 'bonus',
        domanda: 'C\'è un bonus per la porta inviolata?',
        risposta:
            'Non come voce a sé: il portiere è premiato attraverso il **modificatore di difesa**, non con un bonus fisso per il clean sheet.',
        chiavi: ['porta inviolata', 'clean sheet', 'imbattibilita', 'portiere imbattuto', 'zero gol subiti'],
    },
    {
        id: 'quanti-punti-servono',
        sezione: 'coppe',
        domanda: 'Quanti punti servono per segnare in coppa?',
        risposta:
            'Il primo gol arriva a **66 punti**. Sotto 66 la partita di coppa finisce con zero gol per te.',
        chiavi: ['quanti punti per segnare', 'punti minimi', 'primo gol', 'soglia 66', 'punteggio minimo'],
    },
    {
        id: 'punti-alti',
        sezione: 'coppe',
        domanda: 'Quanti gol faccio con un punteggio molto alto?',
        risposta:
            'Si continua a salire **ogni 4 punti** dopo la soglia degli 82: 82.5–86 fanno 5 gol, 86.5–90 fanno 6, e così via.',
        chiavi: ['punteggio alto', 'oltre 82', 'tanti gol', 'quanti gol massimo', '90 punti'],
    },

    /* ------------------------------------------------------ lega e struttura */
    {
        id: 'quante-squadre',
        sezione: 'iscrizione',
        domanda: 'Quante squadre partecipano?',
        risposta:
            'Il numero definitivo si conosce a iscrizioni chiuse: da lì dipendono struttura delle coppe e importi dei premi, comunicati **entro l\'inizio della 5ª giornata**. La stagione scorsa erano **50 squadre**.',
        chiavi: ['quante squadre', 'quanti partecipanti', 'quanti iscritti', 'numero squadre', 'quanti siamo'],
    },
    {
        id: 'due-squadre',
        sezione: 'iscrizione',
        domanda: 'Posso iscrivere due squadre?',
        risposta:
            'Il regolamento pubblicato non lo prevede né lo vieta esplicitamente. È una decisione degli organizzatori: chiedi nel gruppo WhatsApp prima di pagare due quote.',
        chiavi: ['due squadre', 'seconda squadra', 'piu squadre', 'doppia iscrizione'],
    },
    {
        id: 'abbandono',
        sezione: 'iscrizione',
        domanda: 'Cosa succede se qualcuno abbandona a metà stagione?',
        risposta:
            'Non è un caso previsto dal regolamento scritto. La quota comunque **non viene rimborsata**; per il resto decidono gli organizzatori.',
        chiavi: ['abbandona', 'ritiro', 'mollare', 'lascia la lega', 'squadra inattiva'],
    },
    {
        id: 'chi-organizza',
        sezione: 'sito',
        domanda: 'Chi organizza la lega?',
        risposta:
            'Gli organizzatori della Fanta Laghèe, raggiungibili nel **gruppo WhatsApp** della lega. È una lega privata, attiva dal 2025.',
        chiavi: ['chi organizza', 'organizzatori', 'admin', 'presidente', 'chi gestisce', 'lega privata'],
    },

    /* ------------------------------------------------------ punteggi e classifica */
    {
        id: 'come-si-vince',
        sezione: 'premi',
        domanda: 'Come si vince il campionato?',
        risposta:
            'Il **Campionato Generale** è una classifica a punteggio: si sommano i punti di tutte le giornate e vince chi ha il totale più alto a fine stagione.',
        chiavi: ['come si vince', 'vincere campionato', 'classifica generale', 'come funziona campionato', 'somma punti'],
        inEvidenza: true,
    },
    {
        id: 'media-punti',
        sezione: 'sito',
        domanda: 'Cos\'è la media punti in classifica?',
        risposta:
            'La media dei punti per giornata giocata. Serve a confrontare squadre che hanno giocato un numero diverso di turni, per esempio chi si è iscritto in ritardo.',
        chiavi: ['media punti', 'media', 'punti medi', 'media giornata'],
    },
    {
        id: 'cucchiaio',
        sezione: 'sito',
        domanda: 'Cos\'è il cucchiaio di legno?',
        risposta:
            'Il **peggior punteggio** del periodo: nel Verdetto è la voce che ricorda chi ha fatto la giornata più brutta. Non comporta penalità, solo figuraccia.',
        chiavi: ['cucchiaio di legno', 'cucchiaio', 'peggior punteggio', 'ultimo', 'peggiore'],
    },
    {
        id: 'record',
        sezione: 'sito',
        domanda: 'Cos\'è il record nella pagina Verdetto?',
        risposta:
            'Il **miglior punteggio singolo** registrato dalla 1ª giornata a quella che stai guardando, con squadra e giornata in cui è stato fatto.',
        chiavi: ['record', 'miglior punteggio', 'punteggio record', 'massimo'],
    },

    /* --------------------------------------------------------- date e tempi */
    {
        id: 'inizio-stagione',
        sezione: 'iscrizione',
        domanda: 'Quando inizia la stagione?',
        risposta:
            'Il mercato apre il **1 agosto 2026** e si gioca dalla 1ª giornata di Serie A 2026/27. La rosa va chiusa entro 15 minuti prima del primo anticipo.',
        chiavi: ['quando inizia', 'inizio stagione', 'quando si parte', 'data inizio', 'agosto'],
    },
    {
        id: 'quante-giornate',
        sezione: 'sito',
        domanda: 'Quante giornate dura il campionato?',
        risposta:
            'Il Campionato Generale segue la Serie A: **38 giornate**. Le coppe si giocano in parallelo, con la struttura comunicata entro la 5ª giornata.',
        chiavi: ['quante giornate', '38', 'durata campionato', 'quanti turni'],
    },

    /* ------------------------------------------------------ formulazioni brevi */
    /* ------------------------------------------------ dettagli dal regolamento */
    {
        id: 'fonte-assist',
        sezione: 'iscrizione',
        domanda: 'Chi decide se un assist è valido?',
        risposta:
            'La valutazione è di **Fantaclub**, che guarda tre cose: la **volontarietà del passaggio**, il **dribbling prima dell\'assist** e la **palla deviata** che porta al gol.',
        chiavi: ['fonte assist', 'chi decide assist', 'assist valido', 'come si contano gli assist', 'volontarieta', 'palla deviata'],
    },
    {
        id: 'esempio-blocco',
        sezione: 'rosa',
        domanda: 'Se compro un giocatore proprio mentre raggiunge la soglia?',
        risposta:
            'Te lo tieni. Il blocco vale **da quando la soglia è superata**, non retroattivamente: se oggi è ancora acquistabile lo prendi, e da domani sarà bloccato per gli altri. Resta bloccato finché il numero di squadre che lo possiedono non scende sotto la soglia.',
        chiavi: ['compro mentre raggiunge', 'esempio blocco', 'appena prima del blocco', 'patagarro', 'lo tengo', 'retroattivo'],
    },
    {
        id: 'coppe-spostamento',
        sezione: 'coppe',
        domanda: 'Le giornate di coppa possono essere spostate?',
        risposta:
            'Sì. La direzione può **spostare le giornate di coppa**, soprattutto le fasi finali, quando molte partite di Serie A vengono posticipate: serve a evitare che una finale si giochi con mezza rosa a 6 politico.',
        chiavi: ['spostare coppa', 'giornate coppa', 'cambiare date coppe', 'fase finale spostata', 'posticipi coppa'],
    },
    {
        id: 'nome-lega',
        sezione: 'sito',
        domanda: 'Perché si chiama Fanta Laghèe?',
        risposta:
            'È il nome della seconda edizione della lega, che prima si chiamava **FantaBarSport**. "Laghèe" è come si chiamano quelli del lago da queste parti — da lì anche il sottotitolo, il Fantacalcio del Lario.',
        chiavi: ['perche si chiama', 'nome lega', 'fantabarsport', 'laghee', 'significato nome', 'origine'],
    },
    {
        id: 'leggere-prima',
        sezione: 'sito',
        domanda: 'Posso chiedere agli organizzatori?',
        risposta:
            'Certo, ma il regolamento chiede espressamente di **leggerlo prima** — soprattutto per le domande la cui risposta è già scritta. Per questo esiste questo assistente: provaci qui prima di scrivere nel gruppo.',
        chiavi: ['posso chiedere', 'fare domande', 'chiedere agli organizzatori', 'domande stupide', 'gruppo whatsapp domande'],
    },

    {
        id: 'gazzetta',
        sezione: 'sito',
        domanda: 'Cos\'è la Gazzetta del Laghèe?',
        risposta:
            'Il giornale della lega: **esce ogni giornata**, con il racconto del turno appena chiuso. Lo trovi nella sezione Gazzetta.',
        chiavi: ['gazzetta', 'giornale', 'articoli', 'gazzetta del laghee', 'ogni quanto esce', 'notizie'],
    },
    {
        id: 'riassunto',
        sezione: 'sito',
        domanda: 'Riassumimi il regolamento in breve',
        risposta:
            'Quota **110 🍆**. Rosa da **24 giocatori** (3-8-8-5) con **600 Fantamilioni**, su **Fantaclub**, voti Fantaclub Classic. Formazione entro **15 minuti prima del primo anticipo**, modulo fisso, 5 sostituzioni. Si gioca **Campionato**, **Super Lega** e **Coppa UEFA**. Ogni giornata il miglior punteggio vale **25 🍆**, e dal 26/27 c\'è un premio anche per il secondo.',
        chiavi: ['riassunto', 'in breve', 'riassumi', 'sintesi', 'tutto', 'spiegami', 'regole principali'],
        inEvidenza: true,
    },
];

/* ========================================================================== */
/*  Ricerca                                                                   */
/* ========================================================================== */

const STOPWORDS = new Set([
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
    'e', 'ed', 'o', 'ma', 'se', 'che', 'chi', 'cosa', 'come', 'quando', 'dove', 'perche', 'quale', 'quali',
    'del', 'della', 'dei', 'delle', 'dello', 'degli', 'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'nel', 'nella', 'nei', 'negli', 'nelle', 'sul', 'sulla', 'sui', 'sugli', 'sulle',
    'mi', 'ti', 'si', 'ci', 'vi', 'ne', 'me', 'te', 'lui', 'lei', 'noi', 'voi', 'loro',
    'e', 'sono', 'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno', 'essere', 'avere',
    'posso', 'puo', 'possiamo', 'devo', 'deve', 'fare', 'faccio', 'fa', 'vorrei', 'voglio',
    'ciao', 'grazie', 'per favore', 'scusa', 'salve',
    'quanto', 'quanta', 'quanti', 'quante', 'qual', 'piu', 'meno', 'anche', 'solo', 'poi', 'gia',
    'usa', 'usare', 'usano', 'usato', 'usiamo',
]);

/** minuscolo, senza accenti e senza punteggiatura */
export function normalizza(testo: string): string {
    return testo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s+.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenizza(testo: string): string[] {
    return normalizza(testo)
        .split(' ')
        .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Due parole contano come la stessa se una è il prefisso dell'altra, sono
 * abbastanza lunghe e di lunghezza simile: così "difensore" e "difensori"
 * combaciano senza scrivere un lemmatizzatore italiano, mentre "punte" e
 * "punteggio" restano due cose diverse.
 */
function stessaParola(a: string, b: string): boolean {
    if (a === b) return true;
    const min = Math.min(a.length, b.length);
    if (min < 4 || Math.abs(a.length - b.length) > 3) return false;
    return a.startsWith(b.slice(0, min)) || b.startsWith(a.slice(0, min));
}

/**
 * Peso di una parola: quelle presenti in molte voci distinguono poco.
 * Calcolato una volta sola all'avvio.
 */
const PESI: Map<string, number> = (() => {
    const frequenza = new Map<string, number>();
    KB.forEach((v) => {
        const parole = new Set([...tokenizza(v.domanda), ...v.chiavi.flatMap(tokenizza)]);
        parole.forEach((p) => frequenza.set(p, (frequenza.get(p) ?? 0) + 1));
    });
    const pesi = new Map<string, number>();
    frequenza.forEach((n, parola) => pesi.set(parola, Math.log(1 + KB.length / n)));
    return pesi;
})();

const pesoDi = (parola: string): number => {
    if (PESI.has(parola)) return PESI.get(parola)!;
    // parola mai vista nella base: se combacia per prefisso prendiamo il suo peso
    for (const [nota, peso] of PESI) if (stessaParola(parola, nota)) return peso;
    return 0.4;
};

/** Tutte le parole che la base conosce: serve a riconoscere il fuori tema. */
const VOCABOLARIO: string[] = Array.from(PESI.keys());

const conosciuta = (parola: string): boolean =>
    VOCABOLARIO.some((nota) => stessaParola(parola, nota));

export type Risultato = {
    voce: VoceKB;
    punteggio: number;
    /** quota di parole della domanda che la base riconosce, da 0 a 1 */
    copertura: number;
};

/** Voci ordinate per pertinenza rispetto alla domanda. */
export function cerca(domanda: string, quante = 3): Risultato[] {
    const parole = tokenizza(domanda);
    if (parole.length === 0) return [];
    const testoIntero = normalizza(domanda);

    // Le parole che non esistono da nessuna parte nella base sono il segnale
    // migliore di una domanda fuori tema: pesano contro tutte le voci.
    const sconosciute = parole.filter((p) => !conosciuta(p)).length;
    const copertura = (parole.length - sconosciute) / parole.length;

    const risultati = KB.map((voce) => {
        const bersagli = [voce.domanda, ...voce.chiavi];
        let punteggio = 0;

        // una chiave che compare per intero nella domanda vale molto
        for (const chiave of voce.chiavi) {
            const c = normalizza(chiave);
            if (c.includes(' ') && testoIntero.includes(c)) punteggio += 4 + c.split(' ').length;
        }

        // sovrapposizione parola per parola, pesata sulla rarità
        const paroleBersaglio = new Set(bersagli.flatMap(tokenizza));
        for (const parola of parole) {
            for (const bersaglio of paroleBersaglio) {
                if (stessaParola(parola, bersaglio)) {
                    punteggio += pesoDi(bersaglio);
                    break;
                }
            }
        }

        return { voce, punteggio: punteggio - 1.4 * sconosciute, copertura };
    });

    return risultati
        .filter((r) => r.punteggio > 0)
        .sort((a, b) => b.punteggio - a.punteggio)
        .slice(0, quante);
}

/** Soglia sopra la quale ci fidiamo abbastanza da rispondere direttamente. */
export const SOGLIA_CERTEZZA = 2.4;

/** Copertura minima: sotto questa la domanda parla d'altro. */
export const COPERTURA_MINIMA = 0.4;

/** Vero quando conviene rispondere invece di proporre alternative. */
export const abbastanzaSicuro = (r?: Risultato): boolean =>
    !!r && r.punteggio >= SOGLIA_CERTEZZA && r.copertura >= COPERTURA_MINIMA;

/**
 * Le piste da mostrare all'apertura. Poche: una lista lunga si legge come un
 * elenco di cose che l'assistente sa fare, e scoraggia dallo scrivere. Quattro
 * bastano a far capire il registro, poi si chiede a parole proprie.
 */
export const SUGGERIMENTI = KB.filter((v) => v.inEvidenza).slice(0, 4);

export const ARGOMENTI: { sezione: Sezione; titolo: string }[] = [
    { sezione: 'novita', titolo: 'Novità' },
    { sezione: 'iscrizione', titolo: 'Iscrizione e voti' },
    { sezione: 'rosa', titolo: 'Rosa e formazione' },
    { sezione: 'bonus', titolo: 'Bonus e malus' },
    { sezione: 'coppe', titolo: 'Coppe' },
    { sezione: 'premi', titolo: 'Premi' },
    { sezione: 'casi', titolo: 'Rinvii' },
    { sezione: 'sito', titolo: 'Il sito' },
];

/* ========================================================================== */
/*  Quando non capisce                                                        */
/* ========================================================================== */

/**
 * La sezione più vicina alla domanda.
 *
 * Serve al passo successivo del "non ho capito": una domanda può essere troppo
 * vaga per una risposta precisa ma abbastanza chiara da capire *di cosa parla*
 * — "una cosa sulla formazione" non individua una voce, ma individua benissimo
 * l'argomento. Da lì l'assistente può chiedere invece di arrendersi.
 */
export function sezionePiuVicina(domanda: string): Sezione | null {
    const punteggi = new Map<Sezione, number>();
    for (const r of cerca(domanda, KB.length)) {
        punteggi.set(r.voce.sezione, (punteggi.get(r.voce.sezione) ?? 0) + r.punteggio);
    }
    const migliore = Array.from(punteggi.entries()).sort((a, b) => b[1] - a[1])[0];
    return migliore && migliore[1] >= 1.6 ? migliore[0] : null;
}

/** Le domande di una sezione, per proporle come piste da seguire. */
export function domandeDi(sezione: Sezione, quante = 4): VoceKB[] {
    const voci = KB.filter((v) => v.sezione === sezione);
    // prima quelle in evidenza: sono le più chieste
    return [...voci].sort((a, b) => Number(!!b.inEvidenza) - Number(!!a.inEvidenza)).slice(0, quante);
}

export const TITOLO_SEZIONE: Record<Sezione, string> = {
    novita: 'le novità di quest\'anno',
    iscrizione: 'iscrizione, quota e voti',
    rosa: 'rosa, formazione e mercato',
    bonus: 'bonus, malus e modificatore',
    coppe: 'coppe e soglie gol',
    premi: 'premi e melanzane',
    casi: 'rinvii e 6 politico',
    sito: 'il sito e la lega',
};
