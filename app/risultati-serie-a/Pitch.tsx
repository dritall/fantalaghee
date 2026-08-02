"use client";

import { useState } from "react";
import type { NormalizedPlayer, NormalizedTeam } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";

/** Foto del giocatore con bordo accentato e ombra. */
function PlayerAvatar({
    player,
    accent,
    size = "md",
}: {
    player: NormalizedPlayer;
    accent: string;
    size?: "sm" | "md";
}) {
    const [failed, setFailed] = useState(false);
    const px = size === "sm" ? "w-9 h-9" : "w-12 h-12 md:w-14 md:h-14";
    const style = {
        borderColor: accent,
        boxShadow: `0 0 16px ${accent}55, 0 0 40px ${accent}22`,
    };

    if (failed || !player.photo) {
        return (
            <span
                className={cn(px, "rounded-full flex items-center justify-center border-2 bg-[color:var(--secca)] shrink-0")}
                style={style}
            >
                <span className="text-[13px] font-black text-white/60 tabular-nums">{player.number ?? "–"}</span>
            </span>
        );
    }

    return (
        <img
            src={player.photo}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={cn(px, "rounded-full object-cover object-top border-2 bg-[color:var(--secca)] shrink-0")}
            style={style}
        />
    );
}

/** Badge gol/cartellini in sovrimpressione sull'avatar. */
function PlayerBadges({ player }: { player: NormalizedPlayer }) {
    const marks: React.ReactNode[] = [];

    for (let i = 0; i < player.goals; i++) {
        marks.push(
            <span key={`g${i}`} className="drop-shadow-[0_2px_6px_rgba(255,200,0,0.7)] animate-pulse">
                ⚽
            </span>
        );
    }
    if (player.ownGoals > 0) {
        marks.push(
            <span key="og" className="text-[11px] leading-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" title="Autogol">
                🥅
            </span>
        );
    }
    if (player.red) {
        marks.push(<span key="r" className="w-[8px] h-[12px] rounded-[2px] bg-red-600 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />);
    } else if (player.yellow) {
        marks.push(<span key="y" className="w-[8px] h-[12px] rounded-[2px] bg-yellow-400 border border-yellow-500 shadow-[0_0_6px_rgba(250,204,21,0.5)]" />);
    }
    if (player.subbedOut) {
        marks.push(
            <span key="out" className="text-[10px] font-black text-red-400 leading-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" title={`Uscito al ${player.subbedOut}'`}>
                ↓
            </span>
        );
    }

    if (marks.length === 0) return null;
    return <span className="absolute -top-2 -right-2 flex flex-col items-center gap-px z-20 text-[13px] leading-tight">{marks}</span>;
}

/** Giocatore singolo posizionato sul campo. */
function PitchPlayer({
    player,
    accent,
    onSelect,
    stagger,
}: {
    player: NormalizedPlayer;
    accent: string;
    onSelect: (p: NormalizedPlayer) => void;
    stagger: boolean;
}) {
    const left = `${8 + (player.x ?? 0.5) * 84}%`;
    const top = `${9 + (1 - (player.y ?? 0.5)) * 78}%`;

    return (
        <button
            onClick={() => onSelect(player)}
            style={{ left, top }}
            aria-label={`${player.fullName}, ${player.roleLabel}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1
                       transition-all duration-300 hover:scale-125 hover:z-30 focus-visible:scale-125 focus-visible:z-30"
        >
            <span className="relative">
                <PlayerAvatar player={player} accent={accent} />
                <PlayerBadges player={player} />
                {player.number != null && (
                    <span
                        className="absolute -bottom-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--pece)] border border-white/25
                                   flex items-center justify-center text-[9px] font-black text-white/90 tabular-nums z-20
                                   shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                    >
                        {player.number}
                    </span>
                )}
            </span>

            <span
                className={cn(
                    "max-w-[68px] md:max-w-[80px] truncate rounded px-1.5 py-0.5 bg-black/70 backdrop-blur-sm",
                    "text-[9px] md:text-[10px] font-black uppercase tracking-tight leading-tight text-white",
                    "shadow-[0_2px_8px_rgba(0,0,0,0.8)]",
                    stagger && "translate-y-1.5"
                )}
            >
                {player.name}
            </span>
            {player.rating != null && (
                <span
                    className="rounded px-1.5 font-score text-[9px] md:text-[10px] font-bold tabular-nums shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: `${accent}33`, color: accent }}
                >
                    {player.rating.toFixed(1)}
                </span>
            )}
        </button>
    );
}

/** Linee del campo. */
function PitchLines() {
    return (
        <>
            <span className="absolute inset-[6%] border-2 border-[color:var(--calce)]/15" />
            <span className="absolute left-[6%] right-[6%] top-1/2 h-[2px] bg-white/10 -translate-y-1/2" />
            <span className="absolute left-1/2 top-1/2 w-[28%] aspect-square border-2 border-[color:var(--calce)]/12 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute left-1/2 top-1/2 w-2 h-2 bg-[color:var(--calce)]/25 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* area di rigore in basso */}
            <span className="absolute left-1/2 bottom-[6%] w-[54%] h-[17%] border-2 border-b-0 border-white/12 -translate-x-1/2 rounded-t-sm" />
            <span className="absolute left-1/2 bottom-[6%] w-[26%] h-[7%] border-2 border-b-0 border-white/12 -translate-x-1/2 rounded-t-sm" />
            {/* area in alto */}
            <span className="absolute left-1/2 top-[6%] w-[54%] h-[17%] border-2 border-t-0 border-white/12 -translate-x-1/2 rounded-b-sm" />
            <span className="absolute left-1/2 top-[6%] w-[26%] h-[7%] border-2 border-t-0 border-white/12 -translate-x-1/2 rounded-b-sm" />
        </>
    );
}

/** Metà campo di una squadra (formazione + panchina). */
function TeamPitch({
    team,
    accent,
    onSelect,
}: {
    team: NormalizedTeam;
    accent: string;
    onSelect: (p: NormalizedPlayer) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 px-1">
                <span className="min-w-0 flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white truncate">
                        {team.name}
                    </span>
                    {team.coach && (
                        <span className="text-[10px] text-white/35 truncate">All. {team.coach}</span>
                    )}
                </span>
                {team.formation && (
                    <span
                        className="shrink-0 px-2 py-0.5 text-[10px] font-black tabular-nums"
                        style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                        {team.formation}
                    </span>
                )}
            </div>

            <div className="relative w-full aspect-[3/4] overflow-hidden border-2 border-[color:var(--filo)] bg-[#0C2418]">
                {/* righe dell'erba */}
                <span
                    className="absolute inset-0 opacity-[0.2]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 8%, transparent 8% 16%)",
                    }}
                />
                <PitchLines />
                <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none" />

                {(team.starters ?? []).map((p) => {
                    const line = team.starters
                        .filter((o) => o.role === p.role)
                        .sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
                    const idx = line.indexOf(p);
                    return (
                        <PitchPlayer
                            key={p.id || p.name}
                            player={p}
                            accent={accent}
                            onSelect={onSelect}
                            stagger={line.length > 2 && idx % 2 === 1}
                        />
                    );
                })}
            </div>

            {/* Panchina stile Lega Serie A — lista orizzontale foto + nome */}
            {(team.bench?.length ?? 0) > 0 && (
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-2 px-1">
                        Panchina
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(team.bench ?? []).map((p) => (
                            <button
                                key={p.id || p.name}
                                onClick={() => onSelect(p)}
                                className="flex items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-[color:var(--calce)]/[0.06]"
                            >
                                <PlayerAvatar player={p} accent={accent} size="sm" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-xs font-bold text-white/75 truncate">{p.name}</span>
                                    <span className="block text-[9px] text-white/30 truncate">{p.roleLabel}</span>
                                </span>
                                <span className="shrink-0 flex items-center gap-1">
                                    {p.subbedIn && (
                                        <span className="text-[10px] font-black text-emerald-400 tabular-nums">
                                            ↑{p.subbedIn}&apos;
                                        </span>
                                    )}
                                    {p.goals > 0 && (
                                        <span className="text-[12px] drop-shadow-[0_0_6px_rgba(255,200,0,0.5)]">
                                            ⚽
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Formazioni stile Lega Serie A:
 * - Foto grandi con glow
 * - Badge gol animati
 * - Panchina compatta
 * - Mobile: una squadra per volta, Desktop: affiancate
 */
export function Pitch({
    home,
    away,
    colors,
    onSelectPlayer,
}: {
    home: NormalizedTeam;
    away: NormalizedTeam;
    /** colori delle due squadre, gia' resi leggibili e distinti fra loro */
    colors?: { home: string; away: string };
    onSelectPlayer: (p: NormalizedPlayer) => void;
}) {
    const [side, setSide] = useState<"home" | "away">("home");

    // Nessun ripiego ciano/arancio: se i colori non arrivano si usa la
    // calce per entrambe, che è neutra e si nota subito come anomalia.
    const HOME_ACCENT = colors?.home ?? "#EDE8DC";
    const AWAY_ACCENT = colors?.away ?? "#7C93AB";

    if ((home.starters?.length ?? 0) === 0 && (away.starters?.length ?? 0) === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                Formazioni non ancora disponibili
            </p>
        );
    }

    return (
        <div>
            {/* selettore squadra mobile */}
            <div className="md:hidden flex p-1 mb-4 border-2 border-[color:var(--filo)] bg-[color:var(--fondale)]">
                {([
                    { key: "home" as const, team: home, accent: HOME_ACCENT },
                    { key: "away" as const, team: away, accent: AWAY_ACCENT },
                ]).map(({ key, team, accent }) => (
                    <button
                        key={key}
                        onClick={() => setSide(key)}
                        aria-pressed={side === key}
                        className={cn(
                            "flex-1 py-2 text-[11px] font-black uppercase tracking-wider truncate transition-colors",
                            side === key ? "text-[#08102a]" : "text-white/45"
                        )}
                        style={side === key ? { backgroundColor: accent } : undefined}
                    >
                        {team.name}
                    </button>
                ))}
            </div>

            <div className="md:hidden">
                {side === "home" ? (
                    <TeamPitch team={home} accent={HOME_ACCENT} onSelect={onSelectPlayer} />
                ) : (
                    <TeamPitch team={away} accent={AWAY_ACCENT} onSelect={onSelectPlayer} />
                )}
            </div>

            <div className="hidden md:grid grid-cols-2 gap-5">
                <TeamPitch team={home} accent={HOME_ACCENT} onSelect={onSelectPlayer} />
                <TeamPitch team={away} accent={AWAY_ACCENT} onSelect={onSelectPlayer} />
            </div>
        </div>
    );
}