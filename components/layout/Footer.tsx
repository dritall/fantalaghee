"use client";

/**
 * Piede del sito — compatto.
 *
 * Prima era una parete: marchio grande, paragrafo, due colonne di link e due
 * bottoni. Troppo, e poco leggibile sopra l'acqua. Ora è una fascia sottile in
 * vetro: marchio piccolo, i link essenziali su una riga, una sola azione, e la
 * riga dei crediti. Legge bene perché il vetro copre il lago sotto.
 */

import { Marchio } from "@/components/ui/Marchio";
import { ArrowUp } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { LEAGUE_TAGLINE } from "@/lib/seasons";

const link = [
    { name: "Classifica", href: "/classifica" },
    { name: "Verdetto", href: "/verdetto" },
    { name: "Serie A", href: "/risultati-serie-a" },
    { name: "Gazzetta", href: "/gazzetta" },
    { name: "Regolamento", href: "/regolamento" },
];

export function Footer() {
    const anno = new Date().getFullYear();

    return (
        <footer className="relative z-10 mt-auto">
            {/* filetto arancio: il segno del marchio */}
            <div className="h-1 w-full bg-[color:var(--vermiglio)]" />

            <div className="glass-forte">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-24 sm:pb-5">
                    {/* riga principale: marchio · link · azione */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <SeasonLink href="/" aria-label="Fanta Laghèe — home" className="shrink-0 w-fit">
                            <Marchio className="h-8 w-auto object-contain" />
                        </SeasonLink>

                        <nav aria-label="Sezioni" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:flex-1">
                            {link.map((l) => (
                                <SeasonLink
                                    key={l.href}
                                    href={l.href}
                                    className="text-[12px] font-bold uppercase tracking-wide text-[color:var(--calce)] hover:text-[color:var(--vermiglio-testo)] transition-colors"
                                >
                                    {l.name}
                                </SeasonLink>
                            ))}
                        </nav>
                    </div>

                    {/* riga crediti */}
                    <div className="mt-4 pt-3 border-t border-[color:var(--filo)] flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                        <p className="text-[11px] text-[color:var(--fumo)]">
                            © {anno} Fanta Laghèe · {LEAGUE_TAGLINE} · lega privata dal 2025
                        </p>
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--fumo)] hover:text-[color:var(--calce)] transition-colors"
                        >
                            Torna su
                            <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
