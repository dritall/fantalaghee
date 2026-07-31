"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { ISCRIZIONE_FORM_URL } from "@/lib/seasons";
import { cn } from "@/lib/utils";

/**
 * Invito all'iscrizione sempre a portata di pollice.
 *
 * Si ritrae mentre si scorre verso il basso — dove copriva l'angolo dei
 * contenuti — e riappare appena si risale o ci si ferma in cima.
 */
export function IscrivitiFab() {
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);

    useEffect(() => {
        lastY.current = window.scrollY;

        const onScroll = () => {
            const y = window.scrollY;
            const delta = y - lastY.current;

            // soglia piccola: evita che micro-scrolli lo facciano lampeggiare
            if (Math.abs(delta) > 6) {
                setHidden(delta > 0 && y > 220);
                lastY.current = y;
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <a
            href={ISCRIZIONE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Iscriviti alla Lega"
            className={cn(
                "group fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full pl-4 pr-5 py-3",
                "bg-gradient-to-r from-secondary to-cyan-500 text-white font-black uppercase tracking-wider text-xs",
                "shadow-[0_8px_30px_rgba(37,99,235,0.45)] border border-white/20",
                "hover:shadow-[0_10px_40px_rgba(34,211,238,0.55)] hover:scale-105",
                "transition-all duration-300 ease-out",
                hidden && "translate-y-24 opacity-0 pointer-events-none"
            )}
        >
            <span className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md -z-10 animate-pulse" />
            <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Iscriviti alla Lega</span>
            <span className="sm:hidden">Iscriviti</span>
        </a>
    );
}
