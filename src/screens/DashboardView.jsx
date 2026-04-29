import { useState, useEffect, useRef } from 'react';
import { C, BG } from '../tokens';
import { players, activePlayers, getPlayer, rounds, initials, formatCountdown, formatMatchTime } from '../utils';
import { getTeamColor, getTeamAbbr } from '../teams';
import Av from '../components/Av';
import Card from '../components/Card';
import DotBg from '../components/DotBg';

// ── Shared panel shell ────────────────────────────────────────────────────────
function Panel({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>{label}</div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}

// ── Standings panel ───────────────────────────────────────────────────────────
function StandingsPanel({ G, myPlayerId }) {
  const ps = players(G);
  const alive = ps.filter(p => p.active).sort((a, b) => (b.seasonPoints || 0) - (a.seasonPoints || 0) || a.name.localeCompare(b.name));
  const out = ps.filter(p => !p.active).sort((a, b) => (b.seasonPoints || 0) - (a.seasonPoints || 0));

  const ROW = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: 'rgba(233,0,82,0.15)', border: '1px solid rgba(233,0,82,0.3)', borderRadius: 10, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.white }}>🏆 SURVIVORS — {alive.length}</span>
      </div>
      {alive.map((p, i) => (
        <div key={p.id} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, ...ROW, borderLeft: `3px solid ${C.teal}` }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < 3 ? [C.teal, C.g3, C.g2][i] : C.g2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i < 3 ? C.white : C.g4, flexShrink: 0 }}>{i + 1}</span>
          <Av initials={initials(p.name)} color={C.teal} size={30} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.dark }}>{p.name}{p.id === myPlayerId ? ' (you)' : ''}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>{p.seasonPoints || 0}</span>
          <span style={{ fontSize: 9, color: C.g4 }}>pts</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: C.teal }}>ALIVE</span>
        </div>
      ))}
      {out.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 4 }}>✕ ELIMINATED</div>
          {out.map(p => (
            <div key={p.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, ...ROW, opacity: 0.7 }}>
              <Av initials={initials(p.name)} size={30} dim />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{p.name}</span>
              <span style={{ fontSize: 11, color: C.g4 }}>{p.seasonPoints || 0} pts</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.g4 }}>OUT</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Fixtures / pick panel ─────────────────────────────────────────────────────
function FixturesPanel({ G, round, cachedMatchday, myPlayerId, isEliminated, onPick }) {
  const myPlayer = getPlayer(G, myPlayerId);
  const myPick = (round?.picks || {})[myPlayerId];
  const usedTeams = myPlayer?.usedTeams || {};
  const [confirmed, setConfirmed] = useState(null);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);

  const closeTime = round?.closeTime ||
    (round?.firstKickoff ? new Date(new Date(round.firstKickoff).getTime() - 60 * 60 * 1000).toISOString() : null);

  useEffect(() => {
    if (!closeTime) return;
    const tick = () => setCountdown(formatCountdown(new Date(closeTime) - Date.now()));
    tick(); timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [closeTime]);

  const selectedTeam = confirmed || myPick?.team || null;
  const fixtures = cachedMatchday?.matches || [];

  async function handlePick(team) {
    if (!team || isEliminated) return;
    setConfirmed(team);
    await onPick(team);
  }

  if (!round) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Waiting for the host to open a gameweek</div>
      </div>
    );
  }

  if (round.status === 'results') {
    const matches = cachedMatchday?.matches || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: C.white, fontWeight: 600 }}>
          ⏳ Results processing — checking every 5 minutes
        </div>
        {matches.map((m, i) => {
          const score = m.status === 'FINISHED' ? `${m.score?.fullTime?.home ?? '?'}–${m.score?.fullTime?.away ?? '?'}` : null;
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{m.homeTeam?.shortName} v {m.awayTeam?.shortName}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: m.status === 'FINISHED' ? C.greenText : m.status === 'IN_PLAY' ? C.teal : C.g4 }}>
                {score || (m.status === 'IN_PLAY' ? '● Live' : formatMatchTime(m.utcDate))}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (round.status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>Round {round.id} complete</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Waiting for the host to open the next gameweek</div>
      </div>
    );
  }

  // Picking
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isEliminated && (
        <div style={{ background: 'rgba(254,226,226,0.12)', border: '1px solid rgba(254,226,226,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👀</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>You're out this cycle — spectating</span>
        </div>
      )}

      {!isEliminated && selectedTeam && (
        <div style={{ background: 'rgba(233,0,82,0.15)', border: '1px solid rgba(233,0,82,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${getTeamColor(selectedTeam)}cc, ${getTeamColor(selectedTeam)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'white', flexShrink: 0 }}>{getTeamAbbr(selectedTeam)}</div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal }}>YOUR PICK</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.white }}>{selectedTeam}</div>
          </div>
          {closeTime && <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>CLOSES IN</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{countdown}</div>
          </div>}
        </div>
      )}

      {!isEliminated && !selectedTeam && closeTime && (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Picks close in</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.white }}>{countdown}</span>
        </div>
      )}

      {fixtures.length > 0 ? fixtures.map((fx, i) => {
        const homeName = fx.homeTeam?.shortName || fx.homeTeam?.name || '?';
        const awayName = fx.awayTeam?.shortName || fx.awayTeam?.name || '?';
        const homeSel = selectedTeam === homeName;
        const awaySel = selectedTeam === awayName;
        const homeUsed = !!usedTeams[homeName];
        const awayUsed = !!usedTeams[awayName];
        return (
          <div key={i} style={{ background: C.white, borderRadius: 10, overflow: 'hidden', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 8 }}>
              <div onClick={() => !homeUsed && !isEliminated && handlePick(homeName)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: (homeUsed || isEliminated) ? 'default' : 'pointer', opacity: homeUsed ? 0.4 : 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${getTeamColor(homeName)}cc, ${getTeamColor(homeName)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: 'white', boxShadow: homeSel ? `0 0 0 2px ${getTeamColor(homeName)}` : 'none', flexShrink: 0 }}>{getTeamAbbr(homeName)}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.dark }}>{homeName}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.g3 }}>HOME</div>
                </div>
              </div>
              <span style={{ fontSize: 9, color: C.g3, flexShrink: 0 }}>vs</span>
              <div onClick={() => !awayUsed && !isEliminated && handlePick(awayName)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end', cursor: (awayUsed || isEliminated) ? 'default' : 'pointer', opacity: awayUsed ? 0.4 : 1 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.dark }}>{awayName}</div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.g3 }}>AWAY</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${getTeamColor(awayName)}cc, ${getTeamColor(awayName)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: 'white', boxShadow: awaySel ? `0 0 0 2px ${getTeamColor(awayName)}` : 'none', flexShrink: 0 }}>{getTeamAbbr(awayName)}</div>
              </div>
            </div>
            {fx.utcDate && <div style={{ padding: '0 14px 8px', textAlign: 'center', fontSize: 9, color: C.g4 }}>{new Date(fx.utcDate).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
          </div>
        );
      }) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading fixtures…</div>
      )}
    </div>
  );
}

// ── Admin right panel ─────────────────────────────────────────────────────────
function AdminRightPanel({ G, round, cachedMatchday, liveDataError, lastResultsCheck, onActivateGameweek, onStartRound, onLockPicks, onSubmitResults, onReminder, onRefreshResults }) {
  const BTN = (bg, shadow) => ({
    width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: bg, color: 'white', fontFamily: 'Inter, sans-serif',
    fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', boxShadow: shadow || 'none', marginBottom: 8,
  });

  if (!round) {
    return (
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>No round open. Activate a gameweek to begin.</div>
        {liveDataError && <div style={{ background: C.redBg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.redText, marginBottom: 10 }}>⚠️ {liveDataError}</div>}
        <button style={BTN(`linear-gradient(135deg, #e90052, #c4003f)`, 'rgba(233,0,82,0.35)')} onClick={onActivateGameweek}>🌐 ACTIVATE GAMEWEEK (AUTO)</button>
        <button style={{ ...BTN('rgba(255,255,255,0.9)'), color: C.dark }} onClick={onStartRound}>🟢 OPEN ROUND MANUALLY</button>
      </div>
    );
  }

  if (round.status === 'picking') {
    const picks = Object.values(round.picks || {});
    const pickedCount = picks.filter(p => p.team).length;
    const total = picks.length;
    const pct = total > 0 ? (pickedCount / total) * 100 : 0;
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 4 }}>Round {round.id} — Picking Open</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{pickedCount} of {total} players picked</div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`, transition: 'width 0.3s' }} />
        </div>
        <button style={BTN('rgba(255,255,255,0.12)', 'none')} onClick={onLockPicks}>CLOSE PICKS &amp; LOCK ROUND</button>
        <button style={BTN(`linear-gradient(135deg, #e90052, #c4003f)`, 'rgba(233,0,82,0.35)')} onClick={onReminder}>📣 SEND REMINDER</button>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0 10px' }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>PICKS</div>
        {picks.map((pick, i) => {
          const p = getPlayer(G, pick.playerId);
          return (
            <div key={pick.playerId} style={{ display: 'flex', alignItems: 'center', padding: '7px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{p?.name}</span>
              {pick.team ? <span style={{ fontSize: 12, color: C.teal, fontWeight: 700 }}>{pick.team} ✓</span> : <span style={{ fontSize: 11, color: '#d97706' }}>Not picked</span>}
            </div>
          );
        })}
      </div>
    );
  }

  if (round.status === 'results') {
    const matches = cachedMatchday?.matches || [];
    const pickedTeams = [...new Set(Object.values(round.picks || {}).map(p => p.team).filter(Boolean))].sort();
    const DONE = ['FINISHED', 'CANCELLED', 'POSTPONED', 'AWARDED', 'SUSPENDED'];
    const allDone = matches.length > 0 && matches.every(m => DONE.includes(m.status));
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 8 }}>Round {round.id} — Awaiting Results</div>
        <div style={{ background: allDone ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.12)', border: `1px solid ${allDone ? 'rgba(16,185,129,0.3)' : 'rgba(251,191,36,0.3)'}`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: allDone ? C.greenText : '#d97706', marginBottom: 12 }}>
          {allDone ? '✅ All matches done — results applied.' : `⏳ Checking every 5 min.${lastResultsCheck ? ' Last: ' + lastResultsCheck.toLocaleTimeString('en-GB') : ''}`}
        </div>
        <button style={{ ...BTN('rgba(255,255,255,0.12)'), marginBottom: 12 }} onClick={onRefreshResults}>🔄 Refresh Now</button>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>MANUAL — Tick teams that won</div>
        <form id="dash-results-form">
          {pickedTeams.map((team, i) => {
            const who = Object.values(round.picks || {}).filter(p => p.team === team).map(p => getPlayer(G, p.playerId)?.name).filter(Boolean).join(', ');
            return (
              <label key={team} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', cursor: 'pointer' }}>
                <input type="checkbox" name="winners" value={team} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.teal }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{team} <span style={{ color: 'rgba(255,255,255,0.45)' }}>— {who}</span></span>
              </label>
            );
          })}
        </form>
        <button style={{ ...BTN('rgba(0,0,0,0.35)'), marginTop: 10 }} onClick={() => onSubmitResults(Array.from(document.querySelectorAll('#dash-results-form input[type=checkbox]:checked')).map(c => c.value))}>
          SUBMIT RESULTS →
        </button>
      </div>
    );
  }

  if (round.status === 'done') {
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 12 }}>Round {round.id} — Complete</div>
        <button style={BTN(`linear-gradient(135deg, #e90052, #c4003f)`, 'rgba(233,0,82,0.35)')} onClick={onActivateGameweek}>🌐 ACTIVATE NEXT GAMEWEEK</button>
        <button style={{ ...BTN('rgba(255,255,255,0.12)'), marginBottom: 0 }} onClick={onStartRound}>🟢 OPEN ROUND MANUALLY</button>
      </div>
    );
  }

  return null;
}

// ── Player right panel ────────────────────────────────────────────────────────
function PlayerRightPanel({ G, myPlayerId, round, pickPrefs, onUpdatePickPrefs, onLeave, teams }) {
  const myPlayer = getPlayer(G, myPlayerId);
  const usedTeams = myPlayer?.usedTeams || {};
  const currentPrefs = pickPrefs || [];
  const prefCandidates = (teams || []).filter(t => !usedTeams[t] && !currentPrefs.includes(t));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status card */}
      <div style={{ background: myPlayer?.active ? 'rgba(233,0,82,0.15)' : 'rgba(254,226,226,0.1)', border: `1px solid ${myPlayer?.active ? 'rgba(233,0,82,0.3)' : 'rgba(254,226,226,0.3)'}`, borderRadius: 10, padding: '12px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: myPlayer?.active ? C.teal : C.g4, marginBottom: 4 }}>YOUR STATUS</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{myPlayer?.active ? '● ALIVE' : '✕ OUT THIS CYCLE'}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{myPlayer?.seasonPoints || 0} pts this season</div>
      </div>

      {/* Used teams */}
      {Object.keys(usedTeams).length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>TEAMS USED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.keys(usedTeams).map(t => (
              <span key={t} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 9px', fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Auto-pick prefs */}
      {onUpdatePickPrefs && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>AUTO-PICK ORDER</div>
          {currentPrefs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
              {currentPrefs.map((team, idx) => (
                <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 10px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.teal, width: 16 }}>{idx + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.white }}>{team}</span>
                  <button onClick={() => onUpdatePickPrefs(currentPrefs.filter(t => t !== team))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16, padding: 0, fontFamily: 'Inter, sans-serif' }}>×</button>
                </div>
              ))}
            </div>
          )}
          {prefCandidates.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {prefCandidates.slice(0, 12).map(t => (
                <button key={t} onClick={() => onUpdatePickPrefs([...currentPrefs, t])} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: 11, color: C.white, fontFamily: 'Inter, sans-serif' }}>+ {t}</button>
              ))}
            </div>
          )}
          {currentPrefs.length === 0 && prefCandidates.length === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>No teams available to add.</div>
          )}
        </div>
      )}

      {/* Leave */}
      {onLeave && (
        <button onClick={onLeave} style={{ marginTop: 'auto', width: '100%', padding: '11px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer' }}>
          LEAVE GAME
        </button>
      )}
    </div>
  );
}

// ── Main dashboard layout ─────────────────────────────────────────────────────
export default function DashboardView({
  G, gameCode, myPlayerId, role, round, cachedMatchday, teams, pickPrefs,
  onPick, onUpdatePickPrefs, onNav,
  onActivateGameweek, onStartRound, onLockPicks, onSubmitResults,
  onReminder, onRefreshResults, liveDataError, lastResultsCheck, onLeave,
}) {
  const myPlayer = getPlayer(G, myPlayerId);
  const isEliminated = myPlayer && !myPlayer.active;
  const roundsPlayed = (G ? Object.values(G.rounds || {}).filter(r => r.status === 'done').length : 0);

  const PANEL = {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(12px)',
    borderRadius: 16, padding: '20px 18px', overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <DotBg />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)' }}>LAST MAN STANDING</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.white, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{G?.gameName || gameCode}</div>
        </div>
        {cachedMatchday && (
          <div style={{ background: 'rgba(233,0,82,0.18)', border: '1px solid rgba(233,0,82,0.3)', borderRadius: 8, padding: '5px 12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.white }}>GW{cachedMatchday.matchday}</span>
          </div>
        )}
        {round && (
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Round {round.id}</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {myPlayer && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {myPlayer.name} · {myPlayer.active ? <span style={{ color: C.teal }}>ALIVE</span> : <span style={{ color: C.g4 }}>OUT</span>}
            </span>
          )}
          <button onClick={() => onNav('home')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>
            ← HOME
          </button>
        </div>
      </div>

      {/* 3 columns */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', gap: 16, padding: '20px 28px 28px', overflow: 'hidden' }}>
        <div style={PANEL}>
          <Panel label="STANDINGS">
            <StandingsPanel G={G} myPlayerId={myPlayerId} />
          </Panel>
        </div>

        <div style={PANEL}>
          <Panel label={`GAMEWEEK ${cachedMatchday?.matchday || '—'} · FIXTURES`}>
            <FixturesPanel G={G} round={round} cachedMatchday={cachedMatchday} myPlayerId={myPlayerId} isEliminated={isEliminated} onPick={onPick} />
          </Panel>
        </div>

        <div style={PANEL}>
          <Panel label={role === 'host' ? 'ADMIN' : 'MY STATUS'}>
            {role === 'host' ? (
              <AdminRightPanel G={G} round={round} cachedMatchday={cachedMatchday} liveDataError={liveDataError} lastResultsCheck={lastResultsCheck} onActivateGameweek={onActivateGameweek} onStartRound={onStartRound} onLockPicks={onLockPicks} onSubmitResults={onSubmitResults} onReminder={onReminder} onRefreshResults={onRefreshResults} />
            ) : (
              <PlayerRightPanel G={G} myPlayerId={myPlayerId} round={round} pickPrefs={pickPrefs} onUpdatePickPrefs={onUpdatePickPrefs} onLeave={onLeave} teams={teams} />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
