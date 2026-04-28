export function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function savedGames() {
  try { return JSON.parse(localStorage.getItem('lms_games') || '[]'); } catch { return []; }
}

export function saveGame(code, role, pid, name, gameName) {
  const games = savedGames().filter(g => g.code !== code);
  games.push({ code, role, pid, name, gameName: gameName || code });
  localStorage.setItem('lms_games', JSON.stringify(games));
}

export function removeGame(code) {
  localStorage.setItem('lms_games', JSON.stringify(savedGames().filter(g => g.code !== code)));
}

export function migrateLegacyLocalStorage() {
  const oldCode = localStorage.getItem('lms_code');
  const oldRole = localStorage.getItem('lms_role');
  const oldPid  = localStorage.getItem('lms_pid');
  if (oldCode && oldRole) {
    if (!localStorage.getItem('lms_games')) saveGame(oldCode, oldRole, oldPid || null, 'Player', oldCode);
    localStorage.removeItem('lms_code');
    localStorage.removeItem('lms_role');
    localStorage.removeItem('lms_pid');
  }
}

export function players(G) {
  return Object.values(G?.players || {});
}

export function activePlayers(G) {
  return players(G).filter(p => p.active);
}

export function getPlayer(G, id) {
  return (G?.players || {})[id];
}

export function rounds(G) {
  return Object.values(G?.rounds || {}).sort((a, b) => a.id - b.id);
}

export function currentRound(G) {
  const rs = rounds(G);
  return rs[rs.length - 1] || null;
}

export function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatCountdown(ms) {
  if (ms <= 0) return 'Closed';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
  return `${pad(m)}m ${pad(sec)}s`;
}

export function formatMatchTime(utcDate) {
  if (!utcDate) return '—';
  return new Date(utcDate).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDatetimeLocal(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}
