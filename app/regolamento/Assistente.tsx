"use client";

/**
 * Assistente del regolamento.
 *
 * Fa due mestieri con un solo campo di testo: cerca nel regolamento e
 * risponde a domande scritte a parole proprie. Le risposte arrivano dalla
 * base di conoscenza in lib/regolamento-kb.ts — nessun modello, nessuna
 * chiamata di rete — quindi quando non sa una cosa lo dice invece di
 * inventarla.
 */

import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, SendHorizonal, RotateCcw, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    cerca,
    abbastanzaSicuro,
    SUGGERIMENTI,
    type Risultato,
    type Sezione,
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
                            <strong key={i} className="font-black text-[color:var(--carta-forte)]">
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
        "Ciao. Rispondo a domande sul **regolamento della Fanta Laghèe**: quota, rosa, formazione, bonus e malus, coppe, premi, rinvii.\nPer tutto il resto — mercato, consigli sui giocatori, questioni di lega — meglio il gruppo WhatsApp.",
    alternative: [],
};

export function Assistente({ onVaiAlla }: { onVaiAlla?: (sezione: Sezione) => void }) {
    const [messaggi, setMessaggi] = useState<Messaggio[]>([APERTURA]);
    const [bozza, setBozza] = useState("");
    const conversazioneRef = useRef<HTMLDivElement>(null);
    const campoRef = useRef<HTMLInputElement>(null);

    // La conversazione cresce verso il basso: dopo ogni risposta si scorre
    // solo il riquadro, mai la pagina.
    useEffect(() => {
        const box = conversazioneRef.current;
        if (box) box.scrollTop = box.scrollHeight;
    }, [messaggi]);

    const rispondi = (domanda: string) => {
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
                          : "Questa non la so: rispondo solo su quello che c'è nel regolamento. Prova a chiedere di quota, rosa, formazione, bonus, coppe o premi.",
                  alternative: trovate.map((r) => r.voce),
              };

        setMessaggi((prev) => [...prev, { ruolo: "utente", testo }, risposta]);
        setBozza("");
    };

    const invia = (e: React.FormEvent) => {
        e.preventDefault();
        rispondi(bozza);
    };

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

    return (
        <section className="rounded-2xl overflow-hidden border border-[color:var(--carta-forte)]/18 bg-[color:var(--carta-velo)]" aria-label="Assistente del regolamento">
            <header className="flex items-center gap-3 px-4 md:px-5 py-3.5 border-b border-[color:var(--carta-filo)]">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#0E5C69]/30 bg-[#0E5C69]/[0.08]">
                    <MessageCircleQuestion className="w-[18px] h-[18px] text-[#0E5C69]" strokeWidth={2.2} />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-black text-[color:var(--carta-forte)] leading-tight">Chiedi al regolamento</span>
                    <span className="block text-[11px] text-[color:var(--carta-tenue)] leading-tight mt-0.5">
                        Risponde solo su regolamento e premi
                    </span>
                </span>
                {conversazioneIniziata && (
                    <button
                        onClick={ricomincia}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--carta-filo)] bg-[color:var(--carta-velo)]
                                   px-3 min-h-[34px] text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--carta-tenue)]
                                   hover:text-[color:var(--carta-forte)] hover:bg-[color:var(--carta-forte)]/[0.07] active:scale-95 transition-all"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Ricomincia</span>
                    </button>
                )}
            </header>

            <div
                ref={conversazioneRef}
                className="max-h-[22rem] overflow-y-auto custom-scrollbar px-4 md:px-5 py-4 space-y-3"
                aria-live="polite"
            >
                {messaggi.map((m, i) =>
                    m.ruolo === "utente" ? (
                        <p
                            key={i}
                            className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-br-md bg-[#0E5C69] border border-[#0E5C69]
                                       px-3.5 py-2 text-sm text-[#F3EADE]"
                        >
                            {m.testo}
                        </p>
                    ) : (
                        <div key={i} className="max-w-[92%] space-y-2">
                            <div className="w-fit rounded-2xl rounded-bl-md border border-[color:var(--carta-filo)] bg-[#FBF6EF] px-3.5 py-2.5 text-sm leading-relaxed text-[color:var(--carta-corpo)]">
                                <Testo contenuto={m.testo} />
                            </div>

                            {m.voce && m.voce.sezione !== "sito" && onVaiAlla && (
                                <button
                                    onClick={() => onVaiAlla(m.voce!.sezione)}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--carta-lario)] hover:text-[#0A454F] transition-colors"
                                >
                                    <CornerDownRight className="w-3 h-3" />
                                    Apri la sezione del regolamento
                                </button>
                            )}

                            {m.alternative.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {m.alternative.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => chiediVoce(v)}
                                            className="rounded-full border border-[color:var(--carta-filo)] bg-[#FBF6EF] px-3 py-1.5 text-[11px] font-semibold
                                                       text-[color:var(--carta-corpo)] hover:text-[color:var(--carta-forte)] hover:bg-[color:var(--carta-forte)]/[0.07] active:scale-95 transition-all text-left"
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
                                className="rounded-full border border-[color:var(--carta-filo)] bg-[#FBF6EF] px-3 py-1.5 text-[11px] font-semibold
                                           text-[color:var(--carta-corpo)] hover:text-[color:var(--carta-forte)] hover:bg-[color:var(--carta-forte)]/[0.07] active:scale-95 transition-all text-left"
                            >
                                {v.domanda}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={invia} className="flex items-center gap-2 px-3 md:px-4 py-3 border-t border-[color:var(--carta-filo)]">
                <input
                    ref={campoRef}
                    value={bozza}
                    onChange={(e) => setBozza(e.target.value)}
                    placeholder="Quanti difensori posso schierare?"
                    aria-label="Scrivi una domanda sul regolamento"
                    enterKeyHint="send"
                    className="flex-1 min-w-0 rounded-full border border-[color:var(--carta-filo)] bg-[#FBF6EF] px-4 min-h-[42px]
                               text-sm text-[color:var(--carta-forte)] placeholder:text-[color:var(--carta-tenue)] outline-none
                               focus:border-[#0E5C69]/45 focus:bg-white transition-colors"
                />
                <button
                    type="submit"
                    disabled={!bozza.trim()}
                    aria-label="Invia la domanda"
                    className={cn(
                        "shrink-0 inline-flex items-center justify-center w-[42px] h-[42px] rounded-full transition-all",
                        bozza.trim()
                            ? "bg-[#0E5C69] text-[#F3EADE] active:scale-95"
                            : "bg-[color:var(--carta-forte)]/[0.07] text-[color:var(--carta-tenue)] cursor-not-allowed"
                    )}
                >
                    <SendHorizonal className="w-4 h-4" />
                </button>
            </form>
        </section>
    );
}
