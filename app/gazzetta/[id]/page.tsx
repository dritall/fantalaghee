"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import matter from "gray-matter";
import { formatDateToItalian } from "@/lib/date-utils";

interface ArticleMeta {
    title: string;
    date: string;
    description: string;
    author: string;
    image: string;
}

export default function ArticlePage() {
    const params = useParams();
    const id = params.id as string;

    const [content, setContent] = useState<string>("");
    const [metadata, setMetadata] = useState<ArticleMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadArticle() {
            try {
                // Fetch the Markdown file directly
                const contentRes = await fetch(`/articoli/md/${id}.md`);
                if (!contentRes.ok) throw new Error("Scritto non trovato");
                const text = await contentRes.text();

                // Parse Frontmatter
                const { data, content: markdownBody } = matter(text);

                setMetadata({
                    title: data.title || id,
                    date: data.date || "Senza Data",
                    description: data.description || "",
                    author: data.author || "La Redazione",
                    image: data.image || "/image/gazzetta/default.jpg"
                });

                setContent(markdownBody);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (id) loadArticle();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center bg-[#050505]">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        </div>
    );

    if (error || !metadata) return (
        <div className="min-h-screen pt-24 px-4 flex flex-col justify-center items-center bg-[#050505] text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Articolo non disponibile</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Link href="/gazzetta" className="text-rose-400 hover:text-rose-300 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Torna alla Gazzetta
            </Link>
        </div>
    );

    return (
        <article className="min-h-screen bg-[#050505] text-white">
            
            {/* 1. Hero Header con Background */}
            <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden flex flex-col justify-end pt-24">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${metadata.image})` }}
                />
                {/* Overlay Scuro */}
                <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-[#050505] via-black/70 to-black/30" />

                {/* Contenuto in Sovrimpressione (Titolo, Metadati) */}
                <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-12">
                    {/* Back Button (Sticky-like via placement) */}
                    <Link href="/gazzetta" className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors text-sm font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Gazzetta
                    </Link>

                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-oswald uppercase leading-tight mb-4 tracking-wide text-white drop-shadow-2xl">
                        {metadata.title}
                    </h1>
                    
                    {metadata.description && (
                         <p className="text-xl md:text-2xl text-gray-200 font-serif italic max-w-3xl border-l-4 border-rose-500 pl-4 py-1 mb-8 drop-shadow-lg">
                             {metadata.description}
                         </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-rose-400 font-medium">
                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateToItalian(metadata.date)}</span>
                        </div>
                        <span className="text-white/80 text-sm bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                            di {metadata.author}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                
                {/* 2. Immagine Completa e Non Tagliata */}
                <div className="w-full relative rounded-2xl overflow-hidden mb-12 shadow-2xl bg-[#0a0a0a] p-2 border border-white/10">
                    <img 
                        src={metadata.image} 
                        alt={`Copertina per ${metadata.title}`} 
                        className="w-full h-auto object-contain max-h-[75vh] rounded-xl"
                    />
                </div>

                {/* 3. Corpo del Testo (Markdown) */}
                <div className="prose prose-invert prose-lg prose-rose max-w-none 
                    prose-headings:font-oswald prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wide
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:font-serif
                    prose-strong:text-white prose-strong:font-bold
                    prose-a:text-rose-400 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-rose-500 prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:rounded-r-lg
                    prose-img:rounded-xl prose-img:shadow-xl prose-img:w-full prose-img:object-cover prose-img:my-8
                ">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
                </div>
                
            </div>
        </article>
    );
}
