"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle, Users, ListOrdered, BarChart3, Activity, Play } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { Pitch } from "./Pitch";
import { PlayerSheet } from "./PlayerSheet";
import { Momento, ticksFromApi, legaMatchUrl } from "./Momento";
import type { NormalizedMatch, NormalizedPlayer, NormalizedEvent } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";
import { matchColors } from "@/lib/team-colors";
import { usaTema } from "@/lib/usa-tema";
import { matchClock } from "@/lib/match-clock";
import { TeamStats } from "./TeamStats";

const TABS = [
    { id: "formazioni", label: "Formazioni", icon: Users },
    { id: "eventi", label: "Eventi", icon: ListOrdered },
    { id: "momento", label: "Momento", icon: Activity },
    { id: "statistiche", label: "Statistiche", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ eventi */

const EVENT_ICON: Record<NormalizedEvent["kind"], { icon: string; size?: "lg" }> = {
    goal: { icon: "⚽", size: "lg" },
    "own-goal": { icon: "🥅" },
    "penalty-goal": { icon: "⚽", size: "lg" },
    "penalty-missed": { icon: "❌" },
    yellow: { icon: "🟨" },
    red: { icon: "🟥" },
    sub: { icon: "🔄" },
    var: { icon: "🖥️" },
    other: { icon: "•" },
};

const EVENT_TAG: Partial<Record<NormalizedEvent["kind"], { text: string; className: string }>> = {
    "penalty-goal": { text: "Rig.", className: "text-emerald-700 bg-emerald-500/12 border-emerald-500/30" },
    "own-goal": { text: "Aut.", className: "text-red-600 bg-red-500/12 border-red-500/30" },
    "penalty-missed": { text: "Rigore sbagliato", className: "text-orange-300 bg-orange-500/10 border-orange-400/25" },
    var: { text: "VAR", className: "text-violet-300 bg-violet-500/10 border-violet-400/25" },
};

/* ========================================================= TIMELINE EVENTI */


function Timeline({ events, colors }: { events: NormalizedEvent[]; colors: { home: string; away: string } }) {
    if (events.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Nessun evento registrato
            </p>
        );
    }

    return (
        <div>
            {/* Intestazione colonne */}
            <div className="flex items-center pb-2 mb-2 border-b border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                <span className="flex-1 text-left">CASA</span>
                <span className="w-12 text-center shrink-0">MIN</span>
                <span className="flex-1 text-right">TRASFERTA</span>
            </div>

            <div className="relative">
                {/* Linea verticale centrale */}
                <span className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

                <ol className="relative space-y-2">
                    {events.map((e, i) => {
                        const isHome = e.side === "home";
                        const tag = EVENT_TAG[e.kind];
                        const accent = isHome ? colors.home : colors.away;
                        const icon = EVENT_ICON[e.kind];
                        const isGoal = e.kind === "goal" || e.kind === "penalty-goal";
                        const isCard = e.kind === "yellow" || e.kind === "red";
                        const isSub = e.kind === "sub";
                        const kind = e.kind;

                        const iconCircle = (
                            <span className="relative z-10 flex flex-col items-center shrink-0">
                                <span
                                    className={cn(
                                        "rounded-full flex items-center justify-center border bg-[color:var(--fondale)]",
                                        isGoal
                                            ? "w-9 h-9 md:w-10 md:h-10 text-base md:text-lg"
                                            : isCard
                                              ? "w-7 h-7 text-xs md:text-sm"
                                              : "w-7 h-7 text-xs",
                                        isGoal ? "border-yellow-400/40" : "border-[color:var(--filo)]"
                                    )}
                                    style={
                                        isGoal
                                            ? { boxShadow: `0 0 20px ${accent}55` }
                                            : isCard
                                              ? { boxShadow: `0 0 10px ${kind === "red" ? "#ef4444" : "#eab308"}44` }
                                              : undefined
                                    }
                                >
                                    <span className={cn(isGoal && "animate-pulse drop-shadow-[0_0_6px_rgba(255,200,0,0.7)]")}>
                                        {icon.icon}
                                    </span>
                                </span>
                            </span>
                        );

                        // Contenuto testuale
                        const textContent = (
                            <span className="min-w-0 flex flex-col">
                                {isSub ? (
                                    <>
                                        <span className="text-[12px] md:text-[13px] font-black text-[color:var(--calce)] flex items-center gap-1 leading-tight">
                                            <span className="text-emerald-600 text-xs">↑</span>
                                            <span className="truncate">{e.player}</span>
                                        </span>
                                        {e.playerOut && (
                                            <span className="text-[10px] font-bold text-[color:var(--fumo)] flex items-center gap-1 mt-0.5">
                                                <span className="text-red-400 text-[10px]">↓</span>
                                                <span className="truncate">{e.playerOut}</span>
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <span
                                            className={cn(
                                                "text-[color:var(--calce)] truncate max-w-full flex items-center gap-1 leading-tight",
                                                isGoal ? "text-sm md:text-base font-black" : "text-[12px] font-bold"
                                            )}
                                        >
                                            <span className="truncate">{e.player}</span>
                                            {isGoal && (
                                                <span className="drop-shadow-[0_0_8px_rgba(255,200,0,0.6)] text-base md:text-lg animate-pulse shrink-0">
                                                    💥
                                                </span>
                                            )}
                                        </span>
                                        {e.assist && (
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--fumo)] mt-0.5">
                                                {e.assist}
                                            </span>
                                        )}
                                        {e.description && (
                                            <span className="text-[9px] italic text-[color:var(--fumo)] mt-0.5 leading-snug max-w-[180px]">
                                                {e.description}
                                            </span>
                                        )}
                                    </>
                                )}
                                {tag && (
                                    <span
                                        className={cn(
                                            "mt-1 w-fit rounded border px-1.5 py-[1px] text-[8px] font-black uppercase tracking-wider",
                                            tag.className
                                        )}
                                    >
                                        {tag.text}
                                    </span>
                                )}
                            </span>
                        );

                        return (
                            <li
                                key={`${e.minute}-${e.player}-${i}`}
                                className="relative flex items-start gap-2"
                            >
                                {/* Colonna home (sinistra) */}
                                {isHome ? (
                                    <span className="flex-1 flex items-start justify-end gap-2 text-right">
                                        {textContent}
                                        {iconCircle}
                                    </span>
                                ) : (
                                    <span className="flex-1" />
                                )}

                                {/* Minuto centrale */}
                                <span className="relative z-10 w-12 shrink-0 flex justify-center">
                                    <span className="text-[9px] font-black text-[color:var(--fumo)] tabular-nums bg-[color:var(--fondale)] px-1.5 py-0.5 rounded-full border border-[color:var(--filo)]">
                                        {e.label}
                                    </span>
                                </span>

                                {/* Colonna away (destra) */}
                                {!isHome ? (
                                    <span className="flex-1 flex items-start gap-2">
                                        {iconCircle}
                                        {textContent}
                                    </span>
                                ) : (
                                    <span className="flex-1" />
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ modale */

export function MatchSheet({
    fixture,
    details,
    loading,
    error,
    stagione,
    onClose,
}: {
    fixture: any;
    details: { normalized?: NormalizedMatch | null; stats?: any; momentum?: any; highlightsUrl?: string | null; header?: any; events?: any } | null;
    loading: boolean;
    error: string | null;
    stagione: string;
    onClose: () => void;
}) {
    const tema = usaTema();
    const [tab, setTab] = useState<TabId>("formazioni");
    const [selected, setSelected] = useState<{ player: NormalizedPlayer; team: string; accent: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const normalized = details?.normalized || null;
    const momentumTicks = useMemo(() => ticksFromApi(details?.momentum), [details?.momentum]);

    useEffect(() => {
        setTab("formazioni");
        setSelected(null);
    }, [fixture?.matchId, fixture?.id]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [tab]);

    if (!fixture) return null;

    const home = fixture.homeTeam || fixture.home;
    const away = fixture.awayTeam || fixture.away;
    const homeName = normalized?.home.name || home?.shortName || home?.officialName || "Casa";
    const awayName = normalized?.away.name || away?.shortName || away?.officialName || "Ospite";
    const src = details?.header || fixture;
    const hs = src.providerHomeScore ?? src.homeScore ?? fixture.providerHomeScore ?? fixture.homeScore;
    const as_ = src.providerAwayScore ?? src.awayScore ?? fixture.providerAwayScore ?? fixture.awayScore;
    const clock = matchClock(src);
    const played = clock.isFinished || (hs !== null && hs !== undefined && !clock.isUpcoming);
    const isLive = clock.isLive;

    // Colori presi dagli stemmi, schiariti per il fondo notturno e resi
    // diversi fra loro quando le due squadre giocano su tinte simili.
    const colors = matchColors(homeName, awayName, tema);

    // Stadio dall'header API
    const stadiumName = fixture?.stadiumName || fixture?.stadium || fixture?.venue || details?.header?.stadiumName || null;
    const stadiumCity = fixture?.cityName || fixture?.city || fixture?.location || details?.header?.cityName || null;
    const highlightsUrl = details?.highlightsUrl || null;
    const matchId = fixture?.matchId || fixture?.id || details?.header?.matchId;
    const commentaryUrl = legaMatchUrl(matchId, homeName, awayName, "commentary");
    const actionAreas = details?.events?.actionAreas || details?.header?.actionAreas || [];

    const selectPlayer = (side: "home" | "away") => (p: NormalizedPlayer) =>
        setSelected({
            player: p,
            team: side === "home" ? homeName : awayName,
            accent: side === "home" ? colors.home : colors.away,
        });

    return (
        <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[100] bg-[color:var(--pece)]/90 backdrop-blur-md data-[state=open]:animate-fade-up" />

                <Dialog.Content
                    className="fixed z-[101] inset-x-0 bottom-0 md:inset-0 md:m-auto
                               h-[92vh] md:h-fit md:max-h-[88vh] w-full md:max-w-3xl
                               flex flex-col overflow-hidden
                               rounded-t-[var(--ro-l)] md:rounded-[var(--ro-l)] border border-[color:var(--filo)] bg-[color:var(--fondale)] text-[color:var(--calce)]
                               shadow-[0_-24px_70px_rgba(0,0,0,0.7)] md:shadow-[0_40px_100px_rgba(0,0,0,0.75)]
                               focus:outline-none"
                    aria-describedby={undefined}
                >
                    <Dialog.Title className="sr-only">
                        {homeName} contro {awayName}
                    </Dialog.Title>

                    {/* maniglia del foglio, solo su telefono */}
                    <span className="md:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-[color:var(--filo-alto)] shrink-0" />

                    {/* ---------------- tabellone ---------------- */}
                    <header className="relative shrink-0 px-4 pt-4 pb-4 border-b border-[color:var(--filo)]">
                        {/* i due aloni sono i colori degli stemmi: si capisce
                            di chi è la partita ancora prima di leggere i nomi */}
                        <span
                            className="absolute inset-0 opacity-70 pointer-events-none"
                            style={{
                                backgroundImage:
                                    `radial-gradient(360px circle at 8% -35%, ${colors.home}3d, transparent 70%),` +
                                    `radial-gradient(360px circle at 92% -35%, ${colors.away}3d, transparent 70%)`,
                            }}
                        />
                        <span
                            className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
                            style={{ backgroundImage: `linear-gradient(90deg, ${colors.home}, ${colors.away})` }}
                        />

                        <div className="relative flex items-center justify-center mb-3">
                            {isLive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/35 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-red-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                    {clock.label && clock.label !== "LIVE" ? `Live ${clock.label}` : "Live"}
                                </span>
                            ) : (
                                <span className="rounded-full bg-[color:var(--velo-alto)] border border-[color:var(--filo)] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[color:var(--fumo)]">
                                    {played ? "Terminata" : "Da giocare"}
                                </span>
                            )}
                        </div>

                        <div className="relative flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
                                <TeamLogo team={home} className="w-12 h-12 md:w-14 md:h-14" />
                                <span
                                    className="text-[10px] md:text-xs font-black uppercase tracking-wider text-center leading-tight line-clamp-2"
                                    style={{ color: colors.home }}
                                >
                                    {homeName}
                                </span>
                            </div>

                            <div className="shrink-0 px-2 text-center">
                                <span className="block text-4xl md:text-5xl font-black tabular-nums tracking-tighter">
                                    {played ? `${hs}–${as_}` : "VS"}
                                </span>
                                {normalized?.home.formation && normalized?.away.formation && (
                                    <span className="mt-1 block text-[9px] font-bold tabular-nums text-[color:var(--fumo)]">
                                        {normalized.home.formation} · {normalized.away.formation}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
                                <TeamLogo team={away} className="w-12 h-12 md:w-14 md:h-14" />
                                <span
                                    className="text-[10px] md:text-xs font-black uppercase tracking-wider text-center leading-tight line-clamp-2"
                                    style={{ color: colors.away }}
                                >
                                    {awayName}
                                </span>
                            </div>
                        </div>
                        {stadiumName && (
                            <div className="relative mt-2 flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-wider text-[color:var(--fumo)]">
                                <span>🏟️</span>
                                <span>{stadiumName}{stadiumCity ? ` · ${stadiumCity}` : ""}</span>
                            </div>
                        )}
                        {highlightsUrl && (
                            <a
                                href={highlightsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative mt-3 mx-auto flex items-center justify-center gap-1.5 w-fit px-3 py-1.5 rounded-full
                                           text-[10px] font-black uppercase tracking-[0.16em]
                                           bg-[color:var(--vermiglio)] text-[color:var(--su-colore)]"
                            >
                                <Play className="w-3 h-3 fill-current" />
                                Highlights
                            </a>
                        )}
                    </header>

                    {/* ---------------- schede ---------------- */}
                    {/* Le schede: su telefono solo l'icona (la scheda si stringe),
                        icona + testo da sm in su. L'etichetta resta accessibile
                        via aria-label anche quando è nascosta. */}
                    <nav className="relative shrink-0 flex px-3 py-2 gap-1 border-b border-[color:var(--filo)]">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                aria-pressed={tab === t.id}
                                aria-label={t.label}
                                title={t.label}
                                className={cn(
                                    "relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full",
                                    "text-[11px] font-black uppercase tracking-[0.12em] transition-colors",
                                    tab === t.id ? "text-[color:var(--calce)]" : "text-[color:var(--fumo)] hover:text-[color:var(--calce)]/80"
                                )}
                            >
                                {tab === t.id && (
                                    <motion.span
                                        layoutId="match-tab"
                                        className="absolute inset-0 rounded-full bg-[color:var(--velo-alto)] border border-[color:var(--filo)]"
                                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                                    />
                                )}
                                <t.icon className="relative w-[18px] h-[18px] sm:w-4 sm:h-4" />
                                <span className="relative hidden sm:inline">{t.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* ---------------- contenuto ---------------- */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-24">
                                <div className="relative">
                                    <Loader2 className="w-9 h-9 animate-spin" style={{ color: colors.home }} />
                                    <span className="absolute inset-0 blur-xl rounded-full animate-pulse" style={{ backgroundColor: `${colors.home}40` }} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[color:var(--fumo)]">
                                    Carico il tabellino…
                                </p>
                            </div>
                        ) : error || !normalized ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                                <AlertTriangle className="w-9 h-9 text-[color:var(--fumo)]" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                                    {error ? "Dati non raggiungibili" : "Tabellino non disponibile"}
                                </p>
                                <p className="max-w-xs text-[11px] leading-relaxed text-[color:var(--fumo)]">
                                    {error ||
                                        "Lega Serie A non ha ancora pubblicato formazioni e statistiche per questa partita."}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={tab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {tab === "formazioni" && (
                                        <Pitch
                                            home={normalized.home}
                                            away={normalized.away}
                                            colors={colors}
                                            onSelectPlayer={(p) => {
                                                const inHome =
                                                    normalized.home.starters.some((x) => x.id === p.id) ||
                                                    normalized.home.bench.some((x) => x.id === p.id);
                                                selectPlayer(inHome ? "home" : "away")(p);
                                            }}
                                        />
                                    )}
                                    {tab === "eventi" && <Timeline events={normalized.events} colors={colors} />}
                                    {tab === "momento" && (
                                        <Momento
                                            ticks={momentumTicks}
                                            events={normalized.events}
                                            colors={colors}
                                            homeName={homeName}
                                            awayName={awayName}
                                            commentaryUrl={commentaryUrl}
                                            liveMinute={isLive ? clock.minute : null}
                                        />
                                    )}
                                    {tab === "statistiche" && (
                                        <TeamStats
                                            raw={details?.stats}
                                            colors={colors}
                                            homeName={homeName}
                                            awayName={awayName}
                                            actionAreas={actionAreas}
                                            possessionBreakdowns={details?.events?.possessionBreakdowns}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    <Dialog.Close
                        aria-label="Chiudi"
                        className="glass-forte absolute top-4 right-4 w-9 h-9 rounded-full
                                   flex items-center justify-center text-[color:var(--calce)]/80
                                   hover:text-[color:var(--su-colore)] hover:bg-[color:var(--vermiglio)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>

            <PlayerSheet
                player={selected?.player ?? null}
                teamName={selected?.team ?? ""}
                accent={selected?.accent ?? colors.home}
                stagione={stagione}
                onClose={() => setSelected(null)}
            />
        </Dialog.Root>
    );
}