/**
 * Il marchio.
 *
 * È il lettering nuovo, piatto — cobalto, turchese e l'accento arancione —
 * pensato per il fondo chiaro del sito. Prima ne esistevano due versioni che
 * si scambiavano con l'ora (il neon per il buio); ora che il sito è sempre di
 * giorno ne basta uno.
 */

import Image from "next/image";

export function Marchio({ className, priority }: { className?: string; priority?: boolean }) {
    return (
        <Image
            src="/images/logo-lettering.png"
            alt="Fanta Laghèe"
            width={319}
            height={246}
            priority={priority}
            className={className}
        />
    );
}
