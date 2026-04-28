const TEAM_NAME_FIXES = {
  'Brighton Hove': 'Brighton',
  'Wolverhampton': 'Wolves',
  'Nottingham': 'Nottm Forest',
};

export async function apiFetch(endpoint) {
  const res = await fetch(`/api/football?endpoint=${encodeURIComponent(endpoint)}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchTeams() {
  const data = await apiFetch('/competitions/PL/teams?season=2025');
  return data.teams
    .map(t => {
      const raw = t.shortName || t.name;
      return TEAM_NAME_FIXES[raw] || raw;
    })
    .sort();
}

export async function fetchFixtures() {
  const comp = await apiFetch('/competitions/PL');
  const matchday = comp.currentSeason.currentMatchday;
  const data = await apiFetch(`/competitions/PL/matches?matchday=${matchday}`);
  const matches = data.matches || [];
  const kickoffs = matches.map(m => m.utcDate).sort();
  return { matchday, matches, firstKickoff: kickoffs[0] || null };
}

export async function fetchMatchdayMatches(matchday) {
  const data = await apiFetch(`/competitions/PL/matches?matchday=${matchday}`);
  return data.matches || [];
}
