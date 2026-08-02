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
                "group scatto scatto-lario fixed bottom-5 right-5 z-[60] flex items-center gap-2 px-4 h-[50px]",
                "border-2 border-[color:var(--pece)] bg-[color:var(--vermiglio)]",
                "text-[color:var(--calce)] font-black uppercase tracking-[0.16em] text-[11px]",
                "transition-all duration-300 ease-out",
                hidden && "translate-y-24 opacity-0 pointer-events-none"
            )}
        >
            <UserPlus className="w-4 h-4" strokeWidth={2.4} />
            <span className="hidden sm:inline">Iscriviti alla Lega</span>
            <span className="sm:hidden">Iscriviti</span>
        </a>
    );
}
