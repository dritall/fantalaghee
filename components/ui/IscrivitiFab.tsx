"use client";

import { UserPlus } from "lucide-react";
import { ISCRIZIONE_FORM_URL } from "@/lib/seasons";

export function IscrivitiFab() {
    return (
        <a
            href={ISCRIZIONE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full pl-4 pr-5 py-3
                       bg-gradient-to-r from-secondary to-cyan-500 text-white font-black uppercase tracking-wider text-xs
                       shadow-[0_8px_30px_rgba(37,99,235,0.45)] border border-white/20
                       hover:shadow-[0_10px_40px_rgba(34,211,238,0.55)] hover:scale-105 transition-all duration-300"
            aria-label="Iscriviti alla Lega"
        >
            <span className="absolute inset-0 rounded-full bg-cyan-400/40 blur-md -z-10 animate-pulse" />
            <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Iscriviti alla Lega</span>
            <span className="sm:hidden">Iscriviti</span>
        </a>
    );
}
