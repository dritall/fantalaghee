"use client";

import { CalendarClock, Sparkles } from "lucide-react";

export function WaitingFirstMatchday({ title, subtitle }: { title?: string; subtitle?: string }) {
    return (
        // Stava su un vetro all'80%: sopra al lago diventava una lastra grigia
        // e il paesaggio ci passava attraverso sporcando il testo. Adesso è una
        // scheda piena, con il vetro solo come velo esterno.
        <div className="glass-forte tondo-l relative overflow-hidden shadow-[0_16px_44px_-20px_rgba(11,34,51,0.45)]">
            <div className="relative px-6 py-16 flex flex-col items-center justify-center text-center gap-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--lario)]/10 via-transparent to-[color:var(--vermiglio)]/10 pointer-events-none" />
                <div className="relative z-10 w-20 h-20 rounded-[var(--ro-m)] flex items-center justify-center bg-[color:var(--velo-alto)] border border-[color:var(--filo-alto)]">
                    <CalendarClock className="w-9 h-9 text-[color:var(--lario)]" />
                    <Sparkles className="w-5 h-5 text-[color:var(--viola)] absolute -top-2 -right-2 animate-pulse" />
                </div>
                <h3 className="relative z-10 font-oswald text-2xl md:text-3xl uppercase tracking-wide text-[color:var(--calce)]">
                    {title || "In attesa della prima giornata"}
                </h3>
                <p className="relative z-10 text-sm text-[color:var(--fumo)] font-serif italic max-w-md">
                    {subtitle || "Il campionato sta per iniziare: i dati appariranno qui dopo la prima giornata."}
                </p>
            </div>
        </div>
    );
}
