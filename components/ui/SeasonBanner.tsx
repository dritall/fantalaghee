"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, ArrowRight } from "lucide-react";
import { useSeason } from "@/lib/season-link";
import { SEASONS, CURRENT_SEASON } from "@/lib/seasons";

function SeasonBannerInner() {
    const season = useSeason();
    const pathname = usePathname();

    // In stagione corrente non c'è niente da segnalare.
    if (season.slug === CURRENT_SEASON) return null;

    return (
        <div
            className="flex items-center gap-3 rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] px-4 py-3
                       text-amber-100 backdrop-blur-md animate-fade-up"
            role="status"
        >
            <span className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shrink-0">
                <History className="w-4 h-4 text-amber-300" />
            </span>
            <p className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
                Stai consultando l&apos;archivio della stagione{" "}
                <span className="tabular-nums font-black">{season.label}</span>.
            </p>
            <Link
                href={pathname}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-300/30
                           px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-100
                           hover:bg-amber-400/25 transition-colors"
            >
                Torna al {SEASONS[CURRENT_SEASON].label}
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}

/** Avviso che compare solo quando si sta navigando una stagione archiviata. */
export function SeasonBanner() {
    return (
        <Suspense fallback={null}>
            <SeasonBannerInner />
        </Suspense>
    );
}
