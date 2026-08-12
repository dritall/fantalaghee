"use client";

import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";

export type NavTileData = {
    href: string;
    icon: LucideIcon;
    title: string;
    desc: string;
    /** colore d'accento della sezione: una variabile del sistema */
    hex: string;
};

/**
 * Riquadro di navigazione della home.
 *
 * Era un cartello: spigolo vivo, bordo da 2px e una banda di colore che al
 * passaggio si allargava di sessanta volte fino ad annerire tutta la
 * casella. Il salto era violento e obbligava a ribaltare il colore di ogni
 * testo per restare leggibile.
 *
 * Adesso il colore della sezione resta un accento: un chip tondo dietro
 * l'icona, un filetto in alto che si allarga da sinistra a destra come una
 * sottolineatura, e una velatura tenue che sale dal basso. Il testo non
 * cambia mai colore — cambia solo il piano su cui sta.
 */
export function NavTile({ item, index }: { item: NavTileData; index: number }) {
    const Icon = item.icon;

    return (
        <SeasonLink
            href={item.href}
            className="scheda group scatto relative block h-full overflow-hidden focus:outline-none"
            style={{
                animationDelay: `${index * 70}ms`,
                // il contorno che si accende in hover prende il colore della sezione
                "--scatto-tinta": item.hex,
            } as React.CSSProperties}
        >
            {/* il filetto in alto: si allarga da sinistra, non si gonfia */}
            <span
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.22] transition-transform
                           duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                           group-hover:scale-x-100 group-focus-visible:scale-x-100"
                style={{ backgroundColor: item.hex }}
                aria-hidden="true"
            />
            {/* la velatura che sale: appena un fiato del colore della sezione */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 opacity-0 transition-opacity
                           duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                    background: `linear-gradient(0deg, color-mix(in srgb, ${item.hex} 12%, transparent), transparent)`,
                }}
            />

            <span className="relative z-10 flex h-full flex-col p-4 pt-5">
                <span className="mb-5 flex items-start justify-between">
                    <span
                        className="flex h-11 w-11 items-center justify-center rounded-[var(--ro-s)] transition-transform
                                   duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-6 group-hover:scale-110"
                        style={{ background: `color-mix(in srgb, ${item.hex} 11%, transparent)` }}
                    >
                        <Icon className="h-6 w-6" strokeWidth={2.2} style={{ color: item.hex }} />
                    </span>
                    <span className="numerone text-[13px] text-[color:var(--fumo)]/70">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                </span>

                <span className="mt-auto">
                    <span className="stampino block text-[15px] text-[color:var(--calce)]">
                        {item.title}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-[color:var(--fumo)]">
                        {item.desc}
                    </span>
                </span>

                <ArrowUpRight
                    className="mt-3 h-4 w-4 text-[color:var(--fumo)] transition-all duration-300
                               group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2.4}
                />
            </span>
        </SeasonLink>
    );
}
