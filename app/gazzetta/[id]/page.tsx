"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDateToItalian } from "@/lib/date-utils";

interface ArticleMeta {
    title: string;
    date: string;
    description: string;
    author: string;
    image: string;
}

/** "GIORNATA 38" dal titolo o dallo slug, per l'occhiello rosso in apertura. */
function occhiello(id: string, title: string): string {
    const m = `${title} ${id}`.match(/giornata[\s-]*(\d{1,2})|[-\s]g(\d{1,2})\b/i);
    const n = m?.[1] || m?.[2];
    return n ? `Giornata ${n}` : "Edizione speciale";
}

export default function ArticlePage() {
    const params = useParams();
    const id = params.id as string;

    const [content, setContent] = useState<string>("");
    const [metadata, setMetadata] = useState<ArticleMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageOk, setImageOk] = useState(true);
    const [progresso, setProgresso] = useState(0);

    useEffect(() => {
        async function loadArticle() {
            try {
                // Frontmatter già parsato lato server (bundle più leggero, caricamento più veloce)
                const res = await fetch(`/api/articles/${id}`);
                if (!res.ok) throw new Error("Scritto non trovato");
                const { metadata: meta, content: markdownBody } = await res.json();

                setMetadata(meta);
                setContent(markdownBody);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (id) loadArticle();
    }, [id]);

    // Barra di avanzamento della lettura, come sui reader dei quotidiani
    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            setProgresso(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [content]);

    const minuti = useMemo(
        () => Math.max(1, Math.round(content.trim().split(/\s+/).length / 200)),
        [content]
    );

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
        </div>
    );

    if (error || !metadata) return (
        <div className="min-h-screen pt-24 px-4 flex flex-col justify-center items-center text-center">
            <h1 className="text-2xl font-bold text-white mb-3">Articolo non disponibile</h1>
            <p className="text-white/55 mb-8">{error}</p>
            <Link href="/gazzetta" className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-full border border-white/15 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Torna alla Gazzetta
            </Link>
        </div>
    );

    const dataIt = formatDateToItalian(metadata.date);

    return (
        <article className="min-h-screen pt-24 md:pt-28 pb-16 px-3 sm:px-6">

            {/* Avanzamento lettura */}
            <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[60]" aria-hidden="true">
                <div className="h-full bg-[#C8102E] transition-[width] duration-150 ease-out" style={{ width: `${progresso}%` }} />
            </div>

            {/* Tasto Back */}
            <div className="max-w-[52rem] mx-auto mb-5">
                <Link href="/gazzetta" aria-label="Torna agli articoli" className="inline-flex items-center text-white/70 hover:text-white transition-colors text-sm font-semibold bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Gazzetta
                </Link>
            </div>

            {/* IL FOGLIO */}
            <div className="foglio grana max-w-[52rem] mx-auto rounded-md overflow-hidden shadow-[0_28px_80px_rgba(4,8,25,0.65)] ring-1 ring-black/25">

                {/* --- TESTATA ------------------------------------------------ */}
                <header className="relative z-10 bg-[#F3D2DA] border-b-[5px] border-[#16100F] px-5 sm:px-10 pt-4 pb-5">
                    <div className="flex items-baseline justify-between gap-3 border-b border-black/20 pb-1.5 font-testata text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#16100F]">
                        <span>{dataIt}</span>
                        <span className="hidden sm:inline opacity-55 tracking-[0.3em] font-medium">Edizione del Lario</span>
                        <span className="text-[#C8102E]">fantalaghee.live</span>
                    </div>

                    <div className="testata-mark text-[#16100F] mt-4 mb-2 max-w-[34rem] mx-auto" role="img" aria-label="La Gazzetta del Laghèe" />

                    <div className="flex items-center gap-3 justify-center font-testata text-[9px] sm:text-[11px] uppercase tracking-[0.34em] text-[#16100F]/60">
                        <span className="h-px flex-1 bg-black/20" />
                        Tutto il Lario per la Vita
                        <span className="h-px flex-1 bg-black/20" />
                    </div>
                </header>

                {/* --- APERTURA ----------------------------------------------- */}
                <div className="relative z-10 px-5 sm:px-10 pt-7">

                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#C8102E] text-white font-testata text-[11px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 leading-none">
                            {occhiello(id, metadata.title)}
                        </span>
                        <span className="font-testata text-[11px] uppercase tracking-[0.2em] text-black/45">
                            La cronaca del Laghèe
                        </span>
                        <span className="h-px flex-1 bg-black/15" />
                    </div>

                    <h1 className="font-testata font-bold uppercase text-[#16100F] text-[2rem] sm:text-[2.9rem] md:text-[3.35rem] leading-[0.98] tracking-[-0.01em] text-balance">
                        {metadata.title}
                    </h1>

                    {metadata.description && (
                        <p className="mt-5 font-lora italic text-lg sm:text-xl leading-relaxed text-black/72 border-l-[3px] border-[#C8102E] pl-4">
                            {metadata.description}
                        </p>
                    )}

                    {/* Firma */}
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 border-y border-black/15 py-2.5 font-testata text-[11px] sm:text-xs uppercase tracking-[0.16em] text-black/55">
                        <span className="text-[#16100F] font-semibold">di {metadata.author}</span>
                        <span className="hidden sm:inline opacity-40">|</span>
                        <span>{dataIt}</span>
                        <span className="hidden sm:inline opacity-40">|</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {minuti} min di lettura
                        </span>
                    </div>
                </div>

                {/* --- FOTO D'APERTURA ---------------------------------------- */}
                {imageOk && (
                    <figure className="relative z-10 mx-5 sm:mx-10 mt-7 border-2 border-[#16100F]">
                        <Image
                            src={metadata.image}
                            alt={`Copertina per ${metadata.title}`}
                            width={1200}
                            height={675}
                            priority
                            onError={() => setImageOk(false)}
                            className="w-full h-auto object-contain bg-[#EFE7DA]"
                        />
                        <figcaption className="flex items-center gap-2.5 border-t-2 border-[#16100F] bg-[#16100F] px-3 py-1.5 text-[11px] text-[#F8F3EA]/85">
                            <span className="font-testata text-[9px] font-bold uppercase tracking-[0.16em] border border-[#F8F3EA]/45 px-1.5 py-0.5 whitespace-nowrap">
                                La prima pagina
                            </span>
                            <span className="truncate">{metadata.title}</span>
                        </figcaption>
                    </figure>
                )}

                {/* --- CORPO -------------------------------------------------- */}
                <div className="relative z-10 px-5 sm:px-10 py-8">
                    <div className="giornale">
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
                    </div>
                </div>

                {/* --- PIEDE -------------------------------------------------- */}
                <footer className="relative z-10 mx-5 sm:mx-10 mb-8 border-t-2 border-[#16100F] pt-3 flex flex-wrap items-center justify-between gap-3 font-testata text-[10px] uppercase tracking-[0.18em] text-black/50">
                    <span>La Gazzetta del Laghèe — Organo ufficiale del Fanta Laghèe</span>
                    <Link href="/gazzetta" className="text-[#C8102E] hover:underline">Torna all&apos;edicola →</Link>
                </footer>
            </div>
        </article>
    );
}
