"use client";

/**
 * La fascia che scorre sotto la testata.
 *
 * Mix fisso (quota, rosa, premi di giornata) + flash della settimana:
 * record di *questa* stagione, ultima Gazzetta, pillole di regolamento.
 * Mai più il 112,5 del 25/26.
 */

import { useEffect, useState } from "react";
import {
    QUOTA,
    PREMIO_GIORNATA_PRIMO,
    PREMIO_GIORNATA_SECONDO,
    MONTEPREMI_NETTO,
} from "@/lib/premi-2627";
import { GIORNATE, SQUADRE_ISCRITTE, CURRENT_SEASON } from "@/lib/seasons";
import { formattaMigliaia } from "@/lib/numbers";

type Voce = { forte: string; debole: string };

const BASE: Voce[] = [
    { forte: `${PREMIO_GIORNATA_PRIMO} 🍆`, debole: "al 1° di giornata" },
    { forte: `${PREMIO_GIORNATA_SECONDO} 🍆`, debole: "al 2° di giornata" },
    { forte: "24", debole: "giocatori in rosa" },
    { forte: "600", debole: "fantamilioni di budget" },
    { forte: `${QUOTA} 🍆`, debole: "quota di stagione" },
    { forte: `${GIORNATE}`, debole: "giornate di campionato" },
    { forte: `${SQUADRE_ISCRITTE}`, debole: "squadre al via" },
];

const REGOLAMENTO: Voce[] = [
    { forte: `${formattaMigliaia(MONTEPREMI_NETTO)} 🍆`, debole: "montepremi 26/27, tutto ai partecipanti" },
    { forte: "4×10", debole: "gironi coppe: tutte in Super Lega o UEFA" },
    { forte: "G1–G8", debole: "il ranking decide i gironi" },
    { forte: "STOP", debole: "Colpo Proibito fuori dal regolamento" },
];

function itNum(n: string | number) {
    return String(n).replace(".", ",");
}

function Serie({ voci, ariaHidden }: { voci: Voce[]; ariaHidden?: boolean }) {
    return (
        <div className="flex shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
            {voci.map((v, i) => (
                <span key={`${v.forte}-${v.debole}-${i}`} className="flex items-center gap-2.5 px-5 whitespace-nowrap">
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
    const [flash, setFlash] = useState<Voce[]>([]);

    useEffect(() => {
        let vivo = true;
        (async () => {
            const extra: Voce[] = [];
            try {
                const [vRes, aRes] = await Promise.all([
                    fetch("/api/verdetto?stagione=2627"),
                    fetch("/api/articles"),
                ]);
                if (vRes.ok) {
                    const v = await vRes.json();
                    const rec = v?.recordAssoluto;
                    if (rec?.punteggio) {
                        extra.push({
                            forte: itNum(rec.punteggio),
                            debole: rec.squadra
                                ? `record 26/27 · ${rec.squadra}`
                                : "il record da battere",
                        });
                    }
                    if (v?.campioneDiGiornata && v?.numeroGiornata) {
                        extra.push({
                            forte: `G${v.numeroGiornata}`,
                            debole: `${v.campioneDiGiornata} vince la giornata`,
                        });
                    }
                }
                if (aRes.ok) {
                    const arts = await aRes.json();
                    if (Array.isArray(arts)) {
                        const news = arts
                            .filter((a: { placeholder?: boolean; stagione?: string }) =>
                                !a.placeholder && a.stagione === CURRENT_SEASON
                            )
                            .slice(0, 2);
                        for (const a of news) {
                            const titolo = String(a.title || "").replace(/^LA GAZZETTA[:\s]*/i, "");
                            extra.push({
                                forte: "📰",
                                debole: titolo.length > 72 ? `${titolo.slice(0, 70)}…` : titolo,
                            });
                        }
                    }
                }
            } catch {
                /* la fascia resta sui numeri fissi */
            }
            if (vivo) setFlash(extra);
        })();
        return () => {
            vivo = false;
        };
    }, []);

    const voci: Voce[] = [
        ...flash,
        ...BASE,
        ...REGOLAMENTO,
        { forte: "Il Fantacalcio del Lario", debole: "dal 2025" },
    ];

    return (
        <div
            className="relative z-40 overflow-hidden border-y-2 border-[color:var(--pece)] bg-[color:var(--vermiglio)] py-1.5"
            role="complementary"
            aria-label="I numeri della lega"
        >
            <div className="fascia-scorre">
                <Serie voci={voci} />
                <Serie voci={voci} ariaHidden />
            </div>
        </div>
    );
}
