import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { getSeason } from '@/lib/seasons';
import { toNumber } from '@/lib/numbers';
import { giornateDisponibili, verdettoAllaGiornata } from '@/lib/verdetto-storico';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const season = getSeason(searchParams.get('stagione'));
    const bust = `t=${Date.now()}`;

    try {
        const [verdettoRes, classificaRes] = await Promise.all([
            fetch(`${season.verdettoUrl}&${bust}`, { cache: 'no-store' }),
            fetch(`${season.classificaUrl}${season.classificaUrl.includes('?') ? '&' : '?'}${bust}`, { cache: 'no-store' }),
        ]);

        if (!verdettoRes.ok) {
            throw new Error(`Errore nel caricare lo spreadsheet: ${verdettoRes.statusText}`);
        }

        const csvText = await verdettoRes.text();
        const parseResult = Papa.parse(csvText, { skipEmptyLines: false });
        const allData = parseResult.data as string[][];

        if (!allData || allData.length === 0) {
            throw new Error('Nessun dato trovato nel CSV');
        }

        const processedData = parseSheetData(allData);

        // Il foglio del Verdetto ha le celle dei premi e dei box in posizioni
        // che cambiano da una stagione all'altra. I punteggi veri stanno nelle
        // colonne G1…G38 della classifica: se il dashboard è vuoto o letto
        // storto, si ricostruisce da lì.
        if (classificaRes.ok) {
            const classificaCsv = await classificaRes.text();
            const parsed = Papa.parse(classificaCsv, { header: true, skipEmptyLines: true });
            const righe = (parsed.data as any[]).filter((r) => r?.Team && String(r.Team).trim());
            arricchisciDaClassifica(processedData, righe);
        }

        // Stessa logica di /api/classifica: il foglio a monte è sempre fresco,
        // la nostra risposta può stare in cache pochi secondi per non farsi
        // richiamare a vuoto da ogni componente della pagina a ogni caricamento.
        return NextResponse.json(
            { ...processedData, stagione: season.slug },
            { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
        );
    } catch (error: any) {
        console.error('Errore in /api/verdetto:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

const parseSheetData = (data: string[][]) => {
    const cella = (riga: number, colonna: number): string => {
        const v = data[riga]?.[colonna];
        return typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
    };
    const cellaOrND = (riga: number, colonna: number): string => cella(riga, colonna) || 'N/D';

    const trovaRiga = (re: RegExp): number =>
        data.findIndex((row) => row?.some((c) => re.test(String(c || ''))));

    const valoreAccanto = (da: number, fino: number, etichetta: RegExp): string => {
        for (let r = da; r <= fino && r < data.length; r++) {
            const row = data[r] || [];
            for (let c = 0; c < row.length; c++) {
                if (etichetta.test(String(row[c] || '').trim())) {
                    const next = String(row[c + 1] ?? '').trim();
                    if (next) return next;
                }
            }
        }
        return '';
    };

    // --- Leader / record / campione / podio / cucchiaio: per etichetta, non per riga fissa ---

    const iLeader = trovaRiga(/leader\s+attuale/i);
    const leaderAttuale = iLeader >= 0 ? cellaOrND(iLeader + 1, 0) : 'N/D';

    const iRecord = trovaRiga(/record\s+assoluto/i);
    const recordAssoluto = {
        punteggio: (iRecord >= 0 && valoreAccanto(iRecord, iRecord + 6, /^punteggio$/i)) || 'N/D',
        squadra: (iRecord >= 0 && valoreAccanto(iRecord, iRecord + 6, /^squadra$/i)) || 'N/D',
        giornata: (iRecord >= 0 && valoreAccanto(iRecord, iRecord + 6, /^giornata$/i)) || 'N/D',
    };

    const iCamp = trovaRiga(/campione della giornata/i);
    let numeroGiornata = 0;
    let campioneDiGiornata = 'N/D';
    if (iCamp >= 0) {
        const daEtichetta = cella(iCamp, 0).match(/giornata\s*(\d+)/i);
        numeroGiornata = parseInt(daEtichetta?.[1] || '0', 10);
        campioneDiGiornata = valoreAccanto(iCamp, iCamp + 4, /^squadra$/i) || 'N/D';
        if (campioneDiGiornata === 'N/D') {
            const nxt = cella(iCamp + 1, 0);
            if (nxt && !/punteggio|squadra|podio|premi/i.test(nxt)) campioneDiGiornata = nxt;
        }
    }

    const iPodio = trovaRiga(/podio della giornata/i);
    const podio: { squadra: string; punteggio: string }[] = [];
    if (iPodio >= 0) {
        for (let r = iPodio + 1; r <= iPodio + 3 && r < data.length; r++) {
            const squadra = cella(r, 0);
            if (!squadra || /premi|podio|campione|leader/i.test(squadra)) break;
            podio.push({ squadra, punteggio: cellaOrND(r, 1) });
        }
    }

    const iCucc = trovaRiga(/cucchiaio di legno/i);
    const cucchiaioDiLegno = {
        punteggio: (iCucc >= 0 && valoreAccanto(iCucc, iCucc + 5, /^punteggio$/i)) || 'N/D',
        squadra: (iCucc >= 0 && valoreAccanto(iCucc, iCucc + 5, /^squadra$/i)) || 'N/D',
        giornata: (iCucc >= 0 && valoreAccanto(iCucc, iCucc + 5, /^giornata$/i)) || 'N/D',
    };

    // Classifica / Squadre on fire: prime righe dati sotto l'intestazione.
    // Col B = Punteggio Totale (spesso vuoto a inizio stagione),
    // Col F = Punteggio Max (c'è già dopo G1).
    const classifica: { squadra: string; punti: number; mediaPunti: number }[] = [];
    for (let i = 1; i < data.length && classifica.length < 8; i++) {
        const nome = cella(i, 0);
        if (!nome) continue;
        if (/nome squadra|leader|campione|podio|premi|miglior|record|cucchiaio|momento|top\s*5/i.test(nome)) {
            if (classifica.length) break;
            continue;
        }
        const punti = toNumber(data[i][1]) ?? toNumber(data[i][5]) ?? 0;
        const mediaPunti = toNumber(data[i][2]) ?? 0;
        classifica.push({ squadra: nome, punti, mediaPunti });
        if (classifica.length >= 5 && /leader|campione/i.test(cella(i + 1, 0))) break;
    }
    classifica.sort((a, b) => b.punti - a.punti);
    const classificaTop = classifica.slice(0, 5);

    // Premi di giornata: blocco a destra di "Premi di Giornata"
    const iPremiG = trovaRiga(/premi di giornata/i);
    const premiDiGiornata: { squadra: string; premio: string }[] = [];
    if (iPremiG >= 0) {
        // la riga dell'etichetta ha Squadra | Premi… ; i dati partono dalla riga dopo
        for (let i = iPremiG + 1; i < Math.min(data.length, iPremiG + 40); i++) {
            const row = data[i] || [];
            const squadra = String(row[5] || '').trim();
            const premio = String(row[6] || '').trim();
            if (!squadra && !premio) {
                if (premiDiGiornata.length) break;
                continue;
            }
            if (/squadra|premi|miglior/i.test(squadra)) continue;
            premiDiGiornata.push({ squadra, premio });
        }
    }

    // Premi classifica generale: sotto l'etichetta, col A / C
    const iPremiC = trovaRiga(/premi classifica generale/i);
    const premiClassifica: { squadra: string; premio: string }[] = [];
    if (iPremiC >= 0) {
        for (let i = iPremiC + 2; i <= iPremiC + 8 && i < data.length; i++) {
            const squadra = cella(i, 0);
            if (!squadra || /miglior|super\s*lega|coppa|riepilogo/i.test(squadra)) break;
            premiClassifica.push({ squadra, premio: cella(i, 2) });
        }
    }

    let migliorPunteggio = { info: 'N/D', premio: 'N/D' };
    const iMiglior = trovaRiga(/^miglior punteggio$/i);
    if (iMiglior !== -1) {
        migliorPunteggio = {
            info: cellaOrND(iMiglior + 1, 0),
            premio: cellaOrND(iMiglior + 1, 2),
        };
    }

    const iSuper = trovaRiga(/premi super\s*lega/i);
    const premiSuperLega: { squadra: string; posizione: string; premio: string }[] = [];
    if (iSuper >= 0) {
        for (let i = iSuper + 2; i <= iSuper + 6 && i < data.length; i++) {
            const squadra = cella(i, 0);
            if (!squadra || /coppa|uefa|riepilogo/i.test(squadra)) break;
            premiSuperLega.push({ squadra, posizione: cella(i, 1), premio: cella(i, 2) });
        }
    }

    const iUefa = trovaRiga(/premi coppa uefa/i);
    const premiCoppaUefa: { squadra: string; posizione: string; premio: string }[] = [];
    if (iUefa >= 0) {
        for (let i = iUefa + 2; i <= iUefa + 4 && i < data.length; i++) {
            const squadra = cella(i, 0);
            if (!squadra || /riepilogo/i.test(squadra)) break;
            premiCoppaUefa.push({ squadra, posizione: cella(i, 1), premio: cella(i, 2) });
        }
    }

    const totals: Record<string, number> = {};
    const addPrize = (squadra: string, premio: any) => {
        const val = parseFloat(String(premio).replace(',', '.'));
        if (squadra && squadra.trim() && !isNaN(val) && val > 0) {
            totals[squadra.trim()] = (totals[squadra.trim()] || 0) + val;
        }
    };
    premiClassifica.forEach((p) => addPrize(p.squadra, p.premio));
    premiDiGiornata.forEach((p) => addPrize(p.squadra, p.premio));
    if (migliorPunteggio.info !== 'N/D') addPrize(migliorPunteggio.info.split(' - ')[0].trim(), migliorPunteggio.premio);
    premiSuperLega.forEach((p) => addPrize(p.squadra, p.premio));
    premiCoppaUefa.forEach((p) => addPrize(p.squadra, p.premio));

    const cippaKeys = Object.keys(totals).filter((k) => k.toLowerCase().replace(/\s/g, '') === 'cippalippa1418');
    if (cippaKeys.length > 1) {
        const merged = cippaKeys.reduce((sum, k) => sum + totals[k], 0);
        cippaKeys.forEach((k) => delete totals[k]);
        totals['Cippalippa1418'] = merged;
    }

    const premiRiepilogo = Object.entries(totals)
        .map(([squadra, totale]) => ({ squadra, totale }))
        .sort((a, b) => b.totale - a.totale);

    return {
        numeroGiornata,
        leaderAttuale,
        campioneDiGiornata,
        podio,
        recordAssoluto,
        cucchiaioDiLegno,
        classifica: classificaTop,
        premi: {
            classifica: premiClassifica,
            giornata: premiDiGiornata,
            migliorPunteggio,
            superLega: premiSuperLega,
            coppaUefa: premiCoppaUefa,
            riepilogo: premiRiepilogo,
        },
    };
};

function arricchisciDaClassifica(
    processed: ReturnType<typeof parseSheetData>,
    righe: any[]
) {
    if (!righe.length) return;
    const gs = giornateDisponibili(righe);
    const g = processed.numeroGiornata || gs[gs.length - 1] || 0;
    if (g <= 0) return;

    const storico = verdettoAllaGiornata(righe, g);
    processed.numeroGiornata = processed.numeroGiornata || g;

    // i punteggi del dashboard sono spesso a zero (formule non calcolate):
    // la classifica top 5 e i box si prendono dalle colonne G, che esistono.
    processed.classifica = storico.classifica.slice(0, 5);

    const assente = (v: string) => !v || v === 'N/D' || /punteggio totale|premi di giornata/i.test(v);

    if (assente(processed.leaderAttuale)) processed.leaderAttuale = storico.leader;
    if (assente(processed.campioneDiGiornata)) {
        processed.campioneDiGiornata = storico.podio[0]?.squadra || processed.campioneDiGiornata;
    }
    const podioRotto =
        processed.podio.length === 0 || processed.podio.every((p) => assente(p.punteggio) || assente(p.squadra));
    if (podioRotto) {
        processed.podio = storico.podio.slice(0, 3).map((p) => ({
            squadra: p.squadra,
            punteggio: String(p.punteggio),
        }));
    }
    if (assente(processed.recordAssoluto.punteggio) && storico.record) {
        processed.recordAssoluto = {
            punteggio: String(storico.record.punteggio),
            squadra: storico.record.squadra,
            giornata: `Giornata ${storico.record.giornata}`,
        };
    }
    // Il Cucchiaio di Legno del Dashboard (celle F50:G53) è una formula del
    // foglio: può restare ferma su un valore vecchio o sbagliato senza
    // risultare "vuota". Il minimo vero si ricalcola sempre dalle colonne
    // G1…G38, mai dalla cella — a differenza degli altri box che si
    // ricalcolano solo se il dashboard è vuoto.
    if (storico.cucchiaio) {
        processed.cucchiaioDiLegno = {
            punteggio: String(storico.cucchiaio.punteggio),
            squadra: storico.cucchiaio.squadra,
            giornata: `Giornata ${storico.cucchiaio.giornata}`,
        };
    }
}
