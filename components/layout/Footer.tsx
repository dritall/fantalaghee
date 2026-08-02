"use client";

/**
 * Piede del sito.
 *
 * Prima era una fila di link con due bottoni in fondo a destra: informazione
 * zero e un invito all'iscrizione che ripeteva quello già presente in ogni
 * pagina. Ora chiude il discorso — chi siamo, dove si gioca, con che numeri —
 * e tiene una sola chiamata all'azione, quella che conta.
 */

import Image from "next/image";
import { Download, UserPlus, ArrowUp } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL, LEAGUE_TAGLINE, SEASONS } from "@/lib/seasons";
import { QUOTA, PREMIO_GIORNATA, GIORNATE } from "@/lib/premi-riferimento";

const sezioni = [
    { titolo: "La lega", voci: [
        { name: "Classifica", href: "/classifica" },
        { name: "Il Verdetto", href: "/verdetto" },
        { name: "Regolamento", href: "/regolamento" },
    ]},
    { titolo: "Da leggere", voci: [
        { name: "La Gazzetta", href: "/gazzetta" },
        { name: "Risultati Serie A", href: "/risultati-serie-a" },
    ]},
];

export function Footer() {
    const stagioni = Object.values(SEASONS).map((s) => s.label).sort();
    const anno = new Date().getFullYear();

    return (
        <footer className="relative z-10 mt-auto border-t border-white/10 bg-[#0d1730]/85 backdrop-blur-xl">
            <div className="h-[2px] w-full gradient-bar opacity-60" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* ===== TRE NUMERI =====
                    Il piede è l'ultima cosa che si guarda: che dica qualcosa
                    invece di ripetere il menu. */}
                <div className="grid grid-cols-3 gap-3 pb-8 mb-8 border-b border-white/[0.08]">
                    {[
                        { n: `${QUOTA} 🍆`, l: "Quota stagione" },
                        { n: `${PREMIO_GIORNATA} 🍆`, l: "Ogni giornata" },
                        { n: `${GIORNATE}`, l: "Giornate di gioco" },
                    ].map((x) => (
                        <div key={x.l} className="text-center sm:text-left">
                            <span className="block font-score text-xl sm:text-2xl font-black tabular-nums text-white leading-none">
                                {x.n}
                            </span>
                            <span className="block mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                                {x.l}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr_auto]">

                    {/* Marchio e mezza riga su cosa è questo posto */}
                    <div className="flex flex-col gap-3.5">
                        <SeasonLink href="/" aria-label="Fanta Laghèe — home" className="w-fit">
                            <Image
                                src="/image/logo-mark.png"
                                alt="Fanta Laghèe"
                                width={319}
                                height={246}
                                className="object-contain h-11 w-auto opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </SeasonLink>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{LEAGUE_TAGLINE}</p>
                        <p className="text-xs leading-relaxed text-white/35 max-w-[34ch]">
                            Lega privata di fantacalcio nata sul lago nel 2025. Si gioca su Fantaclub, si
                            conta in melanzane, si discute nel gruppo.
                        </p>
                    </div>

                    {sezioni.map((s) => (
                        <nav key={s.titolo} aria-label={s.titolo} className="flex flex-col gap-2.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">{s.titolo}</span>
                            {s.voci.map((l) => (
                                <SeasonLink
                                    key={l.href}
                                    href={l.href}
                                    className="text-[13px] font-semibold text-white/50 hover:text-cyan-300 transition-colors w-fit"
                                >
                                    {l.name}
                                </SeasonLink>
                            ))}
                        </nav>
                    ))}

                    {/* Una sola azione forte, il regolamento come seconda */}
                    <div className="flex flex-col gap-2.5 md:items-end">
                        <a
                            href={ISCRIZIONE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-secondary to-cyan-500
                                       px-5 min-h-[42px] text-[11px] font-black uppercase tracking-wider text-white border border-white/15
                                       hover:brightness-110 active:scale-95 transition-all"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            Iscriviti alla Lega
                        </a>
                        <a
                            href={REGOLAMENTO_PDF_URL}
                            download
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05]
                                       px-5 min-h-[42px] text-[11px] font-bold uppercase tracking-wider text-white/65
                                       hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Regolamento PDF
                        </a>
                    </div>
                </div>

                <div className="mt-9 pt-5 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="text-[11px] text-white/25 font-mono">
                        © {anno} drbb · stagioni {stagioni.join(" · ")}
                    </p>
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
