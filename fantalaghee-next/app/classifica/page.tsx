"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClassificaPage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/classifica');
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setLeaderboard(data.classifica);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Generate Matchday Columns (G1 to G38)
    const matchdays = Array.from({ length: 38 }, (_, i) => `G${i + 1}`);

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center bg-[#050505]">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex justify-center items-center bg-[#050505] p-4">
            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 text-red-500 flex flex-col items-center gap-2">
                <AlertCircle className="w-8 h-8" />
                <span>Errore caricamento: {error}</span>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen pt-24 pb-8 px-4 md:px-8 flex flex-col relative overflow-hidden">

            {/* Background Layer */}
            <div className="absolute inset-0 z-[-1]">
                <div className="absolute inset-0 bg-[#050505]/80 z-10" />
                <img src="/image/bg-field-neon.png" alt="Background" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
            </div>

            <div className="relative z-30 flex flex-col flex-1">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Classifica Generale</h1>
                    <p className="text-gray-400 text-sm">Scorri orizzontalmente per vedere tutte le giornate.</p>
                </div>

                {/* Main Table Container - Explicit overflow handling */}
                <div className="flex-1 w-full relative border border-white/10 rounded-xl bg-[#111]/80 backdrop-blur-sm overflow-hidden flex flex-col shadow-sm">

                    {/* Scrollable Wrapper */}
                    <div className="overflow-auto w-full h-full max-h-[80vh] custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="sticky top-0 z-40 bg-[#111] shadow-2xl shadow-black/50">
                                <tr className="border-b border-white/10">
                                    <th className="sticky left-0 z-50 bg-[#111] p-4 font-semibold text-gray-400 w-16 text-center border-r border-white/5">#</th>
                                    <th className="sticky left-[4rem] z-50 bg-[#111] p-4 font-semibold text-white min-w-[200px] border-r border-white/5 shadow-xl">Squadra</th>
                                    <th className="sticky left-[calc(4rem+200px)] z-50 bg-[#111] p-4 font-bold text-white text-right border-r border-white/10 bg-white/5 shadow-xl">TOTALE</th>
                                    {matchdays.map(g => (
                                        <th key={g} className="p-3 font-medium text-gray-500 text-center min-w-[60px] border-r border-white/5">{g}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {leaderboard.map((team, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-white/5 transition-colors duration-150"
                                    >
                                        {/* Rank */}
                                        <td className="sticky left-0 z-30 bg-[#111] p-4 text-center border-r border-white/5">
                                            <div className={cn(
                                                "w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs mx-auto",
                                                index === 0 ? "bg-white text-black" :
                                                    index === 1 ? "bg-gray-400 text-black" :
                                                        index === 2 ? "bg-amber-600 text-white" :
                                                            "text-gray-500"
                                            )}>
                                                {team.rank}
                                            </div>
                                        </td>

                                        {/* Team Name */}
                                        <td className="sticky left-[4rem] z-30 bg-[#111] p-4 font-medium text-white border-r border-white/5 shadow-xl">
                                            {team.Team}
                                        </td>

                                        {/* Total Score */}
                                        <td className="sticky left-[calc(4rem+200px)] z-30 bg-[#111] p-4 text-right font-bold text-white border-r border-white/10 bg-white/5 shadow-xl">
                                            {team.Generale}
                                        </td>

                                        {/* Matchdays */}
                                        {matchdays.map(g => (
                                            <td key={g} className="p-3 text-center border-r border-white/5 text-gray-300">
                                                {team[g] || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </main >
    );
}
