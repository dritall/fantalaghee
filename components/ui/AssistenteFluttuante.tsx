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
    type Risultato,
    type VoceKB,
} from "@/lib/regolamento-kb";

type Messaggio =
    | { ruolo: "utente"; testo: string }
    | { ruolo: "assistente"; testo: string; voce?: VoceKB; alternative: VoceKB[] };

/** Rende il **grassetto** senza tirare dentro un parser markdown. */
function Testo({ contenuto }: { contenuto: string }) {
    return (
        <>
            {contenuto.split("\n").map((riga, r) => (
                <span key={r} className="block [&+&]:mt-1.5">
                    {riga.split(/(\*\*[^*]+\*\*)/g).map((pezzo, i) =>
                        pezzo.startsWith("**") && pezzo.endsWith("**") ? (
                            <strong key={i} className="font-black text-white">
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

        const risposta: Messaggio = abbastanzaSicuro(migliore)
            ? {
                  ruolo: "assistente",
                  testo: migliore.voce.risposta,
                  voce: migliore.voce,
                  alternative: trovate.slice(1).map((r) => r.voce),
              }
            : {
                  ruolo: "assistente",
                  testo:
                      trovate.length > 0
                          ? "Non ho una risposta sicura per questa. Forse cercavi una di queste:"
                          : "Questa non la so: rispondo solo su quello che c'è nel regolamento. Prova con quota, rosa, formazione, bonus, coppe o premi.",
                  alternative: trovate.map((r) => r.voce),
              };

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
                    "fixed bottom-5 left-5 z-[70] inline-flex items-center gap-2 rounded-full",
                    "h-[52px] pl-4 pr-5 border border-white/15 backdrop-blur-md",
                    "bg-[#16223f]/90 text-white shadow-[0_8px_30px_rgba(4,10,28,0.55)]",
                    "hover:bg-[#1c2b50]/95 hover:border-white/25 active:scale-95 transition-all duration-300",
                    aperto && "md:opacity-0 md:pointer-events-none"
                )}
            >
                <MessagesSquare className="w-[18px] h-[18px] text-cyan-300 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-[0.14em]">Chiedi</span>
                {daLeggere && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />}
            </button>

            {/* velo: solo su telefono, dove il foglio copre tutto */}
            {aperto && (
                <button
                    aria-hidden="true"
                    tabIndex={-1}
                    onClick={() => setAperto(false)}
                    className="fixed inset-0 z-[71] bg-[#04060f]/70 backdrop-blur-sm md:hidden animate-fade-up"
                />
            )}

            <div
                id="assistente-chat"
                role="dialog"
                aria-modal="false"
                aria-label="Assistente del regolamento"
                hidden={!aperto}
                className={cn(
                    "fixed z-[72] flex flex-col overflow-hidden text-white",
                    // telefono: foglio dal basso
                    "inset-x-0 bottom-0 h-[85vh] rounded-t-[1.75rem]",
                    // desktop: riquadro ancorato all'angolo del pulsante
                    "md:inset-auto md:left-5 md:bottom-5 md:h-[min(34rem,80vh)] md:w-[26rem] md:rounded-[1.5rem]",
                    "border border-white/12 bg-[#101a33]/95 backdrop-blur-2xl",
                    "shadow-[0_-20px_60px_rgba(4,8,22,0.7)] md:shadow-[0_24px_70px_rgba(4,8,22,0.7)]"
                )}
            >
                <header className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.09] shrink-0">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-cyan-400/30 bg-cyan-400/10">
                        <MessagesSquare className="w-[18px] h-[18px] text-cyan-300" strokeWidth={2.2} />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-sm font-black leading-tight">Chiedi al regolamento</span>
                        <span className="block text-[11px] text-white/40 leading-tight mt-0.5">
                            Risponde solo su regolamento e premi
                        </span>
                    </span>
                    {conversazioneIniziata && (
                        <button
                            onClick={ricomincia}
                            aria-label="Ricomincia la conversazione"
                            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10
                                       bg-white/[0.05] text-white/45 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
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
                        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10
                                   bg-white/[0.05] text-white/45 hover:text-white hover:bg-red-500 hover:border-red-500 active:scale-95 transition-all"
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
                                className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-br-md bg-secondary/30 border border-secondary/35
                                           px-3.5 py-2 text-sm"
                            >
                                {m.testo}
                            </p>
                        ) : (
                            <div key={i} className="max-w-[92%] space-y-2">
                                <div className="w-fit rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm leading-relaxed text-white/75">
                                    <Testo contenuto={m.testo} />
                                </div>

                                {m.alternative.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {m.alternative.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => chiediVoce(v)}
                                                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold
                                                           text-white/55 hover:text-white hover:bg-white/[0.10] active:scale-95 transition-all text-left"
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
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {SUGGERIMENTI.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => chiediVoce(v)}
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold
                                               text-white/55 hover:text-white hover:bg-white/[0.10] active:scale-95 transition-all text-left"
                                >
                                    {v.domanda}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        rispondi(bozza);
                    }}
                    className="flex items-center gap-2 px-3 py-3 border-t border-white/[0.09] shrink-0
                               pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <input
                        ref={campoRef}
                        value={bozza}
                        onChange={(e) => setBozza(e.target.value)}
                        placeholder="Quanti difensori posso schierare?"
                        aria-label="Scrivi una domanda sul regolamento"
                        enterKeyHint="send"
                        className="flex-1 min-w-0 rounded-full border border-white/10 bg-white/[0.06] px-4 min-h-[42px]
                                   text-sm text-white placeholder:text-white/25 outline-none
                                   focus:border-cyan-400/45 focus:bg-white/[0.10] transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!bozza.trim()}
                        aria-label="Invia la domanda"
                        className={cn(
                            "shrink-0 inline-flex items-center justify-center w-[42px] h-[42px] rounded-full transition-all",
                            bozza.trim()
                                ? "bg-gradient-to-r from-secondary to-cyan-500 text-white active:scale-95"
                                : "bg-white/[0.05] text-white/20 cursor-not-allowed"
                        )}
                    >
                        <SendHorizonal className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </>
    );
}
