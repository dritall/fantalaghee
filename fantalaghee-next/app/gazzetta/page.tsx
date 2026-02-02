"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Article {
    id: string;
    date: string;
    title: string;
    imageUrl: string;
    placeholder?: boolean;
}

export default function GazzettaPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadArticles() {
            try {
                const res = await fetch('/data/articles.json');
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
        <main className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">

            {/* Background Layer */}
            <div className="absolute inset-0 z-[-1]">
                <div className="absolute inset-0 bg-[#050505]/80 z-10" />
                <img src="/image/bg-gazzetta.png" alt="Background" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] z-20" />
            </div>

            <div className="relative z-30 max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold font-oswald text-rose-500 uppercase tracking-tight">
                        La Gazzetta del Laghèe
                    </h1>
                    <p className="text-lg text-muted-foreground font-serif italic">
                        "L'unica testata che non ha paura di prendere 65.5"
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, index) => (
                            <motion.div
                                key={article.id || index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className={cn(
                                    "group relative h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl",
                                    article.placeholder ? "bg-white/5 border-dashed" : "bg-black"
                                )}
                            >
                                {article.placeholder ? (
                                    <div className="w-full h-full flex items-center justify-center flex-col text-muted-foreground">
                                        <span className="font-oswald text-2xl opacity-50">Coming Soon...</span>
                                    </div>
                                ) : (
                                    <Link href={`/gazzetta/${article.id}`} className="block w-full h-full">
                                        {/* Background Image */}
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                                            style={{ backgroundImage: `url(${article.imageUrl})` }}
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                                        {/* Content */}
                                        <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col gap-3">
                                            <span className="text-amber-400 font-bold font-serif text-sm tracking-wider uppercase">
                                                {article.date}
                                            </span>
                                            <h3 className="text-2xl font-bold text-white font-oswald leading-tight group-hover:text-rose-400 transition-colors">
                                                {article.title}
                                            </h3>

                                            <div className="flex items-center text-rose-400 font-bold text-sm mt-4 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                LEGGI ARTICOLO <ArrowRight className="w-4 h-4 ml-2" />
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
