/**
 * Controllo del normalizzatore partita su dati sintetici che riproducono le
 * varianti note dell'API SDP (statistiche come array o come oggetto, foto nel
 * valore o nel nome della chiave, timeline assente).
 *
 *   node --experimental-strip-types scripts/test-normalize.mjs
 */
import { normalizeMatch, playerPhoto, statOf } from '../lib/lega-normalize.ts';

let failures = 0;
const check = (name, cond, extra) => {
    if (cond) {
        console.log(`  ok  ${name}`);
    } else {
        failures++;
        console.log(`  FAIL ${name}`, extra ?? '');
    }
};

const player = (over = {}) => ({
    playerId: 'serie-a::Football_Player::p1',
    displayName: 'Rossi',
    jerseyNumber: 10,
    role: 4,
    tacticalXPosition: 0.5,
    tacticalYPosition: 0.8,
    ...over,
});

// ---------------------------------------------------------------- foto
console.log('\nfoto giocatore');
// le foto passano dal ponte /api/lega-image: senza, Lega rifiuta la richiesta
const viaProxy = (absolute) => `/api/lega-image?src=${encodeURIComponent(absolute)}`;

check(
    'valore diretto, servito dal ponte',
    playerPhoto({ playerImagehomeleft: '/playerImages/a/b.webp' }) ===
        viaProxy('https://media-sdp.legaseriea.it/playerImages/a/b.webp')
);
check(
    'percorso dentro il nome della chiave',
    playerPhoto({ 'playerImagehomeleftplayerImages/x/y.webp': null }) ===
        viaProxy('https://media-sdp.legaseriea.it/playerImages/x/y.webp')
);
check(
    'fallback costruito da stagione+squadra+giocatore',
    playerPhoto({ playerId: 'x::p9' }, 's::S1', 't::T1', 'away') ===
        viaProxy('https://media-sdp.legaseriea.it/playerImages/ec93b94f74294dc98ab5bcfd67fc0d88/S1/T1/away/p9left.webp')
);
check('niente dati -> null', playerPhoto({}) === null);

// ------------------------------------------------------- match completo
console.log('\npartita completa');
const raw = {
    header: {
        seasonId: 'serie-a::Football_Season::S1',
        homeTeam: { teamId: 'serie-a::Football_Team::H', shortName: 'Inter' },
        awayTeam: { teamId: 'serie-a::Football_Team::A', shortName: 'Milan' },
    },
    lineups: {
        home: {
            formation: '4-3-3',
            coach: { displayName: 'Inzaghi' },
            fielded: [
                player({ playerId: 'p1', displayName: 'Sommer', role: 1, tacticalYPosition: 0.05 }),
                player({
                    playerId: 'p2',
                    displayName: 'Lautaro',
                    role: 4,
                    events: [{ type: 'goal', time: 23 }, { type: 'yellow-card', time: 60 }],
                    stats: [
                        { statsId: 'mins_played', statsValue: '90' },
                        { statsId: 'rating', statsValue: '7.5' },
                    ],
                }),
            ],
            benched: [player({ playerId: 'p3', displayName: 'Correa', role: 4 })],
        },
        away: {
            formation: '3-5-2',
            coach: { displayName: 'Allegri' },
            fielded: [
                player({ playerId: 'p9', displayName: 'Maignan', role: 1 }),
                player({ playerId: 'p8', displayName: 'Leao', role: 4 }),
            ],
            benched: [],
        },
    },
    events: {
        events: [
            { type: 'goal', time: 23, teamId: 'serie-a::Football_Team::H', displayName: 'Lautaro', assist: { displayName: 'Barella' } },
            { type: 'yellow-card', time: 60, teamId: 'serie-a::Football_Team::H', displayName: 'Lautaro' },
            { type: 'substitution-out', time: 70, teamId: 'serie-a::Football_Team::H', displayName: 'Lautaro' },
            { type: 'substitution-in', time: 70, teamId: 'serie-a::Football_Team::H', displayName: 'Correa' },
        ],
    },
    // statistiche fornite separatamente, non dentro la formazione
    playerStats: { players: [{ playerId: 'p8', stats: [{ statsId: 'mins_played', statsValue: 85 }, { statsId: 'goals', statsValue: 1 }] }] },
};

const n = normalizeMatch(raw);

check('squadra di casa', n.home.name === 'Inter', n.home.name);
check('modulo', n.home.formation === '4-3-3', n.home.formation);
check('allenatore', n.home.coach === 'Inzaghi', n.home.coach);
check('titolari casa', n.home.starters.length === 2, n.home.starters.length);
check('panchina casa', n.home.bench.length === 1, n.home.bench.length);
check('lineups presenti', n.hasLineups === true);

const lautaro = n.home.starters.find((p) => p.name === 'Lautaro');
check('gol da evento', lautaro?.goals === 1, lautaro?.goals);
check('ammonizione', lautaro?.yellow === true);
check('minuti da stats array', lautaro?.minutes === 90, lautaro?.minutes);
check('voto', lautaro?.rating === 7.5, lautaro?.rating);
check('coordinate normalizzate', lautaro?.x === 0.5 && lautaro?.y === 0.8, [lautaro?.x, lautaro?.y]);
check('foto costruita col fallback e proxata', String(lautaro?.photo).startsWith('/api/lega-image?src=') && decodeURIComponent(String(lautaro?.photo)).includes('/S1/H/home/p2left.webp'), lautaro?.photo);

const leao = n.away.starters.find((p) => p.name === 'Leao');
check('stats dal blocco playerstats', leao?.minutes === 85, leao?.minutes);
check('gol da statistica quando manca l evento', leao?.goals === 1, leao?.goals);

check('portiere senza coordinate esplicite resta al suo posto', n.away.starters[0].y === 0.8 || n.away.starters[0].y === 0.05, n.away.starters[0].y);

console.log('  eventi:', n.events.map((e) => `${e.label} ${e.kind} ${e.player}${e.playerOut ? ' <- ' + e.playerOut : ''}`).join(' | '));
check('sostituzione fusa in un evento solo', n.events.filter((e) => e.kind === 'sub').length === 1);
check('totale eventi dopo la fusione', n.events.length === 3, n.events.length);
const goal = n.events.find((e) => e.kind === 'goal');
check('assist letto', goal?.assist === 'Barella', goal?.assist);
check('lato squadra', goal?.side === 'home', goal?.side);
const sub = n.events.find((e) => e.kind === 'sub');
check('chi entra / chi esce', sub?.player === 'Correa' && sub?.playerOut === 'Lautaro', [sub?.player, sub?.playerOut]);

// -------------------------------------------- timeline assente
console.log('\ntimeline assente (ricostruzione dagli eventi dei giocatori)');
const noTimeline = normalizeMatch({ ...raw, events: null });
check('eventi ricostruiti', noTimeline.events.length >= 2, noTimeline.events.length);
check('gol presente', noTimeline.events.some((e) => e.kind === 'goal'));

// -------------------------------------------- dati mancanti
console.log('\ndati mancanti');
const empty = normalizeMatch({});
check('non esplode con oggetto vuoto', empty.home.starters.length === 0 && empty.hasLineups === false);
check('nomi di ripiego', empty.home.name === 'Casa' && empty.away.name === 'Ospite');
const partial = normalizeMatch({ header: { homeTeam: { shortName: 'Como' } }, lineups: { home: { fielded: [{}] } } });
check('giocatore senza campi', partial.home.starters[0].name === 'Giocatore', partial.home.starters[0].name);

// -------------------------------------------- statOf
console.log('\nlettura statistiche per alias');
check('normalizza trattini e maiuscole', statOf({ minsplayed: 90 }, ['mins_played']) === 90);
check('primo alias disponibile', statOf({ rating: 6 }, ['match_rating', 'rating']) === 6);
check('nessun alias -> null', statOf({}, ['boh']) === null);

console.log(failures === 0 ? '\nTutti i controlli superati.' : `\n${failures} controlli falliti.`);
process.exit(failures === 0 ? 0 : 1);
