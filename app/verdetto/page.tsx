
"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Medal, Flame, ThumbsDown, Coins } from 'lucide-react';
import { MagicCard } from '@/components/ui/MagicCard';
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

export default function VerdettoPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await fetch('/api/verdetto');
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
    }, []);

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen pt-24 px-4 flex justify-center items-center">
            <div className="glass p-6 rounded-lg text-red-400 border border-red-500/30">
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
                grid: { display: false, color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#e5e7eb', font: { family: 'Inter' } }
            },
            y: {
                grid: { display: false },
                ticks: { color: '#fff', font: { weight: 'bold' as const, size: 14 } }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(5, 5, 20, 0.95)',
                padding: 16,
                titleFont: { size: 16, family: 'Oswald' },
                bodyFont: { size: 14, family: 'serif' },
                borderColor: 'rgba(255,255,255,0.1)',
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
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">

            {/* Background Layer */}
            <div className="absolute inset-0 z-[-1]">
                <div className="absolute inset-0 bg-[#050505]/85 z-10" />
                <img src="/image/bg-verdetto.png" alt="Background" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
            </div>

            <div className="relative z-30 max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className={`${oswald.className} text-4xl md:text-6xl font-bold text-white uppercase tracking-wide`}>
                        IL VERDETTO
                    </h1>
                    <div className="inline-block px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-medium">
                        Aggiornato alla Giornata {data.numeroGiornata}
                    </div>
                    <div className="pt-2">
                        <a href="https://docs.google.com/spreadsheets/d/1lHQEZoQT3TmgA-mPwExzorjxv6ub-xvFW-9WTm5805Y/edit?usp=sharing" target="_blank" className="text-xs text-muted-foreground hover:text-white transition-colors underline decoration-dotted">
                            Vedi Foglio Google Originale
                        </a>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Leader */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                        style={{ '--team-color': '250, 204, 21' } as any}
                    >
                        <MagicCard glowColor="#34d399" className="h-full">
                            <div className="p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(var(--team-color),0.5)]">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy className="w-24 h-24 text-yellow-400" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase text-yellow-500 tracking-widest mb-3">Leader Attuale</h3>
                                    <p className="text-3xl md:text-5xl font-bold text-white break-words">{data.leaderAttuale}</p>
                                </div>
                            </div>
                        </MagicCard>
                    </motion.div>

                    {/* Record */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                        style={{ '--team-color': '249, 115, 22' } as any}
                    >
                        <MagicCard glowColor="#34d399" className="h-full">
                            <div className="p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(var(--team-color),0.5)]">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Flame className="w-24 h-24 text-orange-500" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase text-orange-400 tracking-widest mb-3">Record Assoluto</h3>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-white">{data.recordAssoluto.punteggio}</p>
                                        <p className="text-lg text-gray-300">{data.recordAssoluto.squadra}</p>
                                        <p className="text-sm text-muted-foreground uppercase">{data.recordAssoluto.giornata}</p>
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
                        <MagicCard glowColor="#34d399" className="h-full">
                            <div className="p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(var(--team-color),0.5)] bg-red-900/10">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ThumbsDown className="w-24 h-24 text-red-400" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold uppercase text-red-400 tracking-widest mb-3">Cucchiaio di Legno</h3>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-white">{data.cucchiaioDiLegno.punteggio}</p>
                                        <p className="text-lg text-gray-300">{data.cucchiaioDiLegno.squadra}</p>
                                        <p className="text-sm text-muted-foreground uppercase">{data.cucchiaioDiLegno.giornata}</p>
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
                        <MagicCard glowColor="#34d399" className="h-full">
                            <div className="p-6 flex flex-col h-full">
                                <h3 className={`${oswald.className} text-2xl text-white mb-6 pl-2 border-l-4 border-indigo-500`}>TOP 5 CLASSIFICA</h3>
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
                        <MagicCard glowColor="#34d399" className="h-full">
                            <div className="p-6 flex flex-col h-full">
                                <h3 className={`${oswald.className} text-2xl text-white mb-6 pl-2 border-l-4 border-yellow-500`}>PODIO DI GIORNATA</h3>
                                <div className="space-y-4 flex-1">
                                    {data.podio.map((p: any, i: number) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                                            <span className="text-3xl filter drop-shadow-lg">{['🥇', '🥈', '🥉'][i]}</span>
                                            <div>
                                                <p className="font-bold text-white text-lg">{p.squadra}</p>
                                                <p className="text-sm text-indigo-300 font-mono">{p.punteggio} pts</p>
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
                        <h2 className={`${oswald.className} text-3xl font-bold text-amber-400`}>MONTEPREMI</h2>
                        <Coins className="w-8 h-8 text-amber-400" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Classifica Premi */}
                        <div className="h-full">
                            <MagicCard glowColor="#34d399" className="h-full">
                                <div className="p-5 flex flex-col h-full">
                                    <h4 className="text-center font-bold text-indigo-300 mb-6 uppercase tracking-wide text-lg">Classifica Generale</h4>
                                    <div className="space-y-2">
                                        {data.premi.classifica.map((p: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded transition-colors">
                                                <span className="text-gray-300">{p.squadra}</span>
                                                <span className="font-bold text-amber-400">{p.premio} 🍆</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </div>

                        {/* Giornata Premi */}
                        <div className="h-full">
                            <MagicCard glowColor="#34d399" className="h-full">
                                <div className="p-5 flex flex-col h-full">
                                    <h4 className="text-center font-bold text-indigo-300 mb-6 uppercase tracking-wide text-lg">Premi di Giornata</h4>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                        {data.premi.giornata.map((p: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded transition-colors">
                                                <span className="text-gray-300">{p.squadra}</span>
                                                <span className="font-bold text-amber-400">{p.premio} 🍆</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MagicCard>
                        </div>

                        {/* Miglior Punteggio */}
                        <div className="h-full">
                            <MagicCard glowColor="#34d399" className="h-full">
                                <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden h-full">
                                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                                    <h4 className="font-bold text-indigo-300 uppercase tracking-wide text-lg relative z-10">Miglior Punteggio</h4>
                                    <div className="py-4">
                                        <p className="text-white font-semibold text-lg">{data.premi.migliorPunteggio.info}</p>
                                        <p className="text-4xl font-bold text-amber-400 mt-2">{data.premi.migliorPunteggio.premio} 🍆</p>
                                    </div>
                                </div>
                            </MagicCard>
                        </div>

                    </div>
                </div>


            </div>
        </main>
    );
}
