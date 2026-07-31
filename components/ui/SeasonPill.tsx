"use client";

import { SEASONS, CURRENT_SEASON } from "@/lib/seasons";
import { cn } from "@/lib/utils";

/**
 * Etichetta della stagione mostrata in testa alle pagine: ribadisce, sotto al
 * titolo, quale annata si sta guardando — lo stesso codice colore del
 * selettore in alto a destra (ciano = in corso, ambra = archivio).
 */
export function SeasonPill({ stagione, className }: { stagione: string; className?: string }) {
    const season = SEASONS[stagione] || SEASONS[CURRENT_SEASON];
    const archived = season.archived;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em]",
                archived
                    ? "bg-amber-400/10 border-amber-300/25 text-amber-200"
                    : "bg-cyan-400/10 border-cyan-300/25 text-cyan-200",
                className
            )}
        >
            <span className="relative flex h-1.5 w-1.5">
                {!archived && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
                )}
                <span
                    className={cn(
                        "relative inline-flex h-1.5 w-1.5 rounded-full",
                        archived ? "bg-amber-300" : "bg-cyan-300"
                    )}
                />
            </span>
            Stagione {season.label}
            {archived && <span className="opacity-60">· Archivio</span>}
        </span>
    );
}
