import Papa from 'papaparse';

// La variabile SPREADSHEET_URL è configurata su Vercel
const SPREADSHEET_URL = process.env.SPREADSHEET_URL;

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    if (!SPREADSHEET_URL) {
      throw new Error("La variabile SPREADSHEET_URL non è configurata sul server.");
    }

    // MODIFICA CHIAVE: Forziamo Vercel a ricaricare i dati dal Google Sheet
    // almeno una volta ogni 60 secondi, invalidando la cache.
    const response = await fetch(SPREADSHEET_URL, {
      next: {
        revalidate: 60
      }
    });

    if (!response.ok) {
      throw new Error(`Errore nel caricare lo spreadsheet: ${response.statusText}`);
    }
    const csvData = await response.text();
    const parsedData = Papa.parse(csvData).data;

    // Restituiamo i dati
    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Questo header aggiuntivo dice al browser di non conservare una sua cache locale
        'Cache-Control': 'no-cache, no-store, must-revalidate',
       },
    });

  } catch (error) {
    console.error('Errore in /api/getVerdetto:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), { status: 500 });
  }
}
