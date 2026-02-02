"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, FileText, Newspaper, Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Classifica",
    description: "Consulta la classifica aggiornata in tempo reale.",
    href: "/classifica",
    icon: Trophy,
    color: "text-yellow-400",
    bg: "hover:bg-yellow-400/10",
    border: "hover:border-yellow-400/50"
  },
  {
    title: "Regolamento",
    description: "Scopri le regole ufficiali della lega.",
    href: "/regolamento",
    icon: FileText,
    color: "text-indigo-400",
    bg: "hover:bg-indigo-400/10",
    border: "hover:border-indigo-400/50"
  },
  {
    title: "La Gazzetta",
    description: "Leggi le ultime notizie e gli approfondimenti.",
    href: "/gazzetta",
    icon: Newspaper,
    color: "text-rose-400",
    bg: "hover:bg-rose-400/10",
    border: "hover:border-rose-400/50"
  },
  {
    title: "Il Verdetto",
    description: "Analisi dettagliata della giornata e premi.",
    href: "/verdetto",
    icon: Gavel,
    color: "text-green-400",
    bg: "hover:bg-green-400/10",
    border: "hover:border-green-400/50"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { stiffness: 50 } }
};

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center px-4">

      {/* Background Layer - Futuristic Neon Field */}
      {/* Background Layer - FINAL NEON FIELD V2 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#050505]/85 z-10" />
        <Image
          src="/image/bg-field-neon-v2.png"
          alt="Background"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
      </div>

      <div className="relative z-30 max-w-5xl w-full flex flex-col items-center gap-12 pt-20 pb-12">

        {/* Hero Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center space-y-6"
        >
          {/* PURE CSS NEON LOGO - FINAL TYPOGRAPHY */}
          <div className="relative z-50 flex flex-col md:flex-row items-baseline justify-center gap-4 md:gap-8 p-10 select-none">
            {/* FANTA: Blue->Purple Gradient, Stroke effect */}
            <h1 className="font-oswald text-7xl md:text-[10rem] font-bold tracking-tighter uppercase relative z-10"
              style={{
                textShadow: "0 0 20px rgba(0, 100, 255, 0.6)"
              }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                style={{ WebkitTextStroke: "2px rgba(255,255,255,0.1)" }}>
                FANTA
              </span>
            </h1>

            {/* LAGHÈE: Gold Cursive, Neon Glow */}
            <h1 className="font-cursive text-6xl md:text-[9rem] font-normal tracking-wide relative z-10 -rotate-6 transform translate-y-2 md:translate-y-0"
              style={{
                textShadow: "0 0 30px rgba(255, 170, 0, 0.6), 0 0 10px rgba(255, 215, 0, 0.8)"
              }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                Laghèe
              </span>
            </h1>

            {/* Ambient Glow behind logo */}
            <div className="absolute inset-0 bg-blue-900/20 blur-[120px] z-0 rounded-full opacity-40 pointer-events-none" />
          </div>

        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4"
        >
          {sections.map((section) => (
            <motion.div key={section.title} variants={itemVariants}>
              <Link href={section.href} className="block group">
                <div className={cn(
                  "relative overflow-hidden p-8 rounded-2xl bg-[#111]/80 backdrop-blur-md border border-white/5 transition-all duration-500",
                  "group-hover:translate-y-[-5px] group-hover:shadow-2xl",
                  section.bg, section.border
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <section.icon className={cn("w-8 h-8 transition-colors", section.color)} />
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-transform duration-300" />
                  </div>
                  <h2 className="text-2xl font-bold font-oswald text-white mb-2 uppercase tracking-wide">
                    {section.title}
                  </h2>
                  <p className="text-gray-400 font-serif group-hover:text-gray-200 transition-colors">
                    {section.description}
                  </p>

                  {/* Neon Glow Effect on Hover */}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    section.color.replace('text', 'text') // Trick to keep color consistency
                  )} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
