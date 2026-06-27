
"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Medal, Flame, ThumbsDown, Coins } from 'lucide-react';
import { MagicCard } from '@/components/ui/MagicCard';
import { CURRENT_SEASON } from '@/lib/seasons';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Oswald } from 'next/font/google';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const oswald = Oswald({ subsets: ['latin'] });

function VerdettoContent() {
    const searchParams = useSearchParams();
    const stagione = searchParams.get('stagione') || CURRENT_SEASON;

    const [data, setData] = useState<any>(null);

    const fireConfetti = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({ particleCount: 60, spread: 70, origin: { x, y }, colors: ['#FFD700', '#a855f7', '#38bdf8', '#4ade80', '#f97316'] });
    }, []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            setLoading(true);
            try {
                const res = await fetch(`/api/verdetto?stagione=${stagione}`);
                if (!res.ok) throw new Error("Errore nel caricamento dati");
                const jsonData = await res.json();
                if (jsonData.error) throw new Error(jsonData.details);
                setData(jsonData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, [stagione]);

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen pt-24 px-4 flex justify-center items-center">
            <div className="glass p-6 rounded-lg text-red-500 border border-red-500/30">
                Errore: {error}
            </div>
        </div>
    );

    // Chart Config
    const chartData = {
        labels: data?.classifica?.map((d: any) => d.squadra) || [],
        datasets: [{
            label: 'Punti Totali',
            data: data?.classifica?.map((d: any) => d.punti) || [],
            backgroundColor: [
                'rgba(255, 215, 0, 0.7)', // Gold
                'rgba(192, 192, 192, 0.7)', // Silver
                'rgba(205, 127, 50, 0.7)',  // Bronze
                'rgba(74, 222, 128, 0.6)',
                'rgba(74, 222, 128, 0.6)',
            ],
            borderColor: [
                '#FFD700',
                '#C0C0C0',
                '#CD7F32',
                '#4ade80',
                '#4ade80',
            ],
            borderWidth: 2,
            borderRadius: 6,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        scales: {
            x: {
                grid: { display: false, color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { color: '#6b7280', font: { family: 'Inter' } }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#10241a', font: { weight: 'bold' as const, size: 14 } }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.97)',
                titleColor: '#10241a',
                bodyColor: '#374151',
                padding: 16,
                titleFont: { size: 16, family: 'Oswald' },
                bodyFont: { size: 14, family: 'serif' },
                borderColor: 'rgba(0,0,0,0.08)',
                borderWidth: 1,
                callbacks: {
                    label: (context: any) => {
                        const dataPoint = data?.classifica[context.dataIndex];
                        return [
                            `Punti Totali: ${context.raw}`,
                            `Media: ${dataPoint?.mediaPunti || 'N/D'}`
                        ];
                    }
                }
            }
        }
    };

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative">

            <div className="relative z-30 max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className={`${oswald.className} text-4xl md:text-6xl font-bold text-3d-metallic uppercase tracking-wide`}>
                        IL VERDETTO
                    </h1>
                    <div className="inline-block px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-medium">
                        Aggiornato alla Giornata {data.numeroGiornata}
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Leader */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ '--team-color': '250, 204, 21' } as any}
                    >
                        <MagicCard glowColor="#FACC15" className="h-full">
                            <div className="p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy className="w-24 h-24 text-amber-400" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase text-amber-500 tracking-widest mb-3">Leader Attuale</h3>
                                    <p className="text-3xl md:text-5xl font-bold text-[#10241a] break-words">{data.leaderAttuale}</p>
                                </div>
                            </div>
                        </MagicCard>
                    </motion.div>

                    {/* Record */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                        style={{ '--team-color': '249, 115, 22' } as any}
                    >
                        <MagicCard glowColor="#EC4899" className="h-full">
                            <div className="p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Flame className="w-24 h-24 text-pink-500" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase text-pink-500 tracking-widest mb-3">Record Assoluto</h3>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-[#10241a]">{data.recordAssoluto.punteggio}</p>
                                        <p className="text-lg text-gray-600">{data.recordAssoluto.squadra}</p>
                                        <p className="text-sm text-gray-400 uppercase">{data.recordAssoluto.giornata}</p>
                                    </div>
                                </div>
                            </div>
                        </MagicCard>
                    </motion.div>

                    {/* Cucchiaio */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
                        style={{ '--team-color': '248, 113, 113' } as any}
                    >
                        <MagicCard glowColor="#7C3AED" className="h-full">
                            <div className="p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 bg-red-500/5">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ThumbsDown className="w-24 h-24 text-red-400" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase text-red-500 tracking-widest mb-3">Cucchiaio di Legno</h3>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-[#10241a]">{data.cucchiaioDiLegno.punteggio}</p>
                                        <p className="text-lg text-gray-600">{data.cucchiaioDiLegno.squadra}</p>
                                        <p className="text-sm text-gray-400 uppercase">{data.cucchiaioDiLegno.giornata}</p>
                                    </div>
                                </div>
                            </div>
                        </MagicCard>
                    </motion.div>

                </div>

                {/* Chart & Podium Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Chart */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                        className="lg:col-span-2 flex flex-col h-full"
                    >
                        <MagicCard glowColor="#2563EB" className="h-full">
                            <div className="p-6 flex flex-col h-full">
                                <h3 className={`${oswald.className} text-2xl text-[#10241a] mb-6 pl-2 border-l-4 border-secondary`}>TOP 5 CLASSIFICA</h3>
                                <div className="flex-1 min-h-[300px]">
                                    <Bar data={chartData} options={chartOptions} />
                                </div>
                            </div>
                        </MagicCard>
                    </motion.div>

                    {/* Podium */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                        className="flex flex-col h-full"
                    >
                        <MagicCard glowColor="#FACC15" className="h-full">
                            <div className="p-6 flex flex-col h-full">
                                <h3 className={`${oswald.className} text-2xl text-[#10241a] mb-6 pl-2 border-l-4 border-amber-400`}>PODIO DI GIORNATA</h3>
                                <div className="space-y-4 flex-1">
                                    {data.podio.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-black/[0.02] border border-black/5">
                                            <span className="text-3xl filter drop-shadow-lg">{['🥇', '🥈', '🥉'][i]}</span>
                                            <div>
                                                <p className="font-bold text-[#10241a] text-lg">{p.squadra}</p>
                                                <p className="text-sm text-secondary font-mono">{p.punteggio} pts</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </MagicCard>
                    </motion.div>
                </div>


                {/* Premi Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 justify-center mb-8">
                        <Coins className="w-8 h-8 text-amber-400" />
                        <h2 className={`${oswald.className} text-3xl font-bold text-amber-500`}>MONTEPREMI</h2>
                        <Coins className="w-8 h-8 text-amber-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Classifica Premi */}
                        <div className="h-full">
                            <MagicCard glowColor="#2563EB" className="h-full">
                                <div className="p-5 flex flex-col h-full">
                                    <h4 className="text-center font-bold text-secondary mb-6 uppercase tracking-wide text-lg">Classifica Generale</h4>
                                    <div className="space-y-2">
                                        {data.premi.classifica.map((p: any, i: number) => (
                                            <div key={i} onMouseEnter={fireConfetti} onTouchStart={fireConfetti} className="flex justify-between items-center text-sm p-2 hover:bg-black/[0.02] rounded transition-colors cursor-pointer">
                                                <span className="text-gray-600">{p.squadra}</span>
                                                <span className="font-bold text-amber-500">{p.premio} 🍆</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </div>

                        {/* Giornata Premi */}
                        <div className="h-full">
                            <MagicCard glowColor="#2563EB" className="h-full">
                                <div className="p-5 flex flex-col h-full">
                                    <h4 className="text-center font-bold text-secondary mb-6 uppercase tracking-wide text-lg">Premi di Giornata</h4>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                        {data.premi.giornata.map((p: any, i: number) => (
                                            <div key={i} onMouseEnter={fireConfetti} onTouchStart={fireConfetti} className="flex justify-between items-center text-sm p-2 hover:bg-black/[0.02] rounded transition-colors cursor-pointer">
                                                <span className="text-gray-600">{p.squadra}</span>
                                                <span className="font-bold text-amber-500">{p.premio} 🍆</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </div>

                        {/* Miglior Punteggio */}
                        <div className="h-full">
                            <MagicCard glowColor="#FACC15" className="h-full">
                                <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden h-full">
                                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                                    <h4 className="font-bold text-secondary uppercase tracking-wide text-lg relative z-10">Miglior Punteggio</h4>
                                    <div onMouseEnter={fireConfetti} onTouchStart={fireConfetti} className="py-4 cursor-pointer">
                                        <p className="text-[#10241a] font-semibold text-lg">{data.premi.migliorPunteggio.info}</p>
                                        <p className="text-4xl font-bold text-amber-500 mt-2">{data.premi.migliorPunteggio.premio} 🍆</p>
                                    </div>
                                </div>
                            </MagicCard>
                        </div>

                        {/* Premi Super Lega */}
                        {data.premi.superLega?.length > 0 && (
                        <div className="h-full">
                            <MagicCard glowColor="#7C3AED" className="h-full">
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Trophy className="w-5 h-5 text-violet-500" />
                                        <h4 className="font-bold text-violet-600 uppercase tracking-wide text-lg">Premi Super Lega</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {data.premi.superLega?.map((p: any, i: number) => (
                                            <div key={i} onMouseEnter={fireConfetti} onTouchStart={fireConfetti} className="flex justify-between items-center text-sm p-2 hover:bg-black/[0.02] rounded transition-colors cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{['🥇','🥈','🥉','4️⃣'][i] || `${i+1}.`}</span>
                                                    <span className="text-gray-600">{p.squadra}</span>
                                                </div>
                                                <span className="font-bold text-amber-500">{p.premio} 🍆</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </div>
                        )}

                        {/* Premi Coppa UEFA */}
                        {data.premi.coppaUefa?.length > 0 && (
                        <div className="h-full">
                            <MagicCard glowColor="#2563EB" className="h-full">
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Trophy className="w-5 h-5 text-sky-500" />
                                        <h4 className="font-bold text-sky-600 uppercase tracking-wide text-lg">Premi Coppa UEFA</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {data.premi.coppaUefa?.map((p: any, i: number) => (
                                            <div key={i} onMouseEnter={fireConfetti} onTouchStart={fireConfetti} className="flex justify-between items-center text-sm p-2 hover:bg-black/[0.02] rounded transition-colors cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{['🥇','🥈'][i] || `${i+1}.`}</span>
                                                    <span className="text-gray-600">{p.squadra}</span>
                                                </div>
                                                <span className="font-bold text-amber-500">{p.premio} 🍆</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </div>
                        )}

                    </div>

                    {/* Riepilogo aggregato premi */}
                    {data.premi.riepilogo?.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                        >
                            <MagicCard glowColor="#FACC15" className="w-full">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Medal className="w-6 h-6 text-amber-500" />
                                        <h4 className={`${oswald.className} text-2xl font-bold text-amber-500 uppercase tracking-wide`}>Riepilogo Premi Totali</h4>
                                        <span className="text-xs text-gray-400 ml-2">(Classifica + Giornata + Miglior Punteggio + Coppe)</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {data.premi.riepilogo.map((p: any, i: number) => (
                                            <div
                                                key={i}
                                                onMouseEnter={fireConfetti}
                                                onTouchStart={fireConfetti}
                                                className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-1 ${
                                                    i === 0 ? 'border-amber-400/50 bg-amber-400/10' :
                                                    i === 1 ? 'border-slate-300/60 bg-slate-300/10' :
                                                    i === 2 ? 'border-orange-500/40 bg-orange-500/10' :
                                                    'border-black/5 bg-black/[0.02]'
                                                }`}
                                            >
                                                {i < 3 ? (
                                                    <>
                                                        <span className="text-2xl mb-1">{['🥇','🥈','🥉'][i]}</span>
                                                        <p className="text-[#10241a] font-bold text-sm text-center leading-tight">{p.squadra}</p>
                                                        <p className="text-amber-500 font-bold text-xl mt-1">{p.totale}</p>
                                                        <span className="text-xl mt-0.5">🍆</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-[#10241a] font-bold text-sm text-center leading-tight">{p.squadra}</p>
                                                        <p className="text-amber-500 font-bold text-xl mt-1">{p.totale}</p>
                                                        <span className="text-xl mt-0.5">🍆</span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </motion.div>
                    )}

                </div>


            </div>
        </main>
    );
}

export default function VerdettoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-24 flex justify-center items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <VerdettoContent />
        </Suspense>
    );
}
