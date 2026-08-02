"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle, Users, ListOrdered, BarChart3, Activity } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import { Pitch } from "./Pitch";
import { PlayerSheet } from "./PlayerSheet";
import type { NormalizedMatch, NormalizedPlayer, NormalizedEvent } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";
import { matchColors } from "@/lib/team-colors";

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
    "penalty-goal": { text: "Rig.", className: "text-emerald-300 bg-emerald-500/10 border-emerald-400/25" },
    "own-goal": { text: "Aut.", className: "text-red-300 bg-red-500/10 border-red-400/25" },
    "penalty-missed": { text: "Rigore sbagliato", className: "text-orange-300 bg-orange-500/10 border-orange-400/25" },
    var: { text: "VAR", className: "text-violet-300 bg-violet-500/10 border-violet-400/25" },
};

/* ========================================================= TIMELINE EVENTI */

const EVENT_MOMENTUM: Record<string, number> = {
    goal: 12,
    "penalty-goal": 14,
    "own-goal": -8,
    yellow: -2,
    red: -5,
    sub: 1,
    other: 0,
};

type MomentumPoint = { label: string; home: number; away: number };

function calcMomentum(events: NormalizedEvent[]): MomentumPoint[] {
    if (events.length === 0) return [];
    const buckets: { min: number; home: number; away: number }[] = [];
    let lastMin = 0;
    for (const e of events) {
        const w = EVENT_MOMENTUM[e.kind] ?? 0;
        if (w === 0) continue;
        if (e.minute > lastMin + 2) {
            buckets.push({ min: lastMin + Math.ceil((e.minute - lastMin) / 2), home: 0, away: 0 });
        }
        if (e.side === "home") buckets.push({ min: e.minute, home: Math.abs(w), away: 0 });
        else buckets.push({ min: e.minute, home: 0, away: Math.abs(w) });
        lastMin = e.minute;
    }
    const maxVal = Math.max(...buckets.map((b) => Math.max(b.home, b.away)), 1);
    return buckets.map((b) => ({
        label: b.min <= 45 ? `${b.min}'` : b.min <= 90 ? `${b.min}'` : `${b.min}+'`,
        home: Math.round((b.home / maxVal) * 100),
        away: Math.round((b.away / maxVal) * 100),
    }));
}

/**
 * Grafico del momento della partita.
 *
 * La versione precedente disegnava barre larghe 4px dentro un contenitore che
 * scorreva in orizzontale: su telefono era illeggibile e su desktop restava
 * schiacciata. Qui il tracciato e' un SVG con viewBox, quindi si adatta a
 * qualunque larghezza senza scorrimento, e invece di un evento per barra
 * mostra una curva di pressione: ogni episodio pesa e poi si smorza nei
 * minuti successivi, che e' come il momento si legge davvero.
 */
function MomentumChart({
    events,
    colors,
    homeName,
    awayName,
}: {
    events: NormalizedEvent[];
    colors: { home: string; away: string };
    homeName: string;
    awayName: string;
}) {
    const W = 320;
    const H = 120;
    const MID = H / 2;
    const LAST = Math.max(90, ...events.map((e) => e.minute + e.extra));

    const curve = useMemo(() => {
        // peso di ogni tipo di episodio e quanto a lungo continua a "pesare"
        const WEIGHT: Record<string, number> = {
            goal: 10, 'penalty-goal': 10, 'own-goal': -6,
            'penalty-missed': 4, red: -7, yellow: 2, sub: 1.5, var: 1, other: 0,
        };
        const DECAY = 9; // minuti

        const points: { m: number; v: number }[] = [];
        for (let m = 0; m <= LAST; m += 1) {
            let v = 0;
            for (const e of events) {
                const w = WEIGHT[e.kind] ?? 0;
                if (!w) continue;
                const dt = m - (e.minute + e.extra);
                if (dt < 0 || dt > DECAY * 2) continue;
                const strength = w * Math.exp(-(dt * dt) / (2 * DECAY * DECAY));
                v += e.side === 'home' ? strength : -strength;
            }
            points.push({ m, v });
        }
        const peak = Math.max(1, ...points.map((p) => Math.abs(p.v)));
        return points.map((p) => ({ ...p, v: p.v / peak }));
    }, [events, LAST]);

    if (events.length === 0 || curve.length < 3) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Non ci sono abbastanza episodi per leggere il momento
            </p>
        );
    }

    const x = (m: number) => (m / LAST) * W;
    const y = (v: number) => MID - v * (MID - 8);

    const line = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.m).toFixed(2)},${y(p.v).toFixed(2)}`).join(' ');
    const areaHome = `M0,${MID} ` + curve.map((p) => `L${x(p.m).toFixed(2)},${y(Math.max(0, p.v)).toFixed(2)}`).join(' ') + ` L${W},${MID} Z`;
    const areaAway = `M0,${MID} ` + curve.map((p) => `L${x(p.m).toFixed(2)},${y(Math.min(0, p.v)).toFixed(2)}`).join(' ') + ` L${W},${MID} Z`;

    const goals = events.filter((e) => e.kind === 'goal' || e.kind === 'penalty-goal' || e.kind === 'own-goal');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors.home }} />
                    <span className="text-[11px] font-black uppercase tracking-wider truncate" style={{ color: colors.home }}>
                        {homeName}
                    </span>
                </span>
                <span className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="text-[11px] font-black uppercase tracking-wider truncate" style={{ color: colors.away }}>
                        {awayName}
                    </span>
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors.away }} />
                </span>
            </div>

            <div className="rounded-none border border-white/[0.08] bg-[color:var(--fondale)] p-3">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none" role="img"
                     aria-label={`Andamento della pressione: ${homeName} sopra, ${awayName} sotto`}>
                    <defs>
                        <linearGradient id="momHome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors.home} stopOpacity="0.75" />
                            <stop offset="100%" stopColor={colors.home} stopOpacity="0.05" />
                        </linearGradient>
                        <linearGradient id="momAway" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor={colors.away} stopOpacity="0.75" />
                            <stop offset="100%" stopColor={colors.away} stopOpacity="0.05" />
                        </linearGradient>
                    </defs>

                    {/* tacche dei quarti d'ora */}
                    {[15, 30, 45, 60, 75].map((m) => (
                        <line key={m} x1={x(m)} y1="6" x2={x(m)} y2={H - 6}
                              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    ))}
                    <line x1={x(45)} y1="4" x2={x(45)} y2={H - 4} stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeDasharray="3 3" />

                    <path d={areaHome} fill="url(#momHome)" />
                    <path d={areaAway} fill="url(#momAway)" />
                    <path d={line} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1={MID} x2={W} y2={MID} stroke="rgba(255,255,255,0.22)" strokeWidth="1" vectorEffect="non-scaling-stroke" />

                    {goals.map((g, i) => (
                        <circle key={i} cx={x(g.minute + g.extra)} cy={MID} r="3.5"
                                fill={g.side === 'home' ? colors.home : colors.away}
                                stroke="#080c20" strokeWidth="1.5" />
                    ))}
                </svg>

                <div className="flex justify-between mt-1.5 px-0.5 text-[9px] font-bold tabular-nums text-[color:var(--fumo)]">
                    {[0, 15, 30, 45, 60, 75, 90].map((m) => <span key={m}>{m}&apos;</span>)}
                </div>
            </div>

            <p className="text-[10px] leading-relaxed text-[color:var(--fumo)]">
                La curva misura la pressione dopo ogni episodio — gol, cartellini, cambi — e la lascia
                smorzare nei minuti seguenti. I pallini sulla linea centrale sono le reti.
            </p>
        </div>
    );
}

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
                                        isGoal ? "border-yellow-400/40" : "border-white/10"
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
                                            <span className="text-emerald-400 text-xs">↑</span>
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
                                    <span className="text-[9px] font-black text-[color:var(--fumo)] tabular-nums bg-[color:var(--fondale)] px-1.5 py-0.5 rounded-full border border-white/5">
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

function TeamStats({
    rows,
    colors,
    homeName,
    awayName,
}: {
    rows: TeamStatRow[];
    colors: { home: string; away: string };
    homeName: string;
    awayName: string;
}) {
    if (rows.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Statistiche non disponibili
            </p>
        );
    }

    return (
        <div className="space-y-4 py-2">
            {/* chi è chi: senza questa riga le barre colorate sono un indovinello */}
            <div className="sticky top-0 z-10 -mx-1 mb-1 flex items-center justify-between gap-3 rounded-none bg-[color:var(--fondale)]/95 px-3 py-2 backdrop-blur">
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
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--fumo)] shrink-0">
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
                        <div className="flex h-2.5 gap-[2px] rounded-full overflow-hidden bg-white/[0.05]">
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

    // Colori presi dagli stemmi, schiariti per il fondo notturno e resi
    // diversi fra loro quando le due squadre giocano su tinte simili.
    const colors = matchColors(homeName, awayName);

    // Stadio dall'header API
    const stadiumName = fixture?.stadiumName || fixture?.stadium || fixture?.venue || null;
    const stadiumCity = fixture?.cityName || fixture?.city || fixture?.location || null;

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
                               rounded-t-[2rem] md:rounded-none border border-white/12 bg-[color:var(--fondale)] text-[color:var(--calce)]
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
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-400/30 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-red-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                    Live
                                </span>
                            ) : (
                                <span className="rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[color:var(--fumo)]">
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
                    </header>

                    {/* ---------------- schede ---------------- */}
                    <nav className="relative shrink-0 flex px-3 py-2 gap-1 border-b border-white/[0.07]">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                aria-pressed={tab === t.id}
                                className={cn(
                                    "relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-none",
                                    "text-[10px] font-black uppercase tracking-[0.12em] transition-colors",
                                    tab === t.id ? "text-[color:var(--calce)]" : "text-[color:var(--fumo)] hover:text-[color:var(--calce)]/80"
                                )}
                            >
                                {tab === t.id && (
                                    <motion.span
                                        layoutId="match-tab"
                                        className="absolute inset-0 rounded-none bg-white/[0.09] border border-white/12"
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
                                    <Loader2 className="w-9 h-9 text-[color:var(--lario)] animate-spin" />
                                    <span className="absolute inset-0 bg-[color:var(--lario)]/25 blur-xl rounded-full animate-pulse" />
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
                                        <MomentumChart
                                            events={normalized.events}
                                            colors={colors}
                                            homeName={homeName}
                                            awayName={awayName}
                                        />
                                    )}
                                    {tab === "statistiche" && (
                                        <TeamStats rows={teamStats} colors={colors} homeName={homeName} awayName={awayName} />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    <Dialog.Close
                        aria-label="Chiudi"
                        className="absolute top-4 right-4 w-9 h-9 rounded-full border border-white/10 bg-black/40 backdrop-blur
                                   flex items-center justify-center text-[color:var(--calce)]/80
                                   hover:text-[color:var(--calce)] hover:bg-red-500 hover:border-red-500 transition-colors"
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