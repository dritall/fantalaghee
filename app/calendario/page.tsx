"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Fixture {
    idEvent: string;
    intRound: string;
    dateEvent: string;
    strTime: string;
    strHomeTeam: string;
    strAwayTeam: string;
    intHomeScore: string | null;
    intAwayScore: string | null;
    strHomeTeamBadge: string;
    strAwayTeamBadge: string;
    strVenue: string;
}

export default function CalendarioPage() {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRound, setSelectedRound] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSchedule() {
            try {
                const res = await fetch('/api/calendario');
                if (!res.ok) throw new Error('Failed to fetch schedule');
                const data = await res.json();

                if (data.error) throw new Error(data.details);

                setFixtures(data.fixtures || []);

                // Default to the first round found or a specific logic
                if (data.fixtures && data.fixtures.length > 0) {
                    // Find current round logic could go here, for now just pick 1 or the last played
                    setSelectedRound("1");
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchSchedule();
    }, []);

    // Group fixtures by round
    const rounds = fixtures.reduce((acc, fixture) => {
        const round = fixture.intRound;
        if (!acc[round]) acc[round] = [];
        acc[round].push(fixture);
        return acc;
    }, {} as Record<string, Fixture[]>);

    const roundKeys = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

    return (
        <main className="min-h-screen pt-24 pb-8 px-4 md:px-8 flex flex-col relative">

            <div className="relative z-30 flex flex-col flex-1 items-center">
                <div className="mb-6 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-3d-metallic font-oswald uppercase tracking-wide">
                        Calendario Stagione
                    </h1>
                    <p className="text-gray-500">Tutte le sfide, giornata per giornata.</p>
                </div>

                {loading && (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                )
                }

                {
                    !loading && !error && (
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Round Selector (Timeline Sidebar) */}
                            <div className="w-full md:w-48 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[80vh] pb-4 scrollbar-hide">
                                {roundKeys.map((round) => (
                                    <button
                                        key={round}
                                        onClick={() => setSelectedRound(round)}
                                        className={cn(
                                            "px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                            selectedRound === round
                                                ? "bg-primary text-white shadow-[0_8px_20px_rgba(22,163,74,0.3)] scale-105"
                                                : "bg-black/5 text-gray-500 hover:bg-black/10 hover:text-[#10241a]"
                                        )}
                                    >
                                        GIORNATA {round}
                                    </button>
                                ))}
                            </div>

                            {/* Fixtures Grid */}
                            <div className="flex-1 min-h-[500px]">
                                <AnimatePresence mode="wait">
                                    {selectedRound && rounds[selectedRound] && (
                                        <motion.div
                                            key={selectedRound}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                                        >
                                            {rounds[selectedRound].map((fixture) => (
                                                <div key={fixture.idEvent} className="glass-card p-6 rounded-2xl group relative overflow-hidden">
                                                    <div className="relative z-10 flex flex-col gap-4">
                                                        {/* Date & Venue */}
                                                        <div className="flex justify-between text-xs text-gray-400 font-medium uppercase tracking-wider">
                                                            <div className="flex items-center gap-1">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                {new Date(fixture.dateEvent).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {fixture.strTime.substring(0, 5)}
                                                            </div>
                                                        </div>

                                                        {/* Teams & Score */}
                                                        <div className="flex items-center justify-between">
                                                            {/* Home */}
                                                            <div className="flex flex-col items-center gap-2 flex-1 items-end pr-4">
                                                                <div className="w-16 h-16 relative">
                                                                    <img src={`${fixture.strHomeTeamBadge}/preview`} alt={fixture.strHomeTeam} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                                                </div>
                                                            </div>

                                                            {/* Score */}
                                                            <div className="px-4 py-2 bg-black/[0.03] rounded-xl border border-black/5 font-mono text-2xl md:text-3xl font-black italic tracking-tighter text-[#10241a] z-10 mx-4 shrink-0">
                                                                {fixture.intHomeScore !== null ? fixture.intHomeScore : '-'} - {fixture.intAwayScore !== null ? fixture.intAwayScore : '-'}
                                                            </div>

                                                            {/* Away */}
                                                            <div className="flex flex-col items-center gap-2 flex-1 items-start pl-4">
                                                                <div className="w-16 h-16 relative">
                                                                    <img src={`${fixture.strAwayTeamBadge}/preview`} alt={fixture.strAwayTeam} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )
                }
            </div>
        </main>
    );
}
