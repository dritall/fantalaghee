"use client";

import Image from "next/image";
import { Download, UserPlus, ArrowUp } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL, LEAGUE_TAGLINE } from "@/lib/seasons";

const links = [
    { name: "Classifica", href: "/classifica" },
    { name: "Il Verdetto", href: "/verdetto" },
    { name: "Risultati Serie A", href: "/risultati-serie-a" },
    { name: "La Gazzetta", href: "/gazzetta" },
    { name: "Regolamento", href: "/regolamento" },
];

export function Footer() {
    return (
        <footer className="relative z-10 mt-auto border-t border-white/10 bg-[#0b0824]/80 backdrop-blur-xl">
            <div className="h-[2px] w-full gradient-bar opacity-60" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">

                    {/* Marchio */}
                    <div className="flex items-start gap-3">
                        <SeasonLink href="/" aria-label="Fanta Laghèe — home" className="shrink-0">
                            <Image
                                src="/image/logo-mark.png"
                                alt="Fanta Laghèe"
                                width={319}
                                height={246}
                                className="object-contain h-10 w-auto opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </SeasonLink>
                        <div className="pl-3 border-l border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">{LEAGUE_TAGLINE}</p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/25">Lega privata · dal 2025</p>
                        </div>
                    </div>

                    {/* Sezioni */}
                    <nav aria-label="Sezioni" className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-x-6 gap-y-2">
                        {links.map((l) => (
                            <SeasonLink
                                key={l.href}
                                href={l.href}
                                className="text-xs font-semibold text-white/45 hover:text-cyan-300 transition-colors"
                            >
                                {l.name}
                            </SeasonLink>
                        ))}
                    </nav>

                    {/* Azioni */}
                    <div className="flex flex-col gap-2 md:items-end">
                        <a
                            href={ISCRIZIONE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-secondary to-cyan-500 px-4 py-2
                                       text-[11px] font-black uppercase tracking-wider text-white border border-white/15
                                       hover:brightness-110 transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            Iscriviti alla Lega
                        </a>
                        <a
                            href={REGOLAMENTO_PDF_URL}
                            download
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2
                                       text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Scarica Regolamento
                        </a>
                    </div>
                </div>

                <div className="mt-8 pt-5 border-t border-white/[0.07] flex items-center justify-between gap-4">
                    <p className="text-[11px] text-white/30 font-mono">© {new Date().getFullYear()} drbb</p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/35
                                   hover:text-white transition-colors"
                    >
                        Torna su
                        <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </footer>
    );
}
