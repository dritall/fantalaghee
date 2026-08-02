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
 * Non è più una card con bordo a gradiente e riflettore: è un cartello.
 * Bordo pieno, nessun angolo tondo, e in alto una banda del colore della
 * sezione — che al passaggio si allarga fino a riempire tutto il riquadro,
 * portando dentro il numero e l'icona. È l'unico movimento, e si vede.
 */
export function NavTile({ item, index }: { item: NavTileData; index: number }) {
    const Icon = item.icon;

    return (
        <SeasonLink
            href={item.href}
            className="group scatto relative block h-full overflow-hidden border-2 border-[color:var(--filo)]
                       bg-[color:var(--fondale)] focus:outline-none"
            style={{ animationDelay: `${index * 70}ms` }}
        >
            {/* la banda che si allarga: colore pieno, senza sfumature */}
            <span
                className="absolute inset-x-0 top-0 h-[6px] origin-top transition-transform duration-[420ms]
                           ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-[60] group-focus-visible:scale-y-[60]"
                style={{ backgroundColor: item.hex }}
                aria-hidden="true"
            />

            <span className="relative z-10 flex h-full flex-col p-4 pt-6">
                <span className="mb-5 flex items-start justify-between">
                    <Icon
                        className="h-7 w-7 text-[color:var(--calce)] transition-colors duration-300 group-hover:text-[color:var(--pece)]"
                        strokeWidth={2.2}
                    />
                    <span className="numerone text-[13px] text-[color:var(--fumo)] transition-colors duration-300 group-hover:text-[color:var(--pece)]/60">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                </span>

                <span className="mt-auto">
                    <span className="stampino block text-[15px] text-[color:var(--calce)] transition-colors duration-300 group-hover:text-[color:var(--pece)]">
                        {item.title}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-[color:var(--fumo)] transition-colors duration-300 group-hover:text-[color:var(--pece)]/75">
                        {item.desc}
                    </span>
                </span>

                <ArrowUpRight
                    className="mt-3 h-4 w-4 text-[color:var(--fumo)] transition-all duration-300
                               group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--pece)]"
                    strokeWidth={2.4}
                />
            </span>
        </SeasonLink>
    );
}
