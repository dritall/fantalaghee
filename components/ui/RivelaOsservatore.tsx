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
            // Trigghera PRIMA che il blocco entri (bordo inferiore esteso del
            // 18%): così il contenuto è già comparso quando lo scroll lo
            // raggiunge, e non resta un vuoto invisibile-ma-ingombrante.
            { rootMargin: "0px 0px 18% 0px", threshold: 0 }
        );

        // Il contenuto della pagina (client component) può montare un frame
        // dopo di noi: aspettiamo il paint con due rAF, poi:
        //  1) chi è già dentro o appena sotto la piega lo mostriamo SUBITO,
        //     senza dipendere dal timing dell'observer (era la causa di
        //     testate che restavano invisibili all'apertura);
        //  2) il resto lo affidiamo all'observer, che lo rivela allo scroll.
        const aggancia = () => {
            const vh = window.innerHeight;
            document
                .querySelectorAll<HTMLElement>("[data-rivela]:not(.visibile)")
                .forEach((el) => {
                    if (el.getBoundingClientRect().top < vh * 1.05) {
                        el.classList.add("visibile");
                    } else {
                        osservatore.observe(el);
                    }
                });
        };

        // Il contenuto (client component) può montare qualche frame dopo di
        // noi: ci riproviamo su più giri, così le testate in cima non restano
        // mai invisibili per una questione di timing.
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(aggancia); });
        const t1 = window.setTimeout(aggancia, 250);

        // I blocchi che dipendono da una fetch (l'ultima Gazzetta in home, il
        // tabellone) compaiono nel DOM molto dopo di noi: se l'API è lenta
        // arrivano quando abbiamo già finito il giro, e restavano invisibili
        // occupando il loro spazio — un buco in mezzo alla pagina. Restiamo
        // in ascolto sul DOM e li agganciamo appena nascono.
        let rafMut = 0;
        const mutazioni = new MutationObserver(() => {
            if (rafMut) return;
            rafMut = requestAnimationFrame(() => { rafMut = 0; aggancia(); });
        });
        mutazioni.observe(document.body, { childList: true, subtree: true });
        // Rete di sicurezza: qualunque cosa sia ancora nascosta dopo 1.6s si
        // mostra comunque. Chi scrolla prima vede l'animazione (l'observer
        // scatta subito); il resto non resta mai bloccato.
        const t2 = window.setTimeout(() => {
            document
                .querySelectorAll<HTMLElement>("[data-rivela]:not(.visibile)")
                .forEach((el) => el.classList.add("visibile"));
        }, 1600);

        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            if (rafMut) cancelAnimationFrame(rafMut);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            mutazioni.disconnect();
            osservatore.disconnect();
        };
    }, [pathname]);

    return null;
}
