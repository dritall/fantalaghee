"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Pair = { home: number; away: number; percent?: boolean };
type Colors = { home: string; away: string };

function asList(raw: unknown): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray((raw as { stats?: unknown }).stats)) {
        return (raw as { stats: any[] }).stats;
    }
    return [];
}

function buildMap(raw: unknown) {
    const map = new Map<string, { home: number | null; away: number | null; percent: boolean }>();
    for (const s of asList(raw)) {
        const id = String(s?.statsId || s?.id || s?.name || "").toLowerCase();
        if (!id) continue;
        const h = Number(s?.statsValueHome ?? s?.home ?? s?.value);
        const a = Number(s?.statsValueAway ?? s?.away ?? s?.value);
        map.set(id, {
            home: Number.isFinite(h) ? h : null,
            away: Number.isFinite(a) ? a : null,
            percent: id.includes("perc") || String(s?.statsLabel || "").includes("%"),
        });
    }
    return map;
}

function pick(map: ReturnType<typeof buildMap>, ids: string[]): Pair | null {
    for (const id of ids) {
        const v = map.get(id.toLowerCase());
        if (!v) continue;
        if (v.home == null && v.away == null) continue;
        return { home: v.home ?? 0, away: v.away ?? 0, percent: v.percent || id.toLowerCase().includes("perc") };
    }
    for (const id of ids) {
        if (id.length <= 6) continue;
        const needle = id.toLowerCase();
        for (const [key, v] of map) {
            if (key.includes(needle)) {
                if (v.home == null && v.away == null) continue;
                return { home: v.home ?? 0, away: v.away ?? 0, percent: v.percent };
            }
        }
    }
    return null;
}

function hasPair(p?: Pair | null) {
    return !!p && Number.isFinite(p.home) && Number.isFinite(p.away);
}

function livePair(p?: Pair | null) {
    return hasPair(p) && !(p!.home === 0 && p!.away === 0);
}

function fmt(n: number, kind: "int" | "pct" | "xg" | "km" = "int") {
    if (kind === "pct") return `${Math.round(n)}`;
    if (kind === "xg") return (Math.round(n * 100) / 100).toFixed(2);
    if (kind === "km") return (Math.round(n * 10) / 10).toFixed(1);
    if (Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n));
    return (Math.round(n * 100) / 100).toString();
}

function split(total: number, weightA: number, weightB: number): [number, number] {
    const s = weightA + weightB;
    if (total <= 0) return [0, 0];
    if (s <= 0) return [total, 0];
    const first = Math.round(total * (weightA / s));
    return [first, total - first];
}

function pctOf(done: number, total: number) {
    if (!total) return 0;
    return Math.round((done / total) * 100);
}

/* -------------------------------------- atomi visivi */

function BadgeNum({
    value,
    color,
    win,
    kind = "int",
    suffix,
}: {
    value: number;
    color: string;
    win: boolean;
    kind?: "int" | "pct" | "xg" | "km";
    suffix?: string;
}) {
    const text = `${fmt(value, kind)}${kind === "pct" ? "%" : ""}${suffix ?? ""}`;
    if (win) {
        return (
            <span
                className="inline-flex min-w-[1.6rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[13px] font-black tabular-nums text-white"
                style={{ backgroundColor: color }}
            >
                {text}
            </span>
        );
    }
    return <span className="text-[13px] font-black tabular-nums text-[color:var(--calce)]">{text}</span>;
}

function SplitBar({ home, away, colors }: { home: number; away: number; colors: Colors }) {
    const tot = Math.abs(home) + Math.abs(away);
    const hp = tot > 0 ? (Math.abs(home) / tot) * 100 : 50;
    const ap = tot > 0 ? (Math.abs(away) / tot) * 100 : 50;
    return (
        <div className="flex h-[7px] overflow-hidden rounded-full bg-[color:var(--velo)]">
            <span className="h-full rounded-l-full" style={{ width: `${hp}%`, backgroundColor: colors.home }} />
            <span className="h-full rounded-r-full" style={{ width: `${ap}%`, backgroundColor: colors.away }} />
        </div>
    );
}

function AccBar({ homePct, awayPct, colors }: { homePct: number; awayPct: number; colors: Colors }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-8 text-[10px] font-bold tabular-nums text-[color:var(--fumo)]">{Math.round(homePct)}%</span>
            <div className="relative h-[7px] flex-1 overflow-hidden rounded-full bg-[color:var(--velo)]">
                <span
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, homePct))}%`, backgroundColor: colors.home }}
                />
                <span
                    className="absolute right-0 top-0 h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, awayPct))}%`, backgroundColor: colors.away }}
                />
            </div>
            <span className="w-8 text-right text-[10px] font-bold tabular-nums text-[color:var(--fumo)]">{Math.round(awayPct)}%</span>
        </div>
    );
}

function VsRow({
    label,
    home,
    away,
    colors,
    kind = "int",
    homeNote,
    awayNote,
}: {
    label: string;
    home: number;
    away: number;
    colors: Colors;
    kind?: "int" | "pct" | "xg" | "km";
    homeNote?: string;
    awayNote?: string;
}) {
    const homeWin = home > away;
    const awayWin = away > home;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-[3.2rem] items-center gap-1">
                    <BadgeNum value={home} color={colors.home} win={homeWin} kind={kind} />
                    {homeNote ? <span className="text-[10px] font-bold text-[color:var(--fumo)]">{homeNote}</span> : null}
                </span>
                <span className="flex-1 text-center text-[11px] font-bold text-[color:var(--fumo)]">{label}</span>
                <span className="flex min-w-[3.2rem] items-center justify-end gap-1">
                    {awayNote ? <span className="text-[10px] font-bold text-[color:var(--fumo)]">{awayNote}</span> : null}
                    <BadgeNum value={away} color={colors.away} win={awayWin} kind={kind} />
                </span>
            </div>
            {kind === "xg" ? (
                <XgBars home={home} away={away} colors={colors} />
            ) : (
                <SplitBar home={home} away={away} colors={colors} />
            )}
        </div>
    );
}

function XgBars({ home, away, colors }: { home: number; away: number; colors: Colors }) {
    const m = Math.max(home, away, 0.25);
    return (
        <div className="flex items-center gap-6">
            <div className="h-[5px] flex-1">
                <span
                    className="block h-full rounded-full"
                    style={{ width: `${(home / m) * 100}%`, backgroundColor: colors.home }}
                />
            </div>
            <div className="h-[5px] flex-1">
                <span
                    className="ml-auto block h-full rounded-full"
                    style={{ width: `${(away / m) * 100}%`, backgroundColor: colors.away }}
                />
            </div>
        </div>
    );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-3">
            <h3 className="px-1 text-[17px] font-black tracking-tight text-[color:var(--calce)]">{title}</h3>
            <div className="space-y-4 rounded-2xl border border-[color:var(--filo)] bg-[color:var(--velo)]/40 px-3.5 py-4">
                {children}
            </div>
        </section>
    );
}

function Donut({ value, color }: { value: number; color: string }) {
    const r = 34;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, value));
    const dash = (pct / 100) * c;
    return (
        <svg width="88" height="88" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-[color:var(--velo-alto)]" />
            <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c}`}
                transform="rotate(-90 50 50)"
            />
            <text
                x="50"
                y="55"
                textAnchor="middle"
                fill="currentColor"
                className="fill-[color:var(--calce)]"
                fontSize="15"
                fontWeight="800"
            >
                {Math.round(pct)}%
            </text>
        </svg>
    );
}

function PitchLines() {
    return (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden>
            <rect x="1.5" y="1.5" width="157" height="97" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
            <line x1="80" y1="1.5" x2="80" y2="98.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <circle cx="80" cy="50" r="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <rect x="1.5" y="22" width="22" height="56" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <rect x="136.5" y="22" width="22" height="56" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <rect x="1.5" y="36" width="9" height="28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <rect x="149.5" y="36" width="9" height="28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        </svg>
    );
}

function PossessionPitch({
    homeDef,
    homeOff,
    awayOff,
    awayDef,
    colors,
}: {
    homeDef: number;
    homeOff: number;
    awayOff: number;
    awayDef: number;
    colors: Colors;
}) {
    const bands = [
        { pct: homeDef, color: colors.home, dir: "←" },
        { pct: homeOff, color: colors.home, dir: "→" },
        { pct: awayOff, color: colors.away, dir: "←" },
        { pct: awayDef, color: colors.away, dir: "→" },
    ];
    return (
        <div className="relative aspect-[1.7] overflow-hidden rounded-xl border border-[color:var(--filo-alto)]">
            <div className="absolute inset-0 flex">
                {bands.map((b, i) => (
                    <div key={i} className="relative flex flex-1 flex-col items-center justify-end pb-2" style={{ backgroundColor: b.color }}>
                        <span className="text-[15px] font-black tabular-nums text-white drop-shadow">{Math.round(b.pct)}%</span>
                        <span className="text-[11px] font-black text-white/90">{b.dir}</span>
                    </div>
                ))}
            </div>
            <PitchLines />
        </div>
    );
}

function ShotsNest({
    off,
    on,
    colors,
}: {
    off: Pair;
    on: Pair;
    colors: Colors;
}) {
    const offTot = Math.max(off.home + off.away, 0.01);
    const onTot = Math.max(on.home + on.away, 0.01);
    return (
        <div className="relative h-[7.2rem] overflow-hidden rounded-2xl">
            <div className="absolute inset-0 flex">
                <div className="flex items-start justify-center pt-3" style={{ width: `${(off.home / offTot) * 100}%`, backgroundColor: colors.home }}>
                    <span className="text-[15px] font-black text-white">{fmt(off.home)}</span>
                </div>
                <div className="relative flex flex-1 items-start justify-end pr-3 pt-3" style={{ backgroundColor: colors.away }}>
                    <span className="absolute left-1/2 top-2.5 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                        Fuori
                    </span>
                    <span className="text-[15px] font-black text-white">{fmt(off.away)}</span>
                </div>
            </div>
            <div className="absolute bottom-2 left-[14%] right-[14%] flex h-[3.4rem] overflow-hidden rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-center" style={{ width: `${(on.home / onTot) * 100}%`, backgroundColor: colors.home }}>
                    <span className="text-[15px] font-black text-white">{fmt(on.home)}</span>
                </div>
                <div className="relative flex flex-1 items-center justify-end pr-3" style={{ backgroundColor: colors.away }}>
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                        In porta
                    </span>
                    <span className="text-[15px] font-black text-white">{fmt(on.away)}</span>
                </div>
            </div>
        </div>
    );
}

function SavesPitch({
    homeIn,
    homeOut,
    awayIn,
    awayOut,
    colors,
}: {
    homeIn: number;
    homeOut: number;
    awayIn: number;
    awayOut: number;
    colors: Colors;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-[color:var(--filo-alto)]">
            <div className="grid grid-cols-2">
                <div className="space-y-6 px-3 py-4 text-center" style={{ backgroundColor: colors.home }}>
                    <div className="text-[18px] font-black text-white">{homeIn}</div>
                    <div className="text-[18px] font-black text-white">{homeOut}</div>
                </div>
                <div className="space-y-6 px-3 py-4 text-center" style={{ backgroundColor: colors.away }}>
                    <div className="text-[18px] font-black text-white">{awayIn}</div>
                    <div className="text-[18px] font-black text-white">{awayOut}</div>
                </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center">
                <span className="rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-bold text-white">Dentro area</span>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-[18%] flex justify-center">
                <span className="rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-bold text-white">Fuori area</span>
            </div>
        </div>
    );
}

function FascePitch({
    areas,
    colors,
}: {
    areas: { home: { leftThirdRatio: number; centreThirdRatio: number; rightThirdRatio: number }; away: { leftThirdRatio: number; centreThirdRatio: number; rightThirdRatio: number } };
    colors: Colors;
}) {
    const cols = [
        { label: "Sinistra", h: areas.home.leftThirdRatio, a: areas.away.leftThirdRatio },
        { label: "Centro", h: areas.home.centreThirdRatio, a: areas.away.centreThirdRatio },
        { label: "Destra", h: areas.home.rightThirdRatio, a: areas.away.rightThirdRatio },
    ];
    return (
        <div className="space-y-2">
            <div className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--fumo)]">Azioni per corsia</div>
            <div className="relative flex h-20 overflow-hidden rounded-xl border border-[color:var(--filo-alto)]">
                {cols.map((c) => {
                    const homeWins = c.h >= c.a;
                    return (
                        <div key={c.label} className="relative flex flex-1 flex-col items-center justify-end pb-1.5" style={{ backgroundColor: homeWins ? colors.home : colors.away }}>
                            <span className="text-[11px] font-black text-white">
                                {Math.round(c.h)} / {Math.round(c.a)}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-wider text-white/80">{c.label}</span>
                        </div>
                    );
                })}
                <PitchLines />
            </div>
        </div>
    );
}

function PossSlices({
    slices,
    colors,
}: {
    slices: { label: string; home: number; away: number }[];
    colors: Colors;
}) {
    if (slices.length === 0) return null;
    return (
        <div className="flex gap-1">
            {slices.map((s) => {
                const homeWins = s.home >= s.away;
                return (
                    <div key={s.label} className="min-w-0 flex-1 text-center">
                        <div
                            className="flex h-8 items-center justify-center rounded-md text-[10px] font-black tabular-nums text-white"
                            style={{ backgroundColor: homeWins ? colors.home : colors.away }}
                        >
                            {Math.round(homeWins ? s.home : s.away)}%
                        </div>
                        <div className="mt-1 truncate text-[8px] font-bold text-[color:var(--fumo)]">{s.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

/* -------------------------------------- modello */

export function TeamStats({
    raw,
    colors,
    homeName,
    awayName,
    actionAreas,
    possessionBreakdowns,
}: {
    raw: unknown;
    colors: Colors;
    homeName: string;
    awayName: string;
    actionAreas?: any[];
    possessionBreakdowns?: { possessions?: { periodId?: string; periodLabel?: string; home: number; away: number }[] };
}) {
    const [gruppo, setGruppo] = useState("tutte");
    const model = useMemo(() => {
        const map = buildMap(raw);
        const g = (ids: string[]) => pick(map, ids);
        return {
            possession: g(["possession-perc", "possessionpercentage"]),
            fieldTilt: g(["fieldtilt"]),
            xG: g(["expected-goals"]),
            xGA: g(["expectedgoalagainst"]),
            timeAhead: g(["timeaheadperc"]),
            defHalf: g(["defhalfballpossessionperc"]),
            offHalf: g(["offhalfballpossessionperc"]),
            shots: g(["totalscoringatt", "shots"]),
            shotsOn: g(["shots-on-goal", "ontargetscoringatt"]),
            shotsOff: g(["shotofftarget", "totalshotsmissed"]),
            blocked: g(["blocked-shots", "blockedscoringatt"]),
            inBox: g(["shots-at-goal-inside-box", "attemptsibox"]),
            outBox: g(["shots-at-goal-outside-box", "attemptsobox"]),
            bigChances: g(["big-chances", "bigchancecreated"]),
            chances: g(["chances-created"]),
            wood: g(["hitwoodwork", "shotsposts"]),
            corners: g(["cornertaken", "corners"]),
            offsides: g(["totaloffside", "offsides"]),
            touchesBox: g(["touches-opponent-box", "touchesinoppbox"]),
            boxEntries: g(["penareaentries"]),
            assists: g(["goalassist", "assists"]),
            passes: g(["totalpass", "total-passes"]),
            passesOk: g(["passes-completed", "accuratepass", "accurate-pass"]),
            passPct: g(["accurate-pass-perc", "passing-accuracy-perc"]),
            keyPasses: g(["key-passes", "totalattassist"]),
            crosses: g(["crosses", "totalcross"]),
            crossesOk: g(["crosses-successful", "accuratecross"]),
            longBalls: g(["totallongballs"]),
            longOk: g(["accuratelongballs"]),
            through: g(["totalthroughball"]),
            throughOk: g(["accuratethroughball"]),
            finalThird: g(["totalfinalthirdpasses"]),
            finalOk: g(["successfulfinalthirdpasses"]),
            tackles: g(["totaltackle", "tackles-total"]),
            tacklesOk: g(["tackles-successful", "wontackle"]),
            tacklesPct: g(["tackles-won-perc", "tackleswonperc"]),
            interceptions: g(["interception"]),
            clearances: g(["totalclearance", "clearences"]),
            saves: g(["saves"]),
            savePct: g(["totalsaveperc"]),
            goalsConceded: g(["goalsconceded"]),
            duels: g(["duels-won", "duelwon"]),
            aerial: g(["aerial-duels-won", "aerialduelswon"]),
            aerialPct: g(["aerial-duels-won-perc"]),
            ground: g(["groundduelswon"]),
            groundPct: g(["groundduelswonperc"]),
            recovery: g(["ballrecovery"]),
            fouls: g(["fouls", "foulsconceded"]),
            fouled: g(["fouls-suffered", "foulssuffered"]),
            yellow: g(["totalyellowcard", "yellow-cards"]),
            red: g(["totalredcard", "red-cards"]),
            distance: g(["distance-covered"]),
            sprintDist: g(["distance-covered-sprinting"]),
            highDist: g(["distance-covered-high-intensity-running"]),
            sprints: g(["sprints"]),
            maxSpeed: g(["maximum-speed"]),
            touches: g(["touches"]),
        };
    }, [raw]);

    const pills = [
        { id: "tutte", label: "Tutte" },
        { id: "generale", label: "Generale" },
        { id: "attacco", label: "Attacco" },
        { id: "passaggi", label: "Passaggi" },
        { id: "difesa", label: "Difesa" },
        { id: "fisico", label: "Fisico" },
    ];

    const show = (id: string) => gruppo === "tutte" || gruppo === id;

    const fullTimeAreas =
        (actionAreas || []).find((a: any) => String(a?.period || "").toLowerCase().includes("full")) || (actionAreas || [])[0];

    const slices = (possessionBreakdowns?.possessions || [])
        .filter((p) => /^(0-15|16-30|31-45|46-60|61-75|76-90)$/.test(String(p.periodId || p.periodLabel || "")))
        .map((p) => ({
            label: String(p.periodLabel || p.periodId),
            home: p.home,
            away: p.away,
        }));

    const empty = asList(raw).length === 0;
    if (empty) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Statistiche non disponibili
            </p>
        );
    }

    const homeSaves = model.saves?.home ?? 0;
    const awaySaves = model.saves?.away ?? 0;
    const [homeSaveIn, homeSaveOut] = split(homeSaves, model.inBox?.away ?? 0, model.outBox?.away ?? 0);
    const [awaySaveIn, awaySaveOut] = split(awaySaves, model.inBox?.home ?? 0, model.outBox?.home ?? 0);

    return (
        <div className="space-y-5 py-2">
            <div className="sticky top-0 z-10 -mx-1 mb-1 rounded-[var(--ro-s)] bg-[color:var(--fondale)]/95 px-2 py-2 backdrop-blur">
                <div className="mb-2 flex items-center justify-between gap-3">
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
                <div className="no-scrollbar flex gap-1 overflow-x-auto">
                    {pills.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setGruppo(p.id)}
                            aria-pressed={gruppo === p.id}
                            className={cn(
                                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
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

            {show("generale") && (
                <Card title="Generale">
                    {livePair(model.possession) && (
                        <div className="space-y-3">
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black tabular-nums">{fmt(model.possession!.home, "pct")}%</span>
                                <span className="pb-1 text-[11px] font-bold text-[color:var(--fumo)]">Possesso</span>
                                <span className="text-2xl font-black tabular-nums">{fmt(model.possession!.away, "pct")}%</span>
                            </div>
                            {livePair(model.defHalf) && livePair(model.offHalf) && (
                                <PossessionPitch
                                    homeDef={model.defHalf!.home}
                                    homeOff={model.offHalf!.home}
                                    awayOff={model.offHalf!.away}
                                    awayDef={model.defHalf!.away}
                                    colors={colors}
                                />
                            )}
                            <PossSlices slices={slices} colors={colors} />
                        </div>
                    )}
                    {fullTimeAreas?.home && fullTimeAreas?.away && (
                        <FascePitch areas={fullTimeAreas} colors={colors} />
                    )}
                    {livePair(model.xG) && (
                        <VsRow label="xG" home={model.xG!.home} away={model.xG!.away} colors={colors} kind="xg" />
                    )}
                    {livePair(model.fieldTilt) && (
                        <VsRow label="Field tilt" home={model.fieldTilt!.home} away={model.fieldTilt!.away} colors={colors} kind="pct" />
                    )}
                    {livePair(model.bigChances) && (
                        <VsRow label="Grandi occasioni" home={model.bigChances!.home} away={model.bigChances!.away} colors={colors} />
                    )}
                    {livePair(model.corners) && (
                        <VsRow label="Corner" home={model.corners!.home} away={model.corners!.away} colors={colors} />
                    )}
                    {livePair(model.offsides) && (
                        <VsRow label="Fuorigioco" home={model.offsides!.home} away={model.offsides!.away} colors={colors} />
                    )}
                    {livePair(model.timeAhead) && (
                        <VsRow label="% tempo in vantaggio" home={model.timeAhead!.home} away={model.timeAhead!.away} colors={colors} kind="pct" />
                    )}
                </Card>
            )}

            {show("attacco") && (
                <Card title="Attacco">
                    {livePair(model.shots) && (
                        <div className="space-y-3">
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black tabular-nums">{fmt(model.shots!.home)}</span>
                                <span className="pb-1 text-[11px] font-bold text-[color:var(--fumo)]">Tiri</span>
                                <span className="text-2xl font-black tabular-nums">{fmt(model.shots!.away)}</span>
                            </div>
                            {hasPair(model.shotsOff) && hasPair(model.shotsOn) && (
                                <ShotsNest off={model.shotsOff!} on={model.shotsOn!} colors={colors} />
                            )}
                        </div>
                    )}
                    {livePair(model.blocked) && (
                        <VsRow label="Tiri bloccati" home={model.blocked!.home} away={model.blocked!.away} colors={colors} />
                    )}
                    {livePair(model.inBox) && (
                        <VsRow label="Tiri in area" home={model.inBox!.home} away={model.inBox!.away} colors={colors} />
                    )}
                    {livePair(model.outBox) && (
                        <VsRow label="Tiri fuori area" home={model.outBox!.home} away={model.outBox!.away} colors={colors} />
                    )}
                    {gruppo === "attacco" && livePair(model.xG) && (
                        <VsRow label="xG" home={model.xG!.home} away={model.xG!.away} colors={colors} kind="xg" />
                    )}
                    {livePair(model.chances) && (
                        <VsRow label="Occasioni create" home={model.chances!.home} away={model.chances!.away} colors={colors} />
                    )}
                    {livePair(model.wood) && (
                        <VsRow label="Legni" home={model.wood!.home} away={model.wood!.away} colors={colors} />
                    )}
                    {livePair(model.touchesBox) && (
                        <VsRow label="Tocchi in area" home={model.touchesBox!.home} away={model.touchesBox!.away} colors={colors} />
                    )}
                    {livePair(model.assists) && (
                        <VsRow label="Assist" home={model.assists!.home} away={model.assists!.away} colors={colors} />
                    )}
                </Card>
            )}

            {show("passaggi") && (
                <Card title="Passaggi">
                    {livePair(model.passesOk) && livePair(model.passPct) && (
                        <div className="space-y-2">
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black tabular-nums">{fmt(model.passesOk!.home)}</span>
                                <span className="pb-1 text-[11px] font-bold text-[color:var(--fumo)]">Passaggi riusciti</span>
                                <span className="text-2xl font-black tabular-nums">{fmt(model.passesOk!.away)}</span>
                            </div>
                            <div className="flex items-center justify-around pt-1">
                                <Donut value={model.passPct!.home} color={colors.home} />
                                <Donut value={model.passPct!.away} color={colors.away} />
                            </div>
                        </div>
                    )}
                    {livePair(model.finalOk) && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <BadgeNum value={model.finalOk!.home} color={colors.home} win={model.finalOk!.home > model.finalOk!.away} />
                                <span className="flex-1 text-center text-[11px] font-bold text-[color:var(--fumo)]">Nel terzo offensivo</span>
                                <BadgeNum value={model.finalOk!.away} color={colors.away} win={model.finalOk!.away > model.finalOk!.home} />
                            </div>
                            <AccBar
                                homePct={pctOf(model.finalOk!.home, model.finalThird?.home ?? 0)}
                                awayPct={pctOf(model.finalOk!.away, model.finalThird?.away ?? 0)}
                                colors={colors}
                            />
                        </div>
                    )}
                    {livePair(model.crossesOk) && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <BadgeNum value={model.crossesOk!.home} color={colors.home} win={model.crossesOk!.home > model.crossesOk!.away} />
                                <span className="flex-1 text-center text-[11px] font-bold text-[color:var(--fumo)]">Cross riusciti</span>
                                <BadgeNum value={model.crossesOk!.away} color={colors.away} win={model.crossesOk!.away > model.crossesOk!.home} />
                            </div>
                            <AccBar
                                homePct={pctOf(model.crossesOk!.home, model.crosses?.home ?? 0)}
                                awayPct={pctOf(model.crossesOk!.away, model.crosses?.away ?? 0)}
                                colors={colors}
                            />
                        </div>
                    )}
                    {livePair(model.longOk) && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                                <BadgeNum value={model.longOk!.home} color={colors.home} win={model.longOk!.home > model.longOk!.away} />
                                <span className="flex-1 text-center text-[11px] font-bold text-[color:var(--fumo)]">Lanci lunghi riusciti</span>
                                <BadgeNum value={model.longOk!.away} color={colors.away} win={model.longOk!.away > model.longOk!.home} />
                            </div>
                            <AccBar
                                homePct={pctOf(model.longOk!.home, model.longBalls?.home ?? 0)}
                                awayPct={pctOf(model.longOk!.away, model.longBalls?.away ?? 0)}
                                colors={colors}
                            />
                        </div>
                    )}
                    {livePair(model.keyPasses) && (
                        <VsRow label="Passaggi chiave" home={model.keyPasses!.home} away={model.keyPasses!.away} colors={colors} />
                    )}
                    {livePair(model.throughOk) && (
                        <VsRow label="Filtri riusciti" home={model.throughOk!.home} away={model.throughOk!.away} colors={colors} />
                    )}
                    {livePair(model.passes) && (
                        <VsRow label="Passaggi totali" home={model.passes!.home} away={model.passes!.away} colors={colors} />
                    )}
                </Card>
            )}

            {show("difesa") && (
                <Card title="Difesa">
                    {livePair(model.tacklesOk) && (
                        <VsRow
                            label="Contrasti riusciti"
                            home={model.tacklesOk!.home}
                            away={model.tacklesOk!.away}
                            colors={colors}
                            homeNote={livePair(model.tacklesPct) ? `${Math.round(model.tacklesPct!.home)}%` : undefined}
                            awayNote={livePair(model.tacklesPct) ? `${Math.round(model.tacklesPct!.away)}%` : undefined}
                        />
                    )}
                    {livePair(model.clearances) && (
                        <VsRow label="Spazzate" home={model.clearances!.home} away={model.clearances!.away} colors={colors} />
                    )}
                    {livePair(model.interceptions) && (
                        <VsRow label="Intercetti" home={model.interceptions!.home} away={model.interceptions!.away} colors={colors} />
                    )}
                    {livePair(model.fouls) && (
                        <VsRow label="Falli" home={model.fouls!.home} away={model.fouls!.away} colors={colors} />
                    )}
                    {livePair(model.ground) && (
                        <VsRow
                            label="Duelli a terra vinti"
                            home={model.ground!.home}
                            away={model.ground!.away}
                            colors={colors}
                            homeNote={livePair(model.groundPct) ? `${Math.round(model.groundPct!.home)}%` : undefined}
                            awayNote={livePair(model.groundPct) ? `${Math.round(model.groundPct!.away)}%` : undefined}
                        />
                    )}
                    {livePair(model.aerial) && (
                        <VsRow
                            label="Duelli aerei vinti"
                            home={model.aerial!.home}
                            away={model.aerial!.away}
                            colors={colors}
                            homeNote={livePair(model.aerialPct) ? `${Math.round(model.aerialPct!.home)}%` : undefined}
                            awayNote={livePair(model.aerialPct) ? `${Math.round(model.aerialPct!.away)}%` : undefined}
                        />
                    )}
                    {livePair(model.recovery) && (
                        <VsRow label="Palle recuperate" home={model.recovery!.home} away={model.recovery!.away} colors={colors} />
                    )}
                    {livePair(model.yellow) && (
                        <VsRow label="Ammonizioni" home={model.yellow!.home} away={model.yellow!.away} colors={colors} />
                    )}
                    {livePair(model.red) && (
                        <VsRow label="Espulsioni" home={model.red!.home} away={model.red!.away} colors={colors} />
                    )}
                    {livePair(model.saves) && (
                        <div className="space-y-3 pt-1">
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-black tabular-nums">{fmt(model.saves!.home)}</span>
                                <span className="pb-1 text-[11px] font-bold text-[color:var(--fumo)]">Parate</span>
                                <span className="text-2xl font-black tabular-nums">{fmt(model.saves!.away)}</span>
                            </div>
                            <SavesPitch
                                homeIn={homeSaveIn}
                                homeOut={homeSaveOut}
                                awayIn={awaySaveIn}
                                awayOut={awaySaveOut}
                                colors={colors}
                            />
                            {livePair(model.savePct) && (
                                <VsRow label="% parate" home={model.savePct!.home} away={model.savePct!.away} colors={colors} kind="pct" />
                            )}
                        </div>
                    )}
                </Card>
            )}

            {show("fisico") && (livePair(model.distance) || livePair(model.sprints) || livePair(model.touches)) && (
                <Card title="Fisico">
                    {livePair(model.distance) && (
                        <VsRow label="Distanza (km)" home={model.distance!.home} away={model.distance!.away} colors={colors} kind="km" />
                    )}
                    {livePair(model.sprintDist) && (
                        <VsRow label="Distanza in sprint" home={model.sprintDist!.home} away={model.sprintDist!.away} colors={colors} kind="km" />
                    )}
                    {livePair(model.highDist) && (
                        <VsRow label="Alta intensità" home={model.highDist!.home} away={model.highDist!.away} colors={colors} kind="km" />
                    )}
                    {livePair(model.sprints) && (
                        <VsRow label="Sprint" home={model.sprints!.home} away={model.sprints!.away} colors={colors} />
                    )}
                    {livePair(model.maxSpeed) && (
                        <VsRow label="Velocità max" home={model.maxSpeed!.home} away={model.maxSpeed!.away} colors={colors} kind="km" />
                    )}
                    {livePair(model.touches) && (
                        <VsRow label="Tocchi" home={model.touches!.home} away={model.touches!.away} colors={colors} />
                    )}
                </Card>
            )}
        </div>
    );
}
