
"use client";

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Medal, Flame, ThumbsDown, Coins } from 'lucide-react';
import { WaitingFirstMatchday } from '@/components/ui/WaitingFirstMatchday';
import { CURRENT_SEASON } from '@/lib/seasons';
import { SeasonBanner } from '@/components/ui/SeasonBanner';
import { SeasonPill } from '@/components/ui/SeasonPill';
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

    // Stagione non ancora iniziata: nessuna giornata o tutti i punti a zero
    const isPreSeason =
        !data ||
        !Number(data.numeroGiornata) ||
        (Array.isArray(data.classifica) && data.classifica.length > 0 && data.classifica.every((d: any) => !Number(d.punti)));

    if (isPreSeason) return (
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative">
            <div className="relative z-30 max-w-4xl mx-auto space-y-8">
                <SeasonBanner />
                <div className="text-center space-y-4">
                    <h1 className={`${oswald.className} text-4xl md:text-6xl font-bold text-3d-metallic uppercase tracking-wide`}>
                        IL VERDETTO
                    </h1>
                    <SeasonPill stagione={stagione} />
                </div>
                <WaitingFirstMatchday subtitle="Premi, record e classifiche compariranno qui dopo la prima giornata di campionato." />
            </div>
        </main>
    );

    // Grafico: palette pensata per il fondo notturno del sito
    const chartData = {
        labels: data?.classifica?.map((d: any) => d.squadra) || [],
        datasets: [{
            label: 'Punti Totali',
            data: data?.classifica?.map((d: any) => d.punti) || [],
            backgroundColor: [
                'rgba(250, 204, 21, 0.75)',
                'rgba(203, 213, 225, 0.65)',
                'rgba(217, 119, 6, 0.65)',
                'rgba(34, 211, 238, 0.45)',
                'rgba(34, 211, 238, 0.45)',
            ],
            borderColor: ['#facc15', '#cbd5e1', '#d97706', '#22d3ee', '#22d3ee'],
            borderWidth: 1.5,
            borderRadius: 8,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        scales: {
            x: {
                grid: { display: true, color: 'rgba(255, 255, 255, 0.06)' },
                border: { display: false },
                ticks: { color: 'rgba(255,255,255,0.35)', font: { size: 11 } }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: 'rgba(255,255,255,0.8)', font: { weight: 'bold' as const, size: 12 } }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(10, 15, 38, 0.97)',
                titleColor: '#ffffff',
                bodyColor: 'rgba(255,255,255,0.7)',
                padding: 14,
                borderColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: (context: any) => {
                        const dataPoint = data?.classifica[context.dataIndex];
                        return [
                            `Punti totali: ${context.raw}`,
                            `Media: ${dataPoint?.mediaPunti || 'N/D'}`
                        ];
                    }
                }
            }
        }
    };

    /* Riquadro con accento di colore, usato per i tre verdetti in cima. */
    const Highlight = ({ icon: Icon, title, hex, children, delay }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}
            className="relative h-full rounded-[1.5rem] p-[1.5px] overflow-hidden shadow-[0_10px_34px_rgba(6,10,30,0.5)]"
            style={{ background: `linear-gradient(155deg, ${hex}66, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.02))` }}
        >
            <div className="relative h-full rounded-[calc(1.5rem-1.5px)] bg-gradient-to-b from-[#0c1228] to-[#080b1e] p-5 overflow-hidden">
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span className="absolute -right-4 -top-4 opacity-[0.07] pointer-events-none">
                    <Icon className="w-28 h-28" style={{ color: hex }} />
                </span>
                <span
                    className="absolute -inset-px opacity-50 pointer-events-none"
                    style={{ background: `radial-gradient(300px circle at 50% -20%, ${hex}30, transparent 65%)` }}
                />
                <div className="relative">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.22em] mb-3" style={{ color: hex }}>{title}</h3>
                    {children}
                </div>
            </div>
        </motion.div>
    );

    /* Riga premio: squadra a sinistra, importo a destra. */
    const PrizeRow = ({ squadra, premio, rank }: any) => (
        <div
            onMouseEnter={fireConfetti}
            onTouchStart={fireConfetti}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.06]"
        >
            <span className="flex items-center gap-2 min-w-0">
                {rank !== undefined && <span className="text-sm shrink-0">{['🥇', '🥈', '🥉', '4️⃣'][rank] || `${rank + 1}.`}</span>}
                <span className="text-xs text-white/60 truncate">{squadra}</span>
            </span>
            <span className="text-xs font-black text-amber-300 tabular-nums shrink-0">{premio} 🍆</span>
        </div>
    );

    const Panel = ({ title, icon: Icon, hex, children, className = "" }: any) => (
        <div className={`surface rounded-[1.5rem] p-5 flex flex-col ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon className="w-4 h-4 shrink-0" style={{ color: hex }} />}
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: hex }}>{title}</h4>
            </div>
            {children}
        </div>
    );

    return (
        <main className="min-h-screen pt-28 pb-16 px-4 md:px-8 relative">
            <div className="relative z-30 max-w-6xl mx-auto space-y-10">

                <SeasonBanner />

                {/* ===== TESTATA ===== */}
                <header className="text-center space-y-4">
                    <h1 className={`${oswald.className} text-4xl md:text-6xl font-bold text-3d-metallic uppercase tracking-wide`}>
                        Il Verdetto
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <SeasonPill stagione={stagione} />
                        <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                            Giornata {data.numeroGiornata}
                        </span>
                    </div>
                </header>

                {/* ===== I TRE VERDETTI ===== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <Highlight icon={Trophy} title="Leader attuale" hex="#facc15" delay={0.05}>
                        <p className="text-2xl md:text-3xl font-black text-white break-words leading-tight">{data.leaderAttuale}</p>
                    </Highlight>

                    <Highlight icon={Flame} title="Record assoluto" hex="#ec4899" delay={0.12}>
                        <p className="text-3xl font-black text-white tabular-nums leading-none">{data.recordAssoluto.punteggio}</p>
                        <p className="text-sm font-bold text-white/70 mt-1.5 truncate">{data.recordAssoluto.squadra}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 mt-1">{data.recordAssoluto.giornata}</p>
                    </Highlight>

                    <Highlight icon={ThumbsDown} title="Cucchiaio di legno" hex="#f87171" delay={0.19}>
                        <p className="text-3xl font-black text-white tabular-nums leading-none">{data.cucchiaioDiLegno.punteggio}</p>
                        <p className="text-sm font-bold text-white/70 mt-1.5 truncate">{data.cucchiaioDiLegno.squadra}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30 mt-1">{data.cucchiaioDiLegno.giornata}</p>
                    </Highlight>
                </div>

                {/* ===== PODIO + TOP 5 ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.26 }}
                        className="lg:col-span-2"
                    >
                        <Panel title="Top 5 classifica" icon={Medal} hex="#22d3ee" className="h-full">
                            <div className="flex-1 min-h-[260px] md:min-h-[300px]">
                                <Bar data={chartData} options={chartOptions} />
                            </div>
                        </Panel>
                    </motion.div>

                    <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.32 }}>
                        <Panel title="Podio di giornata" icon={Trophy} hex="#facc15" className="h-full">
                            <div className="space-y-2 flex-1">
                                {data.podio.map((p: any, i: number) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                                            i === 0
                                                ? 'border-amber-300/30 bg-amber-400/[0.08]'
                                                : i === 1
                                                  ? 'border-white/15 bg-white/[0.05]'
                                                  : 'border-orange-400/20 bg-orange-500/[0.06]'
                                        }`}
                                    >
                                        <span className="text-2xl shrink-0">{['🥇', '🥈', '🥉'][i]}</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-black text-white text-sm truncate">{p.squadra}</span>
                                            <span className="block text-[11px] font-bold text-cyan-300 tabular-nums mt-0.5">{p.punteggio} pt</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </motion.div>
                </div>

                {/* ===== MONTEPREMI ===== */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Coins className="w-5 h-5 text-amber-300 shrink-0" />
                        <h2 className="text-[11px] font-black uppercase tracking-[0.26em] text-amber-300">Montepremi</h2>
                        <span className="h-px flex-1 bg-white/10" />
                    </div>

                    {/* il totale per squadra apre la sezione: è il dato che interessa di più */}
                    {data.premi.riepilogo?.length > 0 && (
                        <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.38 }}>
                            <Panel title="Totale per squadra" icon={Medal} hex="#facc15">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                    {data.premi.riepilogo.map((p: any, i: number) => (
                                        <div
                                            key={i}
                                            onMouseEnter={fireConfetti}
                                            onTouchStart={fireConfetti}
                                            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 ${
                                                i === 0
                                                    ? 'border-amber-300/40 bg-amber-400/[0.10]'
                                                    : i === 1
                                                      ? 'border-white/20 bg-white/[0.06]'
                                                      : i === 2
                                                        ? 'border-orange-400/30 bg-orange-500/[0.08]'
                                                        : 'border-white/[0.08] bg-white/[0.03]'
                                            }`}
                                        >
                                            {i < 3 && <span className="text-xl mb-1">{['🥇', '🥈', '🥉'][i]}</span>}
                                            <p className="text-white font-bold text-xs text-center leading-tight line-clamp-2">{p.squadra}</p>
                                            <p className="text-amber-300 font-black text-xl tabular-nums mt-1.5">{p.totale}</p>
                                            <span className="text-sm">🍆</span>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Panel title="Classifica generale" icon={Trophy} hex="#22d3ee">
                            <div className="space-y-0.5">
                                {data.premi.classifica.map((p: any, i: number) => (
                                    <PrizeRow key={i} squadra={p.squadra} premio={p.premio} />
                                ))}
                            </div>
                        </Panel>

                        <Panel title="Premi di giornata" icon={Medal} hex="#22d3ee">
                            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {data.premi.giornata.map((p: any, i: number) => (
                                    <PrizeRow key={i} squadra={p.squadra} premio={p.premio} />
                                ))}
                            </div>
                        </Panel>

                        <Panel title="Miglior punteggio" icon={Flame} hex="#facc15">
                            <div
                                onMouseEnter={fireConfetti}
                                onTouchStart={fireConfetti}
                                className="flex-1 flex flex-col items-center justify-center text-center py-4 cursor-pointer"
                            >
                                <p className="text-white/70 font-semibold text-sm">{data.premi.migliorPunteggio.info}</p>
                                <p className="text-3xl font-black text-amber-300 tabular-nums mt-2">
                                    {data.premi.migliorPunteggio.premio} 🍆
                                </p>
                            </div>
                        </Panel>

                        {data.premi.superLega?.length > 0 && (
                            <Panel title="Premi Super Lega" icon={Trophy} hex="#a78bfa">
                                <div className="space-y-0.5">
                                    {data.premi.superLega.map((p: any, i: number) => (
                                        <PrizeRow key={i} squadra={p.squadra} premio={p.premio} rank={i} />
                                    ))}
                                </div>
                            </Panel>
                        )}

                        {data.premi.coppaUefa?.length > 0 && (
                            <Panel title="Premi Coppa UEFA" icon={Trophy} hex="#38bdf8">
                                <div className="space-y-0.5">
                                    {data.premi.coppaUefa.map((p: any, i: number) => (
                                        <PrizeRow key={i} squadra={p.squadra} premio={p.premio} rank={i} />
                                    ))}
                                </div>
                            </Panel>
                        )}
                    </div>
                </section>

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
