"use client";

/**
 * Lo sfondo del sito: una giornata sul lago, dipinta a strati.
 *
 * Non è una foto e non è un gradiente fermo. È il paesaggio scomposto in piani
 * — cielo, sole, uccelli, tre creste di montagna sempre più vicine con la loro
 * pineta, la foschia che le stacca, l'acqua con le onde, il riflesso delle
 * montagne e una banda di luce. Ogni piano si muove a una velocità diversa
 * quando si scorre (parallasse): è quello che dà la profondità.
 *
 * Perché le punte non vengano mai tagliate sul desktop largo, i monti sono
 * disegnati in una viewBox panoramica (più larga che alta) e riempiono
 * l'altezza: così a schermo largo si taglia ai lati, non in cima.
 *
 * Tutto è solo `transform`/`opacity` in un unico rAF agganciato allo scroll,
 * quindi resta fluido; con `prefers-reduced-motion` parallasse e derive si
 * fermano.
 */

import { useEffect, useRef } from "react";

/* La scena: colori dell'illustrazione, non del testo. */
const CIELO: [string, string, string] = ["#EAF4FB", "#D3E7F3", "#BFDCEC"];
const SOLE = "rgba(255, 246, 220, 0.6)";
const MONTE_LONTANO = "#A7CBB7";
const MONTE_MEDIO = "#6BA381";
const MONTE_VICINO = "#41805C";
const PINETA = "#2F6B4C";
const FOSCHIA = "#EAF4FB";
const ACQUA: [string, string, string] = ["#8AB8D4", "#5B9DC2", "#3A83AD"];

/** Una pennellata d'acqua che si ripete due volte per scorrere senza giunte. */
function Onda({ colore, altezza, ritardo, durata, opacita }: {
    colore: string; altezza: number; ritardo: number; durata: number; opacita: number;
}) {
    const d = `M0,${altezza} C120,${altezza - 22} 260,${altezza + 18} 400,${altezza}
               C540,${altezza - 20} 660,${altezza + 16} 800,${altezza}
               C940,${altezza - 22} 1060,${altezza + 18} 1200,${altezza}
               C1340,${altezza - 20} 1460,${altezza + 16} 1600,${altezza}
               L1600,400 L0,400 Z`;
    return (
        <g style={{ animation: `onda ${durata}s linear ${ritardo}s infinite`, opacity: opacita }}>
            <path d={d} fill={colore} />
            <path d={d} fill={colore} transform="translate(1600,0)" />
        </g>
    );
}

/** Una nuvola: gobbe morbide, bianca e appena trasparente, che deriva. */
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
                <svg width="210" height="80" viewBox="0 0 210 80" fill="none">
                    <g fill="#FFFFFF">
                        <ellipse cx="64" cy="50" rx="52" ry="27" />
                        <ellipse cx="118" cy="42" rx="44" ry="33" />
                        <ellipse cx="164" cy="52" rx="40" ry="25" />
                        <rect x="46" y="50" width="130" height="25" rx="12" />
                    </g>
                </svg>
            </span>
        </span>
    );
}

/** Uno stormo: pochi uccelli a "V" che scivolano piano nel cielo. */
function Uccello({ x, y, scala }: { x: number; y: number; scala: number }) {
    return (
        <path
            d={`M${x},${y} q${5 * scala},${-4 * scala} ${10 * scala},0 q${5 * scala},${-4 * scala} ${10 * scala},0`}
            fill="none" stroke="#4A6472" strokeWidth={1.6} strokeLinecap="round" opacity={0.5}
        />
    );
}

export function SfondoLario() {
    useEffect(() => {
        document.documentElement.dataset.fascia = "giorno";
        document.documentElement.dataset.tema = "chiaro";
    }, []);

    const lontano = useRef<HTMLDivElement>(null);
    const medio = useRef<HTMLDivElement>(null);
    const vicino = useRef<HTMLDivElement>(null);
    const nuvole = useRef<HTMLDivElement>(null);
    const sole = useRef<HTMLDivElement>(null);
    const uccelli = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
        let raf = 0;
        const applica = () => {
            raf = 0;
            const y = window.scrollY || 0;
            if (lontano.current) lontano.current.style.transform = `translate3d(0, ${y * -0.03}px, 0)`;
            if (medio.current) medio.current.style.transform = `translate3d(0, ${y * -0.07}px, 0)`;
            if (vicino.current) vicino.current.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
            if (nuvole.current) nuvole.current.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
            if (sole.current) sole.current.style.transform = `translate3d(0, ${y * 0.05}px, 0)`;
            if (uccelli.current) uccelli.current.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(applica); };
        applica();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
    }, []);

    return (
        <div
            className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
            aria-hidden="true"
            style={{ background: `linear-gradient(180deg, ${CIELO[0]} 0%, ${CIELO[1]} 52%, ${CIELO[2]} 100%)` }}
        >
            {/* Il sole: un alone caldo, in alto a destra. */}
            <div
                ref={sole}
                className="absolute -top-[14vh] right-[7vw] h-[56vh] w-[56vh] rounded-full"
                style={{ background: `radial-gradient(circle, ${SOLE} 0%, transparent 66%)`, willChange: "transform" }}
            />

            {/* Gli uccelli. */}
            <div ref={uccelli} className="absolute inset-x-0 top-[12vh] h-[16vh]" style={{ willChange: "transform" }}>
                <svg className="absolute left-[16%] top-0 w-[120px]" viewBox="0 0 80 30">
                    <Uccello x={6} y={16} scala={1.1} />
                    <Uccello x={30} y={10} scala={0.8} />
                    <Uccello x={50} y={18} scala={1} />
                </svg>
            </div>

            {/* Le nuvole, sopra le montagne. */}
            <div ref={nuvole} className="absolute inset-x-0 top-0 h-[46vh] min-h-[240px]" style={{ willChange: "transform" }}>
                <Nuvola top="7%"  scala={1.15} durata={95}  ritardo={0}   opacita={0.92} />
                <Nuvola top="22%" scala={0.78} durata={135} ritardo={-30} opacita={0.68} />
                <Nuvola top="14%" scala={1.45} durata={175} ritardo={-90} opacita={0.48} />
                <Nuvola top="34%" scala={0.6}  durata={115} ritardo={-55} opacita={0.58} />
            </div>

            {/* --- Le tre creste. viewBox panoramica (1600×420, larga più che
                alta) e slice: a schermo largo si taglia ai lati, mai le punte. --- */}
            <div ref={lontano} className="absolute inset-x-0 bottom-0 h-[80vh] min-h-[440px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice">
                    <path fill={MONTE_LONTANO} opacity={0.7}
                        d="M0,168 L150,96 L320,150 L520,70 L720,140 L940,84 L1160,146 L1380,96 L1600,138 L1600,420 L0,420 Z" />
                </svg>
            </div>
            <div ref={medio} className="absolute inset-x-0 bottom-0 h-[72vh] min-h-[400px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice">
                    <path fill={MONTE_MEDIO} opacity={0.92}
                        d="M0,214 L210,120 L430,196 L650,92 L880,182 L1090,110 L1310,190 L1520,118 L1600,158 L1600,420 L0,420 Z" />
                    {/* neve/luce sulle punte più alte */}
                    <path fill="#EAF4FB" opacity={0.5}
                        d="M650,92 L688,128 L612,128 Z M1090,110 L1124,142 L1056,142 Z" />
                </svg>
            </div>
            <div ref={vicino} className="absolute inset-x-0 bottom-0 h-[64vh] min-h-[360px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice">
                    <path fill={MONTE_VICINO}
                        d="M0,280 L250,170 L470,250 L700,140 L940,244 L1160,164 L1380,248 L1560,186 L1600,214 L1600,420 L0,420 Z" />
                    {/* pineta: una fila di abeti sul crinale in primo piano */}
                    <g fill={PINETA}>
                        <path d="M120,300 l10,-22 l10,22 Z M150,300 l12,-27 l12,27 Z M185,300 l9,-20 l9,20 Z
                                 M330,296 l11,-24 l11,24 Z M362,296 l13,-29 l13,29 Z M398,296 l10,-22 l10,22 Z
                                 M560,300 l10,-22 l10,22 Z M590,300 l12,-27 l12,27 Z M624,300 l9,-20 l9,20 Z
                                 M800,296 l11,-24 l11,24 Z M832,296 l13,-29 l13,29 Z M868,296 l10,-22 l10,22 Z
                                 M1030,300 l10,-22 l10,22 Z M1060,300 l12,-27 l12,27 Z M1094,300 l9,-20 l9,20 Z
                                 M1270,298 l11,-24 l11,24 Z M1302,298 l13,-29 l13,29 Z M1338,298 l10,-22 l10,22 Z
                                 M1470,300 l12,-26 l12,26 Z M1504,300 l10,-22 l10,22 Z" opacity={0.9} />
                    </g>
                </svg>
            </div>

            {/* La foschia alla base dei monti. */}
            <div
                className="absolute inset-x-0 bottom-[24vh] h-[20vh] min-h-[110px]"
                style={{ background: `linear-gradient(180deg, transparent 0%, ${FOSCHIA} 66%, ${FOSCHIA} 100%)`, opacity: 0.8 }}
            />

            {/* L'acqua: riflesso dei monti + onde + banda di luce. */}
            <div className="absolute inset-x-0 bottom-0 h-[28vh] min-h-[170px]">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice">
                    <rect x="0" y="120" width="1600" height="280" fill={ACQUA[0]} opacity={0.45} />
                    {/* riflesso capovolto e sfumato del profilo dei monti */}
                    <path fill={MONTE_VICINO} opacity={0.14}
                        d="M0,120 L250,175 L470,140 L700,190 L940,142 L1160,182 L1380,142 L1600,168 L1600,120 Z" />
                    <Onda colore={ACQUA[0]} altezza={210} ritardo={0} durata={46} opacita={0.8} />
                    <Onda colore={ACQUA[1]} altezza={270} ritardo={-14} durata={34} opacita={0.85} />
                    <Onda colore={ACQUA[2]} altezza={340} ritardo={-7} durata={26} opacita={0.95} />
                </svg>
                <div
                    className="riflesso absolute inset-x-0 top-[24%] h-[7vh]"
                    style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                />
            </div>

            {/* Grana di stampa: toglie le bande ai gradienti. */}
            <span
                className="absolute inset-0"
                style={{ opacity: 0.45, backgroundImage: "repeating-linear-gradient(0deg, rgba(120,120,120,0.05) 0 1px, transparent 1px 3px)" }}
            />

            <style jsx global>{`
                @keyframes onda { from { transform: translateX(0); } to { transform: translateX(-1600px); } }
                @keyframes deriva { from { transform: translateX(-250px); } to { transform: translateX(calc(100vw + 250px)); } }
                @keyframes respiro-luce { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.65; } }
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
