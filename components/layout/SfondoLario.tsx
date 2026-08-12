"use client";

/**
 * Lo sfondo del sito: una giornata sul lago, dipinta a strati.
 *
 * Non è una foto e non è un gradiente fermo. È il paesaggio scomposto in piani
 * — cielo, sole, nuvole, tre creste sempre più vicine, la foschia che le
 * stacca, il bosco sul crinale, l'acqua col riflesso e la banda di luce. Ogni
 * piano si muove a una velocità diversa quando si scorre (parallasse): è
 * quello che dà la profondità.
 *
 * Regole del disegno, imparate a spese della versione precedente:
 *
 *  · niente spigoli. Le creste sono curve di Bézier con le cime arrotondate,
 *    non spezzate di segmenti dritti: un profilo di montagna non ha vertici.
 *  · niente giunte. Ogni cresta è riempita con un gradiente verticale che
 *    finisce nel colore della foschia, così i piani si fondono da soli invece
 *    di appoggiarsi uno sull'altro con una riga netta.
 *  · le nuvole sono cerchi bianchi sfocati, non ellissi con sotto un
 *    rettangolo: la sfocatura è ciò che le rende nuvole.
 *  · scorrendo, un velo del colore della pagina sale sul paesaggio. In cima si
 *    vede il lago; più giù la scena arretra e lascia lavorare il contenuto.
 *
 * Tutto è solo `transform`/`opacity` in un unico rAF agganciato allo scroll,
 * quindi resta fluido; con `prefers-reduced-motion` parallasse e derive si
 * fermano.
 */

import { useEffect, useRef } from "react";

/* La scena: colori dell'illustrazione, non del testo. */
const CIELO = {
    alto: "#EFF7FC",
    mezzo: "#DCECF7",
    basso: "#C9E2F0",
    orizzonte: "#E4F0F3",
};
const FOSCHIA = "#DEEDF4";

/** Le tre creste: colore in cima, colore alla base (dove si fondono). */
const CRESTE = [
    { su: "#93BCC0", giu: "#CBE2EC", opacita: 0.62 },
    { su: "#5E9A7B", giu: "#A8CFDA", opacita: 0.82 },
    { su: "#2F6F4E", giu: "#79ADB8", opacita: 1 },
];

/**
 * Da una fila di punti (cima, valle, cima…) a una curva continua.
 *
 * È una Catmull-Rom convertita in Bézier: la linea passa esattamente per i
 * punti dati e la `tensione` decide quanto si gonfia fra l'uno e l'altro. Con
 * una tensione bassa i fianchi restano tesi e solo la vetta si smussa — che è
 * come è fatta una montagna. Con la tensione alta si ottengono le dune, che
 * era il difetto della versione prima di questa.
 */
function cresta(punti: [number, number][], tensione: number): string {
    const p = punti;
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] ?? p[i];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[i + 2] ?? p2;
        const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tensione;
        const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tensione;
        const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tensione;
        const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tensione;
        d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return `${d} L1600,520 L0,520 Z`;
}

/**
 * I tre skyline. La viewBox è panoramica (1600×520) e si taglia ai lati, mai
 * in cima. Più la cresta è vicina, più è bassa nel quadro e più larghe sono le
 * sue forme: è la prospettiva a fare la profondità, prima ancora del colore.
 */
const PROFILI = [
    // lontana — le cime alte dietro a tutto, appena velate
    cresta([
        [0, 196], [128, 132], [244, 184], [372, 78], [512, 158],
        [648, 104], [790, 176], [936, 86], [1076, 166], [1216, 110],
        [1354, 182], [1486, 124], [1600, 168],
    ], 0.62),
    // media — la dorsale vera, quella che porta il disegno
    cresta([
        [0, 262], [152, 202], [302, 256], [438, 140], [566, 228],
        [706, 168], [852, 250], [1004, 154], [1152, 240], [1302, 186],
        [1452, 252], [1600, 204],
    ], 0.6),
    // vicina — il crinale in primo piano, quello col bosco
    cresta([
        [0, 322], [186, 288], [346, 334], [508, 236], [668, 312],
        [828, 252], [992, 328], [1152, 264], [1312, 322], [1466, 270],
        [1600, 312],
    ], 0.58),
];

/**
 * Il bosco sul crinale vicino: non alberelli triangolari messi in fila, ma un
 * profilo continuo di chiome tonde che segue la cresta. Da lontano un bosco è
 * una linea frastagliata morbida, non una serie di frecce.
 */
function boscoPath(): string {
    // La fascia boscata sta sotto il crinale, non sopra: sui monti veri gli
    // abeti si fermano ben prima della cima.
    const base = 372;
    let d = `M0,${base}`;
    let x = 0;
    // gobbe di ampiezza e altezza variabili: la variazione è pseudo-casuale ma
    // deterministica, così il disegno non "balla" fra un render e l'altro.
    let i = 0;
    while (x < 1600) {
        const largo = 16 + ((i * 37) % 19);
        const alto = 12 + ((i * 53) % 17);
        const cima = base - 62 - alto - Math.sin(i / 5.5) * 16;
        d += ` C ${x + largo * 0.25},${cima + 14} ${x + largo * 0.75},${cima} ${x + largo},${cima + 10}`;
        d += ` C ${x + largo * 1.3},${cima + 22} ${x + largo * 1.6},${base - 46} ${x + largo * 2},${base - 40}`;
        x += largo * 2;
        i += 1;
    }
    return `${d} L1600,${base} L1600,520 L0,520 Z`;
}
const BOSCO = boscoPath();

/** Una pennellata d'acqua che si ripete due volte per scorrere senza giunte. */
function Onda({ colore, altezza, ritardo, durata, opacita }: {
    colore: string; altezza: number; ritardo: number; durata: number; opacita: number;
}) {
    const d = `M0,${altezza} C120,${altezza - 20} 260,${altezza + 16} 400,${altezza}
               C540,${altezza - 18} 660,${altezza + 14} 800,${altezza}
               C940,${altezza - 20} 1060,${altezza + 16} 1200,${altezza}
               C1340,${altezza - 18} 1460,${altezza + 14} 1600,${altezza}
               L1600,400 L0,400 Z`;
    return (
        <g style={{ animation: `onda ${durata}s linear ${ritardo}s infinite`, opacity: opacita }}>
            <path d={d} fill={colore} />
            <path d={d} fill={colore} transform="translate(1600,0)" />
        </g>
    );
}

/**
 * Una nuvola: quattro cerchi bianchi sotto una sfocatura. La sfocatura sta sul
 * contenitore, quindi il browser la calcola una volta sola e poi si limita a
 * spostare il livello — la deriva resta gratis.
 */
function Nuvola({ top, scala, durata, ritardo, opacita, sfoca }: {
    top: string; scala: number; durata: number; ritardo: number; opacita: number; sfoca: number;
}) {
    return (
        <span
            className="nuvola absolute left-0 block"
            style={{
                top,
                opacity: opacita,
                animation: `deriva ${durata}s linear ${ritardo}s infinite`,
                willChange: "transform",
            }}
            aria-hidden="true"
        >
            <span
                className="relative block h-[90px] w-[260px]"
                style={{
                    transform: `scale(${scala})`,
                    transformOrigin: "left center",
                    filter: `blur(${sfoca}px)`,
                }}
            >
                <span className="absolute left-[10px] top-[34px] h-[52px] w-[112px] rounded-full bg-white" />
                <span className="absolute left-[52px] top-[10px] h-[74px] w-[104px] rounded-full bg-white" />
                <span className="absolute left-[118px] top-[26px] h-[58px] w-[92px] rounded-full bg-white" />
                <span className="absolute left-[36px] top-[52px] h-[34px] w-[176px] rounded-full bg-white" />
            </span>
        </span>
    );
}

/** Uno stormo: pochi uccelli a "V" che scivolano piano nel cielo. */
function Uccello({ x, y, scala }: { x: number; y: number; scala: number }) {
    return (
        <path
            d={`M${x},${y} q${5 * scala},${-4 * scala} ${10 * scala},0 q${5 * scala},${-4 * scala} ${10 * scala},0`}
            fill="none" stroke="#54707F" strokeWidth={1.5} strokeLinecap="round" opacity={0.42}
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
    const velo = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ridotto = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        let raf = 0;
        const applica = () => {
            raf = 0;
            const y = window.scrollY || 0;

            // Il velo non dipende dal movimento ridotto: è una questione di
            // leggibilità, non di effetto. Scendendo, il paesaggio arretra
            // dietro al colore della pagina e smette di competere col testo.
            if (velo.current) {
                const q = Math.min(1, y / (window.innerHeight * 0.9));
                velo.current.style.opacity = String(q * 0.62);
            }
            if (ridotto) return;

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
            style={{
                background: `linear-gradient(180deg, ${CIELO.alto} 0%, ${CIELO.mezzo} 34%, ${CIELO.basso} 62%, ${CIELO.orizzonte} 100%)`,
            }}
        >
            {/* Il sole: un alone caldo che respira, in alto a destra. */}
            <div
                ref={sole}
                className="absolute -top-[18vh] right-[6vw] h-[64vh] w-[64vh] rounded-full"
                style={{ willChange: "transform" }}
            >
                <span
                    className="alone absolute inset-0 rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, rgba(255,247,224,0.85) 0%, rgba(255,240,205,0.42) 34%, rgba(255,236,196,0) 68%)",
                    }}
                />
            </div>

            {/* Gli uccelli. */}
            <div ref={uccelli} className="absolute inset-x-0 top-[12vh] h-[16vh]" style={{ willChange: "transform" }}>
                <svg className="absolute left-[16%] top-0 w-[120px]" viewBox="0 0 80 30">
                    <Uccello x={6} y={16} scala={1.1} />
                    <Uccello x={30} y={10} scala={0.8} />
                    <Uccello x={50} y={18} scala={1} />
                </svg>
            </div>

            {/* Le nuvole. Quelle sfocate forte stanno lontane, le altre vicine. */}
            <div ref={nuvole} className="absolute inset-x-0 top-0 h-[48vh] min-h-[260px]" style={{ willChange: "transform" }}>
                <Nuvola top="6%"  scala={1.05} durata={104} ritardo={0}   opacita={0.78} sfoca={9} />
                <Nuvola top="21%" scala={0.7}  durata={148} ritardo={-34} opacita={0.5}  sfoca={12} />
                <Nuvola top="12%" scala={1.5}  durata={188} ritardo={-96} opacita={0.34} sfoca={18} />
                <Nuvola top="33%" scala={0.55} durata={124} ritardo={-58} opacita={0.42} sfoca={8} />
            </div>

            {/* --- Le tre creste. Ognuna sfuma nella foschia alla base: è così
                che i piani si staccano senza una riga di taglio. --- */}
            <div ref={lontano} className="absolute inset-x-0 bottom-0 h-[80vh] min-h-[440px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMax slice">
                    <defs>
                        <linearGradient id="cresta-lontana" x1="0" y1="0.24" x2="0" y2="1">
                            <stop offset="0%" stopColor={CRESTE[0].su} />
                            <stop offset="46%" stopColor={CRESTE[0].su} />
                            <stop offset="100%" stopColor={CRESTE[0].giu} />
                        </linearGradient>
                    </defs>
                    <path d={PROFILI[0]} fill="url(#cresta-lontana)" opacity={CRESTE[0].opacita} />
                </svg>
            </div>

            <div ref={medio} className="absolute inset-x-0 bottom-0 h-[72vh] min-h-[400px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMax slice">
                    <defs>
                        <linearGradient id="cresta-media" x1="0" y1="0.3" x2="0" y2="1">
                            <stop offset="0%" stopColor={CRESTE[1].su} />
                            <stop offset="50%" stopColor={CRESTE[1].su} />
                            <stop offset="100%" stopColor={CRESTE[1].giu} />
                        </linearGradient>
                        {/* la luce del sole prende il versante destro delle cime */}
                        <linearGradient id="luce-media" x1="0" y1="0" x2="1" y2="0.4">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                            <stop offset="72%" stopColor="#FFFFFF" stopOpacity="0.16" />
                            <stop offset="100%" stopColor="#FFF6DC" stopOpacity="0.28" />
                        </linearGradient>
                    </defs>
                    <path d={PROFILI[1]} fill="url(#cresta-media)" opacity={CRESTE[1].opacita} />
                    <path d={PROFILI[1]} fill="url(#luce-media)" />
                </svg>
            </div>

            <div ref={vicino} className="absolute inset-x-0 bottom-0 h-[64vh] min-h-[360px]" style={{ willChange: "transform" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 520" preserveAspectRatio="xMidYMax slice">
                    <defs>
                        <linearGradient id="cresta-vicina" x1="0" y1="0.36" x2="0" y2="1">
                            <stop offset="0%" stopColor={CRESTE[2].su} />
                            <stop offset="54%" stopColor={CRESTE[2].su} />
                            <stop offset="100%" stopColor={CRESTE[2].giu} />
                        </linearGradient>
                        <linearGradient id="bosco-sfuma" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2E6449" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#6FA0A8" stopOpacity="0" />
                        </linearGradient>
                        {/* maschera: il bosco esiste solo dentro la sagoma del monte */}
                        <clipPath id="dentro-cresta">
                            <path d={PROFILI[2]} />
                        </clipPath>
                    </defs>
                    <path d={PROFILI[2]} fill="url(#cresta-vicina)" opacity={CRESTE[2].opacita} />
                    <g clipPath="url(#dentro-cresta)">
                        <path d={BOSCO} fill="url(#bosco-sfuma)" />
                    </g>
                </svg>
            </div>

            {/* La foschia alla base dei monti: un respiro chiaro, senza bordo.
                Sta bassa e finisce dov'è la riva, così vela i piedi delle
                creste e non le cime. */}
            <div
                className="absolute inset-x-0 bottom-[20vh] h-[18vh] min-h-[100px]"
                style={{
                    background: `linear-gradient(180deg, rgba(222,237,244,0) 0%, ${FOSCHIA}C4 52%, ${FOSCHIA}F2 100%)`,
                }}
            />

            {/* L'acqua: riflesso dei monti + onde + banda di luce. La riva non
                è un bordo ma una dissolvenza: il primo quinto della lastra è
                trasparente e raccoglie la foschia. */}
            <div className="absolute inset-x-0 bottom-0 h-[26vh] min-h-[160px]">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice">
                    <defs>
                        <linearGradient id="acqua-fondo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={FOSCHIA} stopOpacity="0" />
                            <stop offset="14%" stopColor="#D2E7F0" stopOpacity="0.85" />
                            <stop offset="30%" stopColor="#B7D6E7" />
                            <stop offset="64%" stopColor="#7FB1D0" />
                            <stop offset="100%" stopColor="#4E8FB6" />
                        </linearGradient>
                        <linearGradient id="onda-alta" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9CC4DC" stopOpacity="0.55" />
                            <stop offset="100%" stopColor="#7FB1D0" stopOpacity="0.9" />
                        </linearGradient>
                        <linearGradient id="onda-media" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6BA5C9" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#4E8FB6" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="onda-bassa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3F81AB" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#31719B" />
                        </linearGradient>
                        {/* il riflesso è sfocato: l'acqua non restituisce contorni */}
                        <filter id="sfoca-riflesso" x="-10%" y="-10%" width="120%" height="140%">
                            <feGaussianBlur stdDeviation="7" />
                        </filter>
                    </defs>

                    <rect x="0" y="0" width="1600" height="400" fill="url(#acqua-fondo)" />

                    {/* riflesso capovolto del profilo vicino, subito sotto la riva */}
                    <g filter="url(#sfoca-riflesso)" opacity={0.2} transform="translate(0,74)">
                        <path fill="#2F6F4E"
                            d="M0,0 C 136,14 218,66 342,56 C 466,46 532,106 654,104
                               C 776,102 830,44 950,44 C 1062,44 1132,96 1252,88
                               C 1364,80 1448,38 1600,50 L1600,0 Z" />
                    </g>

                    <Onda colore="url(#onda-alta)" altezza={190} ritardo={0} durata={46} opacita={0.75} />
                    <Onda colore="url(#onda-media)" altezza={262} ritardo={-14} durata={34} opacita={0.85} />
                    <Onda colore="url(#onda-bassa)" altezza={334} ritardo={-7} durata={26} opacita={0.95} />
                </svg>

                <div
                    className="riflesso absolute inset-x-0 top-[20%] h-[8vh]"
                    style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.42), transparent)" }}
                />
            </div>

            {/* Il velo che sale con lo scroll: il paesaggio arretra e lascia
                il palco al contenuto. L'opacità la scrive il rAF. */}
            <div
                ref={velo}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background: `linear-gradient(180deg, ${FOSCHIA}00 0%, var(--pece) 34%, var(--pece) 100%)`,
                    transition: "opacity 120ms linear",
                    willChange: "opacity",
                }}
            />

            {/* Vignettatura appena accennata: tiene lo sguardo al centro. */}
            <span
                className="absolute inset-0"
                style={{ background: "radial-gradient(120% 90% at 50% 34%, transparent 52%, rgba(11,34,51,0.09) 100%)" }}
            />

            {/* Grana: pulviscolo finissimo, toglie le bande ai gradienti. */}
            <span
                className="absolute inset-0 mix-blend-multiply"
                style={{
                    opacity: 0.22,
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
                }}
            />

            <style jsx global>{`
                @keyframes onda { from { transform: translateX(0); } to { transform: translateX(-1600px); } }
                @keyframes deriva { from { transform: translateX(-320px); } to { transform: translateX(calc(100vw + 320px)); } }
                @keyframes respiro-luce { 0%, 100% { opacity: 0.28; } 50% { opacity: 0.6; } }
                @keyframes respiro-sole { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.06); opacity: 1; } }
                .riflesso { animation: respiro-luce 11s ease-in-out infinite; }
                .alone { animation: respiro-sole 16s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes onda { from, to { transform: translateX(0); } }
                    .nuvola { animation: none !important; }
                    .riflesso { animation: none !important; }
                    .alone { animation: none !important; }
                }
            `}</style>
        </div>
    );
}
