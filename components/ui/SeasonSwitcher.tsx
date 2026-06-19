"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SEASONS, CURRENT_SEASON } from "@/lib/seasons";
import { cn } from "@/lib/utils";

export function SeasonSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const current = searchParams.get("stagione") || CURRENT_SEASON;

    function handleChange(slug: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (slug === CURRENT_SEASON) {
            params.delete("stagione");
        } else {
            params.set("stagione", slug);
        }
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
    }

    return (
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            {Object.values(SEASONS).map((s) => (
                <button
                    key={s.slug}
                    onClick={() => handleChange(s.slug)}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-colors whitespace-nowrap",
                        current === s.slug
                            ? "bg-primary text-black shadow-[0_0_10px_rgba(74,222,128,0.4)]"
                            : "text-muted-foreground hover:text-white"
                    )}
                >
                    {s.label} {s.archived ? "· Archivio" : "· In corso"}
                </button>
            ))}
        </div>
    );
}
