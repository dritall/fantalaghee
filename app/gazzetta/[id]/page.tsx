"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
    const [imageOk, setImageOk] = useState(true);

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

    return (
        <article className="min-h-screen pt-24 md:pt-28 pb-16 px-4 sm:px-6">

            {/* Tasto Back */}
            <div className="max-w-4xl mx-auto mb-5">
                <Link href="/gazzetta" aria-label="Torna agli articoli" className="inline-flex items-center text-white/70 hover:text-white transition-colors text-sm font-semibold bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Gazzetta
                </Link>
            </div>

            {/* Foglio di giornale: contenuto su carta chiara, leggibile sullo sfondo scuro */}
            <div className="max-w-4xl mx-auto bg-[#f7f5ef] rounded-[1.75rem] overflow-hidden shadow-[0_24px_70px_rgba(4,8,25,0.6)] border border-white/20 text-[#10241a]">

                {/* Testata in stile quotidiano */}
                <div className="px-6 sm:px-12 pt-9 pb-6 border-b-[3px] border-double border-black/15 text-center">
                    <span className="block text-[10px] sm:text-xs font-black tracking-[0.35em] uppercase text-pink-600 mb-3">
                        La Gazzetta del Laghèe
                    </span>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-oswald uppercase leading-[1.05] tracking-wide text-[#10241a]">
                        {metadata.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-5 text-xs sm:text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-pink-500" />
                            {formatDateToItalian(metadata.date)}
                        </span>
                        <span className="hidden sm:inline text-gray-300">•</span>
                        <span>di {metadata.author}</span>
                    </div>
                </div>

                <div className="px-6 sm:px-12 py-9">

                    {metadata.description && (
                        <p className="text-lg sm:text-xl text-gray-700 font-serif italic border-l-4 border-pink-500 pl-4 py-1 mb-8">
                            {metadata.description}
                        </p>
                    )}

                    {/* Copertina (nascosta se l'immagine non esiste) */}
                    {imageOk && (
                        <div className="w-full relative mb-9">
                            <Image
                                src={metadata.image}
                                alt={`Copertina per ${metadata.title}`}
                                width={1200}
                                height={675}
                                priority={true}
                                onError={() => setImageOk(false)}
                                className="w-full h-auto object-contain rounded-xl shadow-md bg-[#ece9e0]"
                            />
                        </div>
                    )}

                    {/* Corpo del Testo (Markdown) */}
                    <div className="prose prose-lg max-w-none
                        prose-headings:font-oswald prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-[#10241a]
                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:font-serif
                        prose-li:text-gray-700 prose-li:font-serif
                        prose-strong:text-[#10241a] prose-strong:font-bold
                        prose-a:text-pink-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-pink-500 prose-blockquote:bg-black/[0.03] prose-blockquote:p-6 prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:rounded-r-lg
                        prose-img:rounded-xl prose-img:shadow-xl prose-img:w-full prose-img:object-cover prose-img:my-8
                    ">
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </article>
    );
}
