"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SEASONS, CURRENT_SEASON } from "@/lib/seasons";
import { cn } from "@/lib/utils";

export function SeasonSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const current = searchParams.get("stagione") || CURRENT_SEASON;
    const currentConfig = SEASONS[current] || SEASONS[CURRENT_SEASON];

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
                className="flex items-center gap-1 bg-black/5 border border-black/10 rounded-full pl-3 pr-2 py-1.5 text-xs font-semibold text-[#10241a] whitespace-nowrap hover:bg-black/10 transition-colors"
            >
                {currentConfig.label}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-black/10 shadow-xl overflow-hidden z-50">
                    {Object.values(SEASONS).map((s) => (
                        <button
                            key={s.slug}
                            onClick={() => handleChange(s.slug)}
                            className={cn(
                                "w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors",
                                current === s.slug ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-black/5 hover:text-[#10241a]"
                            )}
                        >
                            {s.label} <span className="opacity-60">· {s.archived ? "Archivio" : "In corso"}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
