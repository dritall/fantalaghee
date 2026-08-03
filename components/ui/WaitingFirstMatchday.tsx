"use client";

import { CalendarClock, Sparkles } from "lucide-react";
import { ISCRIZIONE_FORM_URL } from "@/lib/seasons";

export function WaitingFirstMatchday({ subtitle }: { subtitle?: string }) {
    return (
        <div className="relative rounded-[2rem] p-[1px] bg-gradient-to-b from-[color:var(--filo-alto)] to-[color:var(--filo)] overflow-hidden shadow-[0_12px_40px_var(--ombra)]">
            <div className="relative rounded-[calc(2rem-1px)] bg-[color:var(--fondale)]/80 backdrop-blur-xl px-6 py-16 flex flex-col items-center justify-center text-center gap-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--lario)]/10 via-transparent to-[color:var(--vermiglio)]/10 pointer-events-none" />
                <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center bg-[color:var(--velo-alto)] border border-[color:var(--filo-alto)] shadow-lg">
                    <CalendarClock className="w-9 h-9 text-[color:var(--lario)]" />
                    <Sparkles className="w-5 h-5 text-[color:var(--oro)] absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h3 className="relative z-10 font-oswald text-2xl md:text-3xl uppercase tracking-wide text-[color:var(--calce)]">
                    In attesa della prima giornata
                </h3>
                <p className="relative z-10 text-sm text-[color:var(--fumo)] font-serif italic max-w-md">
                    {subtitle || "Il campionato sta per iniziare: i dati appariranno qui dopo la prima giornata."}
                </p>
                <a
                    href={ISCRIZIONE_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider
                               bg-[color:var(--vermiglio)] text-[color:var(--su-colore)] border border-[color:var(--filo-alto)]
                               shadow-[0_8px_24px_var(--ombra)] hover:scale-105 transition-transform"
                >
                    Iscriviti alla Lega →
                </a>
            </div>
        </div>
    );
}
