"use client";

import { useRef, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { SeasonLink } from "@/components/ui/SeasonLink";

export type NavTileData = {
    href: string;
    icon: LucideIcon;
    title: string;
    desc: string;
    /** colore d'accento della sezione, in esadecimale */
    hex: string;
};

/**
 * Riquadro di navigazione della home.
 *
 * Tre livelli sovrapposti: bordo a gradiente (1.5px), superficie scura,
 * riflettore che segue il puntatore. L'icona sta in una "targhetta" con
 * alone del colore della sezione, così i quattro riquadri si riconoscono
 * a colpo d'occhio anche senza leggere il titolo.
 */
export function NavTile({ item, index }: { item: NavTileData; index: number }) {
    const ref = useRef<HTMLDivElement>(null);

    const handleMove = (e: MouseEvent<HTMLDivElement>) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    const Icon = item.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -7, transition: { type: "spring", stiffness: 400, damping: 24 } }}
            className="h-full"
        >
            <SeasonLink href={item.href} className="block h-full group focus:outline-none">
                <div
                    className="relative h-full rounded-[1.75rem] p-[1.5px] overflow-hidden transition-shadow duration-300
                               shadow-[0_10px_34px_rgba(6,10,30,0.5)] group-hover:shadow-[0_18px_46px_rgba(6,10,30,0.7)]"
                    style={{
                        background: `linear-gradient(155deg, ${item.hex}77, rgba(255,255,255,0.10) 42%, rgba(255,255,255,0.03))`,
                    }}
                >
                    {/* filo di luce che scorre lungo il bordo in hover */}
                    <span
                        className="absolute inset-[-60%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-sweep"
                        style={{
                            backgroundImage: `conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 72%, #ffffff 86%, ${item.hex} 96%, transparent 100%)`,
                        }}
                    />

                    <div
                        ref={ref}
                        onMouseMove={handleMove}
                        className="spotlight relative h-full rounded-[calc(1.75rem-1.5px)] bg-gradient-to-b from-[#0c1228] to-[#080b1e]
                                   p-5 pt-6 flex flex-col overflow-hidden"
                        style={{ ["--spot" as string]: `${item.hex}2e` }}
                    >
                        {/* alone del colore in alto, sempre acceso ma discreto */}
                        <span
                            className="absolute -inset-px opacity-55 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(320px circle at 50% -12%, ${item.hex}38, transparent 62%)` }}
                        />
                        {/* riflesso sul bordo superiore */}
                        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

                        <div className="relative z-10 flex items-start justify-between mb-6">
                            <span
                                className="relative w-14 h-14 rounded-2xl flex items-center justify-center border
                                           transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5"
                                style={{
                                    backgroundColor: `${item.hex}1f`,
                                    borderColor: `${item.hex}55`,
                                    boxShadow: `inset 0 1px 0 ${item.hex}44, inset 0 0 18px ${item.hex}22`,
                                }}
                            >
                                <span
                                    className="absolute inset-0 rounded-2xl opacity-45 group-hover:opacity-100 blur-md transition-opacity duration-500 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 50% 50%, ${item.hex}80, transparent 70%)` }}
                                />
                                <Icon
                                    className="relative w-6 h-6"
                                    style={{ color: item.hex, filter: `drop-shadow(0 0 8px ${item.hex}cc)` }}
                                    strokeWidth={2.1}
                                />
                            </span>

                            <span
                                className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center
                                           text-white/40 transition-all duration-300
                                           group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white
                                           group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            >
                                <ArrowUpRight className="w-4 h-4" strokeWidth={2.4} />
                            </span>
                        </div>

                        <div className="relative z-10 mt-auto">
                            <h3 className="font-oswald text-[15px] font-black tracking-[0.1em] text-white uppercase leading-none">
                                {item.title}
                            </h3>
                            <p className="text-xs text-white/50 font-medium mt-2 leading-relaxed">{item.desc}</p>
                        </div>

                        {/* filetto colorato che si allunga in hover */}
                        <span
                            className="relative z-10 mt-4 block h-[2px] w-8 rounded-full transition-all duration-500 group-hover:w-full"
                            style={{ background: `linear-gradient(90deg, ${item.hex}, transparent)` }}
                        />
                    </div>
                </div>
            </SeasonLink>
        </motion.div>
    );
}
