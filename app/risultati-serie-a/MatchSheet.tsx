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

const EVENT_KIND: Record<NormalizedEvent["kind"], { icon: string; text: string }> = {
    goal: { icon: "⚽", text: "Gol" },
    "own-goal": { icon: "🥅", text: "Autogol" },
    "penalty-goal": { icon: "⚽", text: "Rigore" },
    "penalty-missed": { icon: "❌", text: "Rigore sbagliato" },
    yellow: { icon: "🟨", text: "Giallo" },
    red: { icon: "🟥", text: "Rosso" },
    sub: { icon: "🔄", text: "Cambio" },
    var: { icon: "🖥️", text: "VAR" },
    other: { icon: "•", text: "Evento" },
};

function Timeline({ events, colors }: { events: NormalizedEvent[]; colors: { home: string; away: string } }) {
    if (events.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Nessun evento registrato
            </p>
        );
    }

    let hs = 0;
    let as_ = 0;
    const rows = events.map((e) => {
        if (e.kind === "goal" || e.kind === "penalty-goal") {
            if (e.side === "home") hs += 1;
            else as_ += 1;
        } else if (e.kind === "own-goal") {
            if (e.side === "home") as_ += 1;
            else hs += 1;
        }
        const isGoal = e.kind === "goal" || e.kind === "penalty-goal" || e.kind === "own-goal";
        return { e, score: isGoal ? `${hs}–${as_}` : null as string | null };
    });

    const first = rows.filter(({ e }) => (e.half ?? (e.minute > 45 ? 2 : 1)) === 1);
    const second = rows.filter(({ e }) => (e.half ?? (e.minute > 45 ? 2 : 1)) === 2);

    const Block = ({ title, items }: { title: string; items: typeof rows }) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 py-2">
                    <span className="h-px flex-1 bg-[color:var(--filo)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--fumo)]">{title}</span>
                    <span className="h-px flex-1 bg-[color:var(--filo)]" />
                </div>
                <ol className="space-y-1">
                    {items.map(({ e, score }, i) => {
                        const isHome = e.side === "home";
                        const accent = isHome ? colors.home : colors.away;
                        const meta = EVENT_KIND[e.kind];
                        const isGoal = e.kind === "goal" || e.kind === "penalty-goal" || e.kind === "own-goal";
                        const isSub = e.kind === "sub";
                        return (
                            <li
                                key={`${e.minute}-${e.player}-${i}`}
                                className="flex items-stretch gap-2 rounded-xl border border-[color:var(--filo)] bg-[color:var(--velo)]/35 px-2.5 py-2"
                                style={{ borderLeftColor: isHome ? accent : undefined, borderRightColor: !isHome ? accent : undefined, borderLeftWidth: isHome ? 3 : 1, borderRightWidth: !isHome ? 3 : 1 }}
                            >
                                <span className="w-10 shrink-0 self-center text-center text-[11px] font-black tabular-nums text-[color:var(--fumo)]">
                                    {e.label}
                                </span>
                                <span
                                    className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full text-sm"
                                    style={{ backgroundColor: `${accent}22` }}
                                    aria-hidden
                                >
                                    {meta.icon}
                                </span>
                                <span className={cn("min-w-0 flex-1", !isHome && "text-right")}>
                                    {isSub ? (
                                        <>
                                            <span className="block text-[13px] font-black leading-tight text-[color:var(--calce)]">
                                                <span className="text-emerald-600">↑</span> {e.player}
                                            </span>
                                            {e.playerOut && (
                                                <span className="mt-0.5 block text-[11px] font-bold text-[color:var(--fumo)]">
                                                    <span className="text-red-400">↓</span> {e.playerOut}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className={cn("block leading-tight text-[color:var(--calce)]", isGoal ? "text-[14px] font-black" : "text-[13px] font-bold")}>
                                                {e.player}
                                            </span>
                                            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-[color:var(--fumo)]">
                                                {e.description && e.description.toLowerCase() !== meta.text.toLowerCase() ? e.description : meta.text}
                                                {e.assist ? ` · assist ${e.assist}` : ""}
                                            </span>
                                        </>
                                    )}
                                </span>
                                {score && (
                                    <span className="self-center shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-black tabular-nums" style={{ backgroundColor: accent, color: "#fff" }}>
                                        {score}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        );
    };

    return (
        <div className="space-y-4 py-1">
            <Block title="Primo tempo" items={first} />
            <Block title="Secondo tempo" items={second} />
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