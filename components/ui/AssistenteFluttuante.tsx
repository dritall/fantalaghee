"use client";

/**
 * L'assistente del regolamento, come conversazione vera.
 *
 * Prima era un riquadro incastrato in cima al regolamento: si trovava solo se
 * eri già sulla pagina giusta, ed era proprio il caso in cui non ti serviva.
 * Ora è un pulsante presente ovunque che apre una chat — foglio a tutta
 * altezza sul telefono, riquadro ancorato in basso a sinistra sul desktop.
 *
 * Le risposte restano quelle scritte a mano in lib/regolamento-kb.ts: nessun
 * modello, nessuna chiamata di rete, e quando la domanda esce dal regolamento
 * l'assistente lo dichiara invece di inventare.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, SendHorizonal, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    cerca,
    abbastanzaSicuro,
    SUGGERIMENTI,
    sezionePiuVicina,
    domandeDi,
    ARGOMENTI,
    TITOLO_SEZIONE,
    type Risultato,
    type Sezione,
    type VoceKB,
} from "@/lib/regolamento-kb";

type Messaggio =
    | { ruolo: "utente"; testo: string }
    | {
          ruolo: "assistente";
          testo: string;
          voce?: VoceKB;
          alternative: VoceKB[];
          /** quando non ha capito proprio niente, offre gli argomenti */
          argomenti?: Sezione[];
      };

/** Rende il **grassetto** senza tirare dentro un parser markdown. */
function Testo({ contenuto }: { contenuto: string }) {
    return (
        <>
            {contenuto.split("\n").map((riga, r) => (
                <span key={r} className="block [&+&]:mt-1.5">
                    {riga.split(/(\*\*[^*]+\*\*)/g).map((pezzo, i) =>
                        pezzo.startsWith("**") && pezzo.endsWith("**") ? (
                            <strong key={i} className="font-black text-[color:var(--calce)]">
                                {pezzo.slice(2, -2)}
                            </strong>
                        ) : (
                            <span key={i}>{pezzo}</span>
                        )
                    )}
                </span>
            ))}
        </>
    );
}

const APERTURA: Messaggio = {
    ruolo: "assistente",
    testo:
        "Ciao. Rispondo sul **regolamento della Fanta Laghèe**: quota, rosa, formazione, bonus e malus, coppe, premi, rinvii.\nPer il resto — mercato, consigli sui giocatori, questioni di lega — meglio il gruppo.",
    alternative: [],
};

export function AssistenteFluttuante() {
    const [aperto, setAperto] = useState(false);
    const [messaggi, setMessaggi] = useState<Messaggio[]>([APERTURA]);
    const [bozza, setBozza] = useState("");
    const [daLeggere, setDaLeggere] = useState(false);

    const conversazioneRef = useRef<HTMLDivElement>(null);
    const campoRef = useRef<HTMLInputElement>(null);
    const lanciatoreRef = useRef<HTMLButtonElement>(null);

    /* ------------------------------------------------------------- apertura */

    // Chi apre la chat vuole scrivere: il campo prende il fuoco da solo, ma
    // non su telefono, dove farebbe salire la tastiera sopra la conversazione.
    useEffect(() => {
        if (!aperto) return;
        setDaLeggere(false);
        if (window.matchMedia("(min-width: 768px)").matches) {
            campoRef.current?.focus();
        }
    }, [aperto]);

    // Esc chiude e riporta il fuoco sul pulsante, come ci si aspetta da una
    // finestra che si è aperta sopra la pagina.
    useEffect(() => {
        if (!aperto) return;
        const suTasto = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setAperto(false);
                lanciatoreRef.current?.focus();
            }
        };
        window.addEventListener("keydown", suTasto);
        return () => window.removeEventListener("keydown", suTasto);
    }, [aperto]);

    // Sul telefono il foglio copre lo schermo: la pagina sotto non deve scorrere.
    useEffect(() => {
        if (!aperto) return;
        const precedente = document.body.style.overflow;
        if (!window.matchMedia("(min-width: 768px)").matches) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = precedente;
        };
    }, [aperto]);

    useEffect(() => {
        const box = conversazioneRef.current;
        if (box) box.scrollTop = box.scrollHeight;
    }, [messaggi, aperto]);

    /* -------------------------------------------------------------- risposte */

    const rispondi = useCallback((domanda: string) => {
        const testo = domanda.trim();
        if (!testo) return;

        const trovate: Risultato[] = cerca(testo, 3);
        const migliore = trovate[0];

        let risposta: Messaggio;

        if (abbastanzaSicuro(migliore)) {
            risposta = {
                ruolo: "assistente",
                testo: migliore.voce.risposta,
                voce: migliore.voce,
                alternative: trovate.slice(1).map((r) => r.voce),
            };
        } else {
            // Non ha capito la domanda, ma può aver capito l'argomento: in quel
            // caso chiede, invece di rimandare al gruppo. È la differenza fra
            // un assistente e un muro.
            const sezione = sezionePiuVicina(testo);
            if (sezione) {
                risposta = {
                    ruolo: "assistente",
                    testo: `Non sono sicuro di aver capito. Stiamo parlando di **${TITOLO_SEZIONE[sezione]}**?\nDimmi quale di queste ti serve, o riscrivimela con parole diverse.`,
                    alternative: domandeDi(sezione, 4),
                };
            } else if (trovate.length > 0) {
                risposta = {
                    ruolo: "assistente",
                    testo: "Non ho una risposta sicura per questa. Forse cercavi una di queste:",
                    alternative: trovate.map((r) => r.voce),
                };
            } else {
                risposta = {
                    ruolo: "assistente",
                    testo: "Questa non l'ho afferrata. Su cosa ti serve una mano?",
                    alternative: [],
                    argomenti: ARGOMENTI.map((a) => a.sezione),
                };
            }
        }

        setMessaggi((prev) => [...prev, { ruolo: "utente", testo }, risposta]);
        setBozza("");
    }, []);

    const chiediVoce = (voce: VoceKB) => {
        setMessaggi((prev) => [
            ...prev,
            { ruolo: "utente", testo: voce.domanda },
            { ruolo: "assistente", testo: voce.risposta, voce, alternative: [] },
        ]);
        campoRef.current?.focus();
    };

    /** Scelto un argomento, l'assistente propone le domande di quella parte. */
    const apriArgomento = (sezione: Sezione) => {
        setMessaggi((prev) => [
            ...prev,
            { ruolo: "utente", testo: ARGOMENTI.find((a) => a.sezione === sezione)?.titolo ?? "" },
            {
                ruolo: "assistente",
                testo: `Su **${TITOLO_SEZIONE[sezione]}** le domande più frequenti sono queste:`,
                alternative: domandeDi(sezione, 5),
            },
        ]);
        campoRef.current?.focus();
    };

    const ricomincia = () => {
        setMessaggi([APERTURA]);
        setBozza("");
        campoRef.current?.focus();
    };

    const conversazioneIniziata = messaggi.length > 1;

    /* ------------------------------------------------------------------ vista */

    return (
        <>
            {/* Il pulsante sta a sinistra perché a destra c'è già l'invito
                all'iscrizione: due pastiglie nello stesso angolo si coprirebbero. */}
            <button
                ref={lanciatoreRef}
                onClick={() => setAperto((v) => !v)}
                aria-expanded={aperto}
                aria-controls="assistente-chat"
                aria-label={aperto ? "Chiudi l'assistente" : "Chiedi al regolamento"}
                className={cn(
                    "fixed bottom-5 left-5 z-[70] inline-flex items-center justify-center scatto",
                    "h-11 w-11 border-2 border-[color:var(--pece)]",
                    "bg-[color:var(--calce)] text-[color:var(--pece)]",
                    aperto && "md:opacity-0 md:pointer-events-none"
                )}
            >
                <MessagesSquare className="w-5 h-5" strokeWidth={2.4} />
                {daLeggere && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[color:var(--vermiglio)]" />}
            </button>

            {/* velo: solo su telefono, dove il foglio copre tutto */}
            {aperto && (
                <button
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setAperto(false)}
                    className="fixed inset-0 z-[71] bg-[color:var(--pece)]/85 backdrop-blur-sm md:hidden animate-fade-up"
                />
            )}

            {/* Reso solo quando serve: l'attributo `hidden` non basta, perche'
                la classe `flex` di Tailwind vince sul display:none del browser. */}
            {aperto && (
            <div
                id="assistente-chat"
                role="dialog"
                aria-modal="false"
                aria-label="Assistente del regolamento"
                className={cn(
                    "fixed z-[72] flex flex-col overflow-hidden text-[color:var(--calce)]",
                    // telefono: foglio dal basso
                    "inset-x-0 bottom-0 h-[85vh]",
                    // desktop: riquadro ancorato all'angolo del pulsante
                    "md:inset-auto md:left-5 md:bottom-5 md:h-[min(34rem,80vh)] md:w-[26rem]",
                    "border-2 border-[color:var(--calce)] bg-[color:var(--fondale)]",
                    "shadow-[0_-20px_60px_rgba(2,8,16,0.75)] md:shadow-[8px_8px_0_var(--vermiglio)]"
                )}
            >
                <header className="flex items-center gap-3 px-4 py-3 border-b-2 border-[color:var(--calce)] bg-[color:var(--vermiglio)] shrink-0">
                    <span className="w-9 h-9 flex items-center justify-center shrink-0 border-2 border-[color:var(--calce)]">
                        <MessagesSquare className="w-[18px] h-[18px] text-[color:var(--calce)]" strokeWidth={2.4} />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="stampino block text-[15px] leading-none text-[color:var(--calce)]">Chiedi al regolamento</span>
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--calce)]/65 leading-tight mt-1">
                            Risponde solo su regolamento e premi
                        </span>
                    </span>
                    {conversazioneIniziata && (
                        <button
                            onClick={ricomincia}
                            aria-label="Ricomincia la conversazione"
                            className="shrink-0 inline-flex items-center justify-center w-9 h-9 border-2 border-[color:var(--calce)]/50
                                       text-[color:var(--calce)]/70 hover:text-[color:var(--pece)] hover:bg-[color:var(--calce)] active:scale-95 transition-all"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setAperto(false);
                            lanciatoreRef.current?.focus();
                        }}
                        aria-label="Chiudi"
                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 border-2 border-[color:var(--calce)]/50
                                   text-[color:var(--calce)]/70 hover:text-[color:var(--pece)] hover:bg-[color:var(--calce)] active:scale-95 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </header>

                <div
                    ref={conversazioneRef}
                    className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3"
                    aria-live="polite"
                >
                    {messaggi.map((m, i) =>
                        m.ruolo === "utente" ? (
                            <p
                                key={i}
                                className="ml-auto max-w-[85%] w-fit border-2 border-[color:var(--lario)] bg-[color:var(--lario)]/15
                                           px-3.5 py-2 text-sm text-[color:var(--su-colore)]"
                            >
                                {m.testo}
                            </p>
                        ) : (
                            <div key={i} className="max-w-[92%] space-y-2">
                                <div className="w-fit border-2 border-[color:var(--filo)] bg-[color:var(--secca)] px-3.5 py-2.5 text-sm leading-relaxed text-[color:var(--calce)]/80">
                                    <Testo contenuto={m.testo} />
                                </div>

                                {m.argomenti && m.argomenti.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {m.argomenti.map((sez) => (
                                            <button
                                                key={sez}
                                                onClick={() => apriArgomento(sez)}
                                                className="border-2 border-[color:var(--lario)]/50 bg-[color:var(--lario)]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em]
                                                           text-[color:var(--lario)] hover:bg-[color:var(--lario)] hover:text-[color:var(--su-chiaro)] active:scale-95 transition-all text-left"
                                            >
                                                {ARGOMENTI.find((a) => a.sezione === sez)?.titolo}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {m.alternative.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {m.alternative.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => chiediVoce(v)}
                                                className="border-2 border-[color:var(--filo)] bg-[color:var(--fondale)] px-3 py-1.5 text-[11px] font-semibold
                                                           text-[color:var(--fumo)] hover:text-[color:var(--pece)] hover:bg-[color:var(--calce)] hover:border-[color:var(--calce)] active:scale-95 transition-all text-left"
                                            >
                                                {v.domanda}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {!conversazioneIniziata && (
                        <div className="flex flex-col gap-2 pt-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--fumo)]">
                                Per esempio
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                            {SUGGERIMENTI.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => chiediVoce(v)}
                                    className="border-2 border-[color:var(--filo)] bg-[color:var(--fondale)] px-3 py-1.5 text-[11px] font-semibold
                                               text-[color:var(--fumo)] hover:text-[color:var(--pece)] hover:bg-[color:var(--calce)] hover:border-[color:var(--calce)] active:scale-95 transition-all text-left"
                                >
                                    {v.domanda}
                                </button>
                            ))}
                            </div>
                            <span className="text-[11px] leading-relaxed text-[color:var(--fumo)]">
                                Oppure scrivimi la tua: se non capisco ti chiedo io.
                            </span>
                        </div>
                    )}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        rispondi(bozza);
                    }}
                    className="flex items-center gap-2 px-3 py-3 border-t-2 border-[color:var(--filo)] shrink-0
                               pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <input
                        ref={campoRef}
                        value={bozza}
                        onChange={(e) => setBozza(e.target.value)}
                        placeholder="Quanti difensori posso schierare?"
                        aria-label="Scrivi una domanda sul regolamento"
                        enterKeyHint="send"
                        className="flex-1 min-w-0 border-2 border-[color:var(--filo)] bg-[color:var(--pece)] px-4 min-h-[42px]
                                   text-sm text-[color:var(--calce)] placeholder:text-[color:var(--fumo)]/70 outline-none
                                   focus:border-[color:var(--lario)] transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!bozza.trim()}
                        aria-label="Invia la domanda"
                        className={cn(
                            "shrink-0 inline-flex items-center justify-center w-[42px] h-[42px] border-2 transition-all",
                            bozza.trim()
                                ? "bg-[color:var(--vermiglio)] border-[color:var(--vermiglio)] text-[color:var(--su-colore)] active:scale-95"
                                : "bg-transparent border-[color:var(--filo)] text-[color:var(--fumo)]/50 cursor-not-allowed"
                        )}
                    >
                        <SendHorizonal className="w-4 h-4" />
                    </button>
                </form>
            </div>
            )}
        </>
    );
}
