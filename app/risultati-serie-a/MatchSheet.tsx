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

/* -------------------------------------------------------- statistiche team */

type TeamStatRow = { label: string; home: number; away: number; percent: boolean; group: string };

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

    const pick = (aliases: string[], label: string, group: string): TeamStatRow | null => {
        for (const a of aliases) {
            for (const key of Array.from(map.keys())) {
                if (key === a || (a.length > 6 && key.includes(a))) {
                    const v = map.get(key)!;
                    const h = Number(v.home);
                    const aw = Number(v.away);
                    if (!Number.isFinite(h) && !Number.isFinite(aw)) return null;
                    if (h === 0 && aw === 0) return null;
                    return { label, home: h || 0, away: aw || 0, percent: v.percent, group };
                }
            }
        }
        return null;
    };

    const pickExact = (ids: string[], label: string, group: string): TeamStatRow | null => {
        for (const a of ids) {
            const v = map.get(a.toLowerCase());
            if (!v) continue;
            const h = Number(v.home);
            const aw = Number(v.away);
            if (!Number.isFinite(h) && !Number.isFinite(aw)) continue;
            if (h === 0 && aw === 0) continue;
            return { label, home: h || 0, away: aw || 0, percent: v.percent || a.includes("perc"), group };
        }
        return pick(ids, label, group);
    };

    const sep = (title: string, group: string): TeamStatRow => ({ label: `__sep__${title}`, home: -1, away: -1, percent: false, group });

    const addSection = (title: string, group: string, stats: (TeamStatRow | null)[]) => {
        const rows = stats.filter(Boolean) as TeamStatRow[];
        if (rows.length === 0) return;
        if (out.length > 0) out.push(sep("", group));
        out.push(sep(title, group));
        rows.forEach((r) => out.push(r));
    };

    const out: TeamStatRow[] = [];

    addSection("GENERALE", "generale", [
        pickExact(["possession-perc", "possessionpercentage"], "Possesso palla", "generale"),
        pickExact(["fieldtilt"], "Field tilt", "generale"),
        pickExact(["goals-scored", "goals"], "Gol", "generale"),
        pickExact(["expected-goals"], "xG", "generale"),
        pickExact(["expectedgoalagainst"], "xG subiti", "generale"),
        pickExact(["timeaheadperc"], "% tempo in vantaggio", "generale"),
        pickExact(["timebehindperc"], "% tempo in svantaggio", "generale"),
        pickExact(["effectiveTime"], "Tempo effettivo (min)", "generale"),
    ]);

    addSection("ATTACCO", "attacco", [
        pick(["totalscoringatt", "shots"], "Tiri totali", "attacco"),
        pickExact(["shots-on-goal", "ontargetscoringatt"], "Tiri in porta", "attacco"),
        pick(["shots-at-goal-inside-box", "attemptsibox"], "Tiri dentro area", "attacco"),
        pick(["shots-at-goal-outside-box", "attemptsobox"], "Tiri fuori area", "attacco"),
        pick(["blocked-scoring-att", "blocked-shots", "blockedshots"], "Tiri bloccati", "attacco"),
        pick(["big-chances", "bigchancecreated"], "Grandi occasioni", "attacco"),
        pickExact(["chances-created"], "Occasioni create", "attacco"),
        pickExact(["expected-goals"], "xG", "attacco"),
        pick(["goalassist", "assists"], "Assist", "attacco"),
        pick(["hitwoodwork", "shots-crossbar", "shots-post"], "Legni", "attacco"),
        pick(["touches-opponent-box", "touchesinoppbox"], "Tocchi area avversaria", "attacco"),
        pickExact(["penareaentries"], "Entrate in area", "attacco"),
        pick(["cornertaken", "corners"], "Corner", "attacco"),
        pick(["penalty-goals"], "Gol su rigore", "attacco"),
        pick(["own-goals"], "Autogol", "attacco"),
    ]);

    addSection("PASSAGGI", "passaggi", [
        pick(["totalpass", "total-passes"], "Passaggi", "passaggi"),
        pick(["passes-completed", "accuratepass", "accurate-pass"], "Passaggi riusciti", "passaggi"),
        pick(["accurate-pass-perc", "passing-accuracy-perc"], "Precisione passaggi", "passaggi"),
        pick(["key-passes", "totalattassist"], "Passaggi chiave", "passaggi"),
        pick(["crosses", "totalcross"], "Cross", "passaggi"),
        pick(["crosses-successful", "accuratecross"], "Cross riusciti", "passaggi"),
        pickExact(["totallongballs"], "Lanci lunghi", "passaggi"),
        pickExact(["accuratelongballs"], "Lanci lunghi riusciti", "passaggi"),
        pickExact(["totalthroughball"], "Filtri", "passaggi"),
        pickExact(["accuratethroughball"], "Filtri riusciti", "passaggi"),
    ]);

    addSection("DIFESA", "difesa", [
        pick(["totaltackle", "tackles", "tackles-total"], "Contrasti", "difesa"),
        pick(["tackles-successful", "wontackle"], "Contrasti riusciti", "difesa"),
        pick(["tackles-won-perc", "tackleswonperc"], "% Contrasti vinti", "difesa"),
        pick(["interception", "interceptions"], "Intercetti", "difesa"),
        pick(["totalclearance", "clearences"], "Spazzate", "difesa"),
        pick(["saves"], "Parate", "difesa"),
        pickExact(["goalsconceded"], "Gol subiti", "difesa"),
        pick(["duels-won", "duelwon"], "Duelli vinti", "difesa"),
        pick(["aerial-duels-won", "aerialduelswon", "aerialwon"], "Duelli aerei vinti", "difesa"),
        pick(["aerial-duels-won-perc", "aerialduelswonperc"], "% Duelli aerei vinti", "difesa"),
        pickExact(["groundduelswon"], "Duelli a terra vinti", "difesa"),
        pickExact(["ballrecovery"], "Palle recuperate", "difesa"),
    ]);

    addSection("DISCIPLINA", "difesa", [
        pick(["fouls", "foulsconceded"], "Falli commessi", "difesa"),
        pick(["fouls-suffered", "foulssuffered"], "Falli subiti", "difesa"),
        pick(["totaloffside", "offsides"], "Fuorigioco", "difesa"),
        pick(["totalyellowcard", "yellow-cards"], "Ammonizioni", "difesa"),
        pick(["totalredcard", "red-cards"], "Espulsioni", "difesa"),
    ]);

    addSection("FISICO", "fisico", [
        pickExact(["distance-covered"], "Distanza (km)", "fisico"),
        pickExact(["distance-covered-sprinting"], "Distanza in sprint", "fisico"),
        pickExact(["distance-covered-high-intensity-running"], "Distanza alta intensità", "fisico"),
        pick(["sprints"], "Sprint", "fisico"),
        pickExact(["maximum-speed"], "Velocità max", "fisico"),
        pick(["touches"], "Tocchi totali", "fisico"),
    ]);

    return out;
}

function AreeAzione({
    areas,
    colors,
    homeName,
    awayName,
}: {
    areas: any;
    colors: { home: string; away: string };
    homeName: string;
    awayName: string;
}) {
    const h = areas?.home;
    const a = areas?.away;
    if (!h || !a) return null;
    const Terzo = ({ label, home, away }: { label: string; home: number; away: number }) => (
        <div className="flex-1 text-center">
            <div className="text-[9px] font-black uppercase tracking-wider text-[color:var(--fumo)] mb-1">{label}</div>
            <div className="h-16 rounded-[var(--ro-s)] border border-[color:var(--filo)] flex flex-col overflow-hidden">
                <span className="flex-1 flex items-center justify-center text-[12px] font-black" style={{ backgroundColor: `${colors.home}33`, color: colors.home }}>
                    {home}%
                </span>
                <span className="flex-1 flex items-center justify-center text-[12px] font-black" style={{ backgroundColor: `${colors.away}33`, color: colors.away }}>
                    {away}%
                </span>
            </div>
        </div>
    );
    return (
        <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)] mb-2 text-center">
                Azioni per fascia · {homeName} / {awayName}
            </div>
            <div className="flex gap-1.5">
                <Terzo label="Sinistra" home={h.leftThirdRatio} away={a.leftThirdRatio} />
                <Terzo label="Centro" home={h.centreThirdRatio} away={a.centreThirdRatio} />
                <Terzo label="Destra" home={h.rightThirdRatio} away={a.rightThirdRatio} />
            </div>
        </div>
    );
}

function TeamStats({
    rows,
    colors,
    homeName,
    awayName,
    actionAreas,
}: {
    rows: TeamStatRow[];
    colors: { home: string; away: string };
    homeName: string;
    awayName: string;
    actionAreas?: any[];
}) {
    const [gruppo, setGruppo] = useState("tutte");
    const pills = [
        { id: "tutte", label: "Tutte" },
        { id: "generale", label: "Generale" },
        { id: "attacco", label: "Attacco" },
        { id: "passaggi", label: "Passaggi" },
        { id: "difesa", label: "Difesa" },
        { id: "fisico", label: "Fisico" },
    ];
    const visibili = gruppo === "tutte" ? rows : rows.filter((r) => r.group === gruppo);
    const fullTimeAreas = (actionAreas || []).find((a: any) => String(a?.period || "").toLowerCase().includes("full")) || (actionAreas || [])[0];

    if (rows.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Statistiche non disponibili
            </p>
        );
    }

    return (
        <div className="space-y-4 py-2">
            <div className="sticky top-0 z-10 -mx-1 mb-1 rounded-[var(--ro-s)] bg-[color:var(--fondale)]/95 px-2 py-2 backdrop-blur">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors.home }} />
                        <span className="truncate text-[10px] font-black uppercase tracking-wider" style={{ color: colors.home }}>
                            {homeName}
                        </span>
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[10px] font-black uppercase tracking-wider" style={{ color: colors.away }}>
                            {awayName}
                        </span>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors.away }} />
                    </span>
                </div>
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {pills.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setGruppo(p.id)}
                            aria-pressed={gruppo === p.id}
                            className={cn(
                                "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                gruppo === p.id
                                    ? "bg-[color:var(--calce)] text-[color:var(--pece)]"
                                    : "border border-[color:var(--filo)] text-[color:var(--fumo)]"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {fullTimeAreas && (gruppo === "tutte" || gruppo === "generale") && (
                <AreeAzione areas={fullTimeAreas} colors={colors} homeName={homeName} awayName={awayName} />
            )}

            {visibili.map((r, i) => {
                // Se la label inizia con __sep__, è un separatore di sezione
                if (r.label.startsWith("__sep__")) {
                    const sectionName = r.label.slice(7);
                    if (!sectionName) {
                        // Separatore vuoto
                        return <div key={`${r.label}-${i}`} className="h-px bg-[color:var(--velo)] my-1" />;
                    }
                    return (
                        <div key={`${r.label}-${i}`} className="flex items-center gap-2 pt-1">
                            <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--fumo)] shrink-0">
                                {sectionName}
                            </span>
                            <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                        </div>
                    );
                }

                const total = r.percent ? 100 : r.home + r.away;
                const homePct = total > 0 ? (r.home / total) * 100 : 50;
                const awayPct = r.percent ? 100 - homePct : total > 0 ? (r.away / total) * 100 : 50;
                const homeLeads = r.home > r.away;
                const awayLeads = r.away > r.home;

                return (
                    <div key={`${r.group}-${r.label}-${i}`}>
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                            <span
                                className="text-sm font-black tabular-nums w-12"
                                style={{ color: colors.home, opacity: homeLeads ? 1 : 0.5 }}
                            >
                                {r.home}
                                {r.percent ? "%" : ""}
                            </span>
                            <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--fumo)]">
                                {r.label}
                            </span>
                            <span
                                className="text-sm font-black tabular-nums w-12 text-right"
                                style={{ color: colors.away, opacity: awayLeads ? 1 : 0.5 }}
                            >
                                {r.away}
                                {r.percent ? "%" : ""}
                            </span>
                        </div>
                        {/* la barra di chi conduce resta piena, l'altra si smorza:
                            il confronto si legge anche senza guardare i numeri */}
                        <div className="flex h-2.5 gap-[2px] rounded-full overflow-hidden bg-[color:var(--velo)]">
                            <span
                                className="h-full rounded-l-full transition-all duration-500"
                                style={{
                                    width: `${homePct}%`,
                                    backgroundColor: colors.home,
                                    opacity: awayLeads ? 0.55 : 1,
                                    boxShadow: homeLeads ? `0 0 12px ${colors.home}80` : undefined,
                                }}
                            />
                            <span
                                className="h-full rounded-r-full transition-all duration-500"
                                style={{
                                    width: `${awayPct}%`,
                                    backgroundColor: colors.away,
                                    opacity: homeLeads ? 0.55 : 1,
                                    boxShadow: awayLeads ? `0 0 12px ${colors.away}80` : undefined,
                                }}
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
    const teamStats = useMemo(() => buildTeamStats(details?.stats), [details?.stats]);
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
                                            rows={teamStats}
                                            colors={colors}
                                            homeName={homeName}
                                            awayName={awayName}
                                            actionAreas={actionAreas}
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