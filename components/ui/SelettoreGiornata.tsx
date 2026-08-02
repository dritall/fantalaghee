"use client";

/**
 * Selettore delle giornate, condiviso fra Classifica e Verdetto.
 *
 * È un <select> vero e non una lista di bottoni: con 38 giornate una fila di
 * pillole diventa un carosello da scorrere, mentre il menu nativo su telefono
 * apre la rotella di sistema, che è più veloce di qualsiasi cosa si possa
 * ridisegnare. Le giornate sono in ordine inverso perché quella che serve
 * quasi sempre è l'ultima.
 */

import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SelettoreGiornata({
    giornate,
    valore,
    onChange,
    etichettaGenerale,
    className,
}: {
    /** numeri di giornata disponibili, in qualsiasi ordine */
    giornate: number[];
    /** giornata scelta, oppure null per la voce generale */
    valore: number | null;
    onChange: (giornata: number | null) => void;
    /** testo della voce in cima: "Classifica generale", "Giornata attuale"… */
    etichettaGenerale?: string;
    className?: string;
}) {
    const ordinate = [...giornate].sort((a, b) => b - a);

    return (
        <label
            className={cn(
                "group relative inline-flex items-center gap-2 rounded-full border border-[color:var(--filo)]",
                "bg-[color:var(--velo-alto)] pl-3.5 pr-9 min-h-[42px] cursor-pointer",
                "hover:bg-[color:var(--velo-alto)] focus-within:border-[color:var(--lario)] transition-colors",
                className
            )}
        >
            <CalendarDays className="w-3.5 h-3.5 shrink-0 text-[color:var(--lario)]" />
            <span className="sr-only">Scegli la giornata</span>

            <select
                value={valore === null ? "" : String(valore)}
                onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                className="appearance-none bg-transparent outline-none cursor-pointer
                           text-xs font-black uppercase tracking-[0.12em] text-[color:var(--calce)]
                           py-2 pr-1 max-w-[13rem] truncate"
            >
                {etichettaGenerale && (
                    <option value="" className="bg-[color:var(--pece)] text-[color:var(--calce)]">
                        {etichettaGenerale}
                    </option>
                )}
                {ordinate.map((g) => (
                    <option key={g} value={g} className="bg-[color:var(--pece)] text-[color:var(--calce)]">
                        Giornata {g}
                    </option>
                ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3.5 w-4 h-4 text-[color:var(--fumo)] group-hover:text-[color:var(--calce)]/80 transition-colors" />
        </label>
    );
}
