"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Article {
    id: string;
    date: string;
    title: string;
    imageUrl: string;
    placeholder?: boolean;
}

export default function ArticlePage() {
    const params = useParams();
    const id = params.id as string;

    const [content, setContent] = useState<string>("");
    const [metadata, setMetadata] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadArticle() {
            try {
                // 1. Load Article Metadata
                const metaRes = await fetch('/data/articles.json');
                const articles = await metaRes.json();
                const article = articles.find((a: Article) => a.id === id);

                if (!article) throw new Error("Articolo non trovato");
                setMetadata(article);

                // 2. Load Article Content (Markdown)
                const contentRes = await fetch(`/articoli/md/${id}.md`);
                if (!contentRes.ok) throw new Error("Scritto non trovato");
                const text = await contentRes.text();
                setContent(text);

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

            {/* Hero Header */}
            <div className="relative h-[50vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${metadata.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto">
                    <Link href="/gazzetta" className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors backdrop-blur-md bg-black/30 px-3 py-1 rounded-full text-sm">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Gazzetta
                    </Link>
                    <div className="flex items-center gap-2 text-rose-400 font-medium mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{metadata.date}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold font-oswald leading-tight drop-shadow-lg">
                        {metadata.title}
                    </h1>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                <div className="prose prose-invert prose-lg prose-rose max-w-none 
                    prose-headings:font-oswald prose-headings:font-bold prose-headings:uppercase
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:font-serif
                    prose-strong:text-white prose-strong:font-bold
                    prose-a:text-rose-400 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-rose-500 prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:not-italic prose-blockquote:rounded-r-lg
                ">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>

        </article>
    );
}
