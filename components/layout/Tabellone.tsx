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
import { PREMIO_GIORNATA } from "@/lib/premi-riferimento";

type Giornata = { numero: string; vincitore: string; punteggio: string } | null;
type Uscita = { id: string; title: string; date?: string; imageUrl?: string } | null;

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
                "relative flex flex-col gap-3 overflow-hidden border-2 border-[color:var(--filo)] p-4",
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

                const migliore = righe
                    .map((r) => ({ squadra: String(r.Team ?? ""), punti: toNumber(r[ultima]) }))
                    .filter((x) => x.squadra && x.punti !== null)
                    .sort((a, b) => (b.punti as number) - (a.punti as number))[0];
                if (!migliore) return;

                setGiornata({
                    numero: ultima.replace(/\D/g, ""),
                    vincitore: migliore.squadra,
                    punteggio: stripDecorations(String(migliore.punti)),
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
                    <SeasonLink href="/verdetto" className="group flex flex-col gap-1">
                        <span className="numerone text-[32px] text-[color:var(--viola)]">{giornata.punteggio}</span>
                        <span className="stampino text-[13px] leading-tight text-[color:var(--calce)]">
                            {giornata.vincitore}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--lario)]">
                            {PREMIO_GIORNATA} 🍆 al primo
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
                        <strong className="text-[color:var(--calce)]">Novità 26/27:</strong> premia anche il
                        secondo miglior punteggio di giornata.
                    </li>
                    <li>
                        <strong className="text-[color:var(--calce)]">Coppe:</strong> scontro diretto, il
                        punteggio diventa gol secondo le soglie.
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
