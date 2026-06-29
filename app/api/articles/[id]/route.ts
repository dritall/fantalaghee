import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Evita path traversal: accetta solo nomi file semplici
        const id = params.id;
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return NextResponse.json({ error: 'Articolo non valido' }, { status: 400 });
        }

        const filePath = path.join(process.cwd(), 'public', 'articoli', 'md', `${id}.md`);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Scritto non trovato' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);

        return NextResponse.json({
            metadata: {
                title: data.title || id,
                date: data.date || "Senza Data",
                description: data.description || "",
                author: data.author || "La Redazione",
                image: data.image || "/image/gazzetta/default.jpg",
            },
            content,
        });
    } catch (error) {
        console.error("Error reading article:", error);
        return NextResponse.json({ error: 'Impossibile caricare l\'articolo' }, { status: 500 });
    }
}
