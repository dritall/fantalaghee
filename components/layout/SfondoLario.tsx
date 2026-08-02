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
    velo: string;
    veloAlto: string;
    ombra: string;
    prato: string;
    pratoOmbra: string;
    rigaCampo: string;
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
        pece: "#B7CFDE", calce: "#071A24", fondale: "#DCE9F0", secca: "#A2C0D2",
        fumo: "#5A7683", filo: "rgba(10,36,48,0.14)", filoAlto: "rgba(10,36,48,0.30)",
        velo: "rgba(10,36,48,0.05)", veloAlto: "rgba(10,36,48,0.09)", ombra: "rgba(10,36,48,0.14)",
        prato: "#2C6B4E", pratoOmbra: "rgba(0,0,0,0.14)", rigaCampo: "rgba(255,255,255,0.85)",
        lario: "#0F5378", vermiglio: "#AF2233", oro: "#8A6A2F",
        acqua: ["#8FB6CE", "#6D9DBC", "#4C82A6"],
        cielo: ["#D9D2C6", "#B4CFE0"],
    },
    {
        id: "giorno", nome: "giorno", chiara: true,
        pece: "#BAD2E1", calce: "#051317", fondale: "#DEEAF2", secca: "#A3C1D4",
        fumo: "#557381", filo: "rgba(8,34,45,0.14)", filoAlto: "rgba(8,34,45,0.30)",
        velo: "rgba(8,34,45,0.05)", veloAlto: "rgba(8,34,45,0.09)", ombra: "rgba(8,34,45,0.14)",
        prato: "#2F7452", pratoOmbra: "rgba(0,0,0,0.12)", rigaCampo: "rgba(255,255,255,0.9)",
        lario: "#0F5C86", vermiglio: "#A81E30", oro: "#7F6129",
        acqua: ["#93BAD3", "#6FA0C0", "#4E85A9"],
        cielo: ["#E1ECF3", "#BCD6E6"],
    },
    {
        id: "tramonto", nome: "tramonto", chiara: true,
        pece: "#D2C0AB", calce: "#180E0C", fondale: "#E7D9C8", secca: "#BCA286",
        fumo: "#7A6353", filo: "rgba(34,20,16,0.15)", filoAlto: "rgba(34,20,16,0.32)",
        velo: "rgba(34,20,16,0.05)", veloAlto: "rgba(34,20,16,0.09)", ombra: "rgba(34,20,16,0.15)",
        prato: "#356B4B", pratoOmbra: "rgba(0,0,0,0.16)", rigaCampo: "rgba(255,255,255,0.8)",
        lario: "#186273", vermiglio: "#A82330", oro: "#84652B",
        acqua: ["#C2A88", "#A98670", "#8A6A58"],
        cielo: ["#E7D5BE", "#D2B392"],
    },
    {
        id: "sera", nome: "sera", chiara: false,
        pece: "#0A2231", calce: "#E9F1F5", fondale: "#123047", secca: "#184660",
        fumo: "#83A7B4", filo: "rgba(237,242,241,0.18)", filoAlto: "rgba(237,242,241,0.36)",
        velo: "rgba(237,242,241,0.05)", veloAlto: "rgba(237,242,241,0.10)", ombra: "rgba(2,12,18,0.5)",
        prato: "#123526", pratoOmbra: "rgba(0,0,0,0.3)", rigaCampo: "rgba(237,242,241,0.42)",
        lario: "#3F9FD4", vermiglio: "#E2455A", oro: "#D9A441",
        acqua: ["#163147", "#17608F", "#1776A9"],
        cielo: ["#07141C", "#123047"],
    },
    {
        id: "notte", nome: "notte", chiara: false,
        pece: "#061618", calce: "#E5EEF3", fondale: "#0A2028", secca: "#12384F",
        fumo: "#6F94A2", filo: "rgba(231,238,238,0.16)", filoAlto: "rgba(231,238,238,0.32)",
        velo: "rgba(231,238,238,0.05)", veloAlto: "rgba(231,238,238,0.10)", ombra: "rgba(0,6,10,0.6)",
        prato: "#0C2A1D", pratoOmbra: "rgba(0,0,0,0.36)", rigaCampo: "rgba(231,238,238,0.38)",
        lario: "#2E8FC4", vermiglio: "#DE3E54", oro: "#CFA03F",
        acqua: ["#0A1E2A", "#123B58", "#175279"],
        cielo: ["#030D0F", "#0A2028"],
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
        r.setProperty("--velo", fascia.velo);
        r.setProperty("--velo-alto", fascia.veloAlto);
        r.setProperty("--ombra", fascia.ombra);
        r.setProperty("--prato", fascia.prato);
        r.setProperty("--prato-ombra", fascia.pratoOmbra);
        r.setProperty("--riga-campo", fascia.rigaCampo);
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
