/**
 * Client minimale per la Telegram Bot API (solo fetch, nessuna dipendenza esterna).
 *
 * Variabili d'ambiente:
 *   TELEGRAM_BOT_TOKEN       - token del bot (da @BotFather)   [RICHIESTA]
 *   TELEGRAM_ALLOWED_CHAT_ID - (opzionale) se impostata, il bot accetta comandi
 *                              solo da questa chat (sicurezza)
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID || null;

function assertConfigured() {
    if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN non impostata.');
}

async function call(method, params) {
    assertConfigured();
    const res = await fetch(`${API}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram ${method} error: ${JSON.stringify(data)}`);
    return data.result;
}

/** Telegram limita i messaggi a 4096 caratteri: spezziamo se serve. */
async function sendMessage(chatId, text, opts = {}) {
    const LIMIT = 4000;
    for (let i = 0; i < text.length; i += LIMIT) {
        await call('sendMessage', {
            chat_id: chatId,
            text: text.slice(i, i + LIMIT),
            parse_mode: opts.parseMode || undefined,
            disable_web_page_preview: opts.disablePreview ?? true,
        });
    }
}

async function sendPhoto(chatId, filePath, caption) {
    assertConfigured();
    const fs = require('fs');
    const form = new FormData();
    form.append('chat_id', String(chatId));
    if (caption) form.append('caption', caption);
    const buffer = fs.readFileSync(filePath);
    form.append('photo', new Blob([buffer]), require('path').basename(filePath));
    const res = await fetch(`${API}/sendPhoto`, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram sendPhoto error: ${JSON.stringify(data)}`);
    return data.result;
}

function chatConsentito(chatId) {
    if (!ALLOWED_CHAT_ID) return true;
    return String(chatId) === String(ALLOWED_CHAT_ID);
}

/**
 * Long-polling: chiama onMessage per ogni messaggio testuale ricevuto.
 * @param {(msg: {chatId, text, from}) => Promise<void>} onMessage
 */
async function startPolling(onMessage) {
    assertConfigured();
    let offset = 0;
    console.log('🤖 Bot Gazzetta in ascolto (long-polling)...');
    // svuota eventuali update pendenti vecchi
    try {
        const pend = await call('getUpdates', { timeout: 0 });
        if (pend.length) offset = pend[pend.length - 1].update_id + 1;
    } catch { /* ignore */ }

    while (true) {
        let updates = [];
        try {
            updates = await call('getUpdates', { offset, timeout: 50 });
        } catch (e) {
            console.error('getUpdates error, retry tra 5s:', e.message);
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }
        for (const u of updates) {
            offset = u.update_id + 1;
            const msg = u.message;
            if (!msg || !msg.text) continue;
            const chatId = msg.chat.id;
            if (!chatConsentito(chatId)) {
                await sendMessage(chatId, '⛔ Questo bot è privato.');
                continue;
            }
            try {
                await onMessage({ chatId, text: msg.text.trim(), from: msg.from });
            } catch (e) {
                console.error('Errore gestione messaggio:', e);
                try { await sendMessage(chatId, `❌ Errore: ${e.message}`); } catch { /* */ }
            }
        }
    }
}

module.exports = { sendMessage, sendPhoto, startPolling, call, chatConsentito };
