"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Menu, X, Trophy, Newspaper, BookOpen, Gavel, Activity, UserPlus, Download, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { SeasonSwitcher } from "@/components/ui/SeasonSwitcher";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL, LEAGUE_TAGLINE } from "@/lib/seasons";
import { SeasonLink } from "@/components/ui/SeasonLink";

const navItems = [
    { name: "Classifica", full: "Classifica Lega", href: "/classifica", icon: Trophy },
    { name: "Verdetto", full: "Il Verdetto", href: "/verdetto", icon: Gavel },
    { name: "Serie A", full: "Risultati Serie A", href: "/risultati-serie-a", icon: Activity },
    { name: "Gazzetta", full: "La Gazzetta", href: "/gazzetta", icon: Newspaper },
    { name: "Regolamento", full: "Regolamento", href: "/regolamento", icon: BookOpen },
];

/** I link del menu devono portarsi dietro la stagione selezionata. */
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <>
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <SeasonLink
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            "group relative px-3.5 py-2 text-[12px] font-black uppercase tracking-[0.08em] whitespace-nowrap transition-colors duration-200",
                            isActive ? "text-white" : "text-white/55 hover:text-white"
                        )}
                    >
                        <span className="relative z-10 flex items-center gap-1.5">
                            <item.icon
                                className={cn(
                                    "w-[15px] h-[15px] transition-all duration-300",
                                    isActive ? "text-cyan-300" : "text-white/35 group-hover:text-cyan-300/80"
                                )}
                                strokeWidth={2.2}
                            />
                            {item.name}
                        </span>

                        {/* sfondo che scivola sulla voce attiva */}
                        {isActive && (
                            <motion.span
                                layoutId="navbar-indicator"
                                className="absolute inset-0 rounded-full bg-white/[0.09] border border-white/15 shadow-[0_0_22px_rgba(34,211,238,0.22)]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 34 }}
                            />
                        )}
                        {/* alone soffuso in hover, solo sulle voci non attive */}
                        {!isActive && (
                            <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/[0.06] transition-colors duration-200" />
                        )}
                    </SeasonLink>
                );
            })}
        </>
    );
}

/** Sottile barra di avanzamento della lettura, agganciata al bordo della navbar. */
function ScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        };
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden" aria-hidden="true">
            <div className="h-full w-full gradient-bar opacity-35" />
            <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-300 to-secondary shadow-[0_0_10px_rgba(34,211,238,0.7)] transition-[width] duration-150 ease-out"
                style={{ width: `${progress * 100}%` }}
            />
        </div>
    );
}

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 16);
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Il menu mobile si chiude cambiando pagina o con Esc
    useEffect(() => setIsOpen(false), [pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen]);

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                scrolled
                    ? "bg-[color:var(--pece)]/92 backdrop-blur-xl border-b-2 border-[color:var(--calce)]/25"
                    : "bg-gradient-to-b from-[color:var(--pece)]/85 to-transparent backdrop-blur-md border-b-2 border-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    className={cn(
                        "flex items-center justify-between gap-4 transition-all duration-300",
                        scrolled ? "h-14 md:h-16" : "h-16 md:h-20"
                    )}
                >
                    {/* ============ MARCHIO ============
                        Il logo è già il lettering "Fanta Laghèe": ripeterlo
                        accanto in due colori faceva a pugni con l'insegna al
                        neon. Resta il marchio, affiancato dal solo sottotitolo. */}
                    <SeasonLink
                        href="/"
                        className="group flex items-center gap-3 min-w-0 shrink-0"
                        aria-label="Fanta Laghèe — home"
                    >
                        <span className="relative flex items-center">
                            <span className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.35),transparent_70%)]" />
                            <Image
                                src="/image/logo-mark.png"
                                alt="Fanta Laghèe"
                                width={319}
                                height={246}
                                priority
                                className={cn(
                                    "relative w-auto object-contain transition-all duration-300",
                                    "drop-shadow-[0_0_16px_rgba(99,102,241,0.45)] group-hover:drop-shadow-[0_0_22px_rgba(56,189,248,0.6)]",
                                    scrolled ? "h-9 md:h-10" : "h-10 md:h-12"
                                )}
                            />
                        </span>

                        <span className="hidden sm:flex flex-col leading-none pl-3 border-l border-white/10">
                            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
                                {LEAGUE_TAGLINE}
                            </span>
                            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-white/30">
                                Lega privata · dal 2025
                            </span>
                        </span>
                    </SeasonLink>

                    {/* ============ MENU DESKTOP ============ */}
                    <div className="hidden lg:flex items-center gap-0.5 border-2 border-[color:var(--filo)] bg-[color:var(--fondale)]/70 p-1 backdrop-blur-sm">
                        <NavLinks />
                    </div>

                    {/* ============ AZIONI ============ */}
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={REGOLAMENTO_PDF_URL}
                            download
                            className="group hidden md:inline-flex items-center gap-2 border-2 border-[color:var(--calce)]/30 bg-[color:var(--fondale)]/70 px-3 py-1.5
                                       text-[11px] font-black uppercase tracking-[0.1em] text-[color:var(--calce)]/85 backdrop-blur-md transition-all duration-200
                                       hover:bg-[color:var(--calce)] hover:text-[color:var(--pece)] hover:border-[color:var(--calce)]"
                            title="Scarica il regolamento in PDF"
                        >
                            <Download className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
                            <span className="hidden xl:inline">Scarica Regolamento</span>
                            <span className="xl:hidden">Regolamento</span>
                        </a>

                        <Suspense fallback={null}>
                            <SeasonSwitcher />
                        </Suspense>

                        <button
                            onClick={() => setIsOpen((v) => !v)}
                            className="lg:hidden p-2 border-2 border-[color:var(--filo)] text-[color:var(--calce)]/80 hover:text-[color:var(--pece)] hover:bg-[color:var(--calce)] hover:border-[color:var(--calce)] transition-colors"
                            aria-label={isOpen ? "Chiudi il menu" : "Apri il menu"}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            <ScrollProgress />

            {/* ============ MENU MOBILE ============ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:hidden bg-[#0b0824]/97 backdrop-blur-2xl border-t border-white/10 overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-8 space-y-1.5 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
                            <SeasonLink
                                href="/"
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-2xl text-base font-semibold transition-colors",
                                    pathname === "/"
                                        ? "bg-white/10 text-white border border-white/10"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Home className="w-5 h-5" />
                                Home
                            </SeasonLink>

                            <div className="flex flex-col gap-1.5 [&>a]:!rounded-2xl [&>a]:!px-3 [&>a]:!py-3 [&>a]:!text-base">
                                <NavLinks onNavigate={() => setIsOpen(false)} />
                            </div>

                            <div className="pt-4 space-y-2">
                                <a
                                    href={ISCRIZIONE_FORM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl text-base font-black uppercase tracking-wider
                                               bg-gradient-to-r from-secondary to-cyan-500 text-white shadow-[0_8px_24px_rgba(37,99,235,0.4)] border border-white/20"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Iscriviti alla Lega
                                </a>
                                <a
                                    href={REGOLAMENTO_PDF_URL}
                                    download
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl text-base font-bold uppercase tracking-wider
                                               bg-white/5 text-white border border-white/15 hover:bg-white/10 transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    Scarica Regolamento
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
