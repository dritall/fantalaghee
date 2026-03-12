import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function GET() {
    try {
        const mdDir = path.join(process.cwd(), 'public', 'articoli', 'md');
        const files = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

        const articles = files.map(filename => {
            const filePath = path.join(mdDir, filename);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(fileContent);

            return {
                id: filename.replace('.md', ''),
                title: data.title || filename.replace('.md', ''),
                date: data.date || "Senza Data",
                description: data.description || "",
                author: data.author || "La Redazione",
                imageUrl: data.image || "/image/gazzetta/default.jpg",
                placeholder: false
            };
        });

        // Sort by date descending (rough sort if date formats mismatch, but works well for YYYY-MM-DD or parseable dates)
        articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error reading articles frontmatter:", error);
        return NextResponse.json({ error: 'Failed to load articles' }, { status: 500 });
    }
}
