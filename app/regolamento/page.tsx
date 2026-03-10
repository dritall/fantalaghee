"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Trophy, BadgeEuro, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

// Reusable Accordion Component
const AccordionItem = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-white/5 rounded-xl bg-[#111] overflow-hidden mb-4 transition-all duration-300 hover:border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    {Icon && <Icon className="w-5 h-5 text-indigo-400" />}
                    <span className="text-lg font-semibold text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function RegolamentoPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">

            {/* Background Layer */}
            <div className="absolute inset-0 z-[-1]">
                <div className="absolute inset-0 bg-[#050505]/85 z-10" />
                <img src="/image/bg-regolamento.png" alt="Background" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
            </div>

            <div className="relative z-30 max-w-4xl mx-auto space-y-12">

                {/* Header / Call to Action */}
                <div className="text-center mb-12 space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Regolamento Ufficiale
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Le regole del gioco. Chiare, precise, indiscutibili.
                    </p>

                    <a
                        href="https://drive.google.com/file/d/1xLrx-tdMvLbsquIHVIUe_RpmKAn8-D3y/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-black font-semibold py-3 px-8 rounded-full hover:bg-gray-200 transition-transform active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Scarica PDF Completo
                    </a>
                </div>

                <div className="space-y-4">

                    {/* Novità */}
                    <AccordionItem title="Novità e Chiarimenti 2025/2026" icon={AlertTriangle} defaultOpen={true}>
                        <div className="space-y-6 pt-4">
                            <div className="bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20">
                                <h3 className="text-white font-semibold mb-2">🔄 Mercato Pre-Campionato Libero</h3>
                                <p className="text-sm">
                                    Dall'apertura del mercato (1 Agosto) fino a 15 min prima della prima giornata, potrete modificare la rosa <strong>illimitatamente</strong>.
                                    <br /><span className="text-red-400 block mt-2">Nota: Non sarà possibile realizzare plusvalenze.</span>
                                </p>
                            </div>
                            <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                                <h3 className="text-white font-semibold mb-2">💣 Il Colpo Proibito</h3>
                                <p className="text-sm">
                                    Una nuova mossa strategica: acquista un giocatore "bloccato".
                                    <strong>2 colpi a stagione</strong> (1 andata, 1 ritorno).
                                    Penalità: <span className="text-red-400 font-bold">-20 Punti</span> e <span className="text-red-400 font-bold">-1 Gol</span>.
                                </p>
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Regole Base */}
                    <AccordionItem title="Iscrizione e Partecipazione" icon={ShieldCheck}>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Quota:</strong> 100 🍆 entro la 3ª giornata.</li>
                            <li><strong>Piattaforma:</strong> Fantaclub.</li>
                            <li><strong>Voti:</strong> Fantaclub Classic (Media Milano/Roma).</li>
                        </ul>
                    </AccordionItem>

                    {/* Rosa & Mercato */}
                    <AccordionItem title="Rosa e Mercato" icon={BadgeEuro}>
                        <div className="space-y-4">
                            <p><strong>Budget:</strong> 600 Fantamilioni per 25 giocatori (3P, 8D, 8C, 5A).</p>
                            <hr className="border-white/10" />
                            <h4 className="text-white font-medium">Finestre di Mercato</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>15 cambi per il girone di andata.</li>
                                <li>15 cambi per il girone di ritorno.</li>
                                <li>I cambi non sono cumulabili.</li>
                            </ul>
                        </div>
                    </AccordionItem>

                    {/* Struttura Coppe */}
                    <AccordionItem title="Struttura Coppe (Novità)" icon={Trophy}>
                        <div className="space-y-4 text-sm">
                            <p className="text-white font-medium">Sistema 24/24 - Fasi del Torneo</p>
                            <ol className="list-decimal pl-5 space-y-3">
                                <li><strong>Qualificazione (G1-G9):</strong> Prime 9 giornate stabiliscono il Ranking (1-50).</li>
                                <li><strong>Gironi "Biscione" (G10-G18):</strong> 5 gironi da 10 squadre, equilibrati in base al ranking.</li>
                                <li><strong>Smistamento:</strong>
                                    <ul className="list-disc pl-5 mt-1 text-gray-500">
                                        <li>Super Lega: Prime 4 di ogni girone + 4 migliori quinte.</li>
                                        <li>Coppa UEFA: Peggiore quinta + classificate 6°-10° (eccetto le ultime 2 assolute).</li>
                                    </ul>
                                </li>
                                <li><strong>Fase Finale:</strong> Tabellone a 24 squadre con teste di serie che saltano il primo turno.</li>
                            </ol>
                        </div>
                    </AccordionItem>

                    {/* Bonus Malus */}
                    <AccordionItem title="Bonus & Malus" icon={Scale}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-green-500/5 p-4 rounded-lg border border-green-500/10">
                                <h4 className="text-green-400 font-bold mb-2 uppercase text-xs tracking-wider">Bonus</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between"><span>Gol Difensore</span> <span>+4.0</span></li>
                                    <li className="flex justify-between"><span>Gol Centroc.</span> <span>+3.5</span></li>
                                    <li className="flex justify-between"><span>Gol Attaccante</span> <span>+3.0</span></li>
                                    <li className="flex justify-between"><span>Assist</span> <span>+1.0</span></li>
                                    <li className="flex justify-between"><span>Rigore Parato</span> <span>+3.0</span></li>
                                </ul>
                            </div>
                            <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                                <h4 className="text-red-400 font-bold mb-2 uppercase text-xs tracking-wider">Malus</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between"><span>Gol Subito</span> <span>-1.0</span></li>
                                    <li className="flex justify-between"><span>Autogol</span> <span>-2.0</span></li>
                                    <li className="flex justify-between"><span>Rigore Sbagliato</span> <span>-3.0</span></li>
                                    <li className="flex justify-between"><span>Ammonizione</span> <span>-0.5</span></li>
                                    <li className="flex justify-between"><span>Espulsione</span> <span>-1.0</span></li>
                                </ul>
                            </div>
                        </div>
                    </AccordionItem>

                </div>
            </div>
        </main>
    );
}
