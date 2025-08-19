import { kv } from '@vercel/kv';
import Papa from 'papaparse';

// Assicurati che SPREADSHEET_URL sia configurata come Environment Variable su Vercel
const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const cachedData = await kv.get('squadre_protagonisti');
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!SPREADSHEET_URL) {
      throw new Error("SPREADSHEET_URL is not defined");
    }

    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch spreadsheet');
    const csvData = await response.text();
    const parsed = Papa.parse(csvData).data;

    // Estrai i nomi delle squadre dalle righe da 2 a 21 (che corrispondono alle celle A3-A22)
    // e filtra eventuali righe vuote.
    const squadre = parsed.slice(2, 22).map(row => row[0]).filter(Boolean);

    // Salva in cache per 1 ora
    await kv.set('squadre_protagonisti', squadre, { ex: 3600 });

    return new Response(JSON.stringify(squadre), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/getSquadre:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), { status: 500 });
  }
}
