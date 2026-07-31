"use client";

import { useState } from "react";
import type { NormalizedPlayer, NormalizedTeam } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";

/** Cerchietto con la foto del giocatore, con ripiego sul numero di maglia. */
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
    const px = size === "sm" ? "w-9 h-9" : "w-11 h-11 md:w-12 md:h-12";

    if (failed || !player.photo) {
        return (
            <span
                className={cn(px, "rounded-full flex items-center justify-center border-2 bg-[#131a38] shrink-0")}
                style={{ borderColor: accent, boxShadow: `0 0 12px ${accent}55` }}
            >
                <span className="text-[11px] font-black text-white/80 tabular-nums">{player.number ?? "–"}</span>
            </span>
        );
    }

    return (
        <img
            src={player.photo}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={cn(px, "rounded-full object-cover object-top border-2 bg-[#131a38] shrink-0")}
            style={{ borderColor: accent, boxShadow: `0 0 12px ${accent}55` }}
        />
    );
}

/** Pallini e cartellini che si accumulano sull'angolo dell'avatar. */
function PlayerBadges({ player }: { player: NormalizedPlayer }) {
    const marks: React.ReactNode[] = [];

    for (let i = 0; i < player.goals; i++) {
        marks.push(
            <span key={`g${i}`} className="text-[11px] leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                ⚽
            </span>
        );
    }
    if (player.ownGoals > 0) {
        marks.push(
            <span key="og" className="text-[10px] leading-none" title="Autogol">
                🥅
            </span>
        );
    }
    if (player.red) {
        marks.push(<span key="r" className="w-[7px] h-[10px] rounded-[2px] bg-red-500 border border-red-700 shadow" />);
    } else if (player.yellow) {
        marks.push(<span key="y" className="w-[7px] h-[10px] rounded-[2px] bg-yellow-400 border border-yellow-600 shadow" />);
    }
    if (player.subbedOut) {
        marks.push(
            <span key="out" className="text-[9px] font-black text-red-400 leading-none" title={`Uscito al ${player.subbedOut}'`}>
                ↓
            </span>
        );
    }

    if (marks.length === 0) return null;
    return <span className="absolute -top-1 -right-1.5 flex flex-col items-center gap-0.5 z-20">{marks}</span>;
}

function PitchPlayer({
    player,
    accent,
    onSelect,
    stagger,
}: {
    player: NormalizedPlayer;
    accent: string;
    onSelect: (p: NormalizedPlayer) => void;
    /** abbassa la targhetta del nome: i compagni di reparto vicini non si accavallano */
    stagger: boolean;
}) {
    // y = 0 porta propria, 1 porta avversaria → sul campo verticale la porta
    // propria sta in basso, quindi la percentuale va invertita.
    //
    // Le coordinate vengono compresse in un'area di sicurezza: a bordo campo
    // l'avatar e la targhetta col nome uscirebbero dal riquadro, e il portiere
    // — che sta a y≈0 — finirebbe tagliato.
    const left = `${8 + (player.x ?? 0.5) * 84}%`;
    const top = `${9 + (1 - (player.y ?? 0.5)) * 78}%`;

    return (
        <button
            onClick={() => onSelect(player)}
            style={{ left, top }}
            aria-label={`${player.fullName}, ${player.roleLabel}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1
                       transition-transform duration-300 hover:scale-110 hover:z-30 focus-visible:scale-110 focus-visible:z-30"
        >
            <span className="relative">
                <PlayerAvatar player={player} accent={accent} />
                <PlayerBadges player={player} />
                {player.number != null && (
                    <span
                        className="absolute -bottom-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-[#080b1e] border border-white/25
                                   flex items-center justify-center text-[9px] font-black text-white/90 tabular-nums z-20"
                    >
                        {player.number}
                    </span>
                )}
            </span>

            <span
                className={cn(
                    "max-w-[60px] md:max-w-[72px] truncate rounded px-1 py-0.5 bg-black/75 backdrop-blur-sm",
                    "text-[9px] font-black uppercase tracking-tight leading-tight text-white",
                    "drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]",
                    stagger && "translate-y-1.5"
                )}
            >
                {player.name}
            </span>
            {player.rating != null && (
                <span
                    className="rounded px-1.5 text-[9px] font-black tabular-nums"
                    style={{ backgroundColor: `${accent}33`, color: accent }}
                >
                    {player.rating.toFixed(1)}
                </span>
            )}
        </button>
    );
}

/** Le linee del campo, disegnate una volta sola. */
function PitchLines() {
    return (
        <>
            <span className="absolute inset-[6%] border-2 border-white/10 rounded-lg" />
            <span className="absolute left-[6%] right-[6%] top-1/2 h-[2px] bg-white/10 -translate-y-1/2" />
            <span className="absolute left-1/2 top-1/2 w-[26%] aspect-square border-2 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <span className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* area di rigore in basso (squadra che attacca verso l'alto) */}
            <span className="absolute left-1/2 bottom-[6%] w-[54%] h-[17%] border-2 border-b-0 border-white/10 -translate-x-1/2" />
            <span className="absolute left-1/2 bottom-[6%] w-[26%] h-[7%] border-2 border-b-0 border-white/10 -translate-x-1/2" />
            {/* area in alto */}
            <span className="absolute left-1/2 top-[6%] w-[54%] h-[17%] border-2 border-t-0 border-white/10 -translate-x-1/2" />
            <span className="absolute left-1/2 top-[6%] w-[26%] h-[7%] border-2 border-t-0 border-white/10 -translate-x-1/2" />
        </>
    );
}

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
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums"
                        style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                        {team.formation}
                    </span>
                )}
            </div>

            <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#0f2a1b] via-[#123322] to-[#0b1f14]">
                {/* righe dell'erba */}
                <span
                    className="absolute inset-0 opacity-[0.25]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0 8%, transparent 8% 16%)",
                    }}
                />
                <PitchLines />
                <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none" />

                {team.starters.map((p) => {
                    // posizione del giocatore all'interno del proprio reparto:
                    // serve solo a decidere quali nomi abbassare di mezza riga
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

            {team.bench.length > 0 && (
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-2 px-1">Panchina</p>
                    <div className="flex flex-col gap-1">
                        {team.bench.map((p) => (
                            <button
                                key={p.id || p.name}
                                onClick={() => onSelect(p)}
                                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.06]"
                            >
                                <PlayerAvatar player={p} accent={accent} size="sm" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-xs font-bold text-white/75 truncate">{p.name}</span>
                                    <span className="block text-[10px] text-white/30">{p.roleLabel}</span>
                                </span>
                                {p.subbedIn && (
                                    <span className="shrink-0 text-[10px] font-black text-emerald-400 tabular-nums">
                                        ↑ {p.subbedIn}&apos;
                                    </span>
                                )}
                                {p.goals > 0 && <span className="shrink-0 text-[11px]">⚽</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Formazioni.
 *
 * Su telefono si vede una squadra alla volta a tutta larghezza — è la ragione
 * per cui i giocatori restano leggibili; su schermi larghi le due metà stanno
 * affiancate.
 */
export function Pitch({
    home,
    away,
    onSelectPlayer,
}: {
    home: NormalizedTeam;
    away: NormalizedTeam;
    onSelectPlayer: (p: NormalizedPlayer) => void;
}) {
    const [side, setSide] = useState<"home" | "away">("home");

    const HOME_ACCENT = "#22d3ee";
    const AWAY_ACCENT = "#f59e0b";

    if (home.starters.length === 0 && away.starters.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                Formazioni non ancora disponibili
            </p>
        );
    }

    return (
        <div>
            {/* selettore squadra: solo su telefono */}
            <div className="md:hidden flex p-1 mb-4 rounded-2xl border border-white/10 bg-white/[0.04]">
                {([
                    { key: "home" as const, team: home, accent: HOME_ACCENT },
                    { key: "away" as const, team: away, accent: AWAY_ACCENT },
                ]).map(({ key, team, accent }) => (
                    <button
                        key={key}
                        onClick={() => setSide(key)}
                        aria-pressed={side === key}
                        className={cn(
                            "flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider truncate transition-colors",
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
