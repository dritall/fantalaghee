"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Goal, Sparkles } from "lucide-react";
import { MagicCard } from "@/components/ui/MagicCard";
import { CURRENT_SEASON, SEASONS } from "@/lib/seasons";

function StatisticheContent() {
    const searchParams = useSearchParams();
    const stagione = searchParams.get("stagione") || CURRENT_SEASON;
    const seasonLabel = SEASONS[stagione]?.label || SEASONS[CURRENT_SEASON].label;

    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unavailable, setUnavailable] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchData() {
            setLoading(true);
            setError(null);
            setUnavailable(false);
            try {
                const res = await fetch(`/api/football?endpoint=playerstats&category=General&stagione=${stagione}`);
                const json = await res.json();
                if (cancelled) return;
                if (json?.ok && Array.isArray(json.data?.players) && json.data.players.length > 0) {
                    setPlayers(json.data.players);
                } else {
                    setUnavailable(true);
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
            <div className="relative z-30 flex flex-col flex-1 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-3d-metallic mb-2">Marcatori Serie A</h1>
                    <p className="text-white/55 text-sm">La classifica dei bomber · Stagione {seasonLabel}</p>
                </div>

                {unavailable || players.length === 0 ? (
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
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-[12px] font-black ${i === 0 ? "bg-amber-400 text-white" : i < 3 ? "bg-black/5 text-[#10241a]" : "text-gray-400"}`}>{i + 1}</span>
                                            </td>
                                            <td className="p-3 font-bold text-[#10241a]">{p?.player?.name || "-"}</td>
                                            <td className="p-3 text-center text-gray-500">{p?.team?.officialName || p?.team?.name || "-"}</td>
                                            <td className="p-3 text-center font-black text-secondary text-base">{p?.stats?.goals ?? "-"}</td>
                                            <td className="p-3 text-center text-gray-500">{p?.stats?.assists ?? "-"}</td>
                                            <td className="p-3 text-center text-gray-500">{p?.stats?.matchesPlayed ?? "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </MagicCard>
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
