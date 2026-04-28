const TEAM_NAME_FIXES = {
  'Brighton Hove': 'Brighton',
  'Wolverhampton': 'Wolves',
  'Nottingham': 'Nottm Forest',
};

const TERMINAL = ['FINISHED', 'CANCELLED', 'POSTPONED', 'AWARDED', 'SUSPENDED'];

function fixName(raw) {
  return TEAM_NAME_FIXES[raw] || raw;
}

function normalizeMatch(m) {
  if (!m.homeTeam || !m.awayTeam) return m;
  return {
    ...m,
    homeTeam: { ...m.homeTeam, shortName: fixName(m.homeTeam.shortName || m.homeTeam.name) },
    awayTeam: { ...m.awayTeam, shortName: fixName(m.awayTeam.shortName || m.awayTeam.name) },
  };
}

export async function apiFetch(endpoint) {
  const res = await fetch(`/api/football?endpoint=${encodeURIComponent(endpoint)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchTeams() {
  const data = await apiFetch('/competitions/PL/teams?season=2025');
  return data.teams
    .map(t => fixName(t.shortName || t.name))
    .sort();
}

export async function fetchFixtures() {
  const comp = await apiFetch('/competitions/PL');
  let matchday = comp.currentSeason.currentMatchday;
  let data = await apiFetch(`/competitions/PL/matches?matchday=${matchday}`);
  let matches = (data.matches || []).map(normalizeMatch);

  // If this gameweek is all done, move to the next one
  if (matches.length > 0 && matches.every(m => TERMINAL.includes(m.status))) {
    matchday += 1;
    data = await apiFetch(`/competitions/PL/matches?matchday=${matchday}`);
    matches = (data.matches || []).map(normalizeMatch);
  }

  const kickoffs = matches.map(m => m.utcDate).sort();
  return { matchday, matches, firstKickoff: kickoffs[0] || null };
}

export async function fetchMatchdayMatches(matchday) {
  const data = await apiFetch(`/competitions/PL/matches?matchday=${matchday}`);
  return (data.matches || []).map(normalizeMatch);
}
