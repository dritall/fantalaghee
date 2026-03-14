import axios from 'axios';
import React from 'react';

// Data shapes based on API-Sports fixtures endpoint
type FixtureEvent = {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number; name: string | null };
  type: string;
  detail: string;
};

type FixtureResponse = {
  fixture: { id: number; date: string; status: { short: string } };
  league: { id: number; name: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
  score: { fulltime: { home: number | null; away: number | null } };
  events?: FixtureEvent[];
};

export default async function ScoutSerieA() {
  let matches: FixtureResponse[] = [];
  let error: string | null = null;

  try {
    const res = await axios.get('https://v3.football.api-sports.io/fixtures', {
      params: {
        league: 135,
        season: 2025,
        last: 10,
      },
      headers: {
        'x-apisports-key': process.env.REACT_APP_FOOTBALL_API_KEY,
      },
    });

    if (res.data.errors && Object.keys(res.data.errors).length > 0) {
      error = Object.values(res.data.errors)[0] as string;
    } else {
      matches = res.data.response || [];
    }
  } catch (err: any) {
    error = err.message || 'Errore nel caricamento dei dati';
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white border-b border-slate-700 pb-4">
          Scout Serie A (Ultime 10 Partite)
        </h1>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-8">
            <p><strong>Errore API:</strong> {error}</p>
          </div>
        )}

        {matches.length === 0 && !error && (
          <div className="text-slate-400 italic">Nessuna partita trovata.</div>
        )}

        <div className="space-y-6">
          {matches.map((match) => {
            const homeGoals = match.events?.filter(e => e.type === 'Goal' && e.team.id === match.teams.home.id) || [];
            const awayGoals = match.events?.filter(e => e.type === 'Goal' && e.team.id === match.teams.away.id) || [];

            return (
              <div key={match.fixture.id} className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-slate-400 text-sm">
                    {new Date(match.fixture.date).toLocaleDateString('it-IT', {
                      weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </div>
                  <div className="px-3 py-1 bg-slate-700 rounded-full text-xs font-semibold text-slate-300">
                    {match.fixture.status.short}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  {/* Home Team */}
                  <div className="flex flex-col items-center w-1/3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-16 h-16 object-contain mb-3" />
                    <span className="font-bold text-center text-sm md:text-lg">{match.teams.home.name}</span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center w-1/3">
                    <div className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-center">
                      {match.goals.home ?? '-'} <span className="text-slate-500 mx-1 md:mx-2">-</span> {match.goals.away ?? '-'}
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center w-1/3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-16 h-16 object-contain mb-3" />
                    <span className="font-bold text-center text-sm md:text-lg">{match.teams.away.name}</span>
                  </div>
                </div>

                {/* Scorers & Assists */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700 text-sm">
                  {/* Home Scorers */}
                  <div>
                    {homeGoals.map((event, idx) => (
                      <div key={idx} className="mb-1 text-slate-300 flex flex-wrap items-center gap-1">
                        <span className="font-medium">⚽ {event.player.name}</span>
                        <span className="text-slate-500 text-xs">({event.time.elapsed}&apos;)</span>
                        {event.assist?.name && (
                          <span className="text-slate-400 text-xs ml-1">🅰️ {event.assist.name}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Away Scorers */}
                  <div className="text-right flex flex-col items-end">
                    {awayGoals.map((event, idx) => (
                      <div key={idx} className="mb-1 text-slate-300 flex flex-wrap items-center gap-1 justify-end">
                        {event.assist?.name && (
                          <span className="text-slate-400 text-xs mr-1">🅰️ {event.assist.name}</span>
                        )}
                        <span className="font-medium">⚽ {event.player.name}</span>
                        <span className="text-slate-500 text-xs text-right">({event.time.elapsed}&apos;)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
