import { kv } from '@vercel/kv';
import Papa from 'papaparse';

// Assicurati che SPREADSHEET_URL sia configurata come Environment Variable su Vercel
const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const cachedData = await kv.get('squadre');
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch spreadsheet');
    const csvData = await response.text();
    const parsed = Papa.parse(csvData).data;

    // Estrai i nomi delle squadre dalle righe corrette (es. 41-60)
    const squadre = parsed.slice(40, 60).map(row => row[0]).filter(Boolean);

    // Salva in cache per 1 ora
    await kv.set('squadre', squadre, { ex: 3600 });

    return new Response(JSON.stringify(squadre), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
