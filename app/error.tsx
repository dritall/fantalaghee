"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";

/**
 * Rete di sicurezza per un errore non gestito in una pagina: senza questo
 * file Next mostra la sua schermata bianca di default, fuori tema e senza
 * via d'uscita se non ricaricare a mano.
 */
export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="min-h-screen flex items-center justify-center px-4 pt-16">
            <div className="glass-forte tondo-l relative w-full max-w-md overflow-hidden shadow-[0_16px_44px_-20px_rgba(11,34,51,0.45)]">
                <div className="relative px-6 py-14 flex flex-col items-center text-center gap-4">
                    <span className="flex h-16 w-16 items-center justify-center rounded-[var(--ro-m)] bg-[color:var(--velo-alto)] border border-[color:var(--filo-alto)]">
                        <AlertTriangle className="w-8 h-8 text-[color:var(--vermiglio)]" />
                    </span>
                    <h1 className="font-oswald text-2xl uppercase tracking-wide text-[color:var(--calce)]">
                        Qualcosa si è rotto
                    </h1>
                    <p className="text-sm text-[color:var(--fumo)] font-serif italic max-w-xs">
                        Non è colpa tua: il sito ha incontrato un errore imprevisto. Riprova, o torna alla home.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={reset}
                            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--vermiglio)] px-5 py-2.5
                                       text-[12px] font-black uppercase tracking-[0.14em] text-[color:var(--su-chiaro)]
                                       shadow-[0_10px_28px_var(--ombra)] transition-transform duration-300 hover:scale-[1.04]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Riprova
                        </button>
                        <SeasonLink
                            href="/"
                            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--filo-alto)] bg-[color:var(--fondale)]/70 px-5 py-2.5
                                       text-[12px] font-black uppercase tracking-[0.14em] text-[color:var(--calce)]/85 backdrop-blur-md transition-colors hover:bg-[color:var(--calce)] hover:text-[color:var(--pece)]"
                        >
                            <Home className="w-4 h-4" />
                            Torna alla home
                        </SeasonLink>
                    </div>
                </div>
            </div>
        </main>
    );
}
