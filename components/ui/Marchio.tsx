"use client";

/**
 * Il marchio, in due versioni.
 *
 * Il neon è nato per il buio: su fondo chiaro la luce non si vede, e infatti
 * di giorno spariva. Il lettering nuovo è l'opposto — cobalto e turchese
 * pieni, che sul chiaro tengono e sul buio si spengono. Quindi si scambiano
 * con la fascia oraria, che è già quello che fa il resto del sito.
 */

import Image from "next/image";
import { usaTema } from "@/lib/usa-tema";

export function Marchio({ className, priority }: { className?: string; priority?: boolean }) {
    const tema = usaTema();
    const chiaro = tema === "chiaro";

    return (
        <Image
            src={chiaro ? "/images/logo-lettering.png" : "/image/logo-mark.png"}
            alt="Fanta Laghèe"
            width={319}
            height={246}
            priority={priority}
            className={className}
        />
    );
}
