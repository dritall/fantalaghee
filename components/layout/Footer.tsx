"use client";

/**
 * Piede del sito.
 *
 * Prima era una fila di link con due bottoni in fondo a destra: informazione
 * zero e un invito all'iscrizione che ripeteva quello già presente in ogni
 * pagina. Ora chiude il discorso — chi siamo, dove si gioca, con che numeri —
 * e tiene una sola chiamata all'azione, quella che conta.
 */

import { Marchio } from "@/components/ui/Marchio";
import { Download, UserPlus, ArrowUp } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL, LEAGUE_TAGLINE, SEASONS } from "@/lib/seasons";

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
        <footer className="relative z-10 mt-auto border-t-2 border-[color:var(--calce)]/25 bg-[color:var(--pece)]/92 backdrop-blur-xl">
            <div className="h-[6px] w-full bg-[color:var(--vermiglio)]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 sm:pb-10">

                <div className="grid gap-9 md:grid-cols-[1.4fr_1fr_1fr_auto]">

                    {/* Marchio e mezza riga su cosa è questo posto */}
                    <div className="flex flex-col gap-3.5">
                        <SeasonLink href="/" aria-label="Fanta Laghèe — home" className="w-fit">
                            <Marchio className="object-contain h-11 w-auto opacity-90 hover:opacity-100 transition-opacity" />
                        </SeasonLink>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[color:var(--calce)]/75">{LEAGUE_TAGLINE}</p>
                        <p className="text-xs leading-relaxed text-[color:var(--fumo)] max-w-[34ch]">
                            Lega privata di fantacalcio nata sul lago nel 2025. Si gioca su Fantaclub, si
                            conta in melanzane, si discute nel gruppo.
                        </p>
                    </div>

                    {sezioni.map((s) => (
                        <nav key={s.titolo} aria-label={s.titolo} className="flex flex-col gap-2.5">
                            <span className="timbro w-fit bg-[color:var(--calce)] text-[color:var(--pece)]">{s.titolo}</span>
                            {s.voci.map((l) => (
                                <SeasonLink
                                    key={l.href}
                                    href={l.href}
                                    className="text-[13px] font-bold text-[color:var(--calce)]/70 hover:text-[color:var(--vermiglio)] transition-colors w-fit"
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
                            className="scatto scatto-lario inline-flex items-center justify-center gap-2 border-2 border-[color:var(--vermiglio)] bg-[color:var(--vermiglio)]
                                       px-5 min-h-[44px] text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--su-colore)]"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            Iscriviti alla Lega
                        </a>
                        <a
                            href={REGOLAMENTO_PDF_URL}
                            download
                            className="inline-flex items-center justify-center gap-2 border-2 border-[color:var(--filo)] bg-transparent
                                       px-5 min-h-[44px] text-[11px] font-black uppercase tracking-[0.14em] text-[color:var(--calce)]/70
                                       hover:text-[color:var(--pece)] hover:bg-[color:var(--calce)] hover:border-[color:var(--calce)] active:scale-95 transition-all"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Regolamento PDF
                        </a>
                    </div>
                </div>

                <div className="mt-9 pt-5 border-t-2 border-[color:var(--filo)] flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="text-[11px] text-[color:var(--fumo)]/70 font-mono">
                        © {anno} drbb · stagioni {stagioni.join(" · ")}
                    </p>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--fumo)]
                                   hover:text-[color:var(--vermiglio)] transition-colors"
                    >
                        Torna su
                        <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </footer>
    );
}
