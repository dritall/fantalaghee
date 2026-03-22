import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  try {
    const queryParams = new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'endpoint')).toString();
    const url = "https://sofascore.p.rapidapi.com/" + endpoint + (queryParams ? "?" + queryParams : "");
    
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'sofascore.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '3b9798580fmsh5505297c4cba235p1158b4jsn3683c74d3ef0'
      },
      // Cache di 5 minuti per i dati live, 24 ore per i loghi
      next: { revalidate: endpoint.includes('get-logo') ? 86400 : 300 }
    });

    if (endpoint.includes('get-logo')) {
      const blob = await res.blob();
      return new Response(blob, { headers: { 'Content-Type': 'image/png' } });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("🔥 [API ERROR] Sofascore Route Exception:", e);
    return NextResponse.json({ events: [], standings: [], error: String(e) }, { status: 200 });
  }
}
