"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Shield, Goal, Sparkles, Swords, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/MagicCard";
import { CURRENT_SEASON, SEASONS } from "@/lib/seasons";

type Tab = "squadre" | "marcatori";

type TeamStat = {
    id: string;
    name: string;
    played: number;
    win: number;
    draw: number;
    lose: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
};

function StatisticheContent() {
    const searchParams = useSearchParams();
    const stagione = searchParams.get("stagione") || CURRENT_SEASON;
    const seasonLabel = SEASONS[stagione]?.label || SEASONS[CURRENT_SEASON].label;

    const [tab, setTab] = useState<Tab>("squadre");
    const [teams, setTeams] = useState<TeamStat[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seasonUnavailable, setSeasonUnavailable] = useState(false);
    const [playersUnavailable, setPlayersUnavailable] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            setError(null);
            setSeasonUnavailable(false);
            setPlayersUnavailable(false);
            try {
                // Squadre: usiamo l'endpoint standings (lo stesso, affidabile, di Classifica/Risultati)
                const res = await fetch(`/api/football?endpoint=standings&stagione=${stagione}`);
                const json = await res.json();
                if (cancelled) return;

                if (json?.seasonUnavailable) {
                    setSeasonUnavailable(true);
                    setTeams([]);
                } else {
                    const raw = json?.data?.teams || [];
                    const getStat = (t: any, id: string) => {
                        const s = t.stats?.find((x: any) => x.statsId === id);
                        return s ? (parseInt(s.statsValue) || 0) : 0;
                    };
                    const parsed: TeamStat[] = raw.map((t: any) => ({
                        id: t.teamId,
                        name: t.shortName || t.officialName || "N/A",
                        played: getStat(t, "matches-played"),
                        win: getStat(t, "win"),
                        draw: getStat(t, "draw"),
                        lose: getStat(t, "lose"),
                        gf: getStat(t, "goals-for"),
                        ga: getStat(t, "goals-against"),
                        gd: getStat(t, "goal-difference"),
                        points: getStat(t, "points"),
                    }));
                    setTeams(parsed);
                }

                // Marcatori: endpoint sperimentale, fallback elegante se non disponibile
                try {
                    const pRes = await fetch(`/api/football?endpoint=playerstats&category=General&stagione=${stagione}`);
                    const pJson = await pRes.json();
                    if (!cancelled) {
                        if (pJson?.ok && Array.isArray(pJson.data?.players) && pJson.data.players.length > 0) {
                            setPlayers(pJson.data.players);
                        } else {
                            setPlayersUnavailable(true);
                        }
                    }
                } catch {
                    if (!cancelled) setPlayersUnavailable(true);
                }
            } catch (err: any) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchData();
        return () => { cancelled = true; };
    }, [stagione]);

    // Ordina per attacco (gol fatti) di default — taglio "statistiche" distinto dalla classifica
    const attackBoard = [...teams].sort((a, b) => b.gf - a.gf || b.gd - a.gd);
    const defenseBoard = [...teams].sort((a, b) => a.ga - b.ga || b.gd - a.gd);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center">
            <Loader2 className="w-10 h-10 text-cyan-300 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex justify-center items-center p-4">
            <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 text-red-300 flex flex-col items-center gap-2 backdrop-blur-xl">
                <AlertCircle className="w-8 h-8" />
                <span>Errore caricamento: {error}</span>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 flex flex-col relative">
            <div className="relative z-30 flex flex-col flex-1 max-w-6xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-3d-metallic mb-2">Statistiche Serie A</h1>
                    <p className="text-white/55 text-sm">Numeri di squadre e calciatori · Stagione {seasonLabel}</p>
                </div>

                {/* Tab switch */}
                <div className="flex gap-1.5 mb-6 bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-full w-fit">
                    <button
                        onClick={() => setTab("squadre")}
                        className={cn(
                            "flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all",
                            tab === "squadre" ? "bg-white text-[#10241a] shadow-sm" : "text-white/55 hover:text-white"
                        )}
                    >
                        <Shield className="w-3.5 h-3.5" /> Squadre
                    </button>
                    <button
                        onClick={() => setTab("marcatori")}
                        className={cn(
                            "flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all",
                            tab === "marcatori" ? "bg-white text-[#10241a] shadow-sm" : "text-white/55 hover:text-white"
                        )}
                    >
                        <Goal className="w-3.5 h-3.5" /> Marcatori
                    </button>
                </div>

                {/* ===== SQUADRE ===== */}
                {tab === "squadre" && (
                    seasonUnavailable ? (
                        <EmptyState text={`Lega Serie A non ha ancora pubblicato i dati della stagione ${seasonLabel}. Torna a controllare più avanti.`} />
                    ) : teams.length === 0 ? (
                        <EmptyState text="Le statistiche di squadra non sono ancora disponibili per questa stagione." />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <StatTable
                                title="Miglior Attacco"
                                icon={<Swords className="w-4 h-4 text-pink-400" />}
                                glow="#EC4899"
                                rows={attackBoard}
                                highlight="gf"
                                highlightLabel="Gol Fatti"
                            />
                            <StatTable
                                title="Miglior Difesa"
                                icon={<ShieldCheck className="w-4 h-4 text-cyan-400" />}
                                glow="#2563EB"
                                rows={defenseBoard}
                                highlight="ga"
                                highlightLabel="Gol Subiti"
                            />
                        </div>
                    )
                )}

                {/* ===== MARCATORI ===== */}
                {tab === "marcatori" && (
                    playersUnavailable || players.length === 0 ? (
                        <EmptyState text="La classifica marcatori ufficiale non è ancora disponibile per questa stagione." />
                    ) : (
                        <MagicCard glowColor="#EC4899" className="w-full overflow-hidden">
                            <div className="overflow-auto w-full max-h-[72vh] custom-scrollbar">
                                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                                        <tr className="border-b border-black/5">
                                            <th className="p-4 font-semibold text-gray-400 w-12 text-center">#</th>
                                            <th className="p-4 font-semibold text-[#10241a] min-w-[180px]">Calciatore</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Squadra</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Gol</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Assist</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Partite</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {players.map((p: any, i: number) => (
                                            <tr key={p?.player?.playerId || i} className="hover:bg-black/[0.02] transition-colors">
                                                <td className="p-4 text-center font-black text-gray-400">{i + 1}</td>
                                                <td className="p-3 font-bold text-[#10241a]">{p?.player?.name || "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{p?.team?.officialName || p?.team?.name || "-"}</td>
                                                <td className="p-3 text-center font-black text-secondary">{p?.stats?.goals ?? "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{p?.stats?.assists ?? "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{p?.stats?.matchesPlayed ?? "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </MagicCard>
                    )
                )}
            </div>
        </main>
    );
}

function StatTable({
    title, icon, glow, rows, highlight, highlightLabel,
}: {
    title: string;
    icon: React.ReactNode;
    glow: string;
    rows: TeamStat[];
    highlight: "gf" | "ga";
    highlightLabel: string;
}) {
    return (
        <MagicCard glowColor={glow} className="w-full overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-black/5">
                {icon}
                <h3 className="text-sm font-black uppercase tracking-wider text-[#10241a]">{title}</h3>
            </div>
            <div className="overflow-auto w-full max-h-[64vh] custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                        <tr className="border-b border-black/5 text-[10px] uppercase tracking-wider text-gray-400">
                            <th className="py-2.5 px-3 w-8 text-center">#</th>
                            <th className="py-2.5 px-2 font-semibold">Squadra</th>
                            <th className="py-2.5 px-2 text-center">PG</th>
                            <th className="py-2.5 px-2 text-center font-bold text-secondary">{highlightLabel}</th>
                            <th className="py-2.5 px-2 text-center">DR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {rows.map((t, i) => (
                            <tr key={t.id} className="hover:bg-black/[0.02] transition-colors">
                                <td className="py-2.5 px-3 text-center">
                                    <span className={cn(
                                        "inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-black",
                                        i === 0 ? "bg-amber-400 text-white" : "text-gray-400"
                                    )}>{i + 1}</span>
                                </td>
                                <td className="py-2.5 px-2 font-bold text-[#10241a]">{t.name}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500 font-mono">{t.played}</td>
                                <td className="py-2.5 px-2 text-center font-black text-secondary text-base">{t[highlight]}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500 font-mono">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </MagicCard>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <MagicCard glowColor="#FACC15" className="w-full">
            <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-pink-500/5" />
                <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center bg-white/70 border border-black/5 shadow-sm">
                    <Goal className="w-7 h-7 text-secondary" />
                    <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1.5 animate-pulse" />
                </div>
                <span className="relative z-10 font-oswald text-xl text-[#10241a] tracking-wide uppercase">
                    Coming Soon
                </span>
                <span className="relative z-10 text-sm text-gray-400 font-serif italic max-w-[300px]">
                    {text}
                </span>
            </div>
        </MagicCard>
    );
}

export default function StatistichePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex justify-center items-center">
                <Loader2 className="w-10 h-10 text-cyan-300 animate-spin" />
            </div>
        }>
            <StatisticheContent />
        </Suspense>
    );
}
