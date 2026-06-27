"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/MagicCard";
import { CURRENT_SEASON } from "@/lib/seasons";

function ClassificaContent() {
    const searchParams = useSearchParams();
    const stagione = searchParams.get("stagione") || CURRENT_SEASON;

    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/classifica?stagione=${stagione}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setLeaderboard(data.classifica || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [stagione]);

    // Generate Matchday Columns (G1 to G38)
    const matchdays = Array.from({ length: 38 }, (_, i) => `G${i + 1}`);

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
                    <h1 className="text-3xl font-black tracking-tight text-3d-metallic mb-2">Classifica Generale</h1>
                    <p className="text-gray-500 text-sm">Scorri orizzontalmente per vedere tutte le giornate.</p>
                </div>

                {/* Main Table Container - Explicit overflow handling */}
                <MagicCard glowColor="#FACC15" className="flex-1 w-full relative overflow-hidden flex flex-col">

                    {/* Scrollable Wrapper */}
                    <div className="overflow-auto w-full h-full max-h-[80vh] custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                            <thead className="sticky top-0 z-40 bg-white shadow-sm">
                                <tr className="border-b border-black/5">
                                    <th className="sticky left-0 z-50 bg-white p-4 font-semibold text-gray-400 w-16 text-center border-r border-black/5">#</th>
                                    <th className="sticky left-[4rem] z-50 bg-white p-4 font-semibold text-[#10241a] min-w-[200px] border-r border-black/5 shadow-md">Squadra</th>
                                    <th className="sticky left-[calc(4rem+200px)] z-50 bg-black/[0.02] p-4 font-bold text-[#10241a] text-right border-r border-black/10 shadow-md">TOTALE</th>
                                    {matchdays.map(g => (
                                        <th key={g} className="hidden sm:table-cell p-3 font-medium text-gray-400 text-center min-w-[60px] border-r border-black/5">{g}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {leaderboard?.map((team, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-black/[0.02] transition-colors duration-150"
                                    >
                                        {/* Rank */}
                                        <td className="sticky left-0 z-30 bg-white p-4 text-center border-r border-black/5">
                                            <div className={cn(
                                                "w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs mx-auto",
                                                index === 0 ? "bg-amber-400 text-white" :
                                                    index === 1 ? "bg-gray-300 text-[#10241a]" :
                                                        index === 2 ? "bg-amber-600 text-white" :
                                                            "text-gray-400"
                                            )}>
                                                {team.rank}
                                            </div>
                                        </td>

                                        <td className="py-3 px-2 sticky left-[4rem] z-30 bg-white border-r border-black/5 shadow-md">
                                          {/* Forziamo un taglio del testo su mobile per non far sfasare la tabella */}
                                          <div className="w-[110px] sm:w-auto truncate font-bold text-sm sm:text-base text-[#10241a]">
                                            {team.Team}
                                          </div>
                                        </td>

                                        {/* Total Score */}
                                        <td className="py-3 px-2 w-16 text-right sm:text-center font-black text-secondary text-lg sm:text-xl sticky left-[calc(4rem+200px)] z-30 bg-black/[0.02] border-r border-black/10 shadow-md">
                                            {team.Generale}
                                        </td>

                                        {/* Matchdays */}
                                        {matchdays.map(g => (
                                            <td key={g} className="hidden sm:table-cell p-3 text-center border-r border-black/5 text-gray-500">
                                                {team[g] || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </MagicCard>
            </div>

        </main>
    );
}

export default function ClassificaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex justify-center items-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        }>
            <ClassificaContent />
        </Suspense>
    );
}
