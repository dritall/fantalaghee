/**
 * Controlli sugli indirizzi delle foto giocatore.
 *
 *   node --experimental-strip-types scripts/test-foto-giocatore.mjs
 *
 * Il campione di riferimento è `player_summary.json`, una risposta vera di
 * Lega Serie A conservata nel repo: da lì si ricava la forma dei percorsi e il
 * fatto che il segmento del lato vale `home` anche per la squadra ospite.
 */
import { readFileSync } from 'node:fs';
import { playerPhotoUrls } from '../lib/lega-normalize.ts';

let failures = 0;
const ok = (name, cond, extra = '') => {
    if (cond) {
        console.log(`  ok  ${name}`);
    } else {
        failures++;
        console.log(`  FAIL ${name}${extra ? ': ' + extra : ''}`);
    }
};

/** L'indirizzo vero dentro il parametro `src` del ponte. */
const sorgenti = (urls) =>
    urls.map((u) => decodeURIComponent(new URL(u, 'http://x').searchParams.get('src') || ''));

console.log('\nfoto dichiarate dalle formazioni (imagery)');
{
    const p = {
        playerId: 'serie-a::Football_Player::f3670f8a13ba4c38a58d8f59eda2e1b0',
        imagery: {
            playerImage_home_celeb: 'playerImages/K/S/T/home/PID_celeb.webp',
            playerImage_home_left: 'playerImages/K/S/T/home/PID_left.webp',
            playerImage_home_middle: 'playerImages/K/S/T/home/PID_middle.webp',
        },
    };
    const urls = playerPhotoUrls(p, 'serie-a::Football_Season::S', 'serie-a::Football_Team::T');
    const src = sorgenti(urls);
    ok('passano tutte dal ponte', urls.every((u) => u.startsWith('/api/lega-image?src=')));
    ok('la prima è il middle', src[0].endsWith('/home/PID_middle.webp'), src[0]);
    ok('celeb non è la prima', !src[0].includes('_celeb'), src[0]);
    ok('due host per ogni percorso',
        src.includes('https://media-sdp.legaseriea.it/playerImages/K/S/T/home/PID_middle.webp') &&
        src.includes('https://img.legaseriea.it/vimages/playerImages/K/S/T/home/PID_middle.webp'));
    ok('nessun doppione', new Set(urls).size === urls.length);
}

console.log('\nnessuna imagery: indirizzo ricostruito');
{
    const p = { playerId: 'serie-a::Football_Player::PID', role: 4 };
    const src = sorgenti(playerPhotoUrls(p, 'serie-a::Football_Season::SID', 'serie-a::Football_Team::TID'));
    ok('qualche indirizzo c\'è', src.length > 0);
    ok('divisa di casa per prima', src[0].includes('/TID/home/'), src[0]);
    ok('inquadratura verificata (_left) per prima', src[0].endsWith('_left.webp'), src[0]);
    ok('include la stagione passata come path', src.some((u) => u.includes('/SID/TID/')));
    ok('prova anche la divisa da trasferta', src.some((u) => u.includes('/SID/TID/away/')));
    ok('prova left e middle (celeb 404-a troppo spesso, non la costruiamo più)',
        ['_middle.webp', '_left.webp'].every((s) => src.some((u) => u.endsWith(s))));
    ok('media-sdp, non img.legaseriea, sui path costruiti',
        src.every((u) => u.startsWith('https://media-sdp.legaseriea.it/')));
    ok('prova anche le stagioni archiviate come rete',
        src.some((u) => u.includes('5f0e080fc3a44073984b75b3a8e06a8a')));
}

console.log('\nsenza dati non si inventa niente');
{
    ok('giocatore nullo', playerPhotoUrls(null).length === 0);
    ok('senza stagione o squadra', playerPhotoUrls({ playerId: 'x' }).length === 0);
}

console.log('\ncampione reale (player_summary.json)');
{
    const grezzo = readFileSync(new URL('../player_summary.json', import.meta.url), 'utf8');
    const percorsi = [...grezzo.matchAll(/playerImages\/[^"]+/g)].map((m) => m[0]);
    ok('il campione contiene percorsi foto', percorsi.length > 0);
    ok('il segmento del lato è sempre "home", anche per gli ospiti',
        percorsi.every((p) => p.split('/')[4] === 'home'));
    // la chiave costante della libreria foto, quella cablata in lega-normalize
    ok('chiave libreria invariata',
        percorsi.every((p) => p.split('/')[1] === 'ec93b94f74294dc98ab5bcfd67fc0d88'));
}

console.log(failures === 0 ? '\nTutti i controlli superati.\n' : `\n${failures} controlli falliti.\n`);
process.exit(failures === 0 ? 0 : 1);
