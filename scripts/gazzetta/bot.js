#!/usr/bin/env node
/**
 * Bot Telegram "Gazzetta del Laghèe".
 *
 * Flusso:
 *   1. Tu (o un trigger) mandi  /gazzetta            -> legge la giornata dal foglio
 *   2. Hermes scrive la bozza dell'articolo          -> ti arriva il testo su Telegram
 *   3. Tu rispondi  OK  (o mandi correzioni testuali)
 *   4. Su OK: genera l'immagine di copertina, committa e pusha -> Vercel deploya -> LIVE
 *
 * Comandi:
 *   /gazzetta            genera la bozza della giornata corrente (dal foglio)
 *   OK | pubblica | 👍   approva la bozza in sospeso -> pubblica live
 *   /annulla             scarta la bozza in sospeso
 *   (qualsiasi altro testo mentre c'è una bozza) = istruzione di correzione -> rigenera
 *
 * Avvio:  node scripts/gazzetta/bot.js
 * Richiede le env: TELEGRAM_BOT_TOKEN, HERMES_API_KEY (+ opzionali, vedi .env.example)
 */

const fs = require('fs');
const path = require('path');
const { fetchGiornata, datiGiornataInTesto } = require('./lib/fetchGiornata');
const { generaArticolo } = require('./lib/hermes');
const { preparaFile, commitEPush, SITE_URL } = require('./lib/publish');
const tg = require('./lib/telegram');

const DRAFTS_DIR = path.join(__dirname, '.drafts');
fs.mkdirSync(DRAFTS_DIR, { recursive: true });

// --- Stato: una bozza in sospeso per chat, persistita su file (sopravvive ai restart) ---
function draftPath(chatId) { return path.join(DRAFTS_DIR, `${chatId}.json`); }
function salvaBozza(chatId, payload) { fs.writeFileSync(draftPath(chatId), JSON.stringify(payload, null, 2)); }
function leggiBozza(chatId) {
    try { return JSON.parse(fs.readFileSync(draftPath(chatId), 'utf8')); } catch { return null; }
}
function scartaBozza(chatId) { try { fs.unlinkSync(draftPath(chatId)); } catch { /* */ } }

const APPROVAZIONI = ['ok', 'okay', 'pubblica', 'pubblicalo', 'vai', '👍', '✅', 'si', 'sì'];

function anteprima(bozza) {
    return `📰 *BOZZA PRONTA* — giornata rilevata dal foglio\n\n` +
        `*${bozza.title}*\n_${bozza.description}_\n\n` +
        `${bozza.body_md}\n\n` +
        `— — —\n✅ Rispondi *OK* per pubblicare live.\n✏️ Oppure scrivimi le correzioni.\n🗑️ /annulla per scartare.`;
}

async function generaEInvia(chatId, correzione) {
    await tg.sendMessage(chatId, correzione ? '✏️ Applico le correzioni...' : '📥 Leggo la giornata dal foglio e chiamo Hermes...');

    const dati = await fetchGiornata();
    const datiTesto = datiGiornataInTesto(dati);
    const bozza = await generaArticolo(datiTesto, { correzione });

    salvaBozza(chatId, { bozza, dati, ts: Date.now() });
    await tg.sendMessage(chatId, anteprima(bozza), { parseMode: 'Markdown' });
}

async function pubblica(chatId) {
    const pending = leggiBozza(chatId);
    if (!pending) {
        await tg.sendMessage(chatId, '⚠️ Nessuna bozza in sospeso. Manda /gazzetta per crearne una.');
        return;
    }
    await tg.sendMessage(chatId, '🎨 Genero la copertina e pubblico...');

    const file = await preparaFile(pending.bozza, pending.dati);
    commitEPush(file, pending.dati);
    scartaBozza(chatId);

    try { await tg.sendPhoto(chatId, file.imgPath, `Copertina — ${pending.bozza.title}`); } catch { /* */ }
    await tg.sendMessage(chatId,
        `🚀 *Pubblicato!*\nL'articolo sarà live tra pochi secondi (auto-deploy Vercel):\n${file.liveUrl}`,
        { parseMode: 'Markdown', disablePreview: false });
}

async function onMessage({ chatId, text }) {
    const lower = text.toLowerCase();

    if (lower === '/start' || lower === '/help' || lower === '/aiuto') {
        await tg.sendMessage(chatId,
            'Ciao! Sono il bot de La Gazzetta del Laghèe.\n\n' +
            '• /gazzetta — genero la bozza della giornata corrente\n' +
            '• OK — pubblico la bozza in sospeso\n' +
            '• (scrivimi correzioni) — rigenero applicandole\n' +
            '• /annulla — scarto la bozza');
        return;
    }

    if (lower === '/gazzetta' || lower === '/giornata') {
        await generaEInvia(chatId, null);
        return;
    }

    if (lower === '/annulla' || lower === '/cancel') {
        scartaBozza(chatId);
        await tg.sendMessage(chatId, '🗑️ Bozza scartata.');
        return;
    }

    // Se c'è una bozza in sospeso, interpreta il testo come approvazione o correzione
    if (leggiBozza(chatId)) {
        if (APPROVAZIONI.includes(lower)) {
            await pubblica(chatId);
        } else {
            await generaEInvia(chatId, text); // correzione
        }
        return;
    }

    await tg.sendMessage(chatId, 'Non c\'è nessuna bozza in sospeso. Manda /gazzetta per iniziare.');
}

// --- Avvio ---
tg.startPolling(onMessage).catch(err => {
    console.error('Errore fatale del bot:', err);
    process.exit(1);
});
