import Papa from 'papaparse';

// L'URL viene letto in modo sicuro dalla Environment Variable configurata su Vercel.
const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Controlla se l'URL è stato configurato correttamente su Vercel
  if (!SPREADSHEET_URL) {
    return new Response(JSON.stringify({ message: "La variabile SPREADSHEET_URL non è configurata sul server." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(SPREADSHEET_URL, {
      next: {
        // Vercel terrà in cache i dati per 5 minuti (300 secondi)
        revalidate: 300
      }
    });

    if (!response.ok) {
      throw new Error(`Errore nel fetch del CSV: ${response.statusText}`);
    }

    const csvData = await response.text();

    // Usiamo papaparse per convertire il CSV in un array JSON
    const parsedData = Papa.parse(csvData, { header: false });

    // Restituiamo i dati in formato JSON
    return new Response(JSON.stringify(parsedData.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Errore interno del server" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
