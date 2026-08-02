"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronDown, History, Radio } from "lucide-react";
import { SEASONS, CURRENT_SEASON } from "@/lib/seasons";
import { cn } from "@/lib/utils";

export function SeasonSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const current = searchParams.get("stagione") || CURRENT_SEASON;
    const currentConfig = SEASONS[current] || SEASONS[CURRENT_SEASON];
    const isArchive = currentConfig.archived;

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKey);
        };
    }, []);

    function handleChange(slug: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (slug === CURRENT_SEASON) {
            params.delete("stagione");
        } else {
            params.set("stagione", slug);
        }
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
        setOpen(false);
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Stagione ${currentConfig.label}${isArchive ? " (archivio)" : ""}. Cambia stagione`}
                className={cn(
                    "group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] whitespace-nowrap",
                    "border backdrop-blur-md transition-colors duration-300",
                    isArchive
                        ? "bg-[color:var(--oro)] border-[color:var(--oro)] text-[color:var(--su-chiaro)]"
                        : "bg-[color:var(--fondale)] border-[color:var(--calce)]/35 text-[color:var(--calce)] hover:border-[color:var(--vermiglio)]"
                )}
            >
                {/* pallino di stato: pieno e pulsante sulla stagione in corso */}
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    {!isArchive && (
                        <span className="absolute inline-flex h-full w-full animate-ping bg-[color:var(--vermiglio)] opacity-60" />
                    )}
                    <span
                        className={cn(
                            "relative inline-flex h-1.5 w-1.5 rotate-45",
                            "bg-[color:var(--vermiglio)]"
                        )}
                    />
                </span>
                <span className="tabular-nums tracking-tight">{currentConfig.label}</span>
                <ChevronDown
                    className={cn("w-3.5 h-3.5 opacity-70 transition-transform duration-300", open && "rotate-180")}
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label="Stagioni"
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f1230]/95 backdrop-blur-xl border border-[color:var(--filo)] shadow-[0_20px_60px_rgba(4,6,20,0.7)] overflow-hidden z-50 animate-fade-up"
                >
                    <p className="px-4 pt-3 pb-2 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--fumo)]">
                        Stagione
                    </p>
                    {Object.values(SEASONS)
                        .slice()
                        .sort((a, b) => b.slug.localeCompare(a.slug))
                        .map((s) => {
                            const selected = current === s.slug;
                            return (
                                <button
                                    key={s.slug}
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => handleChange(s.slug)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                        selected ? "bg-[color:var(--velo-alto)]" : "hover:bg-[color:var(--velo)]"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
                                            s.archived
                                                ? "bg-[color:var(--oro)]/15 border-[color:var(--oro)]/40 text-[color:var(--oro)]"
                                                : "bg-[color:var(--lario)]/15 border-[color:var(--lario)]/40 text-[color:var(--lario)]"
                                        )}
                                    >
                                        {s.archived ? <History className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span
                                            className={cn(
                                                "block text-xs font-bold tabular-nums",
                                                selected ? "text-[color:var(--calce)]" : "text-[color:var(--calce)]/80"
                                            )}
                                        >
                                            {s.label}
                                        </span>
                                        <span className="block text-[10px] uppercase tracking-[0.14em] text-[color:var(--fumo)]">
                                            {s.archived ? "Archivio" : "In corso"}
                                        </span>
                                    </span>
                                    {selected && <Check className="w-4 h-4 text-[color:var(--lario)] shrink-0" />}
                                </button>
                            );
                        })}
                    <p className="px-4 py-2.5 text-[10px] leading-snug text-[color:var(--fumo)] border-t border-white/5">
                        La stagione scelta ti segue in tutte le sezioni del sito.
                    </p>
                </div>
            )}
        </div>
    );
}
