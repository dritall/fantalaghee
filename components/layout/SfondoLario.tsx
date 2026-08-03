"use client";

/**
 * Lo sfondo del sito: una sola giornata sul lago.
 *
 * Non è una foto e non è un gradiente fermo. È l'acqua del lago, fatta di
 * pennellate che scorrono a velocità diverse, le montagne verdi dietro e
 * qualche nuvola che passa lenta nel cielo. L'idea viene dalla pittura a
 * olio — strati sovrapposti, ognuno con il suo movimento, che a distanza si
 * leggono come una superficie sola che respira.
 *
 * Prima questo componente cambiava i colori con l'ora: non funzionava, il
 * sito non aveva mai una faccia sola. Ora la palette è fissa (sta in
 * globals.css) e qui resta soltanto lo sfondo, sempre lo stesso, di giorno.
 * L'unico compito rimasto verso il resto del sito è dichiarare il tema
 * chiaro, che serve ai colori delle squadre.
 */

import { useEffect } from "react";

/* La scena, tutta qui: sono i colori dell'illustrazione di sfondo, non del
   testo. Il testo e le superfici vivono sulle variabili di globals.css. */
const CIELO: [string, string] = ["#E4F0F8", "#C4DEEE"]; // dall'alto in basso
const MONTE_DIETRO = "#7FB48E"; // cresta lontana, verde velato dalla foschia
const MONTE_DAVANTI = "#4E9068"; // cresta vicina, verde pieno
const ACQUA: [string, string, string] = ["#7DB0CF", "#5197BE", "#357FAA"]; // fondo → superficie

/**
 * Una pennellata d'acqua: una curva morbida che si ripete due volte in
 * orizzontale, così può scorrere all'infinito senza giunte. Le tre onde
 * hanno ampiezze e velocità diverse — è quello che le fa sembrare acqua e
 * non un motivo che si ripete.
 */
function Onda({ colore, altezza, ritardo, durata, opacita }: {
    colore: string; altezza: number; ritardo: number; durata: number; opacita: number;
}) {
    const d = `M0,${altezza} C120,${altezza - 26} 260,${altezza + 22} 400,${altezza}
               C540,${altezza - 24} 660,${altezza + 20} 800,${altezza}
               C940,${altezza - 26} 1060,${altezza + 22} 1200,${altezza}
               C1340,${altezza - 24} 1460,${altezza + 20} 1600,${altezza}
               L1600,600 L0,600 Z`;
    return (
        <g
            style={{
                animation: `onda ${durata}s linear ${ritardo}s infinite`,
                opacity: opacita,
            }}
        >
            <path d={d} fill={colore} />
            <path d={d} fill={colore} transform="translate(1600,0)" />
        </g>
    );
}

/**
 * Una nuvola: tre gobbe morbide messe insieme, bianca e appena trasparente.
 * Attraversa il cielo da sinistra a destra e rientra — non serve la giuntura
 * perfetta delle onde, le nuvole possono sparire e ricomparire.
 */
function Nuvola({ top, scala, durata, ritardo, opacita }: {
    top: string; scala: number; durata: number; ritardo: number; opacita: number;
}) {
    // L'animazione governa il translateX dello strato esterno; la scala sta
    // sul figlio, così le due trasformazioni non si sovrascrivono.
    return (
        <span
            className="nuvola absolute left-0"
            style={{
                top,
                opacity: opacita,
                animation: `deriva ${durata}s linear ${ritardo}s infinite`,
                willChange: "transform",
            }}
            aria-hidden="true"
        >
            <span
                className="block"
                style={{ transform: `scale(${scala})`, transformOrigin: "left center" }}
            >
                <svg width="180" height="70" viewBox="0 0 180 70" fill="none">
                    <g fill="#FFFFFF">
                        <ellipse cx="55" cy="45" rx="45" ry="24" />
                        <ellipse cx="100" cy="38" rx="38" ry="30" />
                        <ellipse cx="140" cy="47" rx="34" ry="22" />
                        <rect x="40" y="45" width="110" height="22" rx="11" />
                    </g>
                </svg>
            </span>
        </span>
    );
}

export function SfondoLario() {
    // Il tema è sempre chiaro: lo dichiariamo una volta per chi calcola i
    // colori (le squadre) leggendo data-tema dall'elemento <html>.
    useEffect(() => {
        document.documentElement.dataset.fascia = "giorno";
        document.documentElement.dataset.tema = "chiaro";
    }, []);

    return (
        <div
            className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
            aria-hidden="true"
            style={{
                background: `linear-gradient(180deg, ${CIELO[0]} 0%, ${CIELO[1]} 100%)`,
            }}
        >
            {/* Le nuvole: qualche pennellata bianca che deriva lenta nel cielo,
                sopra la linea delle montagne. */}
            <div className="absolute inset-x-0 top-0 h-[46vh] min-h-[240px]">
                <Nuvola top="8%"  scala={1.15} durata={90}  ritardo={0}   opacita={0.9} />
                <Nuvola top="26%" scala={0.8}  durata={130} ritardo={-30} opacita={0.7} />
                <Nuvola top="15%" scala={1.4}  durata={160} ritardo={-80} opacita={0.55} />
                <Nuvola top="38%" scala={0.65} durata={110} ritardo={-55} opacita={0.6} />
            </div>

            {/* Le montagne e l'acqua, dal fondo dello schermo. */}
            <svg
                className="absolute inset-x-0 bottom-0 h-[62vh] min-h-[360px] w-full"
                viewBox="0 0 1600 600"
                preserveAspectRatio="xMidYMax slice"
            >
                {/* Le montagne, dietro l'acqua: due creste verdi. */}
                <path
                    fill={MONTE_DIETRO}
                    opacity={0.85}
                    d="M0,300 L200,196 L400,268 L620,140 L840,244 L1060,168 L1280,262 L1450,196 L1600,246 L1600,600 L0,600 Z"
                />
                <path
                    fill={MONTE_DAVANTI}
                    opacity={0.95}
                    d="M0,382 L160,306 L340,372 L540,250 L740,346 L940,276 L1150,358 L1350,292 L1520,350 L1600,322 L1600,600 L0,600 Z"
                />

                {/* L'acqua: tre onde che scorrono a velocità diverse. */}
                <Onda colore={ACQUA[0]} altezza={430} ritardo={0} durata={46} opacita={0.9} />
                <Onda colore={ACQUA[1]} altezza={470} ritardo={-14} durata={34} opacita={0.85} />
                <Onda colore={ACQUA[2]} altezza={512} ritardo={-7} durata={26} opacita={0.95} />
            </svg>

            {/* Grana di stampa: toglie le bande al gradiente e dà il tocco di
                pittura invece che di rendering. */}
            <span
                className="absolute inset-0"
                style={{
                    opacity: 0.5,
                    backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(120,120,120,0.05) 0 1px, transparent 1px 3px)",
                }}
            />

            <style jsx global>{`
                @keyframes onda {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-1600px); }
                }
                @keyframes deriva {
                    from { transform: translateX(-220px); }
                    to   { transform: translateX(calc(100vw + 220px)); }
                }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes onda { from, to { transform: translateX(0); } }
                    .nuvola { animation: none !important; }
                }
            `}</style>
        </div>
    );
}
