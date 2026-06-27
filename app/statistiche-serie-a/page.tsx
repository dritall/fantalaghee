"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Shield, Goal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/MagicCard";
import { CURRENT_SEASON } from "@/lib/seasons";

type Tab = "squadre" | "marcatori";

function StatisticheContent() {
    const searchParams = useSearchParams();
    const stagione = searchParams.get("stagione") || CURRENT_SEASON;

    const [tab, setTab] = useState<Tab>("squadre");
    const [teams, setTeams] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playersUnavailable, setPlayersUnavailable] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const [teamsRes, playersRes] = await Promise.all([
                    fetch(`/api/football?endpoint=clubstats&category=General&stagione=${stagione}`),
                    fetch(`/api/football?endpoint=playerstats&category=General&stagione=${stagione}`),
                ]);

                const teamsJson = await teamsRes.json();
                if (teamsJson.ok) setTeams(teamsJson.data?.teams || []);

                const playersJson = await playersRes.json();
                if (playersJson.ok && Array.isArray(playersJson.data?.players) && playersJson.data.players.length > 0) {
                    setPlayers(playersJson.data.players);
                } else {
                    setPlayersUnavailable(true);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [stagione]);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex justify-center items-center p-4">
            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-red-500 flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                <span>Errore caricamento: {error}</span>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen pt-24 pb-8 px-4 md:px-8 flex flex-col relative">
            <div className="relative z-30 flex flex-col flex-1 max-w-6xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-3xl font-black tracking-tight text-3d-metallic mb-2">Statistiche Serie A</h1>
                    <p className="text-gray-500 text-sm">Numeri di squadre e calciatori, aggiornati da Lega Serie A.</p>
                </div>

                <div className="flex gap-1.5 mb-6 bg-black/5 p-1 rounded-full w-fit">
                    <button
                        onClick={() => setTab("squadre")}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all",
                            tab === "squadre" ? "bg-white text-secondary shadow-sm" : "text-gray-400"
                        )}
                    >
                        <Shield className="w-3.5 h-3.5" /> Squadre
                    </button>
                    <button
                        onClick={() => setTab("marcatori")}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all",
                            tab === "marcatori" ? "bg-white text-secondary shadow-sm" : "text-gray-400"
                        )}
                    >
                        <Goal className="w-3.5 h-3.5" /> Marcatori
                    </button>
                </div>

                {tab === "squadre" && (
                    teams.length === 0 ? (
                        <EmptyState text="Le statistiche di squadra non sono ancora disponibili per questa stagione." />
                    ) : (
                        <MagicCard glowColor="#2563EB" className="w-full overflow-hidden">
                            <div className="overflow-auto w-full max-h-[75vh] custom-scrollbar">
                                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                                        <tr className="border-b border-black/5">
                                            <th className="sticky left-0 z-30 bg-white p-4 font-semibold text-[#10241a] min-w-[180px] border-r border-black/5">Squadra</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Partite</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Gol Fatti</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Gol Subiti</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Tiri</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Possesso %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {teams.map((t: any, i: number) => (
                                            <tr key={t?.team?.teamId || i} className="hover:bg-black/[0.02] transition-colors duration-150">
                                                <td className="sticky left-0 z-10 bg-white p-3 border-r border-black/5 font-bold text-[#10241a]">
                                                    {t?.team?.officialName || t?.team?.name || "-"}
                                                </td>
                                                <td className="p-3 text-center text-gray-500">{t?.stats?.matchesPlayed ?? "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{t?.stats?.goals ?? "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{t?.stats?.goalsConceded ?? "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{t?.stats?.shots ?? "-"}</td>
                                                <td className="p-3 text-center text-gray-500">{t?.stats?.possession ?? "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </MagicCard>
                    )
                )}

                {tab === "marcatori" && (
                    playersUnavailable || players.length === 0 ? (
                        <EmptyState text="La classifica marcatori non è ancora disponibile per questa stagione." />
                    ) : (
                        <MagicCard glowColor="#EC4899" className="w-full overflow-hidden">
                            <div className="overflow-auto w-full max-h-[75vh] custom-scrollbar">
                                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                                    <thead className="sticky top-0 z-20 bg-white shadow-sm">
                                        <tr className="border-b border-black/5">
                                            <th className="sticky left-0 z-30 bg-white p-4 font-semibold text-[#10241a] min-w-[180px] border-r border-black/5">Calciatore</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Squadra</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Gol</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Assist</th>
                                            <th className="p-3 font-medium text-gray-400 text-center">Partite</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {players.map((p: any, i: number) => (
                                            <tr key={p?.player?.playerId || i} className="hover:bg-black/[0.02] transition-colors duration-150">
                                                <td className="sticky left-0 z-10 bg-white p-3 border-r border-black/5 font-bold text-[#10241a]">
                                                    {p?.player?.name || "-"}
                                                </td>
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
                <span className="relative z-10 text-sm text-gray-400 font-serif italic max-w-[280px]">
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
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <StatisticheContent />
        </Suspense>
    );
}
