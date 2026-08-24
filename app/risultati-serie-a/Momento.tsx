"use client";

import type { NormalizedEvent } from "@/lib/lega-normalize";
import { cn } from "@/lib/utils";

export type MomentumTick = {
    periodId: number;
    matchMinute: number;
    home: number;
    away: number;
};

/** Minuto di orologio: 1º tempo così com'è, 2º tempo +45. */
export function clockMinute(periodId: number, matchMinute: number): number {
    return (Number(periodId) === 2 ? 45 : 0) + Number(matchMinute || 0);
}

export function ticksFromApi(raw: any): MomentumTick[] {
    const list = raw?.predictions || raw?.momentum || raw?.data || [];
    if (!Array.isArray(list)) return [];
    return list
        .map((p: any) => ({
            periodId: Number(p.periodId) || 1,
            matchMinute: Number(p.matchMinute) || 0,
            home: Number(p.home) || 0,
            away: Number(p.away) || 0,
        }))
        .filter((p: MomentumTick) => p.matchMinute > 0)
        .sort((a: MomentumTick, b: MomentumTick) => clockMinute(a.periodId, a.matchMinute) - clockMinute(b.periodId, b.matchMinute));
}

export function legaMatchUrl(matchId: string | undefined, home: string, away: string, tab?: string): string | null {
    if (!matchId) return null;
    const id = String(matchId).includes("::") ? String(matchId).split("::").pop() : String(matchId);
    if (!id) return null;
    const slug = (s: string) =>
        String(s || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    const path = `${id}/${slug(home)}-vs-${slug(away)}`;
    return `https://www.legaseriea.it/serie-a/match/${path}${tab ? `/${tab}` : ""}`;
}

/**
 * Momento stile Lega: barre al minuto da Opta (home su, away giù).
 * Sotto, il commento ricavato dagli eventi + link alla pagina Lega.
 */
export function Momento({
    ticks,
    events,
    colors,
    homeName,
    awayName,
    commentaryUrl,
}: {
    ticks: MomentumTick[];
    events: NormalizedEvent[];
    colors: { home: string; away: string };
    homeName: string;
    awayName: string;
    commentaryUrl?: string | null;
}) {
    const official = ticks.length >= 10;
    const bars = official
        ? ticks.map((t) => ({
              minute: clockMinute(t.periodId, t.matchMinute),
              home: t.home,
              away: t.away,
          }))
        : fallbackFromEvents(events);

    if (bars.length === 0) {
        return (
            <p className="py-16 text-center text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)]">
                Momento non ancora pubblicato
            </p>
        );
    }

    const peak = Math.max(0.001, ...bars.map((b) => Math.max(b.home, b.away)));
    const goals = events.filter((e) => e.kind === "goal" || e.kind === "penalty-goal" || e.kind === "own-goal");
    const comments = events.filter((e) => e.description || e.kind !== "other");

    return (
        <div className="space-y-5">
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

            <div className="rounded-[var(--ro-s)] border border-[color:var(--filo)] bg-[color:var(--fondale)] p-3">
                <div className="relative h-[140px]">
                    <span className="absolute left-0 top-1 z-10 text-[8px] font-black text-[color:var(--fumo)]">H</span>
                    <span className="absolute left-0 bottom-1 z-10 text-[8px] font-black text-[color:var(--fumo)]">A</span>
                    <div className="absolute inset-0 flex px-3">
                        {bars.map((b, i) => (
                            <div key={`${b.minute}-${i}`} className="flex-1 min-w-0 flex flex-col">
                                <div className="flex-1 flex items-end">
                                    <span
                                        className="w-full"
                                        style={{
                                            height: `${Math.max(4, (b.home / peak) * 100)}%`,
                                            backgroundColor: colors.home,
                                            opacity: Math.max(0.35, Math.min(1, 0.4 + b.home / peak)),
                                        }}
                                    />
                                </div>
                                <div className="h-px bg-white/15" />
                                <div className="flex-1 flex items-start">
                                    <span
                                        className="w-full"
                                        style={{
                                            height: `${Math.max(4, (b.away / peak) * 100)}%`,
                                            backgroundColor: colors.away,
                                            opacity: Math.max(0.35, Math.min(1, 0.4 + b.away / peak)),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {goals.map((g, i) => {
                        const last = bars[bars.length - 1]?.minute || 90;
                        const left = `${Math.min(98, Math.max(2, ((g.minute + g.extra) / last) * 100))}%`;
                        return (
                            <span
                                key={`g${i}`}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] leading-none"
                                style={{ left }}
                                title={`${g.label} ${g.player}`}
                            >
                                ⚽
                            </span>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1.5 px-0.5 text-[9px] font-bold tabular-nums text-[color:var(--fumo)]">
                    {[0, 15, 30, 45, 60, 75, 90].map((m) => (
                        <span key={m}>{m}&apos;</span>
                    ))}
                </div>
            </div>

            <p className="text-[10px] leading-relaxed text-[color:var(--fumo)]">
                {official
                    ? "Barre al minuto da Lega Serie A (pressione Opta). Casa sopra, ospite sotto. I palloni sono le reti."
                    : "Ricostruito dagli episodi della partita: Lega non ha ancora pubblicato il momento ufficiale."}
            </p>

            {comments.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--fumo)] mb-2">Commento</h4>
                    <ol className="space-y-1.5">
                        {comments.slice(0, 24).map((e, i) => (
                            <li key={i} className="flex gap-2 text-[12px] leading-snug">
                                <span className="numerone shrink-0 text-[11px] text-[color:var(--fumo)] w-8 tabular-nums">{e.label}</span>
                                <span className="min-w-0">
                                    <span className="font-bold" style={{ color: e.side === "home" ? colors.home : colors.away }}>
                                        {e.player}
                                    </span>
                                    {e.assist ? <span className="text-[color:var(--fumo)]"> · assist {e.assist}</span> : null}
                                    {e.description ? (
                                        <span className="block italic text-[11px] text-[color:var(--fumo)]">{e.description}</span>
                                    ) : (
                                        <span className="text-[color:var(--fumo)]"> · {etichettaEvento(e.kind)}</span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {commentaryUrl && (
                <a
                    href={commentaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "block text-center text-[10px] font-black uppercase tracking-[0.16em]",
                        "rounded-full border border-[color:var(--filo)] py-2.5 text-[color:var(--lario)]"
                    )}
                >
                    Commento completo su Lega Serie A ↗
                </a>
            )}
        </div>
    );
}

function etichettaEvento(kind: string): string {
    if (kind === "goal" || kind === "penalty-goal") return "gol";
    if (kind === "own-goal") return "autogol";
    if (kind === "yellow") return "ammonizione";
    if (kind === "red") return "espulsione";
    if (kind === "sub") return "sostituzione";
    if (kind === "var") return "VAR";
    return kind;
}

function fallbackFromEvents(events: NormalizedEvent[]): { minute: number; home: number; away: number }[] {
    const WEIGHT: Record<string, number> = {
        goal: 10,
        "penalty-goal": 12,
        "own-goal": 6,
        "penalty-missed": 4,
        red: 5,
        yellow: 2,
        sub: 1,
        var: 1,
        other: 0,
    };
    const last = Math.max(90, ...events.map((e) => e.minute + e.extra));
    const out: { minute: number; home: number; away: number }[] = [];
    for (let m = 1; m <= last; m++) {
        let home = 0;
        let away = 0;
        for (const e of events) {
            const w = WEIGHT[e.kind] ?? 0;
            if (!w) continue;
            const dt = m - (e.minute + e.extra);
            if (dt < 0 || dt > 8) continue;
            const s = w * Math.exp(-(dt * dt) / 32);
            if (e.side === "home") home += s;
            else away += s;
        }
        out.push({ minute: m, home, away });
    }
    return out.some((b) => b.home || b.away) ? out : [];
}
