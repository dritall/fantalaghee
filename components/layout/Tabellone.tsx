"use client";

/**
 * Il tabellone in fondo alla home.
 *
 * La fascia in alto scorre e dice cos'è la lega; questa sta ferma e dice
 * cosa è successo. Tre colonne che leggono le stesse API delle pagine —
 * quindi si aggiornano da sole giornata dopo giornata, senza che nessuno
 * debba scrivere niente:
 *
 *  · l'ultima giornata, dal foglio classifica
 *  · l'ultima uscita della Gazzetta
 *  · le cose da sapere del regolamento in vigore
 *
 * Quando un dato non c'è la colonna resta, con il suo stato d'attesa: un
 * tabellone con un buco è più onesto di un tabellone che sparisce.
 */

import { useEffect, useState } from "react";
import { CalendarDays, Newspaper, ScrollText, ArrowRight } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { cn } from "@/lib/utils";
import { toNumber, stripDecorations } from "@/lib/numbers";
import { PREMIO_GIORNATA_PRIMO, PREMIO_GIORNATA_SECONDO } from "@/lib/premi-2627";
import { punteggiDiGiornata, primoESecondo } from "@/lib/verdetto-storico";

type Piazzamento = { squadre: string[]; punteggio: string };
type Giornata = { numero: string; primo: Piazzamento; secondo: Piazzamento | null } | null;
type Uscita = { id: string; title: string; date?: string; imageUrl?: string } | null;

/** "A e B" con due squadre, "A, B e C" con tre o più — per i pari merito. */
function elencoSquadre(squadre: string[]): string {
    if (squadre.length <= 1) return squadre[0] ?? "";
    if (squadre.length === 2) return squadre.join(" e ");
    return `${squadre.slice(0, -1).join(", ")} e ${squadre[squadre.length - 1]}`;
}

function Colonna({
    icona: Icona,
    titolo,
    sfondo,
    children,
}: {
    icona: typeof CalendarDays;
    titolo: string;
    /** copertina da mettere dietro: la colonna passa in modalità scura */
    sfondo?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "relative flex flex-col gap-3 overflow-hidden rounded-[var(--ro-m)] border border-[color:var(--filo)] p-4",
                "shadow-[0_1px_2px_rgba(11,34,51,0.05),0_10px_26px_-14px_rgba(11,34,51,0.3)]",
                sfondo ? "bg-[#071A24]" : "bg-[color:var(--fondale)]"
            )}
        >
            {sfondo && (
                <>
                    <span
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${sfondo})` }}
                    />
                    {/* il velo tiene il titolo leggibile qualunque sia la copertina */}
                    <span className="absolute inset-0 bg-gradient-to-t from-[#071A24] via-[#071A24]/88 to-[#071A24]/55" />
                </>
            )}
            <span
                className={cn(
                    "relative flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]",
                    sfondo ? "text-[#8FB6C2]" : "text-[color:var(--fumo)]"
                )}
            >
                <Icona className="h-3.5 w-3.5" strokeWidth={2.4} />
                {titolo}
            </span>
            <div className="relative">{children}</div>
        </div>
    );
}

export function Tabellone() {
    const [giornata, setGiornata] = useState<Giornata>(null);
    const [uscita, setUscita] = useState<Uscita>(null);
    const [caricato, setCaricato] = useState(false);

    useEffect(() => {
        let vivo = true;

        fetch("/api/classifica")
            .then((r) => r.json())
            .then((j) => {
                if (!vivo) return;
                const righe: any[] = j?.classifica || [];
                if (righe.length === 0) return;

                // l'ultima colonna G con almeno un punteggio vero
                const colonne = Array.from(
                    new Set(righe.flatMap((r) => Object.keys(r).filter((k) => /^G\s*\d{1,2}$/i.test(k.trim()))))
                ).sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10));

                const ultima = colonne.reduce<string | null>((acc, g) => {
                    const giocata = righe.some((r) => {
                        const n = toNumber(r[g]);
                        return n !== null && n > 0;
                    });
                    return giocata ? g : acc;
                }, null);
                if (!ultima) return;

                const numeroGiornata = parseInt(ultima.replace(/\D/g, ""), 10);
                const piazzamenti = primoESecondo(punteggiDiGiornata(righe, numeroGiornata));
                if (!piazzamenti) return;

                setGiornata({
                    numero: String(numeroGiornata),
                    primo: {
                        squadre: piazzamenti.primo.squadre,
                        punteggio: stripDecorations(String(piazzamenti.primo.punteggio)),
                    },
                    secondo: piazzamenti.secondo && {
                        squadre: piazzamenti.secondo.squadre,
                        punteggio: stripDecorations(String(piazzamenti.secondo.punteggio)),
                    },
                });
            })
            .catch(() => null)
            .finally(() => vivo && setCaricato(true));

        fetch("/api/articles")
            .then((r) => r.json())
            .then((j) => {
                if (!vivo || !Array.isArray(j)) return;
                const primo = j.find((a: any) => !a.placeholder);
                if (primo) setUscita({ id: primo.id, title: primo.title, date: primo.date, imageUrl: primo.imageUrl });
            })
            .catch(() => null);

        return () => {
            vivo = false;
        };
    }, []);

    return (
        <section aria-label="Il punto sulla lega" className="grid gap-3 sm:grid-cols-3">
            {/* ------------------------------------------------ ultima giornata */}
            <Colonna icona={CalendarDays} titolo={giornata ? `Giornata ${giornata.numero}` : "Ultima giornata"}>
                {giornata ? (
                    <SeasonLink href="/verdetto" className="group flex flex-col gap-2.5">
                        <span className="flex flex-col gap-0.5">
                            <span className="numerone text-[28px] leading-none text-[color:var(--viola)]">{giornata.primo.punteggio}</span>
                            <span className="stampino text-[13px] leading-tight text-[color:var(--calce)]">
                                {elencoSquadre(giornata.primo.squadre)}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--viola)]">
                                {PREMIO_GIORNATA_PRIMO} 🍆 al 1°
                            </span>
                        </span>

                        {giornata.secondo && (
                            <span className="flex flex-col gap-0.5 border-t border-[color:var(--filo)] pt-2">
                                <span className="numerone text-[20px] leading-none text-[color:var(--lario)]">{giornata.secondo.punteggio}</span>
                                <span className="stampino text-[12px] leading-tight text-[color:var(--calce)]/85">
                                    {elencoSquadre(giornata.secondo.squadre)}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--lario)]">
                                    {PREMIO_GIORNATA_SECONDO} 🍆 al 2°
                                </span>
                            </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--fumo)]">
                            Tutti i verdetti
                            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                    </SeasonLink>
                ) : (
                    <p className="text-xs leading-relaxed text-[color:var(--fumo)]">
                        {caricato
                            ? "La prima giornata non è ancora stata giocata. Qui comparirà chi la vince."
                            : "…"}
                    </p>
                )}
            </Colonna>

            {/* -------------------------------------------------- ultima uscita */}
            <Colonna icona={Newspaper} titolo="Ultima uscita" sfondo={uscita?.imageUrl}>
                {uscita ? (
                    <SeasonLink href={`/gazzetta/${uscita.id}`} className="group flex flex-col gap-1.5">
                        <span className="stampino text-[15px] leading-[1.05] text-[#EDF2F1] line-clamp-3">
                            {uscita.title}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--vermiglio)]">
                            Leggi la Gazzetta
                            <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                    </SeasonLink>
                ) : (
                    <p className="text-xs leading-relaxed text-[color:var(--fumo)]">
                        La Gazzetta esce a ogni giornata. Il prossimo numero comparirà qui.
                    </p>
                )}
            </Colonna>

            {/* --------------------------------------------------- da sapere */}
            <Colonna icona={ScrollText} titolo="Da sapere">
                <ul className="flex flex-col gap-2 text-xs leading-relaxed text-[color:var(--fumo)]">
                    <li>
                        <strong className="text-[color:var(--calce)]">Novità 26/27:</strong> {PREMIO_GIORNATA_PRIMO} 🍆
                        al miglior punteggio di giornata, {PREMIO_GIORNATA_SECONDO} 🍆 al secondo.
                    </li>
                    <li>
                        <strong className="text-[color:var(--calce)]">Coppe:</strong> 4 gironi da 10,
                        tutte in Super Lega o UEFA. Poi scontro diretto.
                    </li>
                    <li>
                        <strong className="text-[color:var(--calce)]">Formazione:</strong> entro 15 minuti dal
                        primo anticipo, cambi solo nello stesso ruolo.
                    </li>
                </ul>
                <SeasonLink
                    href="/regolamento"
                    className="group mt-1 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--lario)]"
                >
                    Tutto il regolamento
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                </SeasonLink>
            </Colonna>
        </section>
    );
}
