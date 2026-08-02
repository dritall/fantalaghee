"use client";

/**
 * Lo sfondo del sito, e insieme il regista dei colori.
 *
 * Non è una foto e non è un gradiente fermo: è l'acqua del lago, fatta di
 * pennellate che scorrono a velocità diverse. L'idea viene dalla pittura a
 * olio — strati sovrapposti, ognuno con la sua onda, che a distanza si
 * leggono come una superficie sola che respira.
 *
 * Lo stesso componente scrive sull'elemento <html> i colori della fascia
 * oraria: il sito è chiaro dalla mattina al tramonto e scuro la sera. Le
 * fasce sono decisamente chiare o decisamente scure — niente mezze misure —
 * perché il contrasto del testo non deve mai dipendere dall'ora.
 */

import { useEffect, useState } from "react";

type Fascia = {
    id: string;
    nome: string;
    chiara: boolean;
    /** i sei valori che si invertono */
    pece: string;
    calce: string;
    fondale: string;
    secca: string;
    fumo: string;
    filo: string;
    filoAlto: string;
    /** accenti, tarati sul fondo della fascia */
    lario: string;
    vermiglio: string;
    oro: string;
    /** i tre strati d'acqua, dal fondo alla superficie */
    acqua: [string, string, string];
    /** il cielo dietro l'acqua */
    cielo: [string, string];
};

const FASCE: Fascia[] = [
    {
        id: "alba", nome: "alba", chiara: true,
        pece: "#EAF1F3", calce: "#0A2430", fondale: "#FFFFFF", secca: "#DCE9ED",
        fumo: "#5A7683", filo: "rgba(10,36,48,0.14)", filoAlto: "rgba(10,36,48,0.30)",
        lario: "#0E6E86", vermiglio: "#D33A22", oro: "#A9750B",
        acqua: ["#BBD6DE", "#9CC4D2", "#7FB0C4"],
        cielo: ["#F3EDE4", "#E2EDF0"],
    },
    {
        id: "giorno", nome: "giorno", chiara: true,
        pece: "#F1F5F4", calce: "#08222D", fondale: "#FFFFFF", secca: "#E0EDEF",
        fumo: "#557381", filo: "rgba(8,34,45,0.14)", filoAlto: "rgba(8,34,45,0.30)",
        lario: "#0B6C8C", vermiglio: "#D6391F", oro: "#9E6E08",
        acqua: ["#C3DFE4", "#9FCCD8", "#6FB4C8"],
        cielo: ["#FBFDFC", "#E6F2F3"],
    },
    {
        id: "tramonto", nome: "tramonto", chiara: true,
        pece: "#F3EBE1", calce: "#221410", fondale: "#FFF9F2", secca: "#E8D9C8",
        fumo: "#7A6353", filo: "rgba(34,20,16,0.15)", filoAlto: "rgba(34,20,16,0.32)",
        lario: "#186273", vermiglio: "#C63A1B", oro: "#96650A",
        acqua: ["#DCC6AE", "#C8A98F", "#A98670"],
        cielo: ["#FBEEDD", "#F0D9C0"],
    },
    {
        id: "sera", nome: "sera", chiara: false,
        pece: "#0A2230", calce: "#EDF2F1", fondale: "#0E2E3D", secca: "#154356",
        fumo: "#83A7B4", filo: "rgba(237,242,241,0.18)", filoAlto: "rgba(237,242,241,0.36)",
        lario: "#4FC3CE", vermiglio: "#F2543D", oro: "#F0B429",
        acqua: ["#123A4B", "#17495D", "#1D5A70"],
        cielo: ["#08202C", "#0D3040"],
    },
    {
        id: "notte", nome: "notte", chiara: false,
        pece: "#04141C", calce: "#E7EEEE", fondale: "#071F2A", secca: "#0C3140",
        fumo: "#6F94A2", filo: "rgba(231,238,238,0.16)", filoAlto: "rgba(231,238,238,0.32)",
        lario: "#3FB8C4", vermiglio: "#F2543D", oro: "#E8A72B",
        acqua: ["#08222E", "#0A2C3B", "#0D3849"],
        cielo: ["#020D13", "#061C26"],
    },
];

export function fasciaDi(ora: number): Fascia {
    if (ora >= 6 && ora < 9) return FASCE[0];
    if (ora >= 9 && ora < 17) return FASCE[1];
    if (ora >= 17 && ora < 20) return FASCE[2];
    if (ora >= 20 && ora < 23) return FASCE[3];
    return FASCE[4];
}

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

export function SfondoLario() {
    // Server e primo render usano la sera: è quando il sito viene guardato di
    // più, e così non c'è nessun salto di colore all'idratazione.
    const [fascia, setFascia] = useState<Fascia>(FASCE[3]);

    useEffect(() => {
        const aggiorna = () => setFascia(fasciaDi(new Date().getHours()));
        aggiorna();
        const id = setInterval(aggiorna, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    // I colori del tema vivono sull'elemento <html>: da lì li vede tutto il
    // sito, comprese le parti che non passano da questo componente.
    useEffect(() => {
        const r = document.documentElement.style;
        r.setProperty("--pece", fascia.pece);
        r.setProperty("--calce", fascia.calce);
        r.setProperty("--fondale", fascia.fondale);
        r.setProperty("--secca", fascia.secca);
        r.setProperty("--fumo", fascia.fumo);
        r.setProperty("--filo", fascia.filo);
        r.setProperty("--filo-alto", fascia.filoAlto);
        r.setProperty("--lario", fascia.lario);
        r.setProperty("--vermiglio", fascia.vermiglio);
        r.setProperty("--oro", fascia.oro);
        document.documentElement.dataset.fascia = fascia.id;
        document.documentElement.dataset.tema = fascia.chiara ? "chiaro" : "scuro";
    }, [fascia]);

    return (
        <div
            className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
            aria-hidden="true"
            style={{
                background: `linear-gradient(180deg, ${fascia.cielo[0]} 0%, ${fascia.cielo[1]} 100%)`,
                transition: "background 1400ms ease",
            }}
        >
            {/* Le montagne, dietro l'acqua: due creste appena staccate dal cielo. */}
            <svg
                className="absolute inset-x-0 bottom-0 h-[62vh] min-h-[360px] w-full"
                viewBox="0 0 1600 600"
                preserveAspectRatio="xMidYMax slice"
            >
                <g style={{ transition: "opacity 1400ms ease" }}>
                    <path
                        fill={fascia.acqua[0]}
                        opacity={fascia.chiara ? 0.55 : 0.9}
                        d="M0,300 L200,196 L400,268 L620,140 L840,244 L1060,168 L1280,262 L1450,196 L1600,246 L1600,600 L0,600 Z"
                    />
                    <path
                        fill={fascia.chiara ? fascia.acqua[1] : fascia.cielo[0]}
                        opacity={fascia.chiara ? 0.75 : 1}
                        d="M0,382 L160,306 L340,372 L540,250 L740,346 L940,276 L1150,358 L1350,292 L1520,350 L1600,322 L1600,600 L0,600 Z"
                    />
                </g>

                {/* L'acqua: tre onde che scorrono a velocità diverse. */}
                <Onda colore={fascia.acqua[0]} altezza={430} ritardo={0} durata={46} opacita={0.9} />
                <Onda colore={fascia.acqua[1]} altezza={470} ritardo={-14} durata={34} opacita={0.85} />
                <Onda colore={fascia.acqua[2]} altezza={512} ritardo={-7} durata={26} opacita={0.95} />
            </svg>

            {/* Grana di stampa: toglie le bande al gradiente e dà il tocco di
                pittura invece che di rendering. */}
            <span
                className="absolute inset-0"
                style={{
                    opacity: fascia.chiara ? 0.5 : 0.28,
                    backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(120,120,120,0.05) 0 1px, transparent 1px 3px)",
                }}
            />

            <style jsx global>{`
                @keyframes onda {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-1600px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes onda { from, to { transform: translateX(0); } }
                }
            `}</style>
        </div>
    );
}
