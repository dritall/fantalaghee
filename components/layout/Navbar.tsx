"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Trophy, Newspaper, BookOpen, Gavel, Activity, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { SeasonSwitcher } from "@/components/ui/SeasonSwitcher";

const navItems = [
    { name: "Classifica Lega", href: "/classifica", icon: Trophy },
    { name: "Il Verdetto", href: "/verdetto", icon: Gavel },
    { name: "Risultati Serie A", href: "/risultati-serie-a", icon: Activity },
    { name: "Statistiche Serie A", href: "/statistiche-serie-a", icon: BarChart3 },
    { name: "La Gazzetta", href: "/gazzetta", icon: Newspaper },
    { name: "Regolamento", href: "/regolamento", icon: BookOpen },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                scrolled
                    ? "bg-[#0d0a2a]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] py-1 md:py-1.5"
                    : "bg-[#0d0a2a]/45 backdrop-blur-md border-b border-white/5 py-1.5 md:py-3"
            )}
        >
            <div className="h-[2px] w-full gradient-bar" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-12 md:h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group">
                        <div className="relative w-auto h-8 md:h-11 flex items-center justify-center">
                            <Image
                                src="/image/logo-fantalaghee.png"
                                alt="Fantalaghee Logo"
                                width={120}
                                height={48}
                                className="object-contain h-full w-auto drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                                priority
                            />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white hidden sm:block">
                            FANTA <span className="text-gradient">LAGHÈE</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-0.5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-3.5 py-2 rounded-full text-[13px] font-medium transition-all relative",
                                        isActive
                                            ? "text-white"
                                            : "text-white/55 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute inset-0 -z-10 rounded-full bg-white/10 border border-white/15 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Season Switcher + Mobile Menu Button */}
                    <div className="flex items-center gap-2">
                        <Suspense fallback={null}>
                            <SeasonSwitcher />
                        </Suspense>
                        <div className="lg:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                                aria-label="Menu"
                            >
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-[#0d0a2a]/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-white/10 text-white border border-white/10"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
