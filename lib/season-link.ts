"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CURRENT_SEASON, SEASONS, type SeasonConfig } from "@/lib/seasons";

/**
 * La stagione attualmente in vista, letta dalla query string.
 * Se il parametro manca (o non è valido) si ricade sulla stagione in corso.
 */
export function useSeason(): SeasonConfig {
    const searchParams = useSearchParams();
    const slug = searchParams.get("stagione");
    return (slug && SEASONS[slug]) || SEASONS[CURRENT_SEASON];
}

/**
 * Aggiunge `?stagione=` a un link interno quando si sta guardando una
 * stagione diversa da quella in corso: così la scelta fatta in alto a destra
 * non si perde passando da una sezione all'altra.
 *
 * Ritorna una funzione perché serve applicarla a più link nello stesso
 * componente (menu, card della home, footer).
 */
export function useSeasonHref(): (href: string) => string {
    const season = useSeason();

    return useCallback(
        (href: string) => {
            if (season.slug === CURRENT_SEASON) return href;
            if (!href.startsWith("/")) return href;
            const [path, hash] = href.split("#");
            const sep = path.includes("?") ? "&" : "?";
            return `${path}${sep}stagione=${season.slug}${hash ? `#${hash}` : ""}`;
        },
        [season.slug]
    );
}
