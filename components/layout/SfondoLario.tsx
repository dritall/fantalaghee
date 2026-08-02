"use client";

/**
 * Lo sfondo del sito, disegnato invece che fotografato.
 *
 * Al posto delle due immagini (300 kB fra telefono e desktop) c'è il profilo
 * del Lario costruito in SVG e un cielo fatto di sfumature: pesa qualche
 * centinaio di byte, non sgrana su nessuno schermo, e soprattutto è scuro
 * dove serve — il testo sopra si legge sempre, che è il difetto vero della
 * foto dello stadio.
 *
 * Il cielo cambia con l'ora di chi guarda. Restano tutte notti: cambia il
 * tono, non la luminosità, così alle due del pomeriggio il sito non diventa
 * un altro sito e la leggibilità non dipende mai dal momento della giornata.
 */

import { useEffect, useState } from "react";

type Momento = {
    nome: string;
    /** in alto, sopra le montagne */
    zenit: string;
    /** all'altezza delle creste */
    cresta: string;
    /** il riverbero basso, l'unica cosa che cambia davvero */
    riverbero: string;
    /** quanto è acceso il riverbero, da 0 a 1 */
    intensita: number;
};

const MOMENTI: Record<string, Momento> = {
    notteFonda: { nome: "notte fonda", zenit: "#03070E", cresta: "#071220", riverbero: "#123A52", intensita: 0.35 },
    alba:       { nome: "alba",        zenit: "#060C18", cresta: "#111A2C", riverbero: "#7A3A2E", intensita: 0.55 },
    mattino:    { nome: "mattino",     zenit: "#05101E", cresta: "#0C2036", riverbero: "#1E6E8C", intensita: 0.50 },
    pomeriggio: { nome: "pomeriggio",  zenit: "#061426", cresta: "#0E2740", riverbero: "#23A6E0", intensita: 0.45 },
    tramonto:   { nome: "tramonto",    zenit: "#070B16", cresta: "#161428", riverbero: "#E5322A", intensita: 0.60 },
    sera:       { nome: "sera",        zenit: "#04080F", cresta: "#081524", riverbero: "#1B4F72", intensita: 0.42 },
};

/** Il momento della giornata, dall'ora locale di chi guarda. */
export function momentoDi(ora: number): Momento {
    if (ora >= 5 && ora < 8) return MOMENTI.alba;
    if (ora >= 8 && ora < 13) return MOMENTI.mattino;
    if (ora >= 13 && ora < 18) return MOMENTI.pomeriggio;
    if (ora >= 18 && ora < 21) return MOMENTI.tramonto;
    if (ora >= 21 && ora < 24) return MOMENTI.sera;
    return MOMENTI.notteFonda;
}

/**
 * Il profilo del lago: due creste che si sovrappongono, quella dietro più
 * chiara. Non è il Lario vero preso da una mappa — è la sua forma, due rami
 * che scendono a picco sull'acqua, che è quello che si riconosce.
 */
function Creste() {
    return (
        <svg
            className="absolute inset-x-0 bottom-0 w-full h-[58vh] min-h-[340px]"
            viewBox="0 0 1200 600"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
        >
            {/* Cresta lontana: poche vette larghe, appena staccate dal cielo.
                Su telefono si vede solo la parte centrale, quindi le vette
                importanti stanno in mezzo. */}
            <path
                fill="var(--cresta-lontana)"
                d="M0,300 L150,206 L300,268 L470,150 L640,244 L800,178 L960,262 L1090,204 L1200,246 L1200,600 L0,600 Z"
            />
            {/* Cresta vicina: quasi nera, fianchi ripidi come quelli veri
                che scendono a picco sull'acqua. */}
            <path
                fill="var(--cresta-vicina)"
                d="M0,392 L120,318 L260,378 L400,262 L540,352 L700,286 L860,362 L1010,300 L1130,356 L1200,330 L1200,600 L0,600 Z"
            />

            {/* L'acqua: il riverbero del cielo che si spezza sulla superficie,
                tre righe che si accorciano scendendo. */}
            <g fill="var(--riga-acqua)">
                <rect x="0" y="452" width="1200" height="2" />
                <rect x="360" y="486" width="480" height="1.5" opacity="0.7" />
                <rect x="470" y="516" width="260" height="1.5" opacity="0.45" />
                <rect x="530" y="546" width="140" height="1.5" opacity="0.25" />
            </g>
        </svg>
    );
}

export function SfondoLario() {
    // Server e primo render usano la sera: è il momento in cui il sito viene
    // guardato di più, e così non c'è nessun salto di colore all'idratazione.
    const [momento, setMomento] = useState<Momento>(MOMENTI.sera);

    useEffect(() => {
        const aggiorna = () => setMomento(momentoDi(new Date().getHours()));
        aggiorna();
        // se qualcuno lascia la pagina aperta, alle 21 il cielo cambia da solo
        const id = setInterval(aggiorna, 10 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
            aria-hidden="true"
            style={{
                ["--cresta-lontana" as string]: momento.cresta,
                ["--cresta-vicina" as string]: momento.zenit,
                ["--riga-acqua" as string]: `${momento.riverbero}55`,
                background: `
                    radial-gradient(120% 60% at 50% 104%, ${momento.riverbero}${Math.round(momento.intensita * 90).toString(16).padStart(2, "0")} 0%, transparent 62%),
                    linear-gradient(180deg, ${momento.zenit} 0%, ${momento.cresta} 58%, ${momento.zenit} 100%)
                `,
                transition: "background 1200ms ease",
            }}
        >
            <Creste />

            {/* Grana di stampa su tutto: toglie la perfezione digitale al
                gradiente, che altrimenti si vede a bande sugli schermi buoni. */}
            <span
                className="absolute inset-0 opacity-[0.22]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg, rgba(237,232,220,0.05) 0 1px, transparent 1px 3px)",
                }}
            />
        </div>
    );
}
