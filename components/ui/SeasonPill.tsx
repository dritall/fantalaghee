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
                "timbro",
                archived
                    ? "bg-[color:var(--oro)] text-[color:var(--su-chiaro)]"
                    : "bg-[color:var(--lario)] text-[color:var(--su-colore)]",
                className
            )}
        >
            <span className={cn("h-1.5 w-1.5 rotate-45", archived ? "bg-[color:var(--su-chiaro)]" : "bg-[color:var(--su-colore)]")} />
            Stagione {season.label}
            {archived && <span className="opacity-60">· Archivio</span>}
        </span>
    );
}
