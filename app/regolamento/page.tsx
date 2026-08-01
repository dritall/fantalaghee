"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download, ChevronDown, Sparkles, ShieldCheck, Trophy, BadgeEuro, Scale,
    AlertTriangle, ListChecks, UserPlus, Plus, Minus, ArrowRight,
} from "lucide-react";
import { ISCRIZIONE_FORM_URL, REGOLAMENTO_PDF_URL } from "@/lib/seasons";
import { cn } from "@/lib/utils";

type SectionId = "novita" | "iscrizione" | "rosa" | "coppe" | "premi" | "bonus" | "casi";

const sections: { id: SectionId; title: string; short: string; icon: any; accent: string }[] = [
    { id: "novita", title: "Novità 2026/2027", short: "Novità", icon: Sparkles, accent: "#ec4899" },
    { id: "iscrizione", title: "Iscrizione e Quota", short: "Iscrizione", icon: ShieldCheck, accent: "#22d3ee" },
    { id: "rosa", title: "Rosa, Formazione e Mercato", short: "Rosa", icon: BadgeEuro, accent: "#2563EB" },
    { id: "coppe", title: "Competizioni e Coppe", short: "Coppe", icon: Trophy, accent: "#facc15" },
    { id: "premi", title: "Distribuzione Premi", short: "Premi", icon: ListChecks, accent: "#10b981" },
    { id: "bonus", title: "Bonus, Malus e Modificatori", short: "Bonus/Malus", icon: Scale, accent: "#8b5cf6" },
    { id: "casi", title: "Rinvii e Anticipi", short: "Casi speciali", icon: AlertTriangle, accent: "#f97316" },
];

/* --------------------------------------------------------------------------
   Mattoncini riutilizzati dentro le sezioni
   -------------------------------------------------------------------------- */

function Rule({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="py-3 border-b border-white/[0.07] last:border-0">
            <dt className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90 mb-1">{label}</dt>
            <dd className="text-sm text-white/65 leading-relaxed">{children}</dd>
        </div>
    );
}

function Callout({
    tone = "info",
    title,
    children,
}: {
    tone?: "info" | "warn" | "new";
    title?: string;
    children: React.ReactNode;
}) {
    const tones = {
        info: "border-blue-400/25 bg-blue-500/[0.08] text-blue-100",
        warn: "border-red-400/25 bg-red-500/[0.08] text-red-100",
        new: "border-pink-400/25 bg-pink-500/[0.08] text-pink-100",
    } as const;

    return (
        <div className={cn("rounded-2xl border p-4", tones[tone])}>
            {title && <p className="text-sm font-black mb-1.5">{title}</p>}
            <div className="text-sm leading-relaxed opacity-90">{children}</div>
        </div>
    );
}

function ScoreRow({ label, value, positive }: { label: string; value: string; positive: boolean }) {
    return (
        <li className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0">
            <span className="text-sm text-white/65">{label}</span>
            <span
                className={cn(
                    "text-sm font-black tabular-nums px-2 py-0.5 rounded-md",
                    positive ? "text-emerald-300 bg-emerald-500/10" : "text-red-300 bg-red-500/10"
                )}
            >
                {value}
            </span>
        </li>
    );
}

/* --------------------------------------------------------------------------
   Fisarmonica
   -------------------------------------------------------------------------- */

function AccordionItem({
    id,
    title,
    icon: Icon,
    accent,
    isOpen,
    onToggle,
    children,
}: {
    id: string;
    title: string;
    icon: any;
    accent: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-32">
            <div
                className={cn(
                    "surface rounded-3xl overflow-hidden transition-all duration-300",
                    isOpen ? "border-white/20 shadow-[0_18px_50px_rgba(6,10,30,0.6)]" : "hover:border-white/[0.18]"
                )}
            >
                <button
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={`${id}-panel`}
                    className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
                >
                    <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300"
                        style={{
                            backgroundColor: `${accent}1f`,
                            borderColor: `${accent}44`,
                            boxShadow: isOpen ? `0 0 18px ${accent}33` : undefined,
                        }}
                    >
                        <Icon className="w-[18px] h-[18px]" style={{ color: accent }} strokeWidth={2.2} />
                    </span>

                    <span className="flex-1 min-w-0 text-base md:text-lg font-black text-white tracking-tight">{title}</span>

                    <ChevronDown
                        className={cn(
                            "w-5 h-5 text-white/35 shrink-0 transition-transform duration-300",
                            isOpen && "rotate-180 text-white/70"
                        )}
                    />
                </button>

                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            id={`${id}-panel`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 md:px-6 pb-6 pt-1 border-t border-white/[0.07]">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

/* --------------------------------------------------------------------------
   Pagina
   -------------------------------------------------------------------------- */

export default function RegolamentoPage() {
    const [open, setOpen] = useState<Record<string, boolean>>({ novita: true });
    const [active, setActive] = useState<SectionId>("novita");

    const allOpen = sections.every((s) => open[s.id]);

    const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    const toggleAll = () =>
        setOpen(allOpen ? {} : Object.fromEntries(sections.map((s) => [s.id, true])));

    const jumpTo = (id: SectionId) => {
        setOpen((prev) => ({ ...prev, [id]: true }));
        // Il pannello si apre con un'animazione: aspettando solo un frame lo
        // scorrimento partirebbe verso la posizione di prima dell'apertura e
        // finirebbe fuori bersaglio. Due frame bastano perché il layout sia
        // aggiornato, e `scroll-mt` sulla sezione tiene conto della navbar.
        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
            )
        );
    };

    // Sezione attualmente in vista: serve a evidenziarla nell'indice che segue.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (visible) setActive(visible.target.id as SectionId);
            },
            { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
        );
        sections.forEach((sec) => {
            const el = document.getElementById(sec.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <main className="min-h-screen pt-28 pb-16 px-4 md:px-8 relative">
            <div className="relative max-w-4xl mx-auto">

                {/* ===== TESTATA ===== */}
                <header className="text-center space-y-5 mb-10">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.26em] uppercase px-4 py-1.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/25">
                        Seconda Edizione · Stagione 2026/27
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black font-oswald uppercase tracking-tight text-3d-metallic">
                        Regolamento Ufficiale
                    </h1>
                    <p className="text-white/50 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        Le regole del gioco, chiare e indiscutibili. Quasi invariate per i veterani —
                        le novità sono evidenziate in cima.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                        <a
                            href={REGOLAMENTO_PDF_URL}
                            download
                            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-secondary to-cyan-500 px-7 py-3
                                       text-sm font-black uppercase tracking-wider text-white border border-white/15
                                       shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:brightness-110 active:scale-95 transition-all"
                        >
                            <Download className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                            Scarica PDF Completo
                        </a>
                        <a
                            href={ISCRIZIONE_FORM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-7 py-3
                                       text-sm font-bold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Iscriviti alla Lega
                        </a>
                    </div>
                </header>

                {/* ===== INDICE RAPIDO ===== */}
                <nav
                    aria-label="Indice del regolamento"
                    className="sticky top-[4.25rem] z-30 -mx-4 px-4 py-3 mb-6
                               bg-[#0b0824]/85 backdrop-blur-xl border-y border-white/[0.07]"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Salta a</span>
                        <span className="h-px flex-1 bg-white/10" />
                        <button
                            onClick={toggleAll}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 hover:text-cyan-300 transition-colors"
                        >
                            {allOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            {allOpen ? "Chiudi tutto" : "Apri tutto"}
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => jumpTo(s.id)}
                                aria-current={active === s.id ? "true" : undefined}
                                className={cn(
                                    "group shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-2",
                                    "text-xs font-bold transition-all",
                                    active === s.id
                                        ? "text-white bg-white/[0.12] border-white/25"
                                        : "text-white/55 bg-white/[0.04] border-white/10 hover:text-white hover:bg-white/[0.09] hover:border-white/20"
                                )}
                                style={active === s.id ? { boxShadow: `0 0 16px ${s.accent}33` } : undefined}
                            >
                                <s.icon className="w-3.5 h-3.5" style={{ color: s.accent }} />
                                {s.short}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* ===== SEZIONI ===== */}
                <div className="space-y-3">

                    <AccordionItem
                        id="novita"
                        title="Novità 2026/2027"
                        icon={Sparkles}
                        accent="#ec4899"
                        isOpen={!!open.novita}
                        onToggle={() => toggle("novita")}
                    >
                        <div className="space-y-4 pt-3">
                            <p className="text-sm text-white/65 leading-relaxed">
                                Per i veterani: il regolamento resta <strong className="text-white">praticamente identico</strong> a
                                quello della stagione 25/26. L&apos;unica novità sostanziale:
                            </p>
                            <Callout tone="new" title="🏅 Nuovo premio: secondo classificato di giornata">
                                Non festeggia più solo il primo: ora anche il{" "}
                                <strong>secondo miglior punteggio di giornata</strong> riceve un premio, ogni turno.
                            </Callout>
                            <Callout tone="info">
                                I dettagli completi su premi e struttura definitiva delle coppe verranno comunicati{" "}
                                <strong>entro l&apos;inizio della 5ª giornata</strong> di Serie A 26/27 — dipendono dal numero
                                ufficiale di squadre iscritte.
                            </Callout>
                        </div>
                    </AccordionItem>

                    <AccordionItem
                        id="iscrizione"
                        title="Iscrizione e Quota"
                        icon={ShieldCheck}
                        accent="#22d3ee"
                        isOpen={!!open.iscrizione}
                        onToggle={() => toggle("iscrizione")}
                    >
                        <dl className="pt-2">
                            <Rule label="Quota">
                                110 🍆, da saldare <strong className="text-white">prima dell&apos;inizio della 1ª giornata</strong>.
                                Il mancato versamento comporta l&apos;esclusione senza rimborso.
                            </Rule>
                            <Rule label="Pagamento">
                                A mano, oppure contattando gli organizzatori se davvero non è possibile altrimenti.
                            </Rule>
                            <Rule label="Procedura">
                                Compila il form → ricevi la mail di conferma con il link alla lega su Fantaclub → inserisci
                                la rosa e gioca.
                            </Rule>
                            <Rule label="Iscrizioni tardive">
                                Ammesse fino all&apos;inizio della 3ª giornata. Chi si iscrive dopo la 1ª giornata riceve{" "}
                                <strong className="text-white">66 punti d&apos;ufficio</strong> per ogni giornata saltata.
                            </Rule>
                            <Rule label="Piattaforma">Fantaclub.</Rule>
                            <Rule label="Quotazioni giocatori">Redazione Milano.</Rule>
                            <Rule label="Voti">
                                Fantaclub Classic (media ponderata Milano/Roma). I &ldquo;Voti Live&rdquo; durante le partite
                                diventano definitivi la mattina dopo.
                            </Rule>
                        </dl>
                    </AccordionItem>

                    <AccordionItem
                        id="rosa"
                        title="Rosa, Formazione e Mercato"
                        icon={BadgeEuro}
                        accent="#2563EB"
                        isOpen={!!open.rosa}
                        onToggle={() => toggle("rosa")}
                    >
                        <div className="space-y-5 pt-3">
                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90 mb-2">Rosa iniziale</h3>
                                <p className="text-sm text-white/65 leading-relaxed mb-3">
                                    Dal 1 Agosto 2026 fino a 15 minuti prima della 1ª giornata. Budget:{" "}
                                    <strong className="text-white">600 Fantamilioni</strong>.
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { n: 3, r: "Portieri" },
                                        { n: 8, r: "Difensori" },
                                        { n: 8, r: "Centrocamp." },
                                        { n: 5, r: "Attaccanti" },
                                    ].map((x) => (
                                        <div
                                            key={x.r}
                                            className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center"
                                        >
                                            <span className="block text-2xl font-black text-white tabular-nums leading-none">{x.n}</span>
                                            <span className="block text-[9px] font-bold uppercase tracking-[0.1em] text-white/40 mt-1.5">
                                                {x.r}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90 mb-2">
                                    Formazione settimanale
                                </h3>
                                <ul className="space-y-2 text-sm text-white/65">
                                    <li className="flex gap-2.5">
                                        <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-white/25" />
                                        <span>
                                            Moduli consentiti: 343, 352, 361, 433, 442, 451, 532, 541. Cambio modulo{" "}
                                            <strong className="text-white">non consentito</strong>.
                                        </span>
                                    </li>
                                    <li className="flex gap-2.5">
                                        <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-white/25" />
                                        <span>11 riserve + 5 sostituzioni, con priorità secondo l&apos;ordine in panchina.</span>
                                    </li>
                                    <li className="flex gap-2.5">
                                        <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-white/25" />
                                        <span>
                                            Inserimento su Fantaclub fino a 15 minuti prima del primo anticipo; senza inserimento
                                            vale la formazione precedente.
                                        </span>
                                    </li>
                                    <li className="flex gap-2.5">
                                        <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-white/25" />
                                        <span>
                                            Inserimento manuale via gruppo WhatsApp: 1 sola volta a stagione per squadra, solo per
                                            problemi tecnici.
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90 mb-2">
                                    Mercato pre-campionato libero
                                </h3>
                                <p className="text-sm text-white/65 leading-relaxed mb-3">
                                    Dall&apos;apertura (1 Agosto) fino a 15 minuti prima della 1ª giornata: modifiche{" "}
                                    <strong className="text-white">illimitate</strong>, senza plusvalenze.
                                </p>
                                <Callout tone="warn">
                                    Se Fantaclub dovesse consentire plusvalenze per errore, le rose verranno resettate e andranno
                                    reinserite una volta.
                                </Callout>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300/90 mb-2">
                                    Giocatori bloccati
                                </h3>
                                <p className="text-sm text-white/65 leading-relaxed">
                                    Un giocatore è bloccato (non acquistabile) se posseduto da almeno{" "}
                                    <em className="text-white/85">totale iscritti / 6</em> squadre, dopo l&apos;inizio della 1ª
                                    giornata. Resta bloccato finché non scende sotto la soglia.
                                </p>
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem
                        id="coppe"
                        title="Competizioni e Coppe"
                        icon={Trophy}
                        accent="#facc15"
                        isOpen={!!open.coppe}
                        onToggle={() => toggle("coppe")}
                    >
                        <div className="space-y-3 pt-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { t: "Campionato Generale", d: "Classifica a punteggio per tutta la stagione." },
                                    { t: "Fase Iniziale Coppe", d: "Qualificazione che costruisce le due competizioni finali." },
                                    { t: "Coppa Super Lega", d: "Per le squadre più forti." },
                                    { t: "Coppa UEFA", d: "Per tutte le altre squadre." },
                                ].map((c) => (
                                    <div key={c.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <p className="text-sm font-black text-white mb-1">{c.t}</p>
                                        <p className="text-xs text-white/50 leading-relaxed">{c.d}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed">
                                Struttura e date definitive verranno comunicate entro l&apos;inizio della 5ª giornata, in base al
                                numero di squadre iscritte.
                            </p>
                        </div>
                    </AccordionItem>

                    <AccordionItem
                        id="premi"
                        title="Distribuzione Premi"
                        icon={ListChecks}
                        accent="#10b981"
                        isOpen={!!open.premi}
                        onToggle={() => toggle("premi")}
                    >
                        <dl className="pt-2">
                            <Rule label="Premi di giornata">
                                1° e 2° classificato di ogni giornata, più il miglior punteggio stagionale.
                            </Rule>
                            <Rule label="Premi classifica generale">Prime posizioni del Campionato.</Rule>
                            <Rule label="Premi coppe">Vincitori di Super Lega e UEFA.</Rule>
                        </dl>
                    </AccordionItem>

                    <AccordionItem
                        id="bonus"
                        title="Bonus, Malus e Modificatori"
                        icon={Scale}
                        accent="#8b5cf6"
                        isOpen={!!open.bonus}
                        onToggle={() => toggle("bonus")}
                    >
                        <div className="space-y-4 pt-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4">
                                    <h4 className="text-emerald-300 font-black mb-2 uppercase text-[10px] tracking-[0.2em]">Bonus</h4>
                                    <ul>
                                        <ScoreRow label="Gol difensore / portiere" value="+4.0" positive />
                                        <ScoreRow label="Gol centrocampista" value="+3.5" positive />
                                        <ScoreRow label="Gol attaccante" value="+3.0" positive />
                                        <ScoreRow label="Rigore parato" value="+3.0" positive />
                                        <ScoreRow label="Assist" value="+1.0" positive />
                                    </ul>
                                </div>
                                <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-4">
                                    <h4 className="text-red-300 font-black mb-2 uppercase text-[10px] tracking-[0.2em]">Malus</h4>
                                    <ul>
                                        <ScoreRow label="Ammonizione" value="-0.5" positive={false} />
                                        <ScoreRow label="Espulsione" value="-1.0" positive={false} />
                                        <ScoreRow label="Gol subito (portiere)" value="-1.0" positive={false} />
                                        <ScoreRow label="Autogol" value="-2.0" positive={false} />
                                        <ScoreRow label="Rigore sbagliato" value="-3.0" positive={false} />
                                    </ul>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blue-400/20 bg-blue-500/[0.06] p-4">
                                <h4 className="text-white font-black mb-1.5 text-sm">Modificatore di difesa</h4>
                                <p className="text-sm text-white/60 mb-3 leading-relaxed">
                                    Applicabile con 4+ difensori, sulla media voto di portiere + 3 migliori difensori:
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { m: "≥ 7", p: "+6", c: "emerald" },
                                        { m: "6.5 – 7", p: "+3", c: "amber" },
                                        { m: "6 – 6.5", p: "+1", c: "sky" },
                                    ].map((x) => (
                                        <div key={x.m} className="rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                                                Media {x.m}
                                            </span>
                                            <span
                                                className={cn(
                                                    "block text-xl font-black tabular-nums mt-1",
                                                    x.c === "emerald" && "text-emerald-300",
                                                    x.c === "amber" && "text-amber-300",
                                                    x.c === "sky" && "text-sky-300"
                                                )}
                                            >
                                                {x.p}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
                                <h4 className="text-white font-black mb-2 text-sm">Soglie gol per le coppe</h4>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {[
                                        { s: "< 66", g: "0" },
                                        { s: "66 – 70", g: "1" },
                                        { s: "70.5 – 74", g: "2" },
                                        { s: "74.5 – 78", g: "3" },
                                        { s: "78.5 – 82", g: "4" },
                                    ].map((x) => (
                                        <span
                                            key={x.s}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5"
                                        >
                                            <span className="text-[11px] font-semibold text-white/55 tabular-nums">{x.s}</span>
                                            <span className="text-[11px] font-black text-violet-300 tabular-nums">
                                                {x.g} {x.g === "1" ? "gol" : "gol"}
                                            </span>
                                        </span>
                                    ))}
                                    <span className="inline-flex items-center rounded-lg border border-dashed border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/35">
                                        …e così ogni 4 punti
                                    </span>
                                </div>
                                <p className="text-xs text-white/45 leading-relaxed">
                                    La formazione delle coppe è libera e indipendente da quella del campionato.
                                </p>
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem
                        id="casi"
                        title="Casi Speciali: Rinvii e Anticipi"
                        icon={AlertTriangle}
                        accent="#f97316"
                        isOpen={!!open.casi}
                        onToggle={() => toggle("casi")}
                    >
                        <dl className="pt-2">
                            <Rule label="Partite dentro il range della giornata">Voti contati normalmente.</Rule>
                            <Rule label="Partite fuori dal range">
                                <strong className="text-white">6 politico</strong> per tutti i giocatori coinvolti — anche
                                infortunati, squalificati e riserve.
                            </Rule>
                            <Rule label="Effetto sul modificatore">Il 6 politico conta normalmente nel modificatore di difesa.</Rule>
                        </dl>
                    </AccordionItem>

                </div>

                {/* ===== CHIUSURA ===== */}
                <div className="mt-10 text-center">
                    <a
                        href={REGOLAMENTO_PDF_URL}
                        download
                        className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-3
                                   text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Download className="w-4 h-4 text-cyan-300 transition-transform duration-300 group-hover:translate-y-0.5" />
                        Scarica la versione PDF
                    </a>
                </div>
            </div>
        </main>
    );
}
