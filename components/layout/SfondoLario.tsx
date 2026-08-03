"use client";

/**
 * Lo sfondo del sito: una giornata sul lago, dipinta a strati.
 *
 * Non è una foto e non è un gradiente fermo. È il paesaggio scomposto in piani
 * — cielo, sole, tre creste di montagna sempre più vicine, la foschia che le
 * stacca, l'acqua con le sue onde e un riflesso di luce. Ogni piano si muove a
 * una velocità diversa quando si scorre (parallasse): è quello che dà la
 * profondità, la sensazione di guardare *dentro* e non *contro* lo sfondo.
 *
 * Le nuvole derivano lente per conto loro. Tutto è solo `transform`/`opacity`,
 * aggiornato in un unico rAF agganciato allo scroll, quindi resta fluido; e con
 * `prefers-reduced-motion` la parallasse e le derive si fermano.
 */

import { useEffect, useRef } from "react";

/* La scena: colori dell'illustrazione, non del testo. */
const CIELO: [string, string] = ["#E6F1F9", "#C3DDEE"];
const SOLE = "rgba(255, 246, 222, 0.55)";
const MONTE_LONTANO = "#9CC2AE"; // cresta velata dalla foschia
const MONTE_MEDIO = "#5F9E78";   // cresta di mezzo
const MONTE_VICINO = "#3C7B58";  // cresta in primo piano, verde pieno
const FOSCHIA = "#E6F1F9";       // il velo alla base dei monti
const ACQUA: [string, string, string] = ["#7DB0CF", "#5197BE", "#357FAA"];

/** Una pennellata d'acqua che si ripete due volte per scorrere senza giunte. */
function Onda({ colore, altezza, ritardo, durata, opacita }: {
    colore: string; altezza: number; ritardo: number; durata: number; opacita: number;
}) {
    const d = `M0,${altezza} C120,${altezza - 26} 260,${altezza + 22} 400,${altezza}
               C540,${altezza - 24} 660,${altezza + 20} 800,${altezza}
               C940,${altezza - 26} 1060,${altezza + 22} 1200,${altezza}
               C1340,${altezza - 24} 1460,${altezza + 20} 1600,${altezza}
               L1600,900 L0,900 Z`;
    return (
        <g style={{ animation: `onda ${durata}s linear ${ritardo}s infinite`, opacity: opacita }}>
            <path d={d} fill={colore} />
            <path d={d} fill={colore} transform="translate(1600,0)" />
        </g>
    );
}

/** Una nuvola: tre gobbe morbide, bianca e appena trasparente, che deriva. */
function Nuvola({ top, scala, durata, ritardo, opacita }: {
    top: string; scala: number; durata: number; ritardo: number; opacita: number;
}) {
    return (
        <span
            className="nuvola absolute left-0"
            style={{ top, opacity: opacita, animation: `deriva ${durata}s linear ${ritardo}s infinite`, willChange: "transform" }}
            aria-hidden="true"
        >
            <span className="block" style={{ transform: `scale(${scala})`, transformOrigin: "left center" }}>
                <svg width="200" height="76" viewBox="0 0 200 76" fill="none">
                    <g fill="#FFFFFF">
                        <ellipse cx="62" cy="48" rx="50" ry="26" />
                        <ellipse cx="112" cy="40" rx="42" ry="32" />
                        <ellipse cx="156" cy="50" rx="38" ry="24" />
                        <rect x="44" y="48" width="124" height="24" rx="12" />
                    </g>
                </svg>
            </span>
        </span>
    );
}

export function SfondoLario() {
    // Il tema è sempre chiaro: lo dichiariamo per chi calcola i colori (le
    // squadre) leggendo data-tema da <html>.
    useEffect(() => {
        document.documentElement.dataset.fascia = "giorno";
        document.documentElement.dataset.tema = "chiaro";
    }, []);

    // Parallasse: ogni piano ha un suo fattore. Aggiorniamo i transform in un
    // solo requestAnimationFrame agganciato allo scroll — mai lavoro nel
    // gestore stesso, così non si inchioda.
    const lontano = useRef<HTMLDivElement>(null);
    const medio = useRef<HTMLDivElement>(null);
    const vicino = useRef<HTMLDivElement>(null);
    const nuvole = useRef<HTMLDivElement>(null);
    const sole = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

        let raf = 0;
        const applica = () => {
            raf = 0;
            const y = window.scrollY || 0;
            // i monti salgono piano (più vicini = più veloci), le nuvole e il
            // sole scendono appena: è la parallasse che apre la profondità.
            if (lontano.current) lontano.current.style.transform = `translate3d(0, ${y * -0.03}px, 0)`;
            if (medio.current) medio.current.style.transform = `translate3d(0, ${y * -0.07}px, 0)`;
            if (vicino.current) vicino.current.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
            if (nuvole.current) nuvole.current.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
            if (sole.current) sole.current.style.transform = `translate3d(0, ${y * 0.05}px, 0)`;
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(applica); };

        applica();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div
            className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
            aria-hidden="true"
            style={{ background: `linear-gradient(180deg, ${CIELO[0]} 0%, ${CIELO[1]} 100%)` }}
        >
            {/* Il sole: un alone caldo e morbido, in alto a destra. */}
            <div
                ref={sole}
                className="absolute -top-[12vh] right-[8vw] h-[52vh] w-[52vh] rounded-full"
                style={{ background: `radial-gradient(circle, ${SOLE} 0%, transparent 68%)`, willChange: "transform" }}
            />

            {/* Le nuvole, sopra le montagne. */}
            <div ref={nuvole} className="absolute inset-x-0 top-0 h-[46vh] min-h-[240px]" style={{ willChange: "transform" }}>
                <Nuvola top="8%"  scala={1.15} durata={95}  ritardo={0}   opacita={0.92} />
                <Nuvola top="24%" scala={0.8}  durata={135} ritardo={-30} opacita={0.7} />
                <Nuvola top="15%" scala={1.45} durata={170} ritardo={-85} opacita={0.5} />
                <Nuvola top="36%" scala={0.62} durata={115} ritardo={-55} opacita={0.6} />
            </div>

            {/* Le montagne: tre creste, dalla più lontana e velata alla più
                vicina e piena. Ognuna nel suo strato per la parallasse. */}
            <div ref={lontano} className="absolute inset-x-0 bottom-0 h-[74vh] min-h-[420px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
                    <path fill={MONTE_LONTANO} opacity={0.75}
                        d="M0,300 L180,214 L360,286 L560,182 L760,270 L980,196 L1200,282 L1400,214 L1600,268 L1600,900 L0,900 Z" />
                </svg>
            </div>
            <div ref={medio} className="absolute inset-x-0 bottom-0 h-[70vh] min-h-[400px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
                    <path fill={MONTE_MEDIO} opacity={0.9}
                        d="M0,382 L200,300 L420,372 L640,268 L860,360 L1080,286 L1300,368 L1520,300 L1600,338 L1600,900 L0,900 Z" />
                </svg>
            </div>
            <div ref={vicino} className="absolute inset-x-0 bottom-0 h-[66vh] min-h-[380px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
                    <path fill={MONTE_VICINO}
                        d="M0,470 L240,372 L470,452 L700,336 L940,440 L1160,360 L1380,448 L1560,384 L1600,410 L1600,900 L0,900 Z" />
                </svg>
            </div>

            {/* La foschia: un velo chiaro alla base dei monti, dove incontrano
                l'acqua. È il tocco che dà l'aria umida del lago. */}
            <div
                className="absolute inset-x-0 bottom-[26vh] h-[22vh] min-h-[120px]"
                style={{ background: `linear-gradient(180deg, transparent 0%, ${FOSCHIA} 62%, ${FOSCHIA} 100%)`, opacity: 0.85 }}
            />

            {/* L'acqua e le sue onde. */}
            <div className="absolute inset-x-0 bottom-0 h-[30vh] min-h-[180px]">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
                    <rect x="0" y="600" width="1600" height="300" fill={ACQUA[0]} opacity={0.5} />
                    <Onda colore={ACQUA[0]} altezza={640} ritardo={0} durata={46} opacita={0.85} />
                    <Onda colore={ACQUA[1]} altezza={700} ritardo={-14} durata={34} opacita={0.85} />
                    <Onda colore={ACQUA[2]} altezza={770} ritardo={-7} durata={26} opacita={0.95} />
                </svg>
                {/* Riflesso di luce sull'acqua: una banda chiara che respira. */}
                <div
                    className="riflesso absolute inset-x-0 bottom-[6vh] h-[8vh]"
                    style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                />
            </div>

            {/* Grana di stampa: toglie le bande ai gradienti. */}
            <span
                className="absolute inset-0"
                style={{ opacity: 0.5, backgroundImage: "repeating-linear-gradient(0deg, rgba(120,120,120,0.05) 0 1px, transparent 1px 3px)" }}
            />

            <style jsx global>{`
                @keyframes onda { from { transform: translateX(0); } to { transform: translateX(-1600px); } }
                @keyframes deriva { from { transform: translateX(-240px); } to { transform: translateX(calc(100vw + 240px)); } }
                @keyframes respiro-luce { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
                .riflesso { animation: respiro-luce 9s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes onda { from, to { transform: translateX(0); } }
                    .nuvola { animation: none !important; }
                    .riflesso { animation: none !important; }
                }
            `}</style>
        </div>
    );
}
