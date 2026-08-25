"use client";

/**
 * La fascia che scorre sotto la testata.
 *
 * È lo striscione portato a spalla lungo la curva: una banda di dati della
 * lega che passa in orizzontale. Serve a due cose — dare il tono al sito nel
 * primo mezzo secondo, e mettere in vista numeri che altrimenti stanno
 * sepolti in tre pagine diverse.
 *
 * Il contenuto è duplicato perché lo scorrimento è un `translateX(-50%)`:
 * quando la prima copia esce a sinistra la seconda è già al suo posto, e il
 * ciclo non ha giunte visibili.
 */

import { QUOTA, PREMIO_GIORNATA_PRIMO, PREMIO_GIORNATA_SECONDO } from "@/lib/premi-2627";
import { GIORNATE, SQUADRE_ISCRITTE } from "@/lib/seasons";

const VOCI: { forte: string; debole: string }[] = [
    { forte: `${PREMIO_GIORNATA_PRIMO} 🍆`, debole: "al 1° di giornata" },
    { forte: `${PREMIO_GIORNATA_SECONDO} 🍆`, debole: "al 2° di giornata" },
    { forte: "24", debole: "giocatori in rosa" },
    { forte: "600", debole: "fantamilioni di budget" },
    { forte: `${QUOTA} 🍆`, debole: "quota di stagione" },
    { forte: `${GIORNATE}`, debole: "giornate di campionato" },
    { forte: "112,5", debole: "il record da battere" },
    { forte: `${SQUADRE_ISCRITTE}`, debole: "squadre al via" },
    { forte: "Il Fantacalcio del Lario", debole: "dal 2025" },
];

function Serie({ ariaHidden }: { ariaHidden?: boolean }) {
    return (
        <div className="flex shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
            {VOCI.map((v, i) => (
                <span key={i} className="flex items-center gap-2.5 px-5 whitespace-nowrap">
                    <span className="numerone text-[13px] text-[color:var(--su-chiaro)]">{v.forte}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--su-chiaro)]/80">
                        {v.debole}
                    </span>
                    <span className="ml-3 h-1.5 w-1.5 rotate-45 bg-[color:var(--su-chiaro)]/40" />
                </span>
            ))}
        </div>
    );
}

export function FasciaScorre() {
    return (
        <div
            className="relative z-40 overflow-hidden border-y-2 border-[color:var(--pece)] bg-[color:var(--vermiglio)] py-1.5"
            role="complementary"
            aria-label="I numeri della lega"
        >
            <div className="fascia-scorre">
                <Serie />
                <Serie ariaHidden />
            </div>
        </div>
    );
}
