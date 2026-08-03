"use client";

/**
 * Il regista delle comparse in scroll.
 *
 * Un solo IntersectionObserver per tutta la pagina: guarda ogni elemento con
 * `data-rivela` e, appena entra nel viewport, gli mette la classe `.visibile`
 * — da lì è il CSS a portarlo su mettendo a fuoco. Una volta comparso resta,
 * così scorrendo su e giù non "lampeggia".
 *
 * Si riaggancia a ogni cambio pagina, perché il contenuto nuovo arriva dopo il
 * primo montaggio. Se il browser non ha l'observer, o l'utente chiede meno
 * movimento, mostra tutto subito senza animare.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RivelaOsservatore() {
    const pathname = usePathname();

    useEffect(() => {
        const ridotto =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        const mostraTutto = () =>
            document
                .querySelectorAll<HTMLElement>("[data-rivela]")
                .forEach((el) => el.classList.add("visibile"));

        if (ridotto || typeof IntersectionObserver === "undefined") {
            mostraTutto();
            return;
        }

        const osservatore = new IntersectionObserver(
            (voci) => {
                for (const voce of voci) {
                    if (voce.isIntersecting) {
                        voce.target.classList.add("visibile");
                        osservatore.unobserve(voce.target);
                    }
                }
            },
            // parte un filo prima che il blocco sia del tutto in vista
            { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
        );

        // il contenuto della nuova pagina può montare un tick dopo di noi.
        // L'observer, appena aggancia, fa scattare subito gli elementi già in
        // vista: quelli sotto la piega restano in attesa dello scroll.
        const id = window.setTimeout(() => {
            document
                .querySelectorAll<HTMLElement>("[data-rivela]:not(.visibile)")
                .forEach((el) => osservatore.observe(el));
        }, 0);

        return () => {
            window.clearTimeout(id);
            osservatore.disconnect();
        };
    }, [pathname]);

    return null;
}
