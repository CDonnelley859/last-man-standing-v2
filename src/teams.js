export const FALLBACK_TEAMS = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
  'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
  'Leeds United', 'Liverpool', 'Man City', 'Man United', 'Newcastle',
  'Nottm Forest', 'Sunderland', 'Tottenham', 'West Ham', 'Wolves',
];

const TEAM_COLORS = {
  'Arsenal': { color: '#EF4444', abbr: 'ARS' },
  'Aston Villa': { color: '#7C3AED', abbr: 'AVL' },
  'Bournemouth': { color: '#C8102E', abbr: 'BOU' },
  'Brentford': { color: '#EF4444', abbr: 'BRE' },
  'Brighton': { color: '#3B82F6', abbr: 'BHA' },
  'Burnley': { color: '#7C3AED', abbr: 'BUR' },
  'Chelsea': { color: '#1d3a8a', abbr: 'CHE' },
  'Crystal Palace': { color: '#EF4444', abbr: 'CRY' },
  'Everton': { color: '#3B82F6', abbr: 'EVE' },
  'Fulham': { color: '#1a1a1a', abbr: 'FUL' },
  'Leeds United': { color: '#F59E0B', abbr: 'LEE' },
  'Liverpool': { color: '#C8102E', abbr: 'LIV' },
  'Man City': { color: '#6CABDD', abbr: 'MCI' },
  'Manchester City': { color: '#6CABDD', abbr: 'MCI' },
  'Man United': { color: '#DA291C', abbr: 'MUN' },
  'Manchester United': { color: '#DA291C', abbr: 'MUN' },
  'Newcastle': { color: '#241F20', abbr: 'NEW' },
  'Newcastle United': { color: '#241F20', abbr: 'NEW' },
  'Nottm Forest': { color: '#EF4444', abbr: 'NFO' },
  'Nottingham': { color: '#EF4444', abbr: 'NFO' },
  'Sunderland': { color: '#EF4444', abbr: 'SUN' },
  'Tottenham': { color: '#132257', abbr: 'TOT' },
  'Spurs': { color: '#132257', abbr: 'TOT' },
  'West Ham': { color: '#7C1E3F', abbr: 'WHU' },
  'West Ham United': { color: '#7C1E3F', abbr: 'WHU' },
  'Wolves': { color: '#F59E0B', abbr: 'WOL' },
  'Wolverhampton': { color: '#F59E0B', abbr: 'WOL' },
};

export function getTeamColor(name) {
  return TEAM_COLORS[name]?.color || '#6B7280';
}

export function getTeamAbbr(name) {
  return TEAM_COLORS[name]?.abbr || (name || '?').slice(0, 3).toUpperCase();
}
