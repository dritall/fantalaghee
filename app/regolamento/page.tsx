"use client";

import { useState } from "react";
import { Download, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Trophy, BadgeEuro, Scale, AlertTriangle, ListChecks } from "lucide-react";
import { ISCRIZIONE_FORM_URL } from "@/lib/seasons";

const AccordionItem = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="glass-card rounded-2xl overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left"
            >
                <div className="flex items-center gap-4">
                    {Icon && <Icon className="w-5 h-5 text-secondary flex-shrink-0" />}
                    <span className="text-base md:text-lg font-semibold text-[#10241a]">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
            </button>
            {isOpen && (
                <div className="p-5 md:p-6 pt-0 text-gray-600 leading-relaxed border-t border-black/5 mt-2 text-sm md:text-base">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function RegolamentoPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative">
            <div className="relative max-w-4xl mx-auto space-y-10">

                {/* Header */}
                <div className="text-center mb-8 space-y-5">
                    <span className="inline-block text-xs font-black tracking-[0.3em] uppercase px-4 py-1.5 rounded-full bg-primary/10 text-primary">
                        Seconda Edizione · Stagione 2026/27
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-3d-metallic">
                        Regolamento Ufficiale
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
                        Le regole del gioco, chiare e indiscutibili. Quasi invariate per i veterani —
                        le novità sono evidenziate qui sotto.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                        <a
                            href="/docs/regolamento-fantalaghee-2627.pdf"
                            download
                            className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-3 px-7 rounded-full hover:bg-primary/90 transition-transform active:scale-95 shadow-[0_8px_20px_rgba(22,163,74,0.3)]"
                        >
                            <Download className="w-4 h-4" />
                            Scarica PDF Completo
                        </a>
                        <a
                            href={ISCRIZIONE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white text-secondary font-semibold py-3 px-7 rounded-full border border-secondary/20 hover:bg-secondary/5 transition-transform active:scale-95"
                        >
                            Iscriviti alla Lega
                        </a>
                    </div>
                </div>

                <div className="space-y-4">

                    {/* Novità */}
                    <AccordionItem title="Novità 2026/2027" icon={Sparkles} defaultOpen={true}>
                        <div className="space-y-4 pt-2">
                            <p className="text-sm">
                                Per i veterani: il regolamento rimane <strong>praticamente identico</strong> a quello
                                della stagione 25/26. L'unica novità sostanziale:
                            </p>
                            <div className="bg-pink-500/5 p-4 rounded-xl border border-pink-500/15">
                                <h3 className="text-[#10241a] font-semibold mb-1">🏅 Nuovo Premio: Secondo Classificato di Giornata</h3>
                                <p className="text-sm">
                                    Non festeggia più solo il primo: ora anche il <strong>secondo miglior punteggio di giornata</strong>
                                    riceve un premio, ogni turno.
                                </p>
                            </div>
                            <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/15 text-sm">
                                I dettagli completi su premi e struttura definitiva delle coppe verranno comunicati
                                <strong> entro l'inizio della 5ª giornata</strong> di Serie A 26/27 (dipendono dal numero ufficiale di squadre iscritte).
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Iscrizione */}
                    <AccordionItem title="Iscrizione e Quota" icon={ShieldCheck}>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Quota:</strong> 110 🍆, da saldare <strong>prima dell'inizio della 1ª giornata</strong> — il mancato versamento comporta l'esclusione senza rimborso.</li>
                            <li><strong>Pagamento:</strong> a mano, o contattando gli organizzatori se davvero non possibile altrimenti.</li>
                            <li><strong>Procedura:</strong> compila il form → mail di conferma con link alla lega su Fantaclub → inserisci la rosa e gioca.</li>
                            <li><strong>Iscrizioni tardive:</strong> ammesse fino all'inizio della 3ª giornata. Chi si iscrive dopo la 1ª giornata riceve <strong>66 punti d'ufficio</strong> per ogni giornata saltata.</li>
                            <li><strong>Piattaforma:</strong> Fantaclub.</li>
                            <li><strong>Quotazioni giocatori:</strong> redazione Milano.</li>
                            <li><strong>Voti:</strong> Fantaclub Classic (media ponderata Milano/Roma) — i "Voti Live" durante le partite diventano definitivi la mattina dopo.</li>
                        </ul>
                    </AccordionItem>

                    {/* Rosa & Mercato */}
                    <AccordionItem title="Rosa, Formazione e Mercato" icon={BadgeEuro}>
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-[#10241a] font-medium mb-1">Rosa Iniziale</h4>
                                <p className="text-sm">Dal 1 Agosto 2026 fino a 15 minuti prima della 1ª giornata. Budget: <strong>600 Fantamilioni</strong> per 3 portieri, 8 difensori, 8 centrocampisti, 5 attaccanti.</p>
                            </div>
                            <hr className="border-black/5" />
                            <div>
                                <h4 className="text-[#10241a] font-medium mb-1">Formazione Settimanale</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>Moduli consentiti: 343, 352, 361, 433, 442, 451, 532, 541 — cambio modulo non consentito.</li>
                                    <li>11 riserve + 5 sostituzioni, priorità secondo l'ordine in panchina.</li>
                                    <li>Inserimento su Fantaclub fino a 15 minuti prima del primo anticipo; senza inserimento si usa la formazione precedente.</li>
                                    <li>Inserimento manuale via gruppo WhatsApp consentito 1 sola volta a stagione per squadra, solo per problemi tecnici.</li>
                                </ul>
                            </div>
                            <hr className="border-black/5" />
                            <div>
                                <h4 className="text-[#10241a] font-medium mb-1">Mercato Pre-Campionato Libero</h4>
                                <p className="text-sm">
                                    Dall'apertura (1 Agosto) fino a 15 minuti prima della 1ª giornata: modifiche <strong>illimitate</strong>, senza plusvalenze.
                                    <span className="text-red-500 block mt-1">Se Fantaclub dovesse consentire plusvalenze per errore, le rose verranno resettate e andranno reinserite una volta.</span>
                                </p>
                            </div>
                            <hr className="border-black/5" />
                            <div>
                                <h4 className="text-[#10241a] font-medium mb-1">Giocatori Bloccati</h4>
                                <p className="text-sm">
                                    Un giocatore è bloccato (non acquistabile) se posseduto da almeno <em>totale iscritti / 6</em> squadre,
                                    dopo l'inizio della 1ª giornata. Resta bloccato finché non scende sotto la soglia.
                                </p>
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Struttura Coppe */}
                    <AccordionItem title="Competizioni e Coppe" icon={Trophy}>
                        <div className="space-y-4 text-sm">
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Campionato Generale:</strong> classifica a punteggio per tutta la stagione.</li>
                                <li><strong>Fase Iniziale Coppe:</strong> qualificazione che costruisce le due competizioni finali.</li>
                                <li><strong>Coppa Super Lega:</strong> per le squadre più forti.</li>
                                <li><strong>Coppa UEFA:</strong> per le altre squadre.</li>
                            </ul>
                            <p className="text-gray-500">Struttura e date definitive verranno comunicate entro l'inizio della 5ª giornata, in base al numero di squadre iscritte.</p>
                        </div>
                    </AccordionItem>

                    {/* Premi */}
                    <AccordionItem title="Distribuzione Premi" icon={ListChecks}>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li><strong>Premi di Giornata:</strong> 1° e 2° classificato di ogni giornata + miglior punteggio stagionale.</li>
                            <li><strong>Premi Classifica Generale:</strong> prime posizioni del Campionato.</li>
                            <li><strong>Premi Coppe:</strong> vincitori di Super Lega e UEFA.</li>
                        </ul>
                    </AccordionItem>

                    {/* Bonus Malus */}
                    <AccordionItem title="Bonus, Malus e Modificatori" icon={Scale}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/15">
                                    <h4 className="text-green-600 font-bold mb-2 uppercase text-xs tracking-wider">Bonus</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between"><span>Gol Difensore/Portiere</span> <span>+4.0</span></li>
                                        <li className="flex justify-between"><span>Gol Centrocampista</span> <span>+3.5</span></li>
                                        <li className="flex justify-between"><span>Gol Attaccante</span> <span>+3.0</span></li>
                                        <li className="flex justify-between"><span>Rigore Parato</span> <span>+3.0</span></li>
                                        <li className="flex justify-between"><span>Assist</span> <span>+1.0</span></li>
                                    </ul>
                                </div>
                                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/15">
                                    <h4 className="text-red-500 font-bold mb-2 uppercase text-xs tracking-wider">Malus</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between"><span>Ammonizione</span> <span>-0.5</span></li>
                                        <li className="flex justify-between"><span>Espulsione</span> <span>-1.0</span></li>
                                        <li className="flex justify-between"><span>Gol Subito (Portiere)</span> <span>-1.0</span></li>
                                        <li className="flex justify-between"><span>Autogol</span> <span>-2.0</span></li>
                                        <li className="flex justify-between"><span>Rigore Sbagliato</span> <span>-3.0</span></li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/15">
                                <h4 className="text-[#10241a] font-semibold mb-2 text-sm">Modificatore Difesa</h4>
                                <p className="text-sm mb-2">Applicabile con 4+ difensori, basato sulla media voto di portiere + 3 migliori difensori:</p>
                                <ul className="space-y-1 text-sm">
                                    <li>🟢 Media ≥ 7 → <strong>+6 punti</strong></li>
                                    <li>🟡 Media ≥ 6.5 e &lt; 7 → <strong>+3 punti</strong></li>
                                    <li>🔵 Media ≥ 6 e &lt; 6.5 → <strong>+1 punto</strong></li>
                                </ul>
                            </div>

                            <div className="bg-violet-500/5 p-4 rounded-xl border border-violet-500/15">
                                <h4 className="text-[#10241a] font-semibold mb-2 text-sm">Soglie Gol per le Coppe</h4>
                                <p className="text-sm">
                                    &lt;66 punti = 0 gol · 66–70 = 1 gol · 70.5–74 = 2 gol · 74.5–78 = 3 gol · 78.5–82 = 4 gol (e così ogni 4 punti).
                                    Formazione delle coppe libera, indipendente da quella del campionato.
                                </p>
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Casi Speciali */}
                    <AccordionItem title="Casi Speciali: Rinvii e Anticipi" icon={AlertTriangle}>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>Partite nel range temporale della giornata: voti contati normalmente.</li>
                            <li>Partite fuori dal range: <strong>6 politico</strong> per tutti i giocatori coinvolti (anche infortunati, squalificati, riserve).</li>
                            <li>Il 6 politico conta normalmente nel modificatore di difesa.</li>
                        </ul>
                    </AccordionItem>

                </div>
            </div>
        </main>
    );
}
