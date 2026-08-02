"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Newspaper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateToItalian } from "@/lib/date-utils";
import { ARCHIVED_SEASON, SEASONS } from "@/lib/seasons";
import { SeasonLink } from "@/components/ui/SeasonLink";

interface Article {
    id: string;
    date: string;
    title: string;
    description?: string;
    imageUrl: string;
    stagione?: string;
    placeholder?: boolean;
}

/** Riquadro "in attesa": la redazione non ha ancora pubblicato niente. */
function ComingSoon({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "group relative rounded-[1.75rem] border border-dashed border-[color:var(--filo-alto)] bg-[#0d1330]/70 backdrop-blur-xl overflow-hidden",
                className
            )}
        >
            <span className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-cyan-500/5 to-indigo-500/10" />
            <div className="relative h-full flex flex-col items-center justify-center gap-3 text-center px-6 py-16">
                <span className="relative w-16 h-16 rounded-2xl flex items-center justify-center bg-[color:var(--velo-alto)] border border-[color:var(--filo-alto)]">
                    <Newspaper className="w-7 h-7 text-cyan-300" />
                    <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
                </span>
                <span className="font-oswald text-xl text-white tracking-wide uppercase">In preparazione</span>
                <span className="text-sm text-white/45 font-serif italic max-w-[240px]">
                    La Redazione sta scaldando i motori per la prima uscita di stagione 🏆
                </span>
            </div>
        </div>
    );
}

/** Card di un numero arretrato. */
function ArticleCard({ article, index }: { article: Article; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 380, damping: 24 } }}
            className="h-full"
        >
            <SeasonLink
                href={`/gazzetta/${article.id}`}
                className="group relative flex flex-col h-full rounded-[1.5rem] overflow-hidden border border-[color:var(--filo)] bg-[#0a0a1e]
                           shadow-[0_10px_34px_rgba(6,10,30,0.5)] transition-all duration-300
                           hover:shadow-[0_18px_46px_rgba(6,10,30,0.7)] hover:border-[color:var(--filo-alto)]"
            >
                {/* la copertina è il contenuto: prende tutto lo spazio che può */}
                <div className="relative aspect-[4/3] overflow-hidden shrink-0">
                    <div
                        className="absolute inset-0 bg-cover bg-top transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${article.imageUrl})` }}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a1e] to-transparent" />
                </div>

                <div className="relative flex flex-col flex-1 p-5 pt-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/80">
                        {formatDateToItalian(article.date)}
                    </span>
                    <h3 className="mt-2 font-oswald text-lg font-black uppercase leading-tight text-white group-hover:text-cyan-200 transition-colors line-clamp-3">
                        {article.title}
                    </h3>
                    <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35 group-hover:text-cyan-300 transition-colors">
                        Leggi
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                </div>
            </SeasonLink>
        </motion.div>
    );
}

export default function GazzettaPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadArticles() {
            try {
                const res = await fetch("/api/articles");
                if (res.ok) setArticles(await res.json());
            } catch (error) {
                console.error("Failed to load articles", error);
            } finally {
                setLoading(false);
            }
        }
        loadArticles();
    }, []);

    // L'ultima uscita apre la pagina a tutta larghezza; il resto va in archivio.
    const real = articles.filter((a) => !a.placeholder);
    const latest = real[0] || null;
    const rest = latest ? articles.filter((a) => a.id !== latest.id) : articles;
    const onlyPlaceholders = real.length === 0;

    return (
        <main className="min-h-screen pt-28 pb-16 px-4 md:px-8 relative">
            <div className="relative z-30 max-w-6xl mx-auto space-y-10">

                {/* ===== TESTATA ===== */}
                <header className="text-center space-y-4">
                    <h1 className="sr-only">La Gazzetta del Laghèe</h1>
                    <div className="testata-mark text-pink-200 w-full max-w-3xl mx-auto" aria-hidden="true" />
                    <div className="flex items-center gap-4 justify-center max-w-2xl mx-auto font-testata text-[10px] md:text-xs uppercase tracking-[0.34em] text-white/45">
                        <span className="h-px flex-1 bg-[color:var(--filo-alto)]" />
                        Tutto il Lario per la Vita
                        <span className="h-px flex-1 bg-[color:var(--filo-alto)]" />
                    </div>
                    <p className="text-lg text-white/55 font-lora italic">
                        &ldquo;L&apos;unica testata che non ha paura di prendere 65.5&rdquo;
                    </p>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
                    </div>
                ) : onlyPlaceholders ? (
                    <ComingSoon />
                ) : (
                    <>
                        {/* ===== NUMERO IN PRIMA PAGINA ===== */}
                        {latest && (
                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                aria-label="Ultimo numero"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/15 border border-pink-400/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-pink-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                                        In edicola
                                    </span>
                                    <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                                </div>

                                <SeasonLink
                                    href={`/gazzetta/${latest.id}`}
                                    className="group relative grid md:grid-cols-2 rounded-[2rem] overflow-hidden border border-[color:var(--filo)] bg-[#0a0a1e]
                                               shadow-[0_18px_56px_rgba(6,10,30,0.6)] transition-all duration-300
                                               hover:border-[color:var(--filo-alto)] hover:shadow-[0_26px_70px_rgba(6,10,30,0.75)]"
                                >
                                    <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px] overflow-hidden">
                                        <div
                                            className="absolute inset-0 bg-cover bg-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                                            style={{ backgroundImage: `url(${latest.imageUrl})` }}
                                        />
                                        {/* sfumatura verso il testo: in basso su telefono, a destra su desktop */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a1e] to-transparent md:hidden" />
                                        <div className="hidden md:block absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#0a0a1e] to-transparent" />
                                    </div>

                                    <div className="relative flex flex-col justify-center p-6 md:p-9">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                                            {formatDateToItalian(latest.date)}
                                        </span>
                                        <h2 className="mt-3 font-oswald text-3xl md:text-4xl font-black uppercase leading-[1.05] tracking-tight text-white">
                                            {latest.title}
                                        </h2>
                                        {latest.description && (
                                            <p className="mt-4 text-sm md:text-base text-white/55 font-lora italic leading-relaxed line-clamp-4">
                                                {latest.description}
                                            </p>
                                        )}
                                        <span className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                                            Leggi il numero
                                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                        </span>
                                    </div>
                                </SeasonLink>
                            </motion.section>
                        )}

                        {/* ===== ARRETRATI ===== */}
                        {rest.length > 0 && (
                            <section aria-label="Numeri precedenti">
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">
                                        Numeri precedenti
                                    </h2>
                                    <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                                    {rest.map((article, index) => {
                                        // Il divisore separa due stagioni: se gli arretrati
                                        // sono già tutti d'archivio non serve, lo direbbe
                                        // subito dopo il titolo di sezione.
                                        const prev = rest[index - 1];
                                        const isFirstArchived =
                                            article.stagione === ARCHIVED_SEASON &&
                                            !!prev &&
                                            prev.stagione !== ARCHIVED_SEASON;

                                        return (
                                            <Fragment key={article.id || index}>
                                                {isFirstArchived && (
                                                    <div className="col-span-full flex items-center gap-4 mt-4 mb-1">
                                                        <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                                                        <span className="text-white/40 text-[10px] uppercase tracking-[0.22em] font-black whitespace-nowrap">
                                                            Archivio {SEASONS[ARCHIVED_SEASON].label}
                                                        </span>
                                                        <span className="h-px flex-1 bg-[color:var(--velo-alto)]" />
                                                    </div>
                                                )}

                                                {article.placeholder ? (
                                                    <ComingSoon className="h-full" />
                                                ) : (
                                                    <ArticleCard article={article} index={index} />
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
