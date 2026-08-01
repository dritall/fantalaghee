"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle, Users, ListOrdered, BarChart3 } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { Pitch } from "./Pitch";
import { PlayerSheet } from "./PlayerSheet";
import type { NormalizedMatch, NormalizedPlayer, NormalizedEvent } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";

const HOME_ACCENT = "#22d3ee";
const AWAY_ACCENT = "#f59e0b";

const TABS = [
    { id: "formazioni", label: "Formazioni", icon: Users },
    { id: "eventi", label: "Eventi", icon: ListOrdered },
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
    "penalty-goal": { text: "Rig.", className: "text-emerald-300 bg-emerald-500/10 border-emerald-400/25" },
    "own-goal": { text: "Aut.", className: "text-red-300 bg-red-500/10 border-red-400/25" },
    "penalty-missed": { text: "Rigore sbagliato", className: "text-orange-300 bg-orange-500/10 border-orange-400/25" },
    var: { text: "VAR", className: "text-violet-300 bg-violet-500/10 border-violet-400/25" },
};

/* --------------------------------------------------------- timeline eventi */

function Timeline({ events }: { events: NormalizedEvent[] }) {
    if (events.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/25">
                Nessun evento registrato
            </p>
        );
    }

    return (
        <div>
            <div className="relative">
                {/* Linea temporale centrale */}
                <span className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent -translate-x-1/2" />

                <ol className="relative space-y-1.5">
                    {events.map((e, i) => {
                        const isHome = e.side === "home";
                        const tag = EVENT_TAG[e.kind];
                        const accent = isHome ? HOME_ACCENT : AWAY_ACCENT;
                        const icon = EVENT_ICON[e.kind];
                        const isGoal = e.kind === "goal" || e.kind === "penalty-goal";
                        const isCard = e.kind === "yellow" || e.kind === "red";
                        const isSub = e.kind === "sub";

                        return (
                            <li
                                key={`${e.minute}-${e.player}-${i}`}
                                className={cn(
                                    "relative flex items-start gap-2.5 md:gap-4 py-2 md:py-2.5",
                                    isHome ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                {/* Lato testo evento */}
                                <span
                                    className={cn(
                                        "flex-1 min-w-0 flex flex-col",
                                        isHome ? "items-end text-right" : "items-start text-left"
                                    )}
                                >
                                    {isSub ? (
                                        <>
                                            <span className="text-[13px] font-black text-white flex items-center gap-1.5 leading-tight">
                                                <span className="text-emerald-400 shrink-0">↑</span>
                                                <span className="truncate">{e.player}</span>
                                            </span>
                                            {e.playerOut && (
                                                <span className="text-[11px] font-bold text-white/40 flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-red-400 shrink-0">↓</span>
                                                    <span className="truncate">{e.playerOut}</span>
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                className={cn(
                                                    "text-white truncate max-w-full flex items-center gap-1 leading-tight",
                                                    isGoal ? "text-base md:text-lg font-black" : "text-[13px] font-bold"
                                                )}
                                            >
                                                {!isHome && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
                                                <span className="truncate">{e.player}</span>
                                                {isHome && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
                                                {isGoal && (
                                                    <span className="drop-shadow-[0_0_10px_rgba(255,200,0,0.6)] text-lg md:text-xl animate-pulse shrink-0">
                                                        💥
                                                    </span>
                                                )}
                                                {e.assist && !isGoal && (
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider ml-1">
                                                        (A: {e.assist})
                                                    </span>
                                                )}
                                            </span>
                                            {e.assist && isGoal && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/35 mt-0.5">
                                                    Assist: <span className="text-white/60 font-black">{e.assist}</span>
                                                </span>
                                            )}
                                            {e.description && (
                                                <span className="text-[10px] italic text-white/30 mt-0.5 leading-snug max-w-[200px]">
                                                    {e.description}
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {tag && (
                                        <span
                                            className={cn(
                                                "mt-1.5 inline-block w-fit rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                                                tag.className
                                            )}
                                        >
                                            {tag.text}
                                        </span>
                                    )}
                                </span>

                                {/* Icona centrale */}
                                <span className="relative z-10 flex flex-col items-center shrink-0">
                                    <span
                                        className={cn(
                                            "rounded-full flex items-center justify-center border bg-[#0d1330]",
                                            isGoal
                                                ? "w-10 h-10 md:w-12 md:h-12 text-lg md:text-xl"
                                                : isCard
                                                  ? "w-8 h-8 text-sm"
                                                  : "w-8 h-8 text-xs",
                                            isGoal ? "border-yellow-400/40" : "border-white/10"
                                        )}
                                        style={
                                            isGoal
                                                ? { boxShadow: `0 0 28px ${accent}55, 0 0 60px ${accent}22` }
                                                : isCard
                                                  ? { boxShadow: `0 0 12px ${kind === "red" ? "#ef4444" : "#eab308"}44` }
                                                  : undefined
                                        }
                                    >
                                        <span className={cn(isGoal && "animate-pulse drop-shadow-[0_0_8px_rgba(255,200,0,0.7)]")}>
                                            {icon.icon}
                                        </span>
                                    </span>
                                    <span className="mt-1 text-[9px] font-black text-white/50 tabular-nums">{e.label}</span>
                                </span>

                                {/* Spazio vuoto lato opposto (per bilanciare) */}
                                <span className="flex-1 hidden md:block" />
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}

/* -------------------------------------------------------- statistiche team */

type TeamStatRow = { label: string; home: number; away: number; percent: boolean };

/** Riduce le molte forme del blocco teamstats a righe confrontabili. */
function buildTeamStats(raw: any): TeamStatRow[] {
    const list: any[] = Array.isArray(raw) ? raw : raw?.stats || [];
    if (!Array.isArray(list) || list.length === 0) return [];

    const map = new Map<string, { label: string; home: any; away: any; percent: boolean }>();
    list.forEach((s: any) => {
        const id = String(s?.statsId || s?.id || s?.name || "").toLowerCase();
        if (!id) return;
        map.set(id, {
            label: s?.statsLabel || s?.label || id,
            home: s?.statsValueHome ?? s?.home ?? s?.value,
            away: s?.statsValueAway ?? s?.away ?? s?.value,
            percent: id.includes("perc") || String(s?.statsLabel || "").includes("%"),
        });
    });

    const pick = (aliases: string[], label: string): TeamStatRow | null => {
        for (const a of aliases) {
            for (const key of Array.from(map.keys())) {
                if (key === a || key.includes(a)) {
                    const v = map.get(key)!;
                    const h = Number(v.home);
                    const aw = Number(v.away);
                    if (!Number.isFinite(h) && !Number.isFinite(aw)) return null;
                    if (h === 0 && aw === 0) return null;
                    return { label, home: h || 0, away: aw || 0, percent: v.percent };
                }
            }
        }
        return null;
    };

    const sep = (title: string): TeamStatRow => ({ label: `__sep__${title}`, home: -1, away: -1, percent: false });

    const addSection = (title: string, stats: (TeamStatRow | null)[]) => {
        const rows = stats.filter(Boolean) as TeamStatRow[];
        if (rows.length === 0) return;
        if (out.length > 0) out.push(sep(""));
        out.push(sep(title));
        rows.forEach(r => out.push(r));
    };

    const out: TeamStatRow[] = [];

    addSection("POSSESSO", [
        pick(["possession-perc", "possessionpercentage"], "Possesso palla"),
    ]);

    addSection("TIRO", [
        pick(["totalscoringatt", "shots"], "Tiri totali"),
        pick(["ontargetscoringatt", "shots-on-target"], "Tiri in porta"),
        pick(["shots-at-goal-inside-box", "attemptsibox"], "Tiri dentro area"),
        pick(["shots-at-goal-outside-box", "attemptsobox"], "Tiri fuori area"),
        pick(["blocked-scoring-att", "blockedshots"], "Tiri bloccati"),
        pick(["big-chances", "bigchancecreated"], "Grandi occasioni"),
        pick(["hitwoodwork", "hitwoodwork", "shots-crossbar", "shots-post"], "Legni"),
    ]);

    addSection("xG & PUNTI", [
        pick(["expected-goals", "expectedgoals"], "xG"),
        pick(["goalassist", "assists"], "Assist"),
        pick(["own-goals"], "Autogol"),
        pick(["penalty-goals"], "Gol su rigore"),
    ]);

    addSection("PASSAGGI", [
        pick(["totalpass", "total-passes"], "Passaggi"),
        pick(["passes-completed", "accuratepass"], "Passaggi riusciti"),
        pick(["accurate-pass-perc", "passing-accuracy-perc"], "Precisione passaggi"),
        pick(["key-passes", "totalattassist"], "Passaggi chiave"),
        pick(["crosses", "totalcross"], "Cross"),
        pick(["crosses-successful", "accuratecross"], "Cross riusciti"),
        pick(["cornertaken", "corners"], "Corner"),
    ]);

    addSection("DIFESA", [
        pick(["totaltackle", "tackles"], "Contrasti"),
        pick(["tackles-successful", "wontackle"], "Contrasti riusciti"),
        pick(["tackles-won-perc", "tackleswonperc"], "% Contrasti vinti"),
        pick(["interception", "interceptions"], "Intercetti"),
        pick(["totalclearance", "clearences"], "Spazzate"),
        pick(["saves"], "Parate"),
    ]);

    addSection("DUELLI", [
        pick(["duels-won", "duelwon"], "Duelli vinti"),
        pick(["aerial-duels-won", "aerialduelswon", "aerialwon"], "Duelli aerei vinti"),
        pick(["aerial-duels-won-perc", "aerialduelswonperc"], "% Duelli aerei vinti"),
    ]);

    addSection("DISCIPLINA", [
        pick(["fouls", "foulsconceded"], "Falli commessi"),
        pick(["fouls-suffered", "foulssuffered"], "Falli subiti"),
        pick(["totaloffside", "offsides"], "Fuorigioco"),
        pick(["totalyellowcard", "yellow-cards"], "Ammonizioni"),
        pick(["totalredcard", "red-cards"], "Espulsioni"),
    ]);

    addSection("FISICO & SPAZIO", [
        pick(["touches-opponent-box", "touchesinoppbox"], "Tocchi area avversaria"),
        pick(["sprints"], "Sprint"),
        pick(["distance-covered"], "Distanza (km)"),
        pick(["touches"], "Tocchi totali"),
    ]);

    return out;
}

function TeamStats({ rows }: { rows: TeamStatRow[] }) {
    if (rows.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/25">
                Statistiche non disponibili
            </p>
        );
    }

    return (
        <div className="space-y-4 py-2">
            {rows.map((r) => {
                // Se la label inizia con __sep__, è un separatore di sezione
                if (r.label.startsWith("__sep__")) {
                    const sectionName = r.label.slice(7);
                    if (!sectionName) {
                        // Separatore vuoto
                        return <div key={r.label} className="h-px bg-white/6 my-1" />;
                    }
                    return (
                        <div key={r.label} className="flex items-center gap-2 pt-1">
                            <span className="h-px flex-1 bg-white/10" />
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25 shrink-0">
                                {sectionName}
                            </span>
                            <span className="h-px flex-1 bg-white/10" />
                        </div>
                    );
                }

                const total = r.percent ? 100 : r.home + r.away;
                const homePct = total > 0 ? (r.home / total) * 100 : 50;
                const awayPct = r.percent ? 100 - homePct : total > 0 ? (r.away / total) * 100 : 50;
                const homeLeads = r.home > r.away;
                const awayLeads = r.away > r.home;

                return (
                    <div key={r.label}>
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                            <span
                                className="text-sm font-black tabular-nums w-12"
                                style={{ color: homeLeads ? HOME_ACCENT : "rgba(255,255,255,0.45)" }}
                            >
                                {r.home}
                                {r.percent ? "%" : ""}
                            </span>
                            <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                                {r.label}
                            </span>
                            <span
                                className="text-sm font-black tabular-nums w-12 text-right"
                                style={{ color: awayLeads ? AWAY_ACCENT : "rgba(255,255,255,0.45)" }}
                            >
                                {r.away}
                                {r.percent ? "%" : ""}
                            </span>
                        </div>
                        <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.07]">
                            <span
                                className="h-full transition-all duration-500"
                                style={{ width: `${homePct}%`, backgroundColor: HOME_ACCENT }}
                            />
                            <span
                                className="h-full transition-all duration-500"
                                style={{ width: `${awayPct}%`, backgroundColor: AWAY_ACCENT }}
                            />
                        </div>
                    </div>
                );
            })}
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
    details: { normalized?: NormalizedMatch | null; stats?: any } | null;
    loading: boolean;
    error: string | null;
    stagione: string;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<TabId>("formazioni");
    const [selected, setSelected] = useState<{ player: NormalizedPlayer; team: string; accent: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const normalized = details?.normalized || null;
    const teamStats = useMemo(() => buildTeamStats(details?.stats), [details?.stats]);

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
    const hs = fixture.providerHomeScore ?? fixture.homeScore;
    const as_ = fixture.providerAwayScore ?? fixture.awayScore;
    const played = hs !== null && hs !== undefined;
    const isLive = fixture.matchStatus === "Playing" || fixture.matchStatus === "LIVE";

    // Stadio dall'header API
    const stadiumName = fixture?.stadiumName || fixture?.stadium || fixture?.venue || null;
    const stadiumCity = fixture?.cityName || fixture?.city || fixture?.location || null;

    const selectPlayer = (side: "home" | "away") => (p: NormalizedPlayer) =>
        setSelected({
            player: p,
            team: side === "home" ? homeName : awayName,
            accent: side === "home" ? HOME_ACCENT : AWAY_ACCENT,
        });

    return (
        <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#04060f]/90 backdrop-blur-md data-[state=open]:animate-fade-up" />

                <Dialog.Content
                    className="fixed z-[101] inset-x-0 bottom-0 md:inset-0 md:m-auto
                               h-[92vh] md:h-fit md:max-h-[88vh] w-full md:max-w-3xl
                               flex flex-col overflow-hidden
                               rounded-t-[2rem] md:rounded-[2rem] border border-white/12 bg-[#080c20] text-white
                               shadow-[0_-24px_70px_rgba(0,0,0,0.7)] md:shadow-[0_40px_100px_rgba(0,0,0,0.75)]
                               focus:outline-none"
                    aria-describedby={undefined}
                >
                    <Dialog.Title className="sr-only">
                        {homeName} contro {awayName}
                    </Dialog.Title>

                    {/* maniglia del foglio, solo su telefono */}
                    <span className="md:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 shrink-0" />

                    {/* ---------------- tabellone ---------------- */}
                    <header className="relative shrink-0 px-4 pt-4 pb-4 border-b border-white/[0.07]">
                        <span
                            className="absolute inset-0 opacity-60 pointer-events-none"
                            style={{
                                background:
                                    "radial-gradient(420px circle at 50% -30%, rgba(56,189,248,0.16), transparent 70%)",
                            }}
                        />

                        <div className="relative flex items-center justify-center mb-3">
                            {isLive ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-400/30 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-red-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                    Live
                                </span>
                            ) : (
                                <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                                    {played ? "Terminata" : "Da giocare"}
                                </span>
                            )}
                        </div>

                        <div className="relative flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
                                <TeamLogo team={home} className="w-12 h-12 md:w-14 md:h-14" />
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-center leading-tight text-white/85 line-clamp-2">
                                    {homeName}
                                </span>
                            </div>

                            <div className="shrink-0 px-2 text-center">
                                <span className="block text-4xl md:text-5xl font-black tabular-nums tracking-tighter">
                                    {played ? `${hs}–${as_}` : "VS"}
                                </span>
                                {normalized?.home.formation && normalized?.away.formation && (
                                    <span className="mt-1 block text-[9px] font-bold tabular-nums text-white/25">
                                        {normalized.home.formation} · {normalized.away.formation}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
                                <TeamLogo team={away} className="w-12 h-12 md:w-14 md:h-14" />
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-center leading-tight text-white/85 line-clamp-2">
                                    {awayName}
                                </span>
                            </div>
                        </div>
                        {stadiumName && (
                            <div className="relative mt-2 flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-wider text-white/35">
                                <span>🏟️</span>
                                <span>{stadiumName}{stadiumCity ? ` · ${stadiumCity}` : ""}</span>
                            </div>
                        )}
                    </header>

                    {/* ---------------- schede ---------------- */}
                    <nav className="relative shrink-0 flex px-3 py-2 gap-1 border-b border-white/[0.07]">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                aria-pressed={tab === t.id}
                                className={cn(
                                    "relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl",
                                    "text-[10px] font-black uppercase tracking-[0.12em] transition-colors",
                                    tab === t.id ? "text-white" : "text-white/35 hover:text-white/70"
                                )}
                            >
                                {tab === t.id && (
                                    <motion.span
                                        layoutId="match-tab"
                                        className="absolute inset-0 rounded-xl bg-white/[0.09] border border-white/12"
                                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                                    />
                                )}
                                <t.icon className="relative w-3.5 h-3.5" />
                                <span className="relative">{t.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* ---------------- contenuto ---------------- */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-24">
                                <div className="relative">
                                    <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
                                    <span className="absolute inset-0 bg-cyan-400/25 blur-xl rounded-full animate-pulse" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                                    Carico il tabellino…
                                </p>
                            </div>
                        ) : error || !normalized ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                                <AlertTriangle className="w-9 h-9 text-white/20" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                                    {error ? "Dati non raggiungibili" : "Tabellino non disponibile"}
                                </p>
                                <p className="max-w-xs text-[11px] leading-relaxed text-white/30">
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
                                            onSelectPlayer={(p) => {
                                                const inHome =
                                                    normalized.home.starters.some((x) => x.id === p.id) ||
                                                    normalized.home.bench.some((x) => x.id === p.id);
                                                selectPlayer(inHome ? "home" : "away")(p);
                                            }}
                                        />
                                    )}
                                    {tab === "eventi" && <Timeline events={normalized.events} />}
                                    {tab === "statistiche" && <TeamStats rows={teamStats} />}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    <Dialog.Close
                        aria-label="Chiudi"
                        className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/10 bg-black/40 backdrop-blur
                                   flex items-center justify-center text-white/60
                                   hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>

            <PlayerSheet
                player={selected?.player ?? null}
                teamName={selected?.team ?? ""}
                accent={selected?.accent ?? HOME_ACCENT}
                stagione={stagione}
                onClose={() => setSelected(null)}
            />
        </Dialog.Root>
    );
}