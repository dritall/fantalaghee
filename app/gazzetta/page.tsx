"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Newspaper, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateToItalian } from "@/lib/date-utils";
import { ARCHIVED_SEASON, SEASONS } from "@/lib/seasons";

interface Article {
    id: string;
    date: string;
    title: string;
    imageUrl: string;
    stagione?: string;
    placeholder?: boolean;
}

export default function GazzettaPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadArticles() {
            try {
                const res = await fetch('/api/articles');
                if (res.ok) {
                    const data = await res.json();
                    setArticles(data);
                }
            } catch (error) {
                console.error("Failed to load articles", error);
            } finally {
                setLoading(false);
            }
        }
        loadArticles();
    }, []);

    return (
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative">

            <div className="relative z-30 max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold font-oswald text-pink-600 uppercase tracking-tight">
                        La Gazzetta del Laghèe
                    </h1>
                    <p className="text-lg text-white/55 font-serif italic">
                        "L'unica testata che non ha paura di prendere 65.5"
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, index) => {
                            const isFirstArchived =
                                article.stagione === ARCHIVED_SEASON &&
                                articles[index - 1]?.stagione !== ARCHIVED_SEASON;

                            return (
                            <Fragment key={article.id || index}>
                            {isFirstArchived && (
                                <div key={`divider-${article.id}`} className="col-span-full flex items-center gap-4 my-2">
                                    <div className="flex-1 h-px bg-white/15" />
                                    <span className="text-white/45 text-xs sm:text-sm uppercase tracking-[0.2em] font-bold whitespace-nowrap">
                                        Archivio Stagione {SEASONS[ARCHIVED_SEASON].label}
                                    </span>
                                    <div className="flex-1 h-px bg-white/15" />
                                </div>
                            )}
                            <motion.div
                                key={article.id || index}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: (index % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                whileHover={{ y: -8, transition: { type: "spring", stiffness: 380, damping: 22 } }}
                                className={cn(
                                    "group relative h-[400px] rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(6,10,30,0.45)] border",
                                    article.placeholder ? "bg-[#0d1330]/70 backdrop-blur-xl border-dashed border-white/15" : "bg-[#0a0a1e] border-white/10"
                                )}
                            >
                                {article.placeholder ? (
                                    <div className="w-full h-full flex items-center justify-center flex-col gap-3 text-center px-6 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-cyan-500/5 to-indigo-500/10" />
                                        <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center bg-white/10 border border-white/15 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                            <Newspaper className="w-7 h-7 text-cyan-300" />
                                            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
                                        </div>
                                        <span className="relative z-10 font-oswald text-xl text-white tracking-wide uppercase">
                                            Coming Soon
                                        </span>
                                        <span className="relative z-10 text-sm text-white/50 font-serif italic max-w-[220px]">
                                            La Redazione sta scaldando i motori per la prima uscita di stagione 🏆
                                        </span>
                                    </div>
                                ) : (
                                    <Link href={`/gazzetta/${article.id}`} className="block w-full h-full">
                                        {/* Background Image — nitida */}
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                            style={{ backgroundImage: `url(${article.imageUrl})` }}
                                        />

                                        {/* Scrim: leggero su tutta la card + banda scura piena in basso per il titolo */}
                                        <div className="absolute inset-0 bg-[#06060f]/35 group-hover:bg-[#06060f]/20 transition-colors duration-500" />
                                        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#050510] via-[#050510]/92 via-30% to-transparent" />

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 w-full p-7 flex flex-col gap-2.5">
                                            <span className="text-cyan-300 font-bold font-serif text-sm tracking-wider uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                                                {formatDateToItalian(article.date)}
                                            </span>
                                            <h3 className="text-2xl font-black text-white font-oswald leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] group-hover:text-cyan-300 transition-colors">
                                                {article.title}
                                            </h3>

                                            <div className="flex items-center text-cyan-300 font-bold text-sm mt-3 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                LEGGI ARTICOLO <ArrowRight className="w-4 h-4 ml-2" />
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </motion.div>
                            </Fragment>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
