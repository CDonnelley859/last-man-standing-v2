import { C, BG, SCREEN } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import Pill from '../components/Pill';
import StatusDot from '../components/StatusDot';
import { players, activePlayers, getPlayer, formatMatchTime } from '../utils';

const BTN_DARK = {
  height: 44, borderRadius: '12px 12px 12px 4px', border: 'none', cursor: 'pointer',
  background: `linear-gradient(135deg, #1a1a1a, #111)`, color: '#fff',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
  boxShadow: '0 3px 12px rgba(0,0,0,0.3)', width: '100%',
};
const BTN_TEAL = {
  height: 44, borderRadius: '12px 12px 12px 4px', border: 'none', cursor: 'pointer',
  background: `linear-gradient(135deg, #1CBFA0, #15a087)`, color: '#fff',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
  boxShadow: '0 3px 12px rgba(28,191,160,0.35)', width: '100%',
};
const BTN_WHITE = {
  height: 44, borderRadius: '12px 12px 12px 4px', border: `1.5px solid ${C.g2}`, cursor: 'pointer',
  background: C.white, color: C.dark,
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', width: '100%',
};

export default function AdminScreen({
  G, gameCode, myPlayerId, round, cachedMatchday, liveDataError, lastResultsCheck,
  onActivateGameweek, onStartRound, onLockPicks, onSubmitResults, onEliminate, onReinstate,
  onReset, onCopyLink, onReminder, onRefreshResults, onSwitchToPlayer, onNav,
}) {
  const ps = players(G);
  const active = activePlayers(G);

  // Round control content
  function renderRoundControl() {
    // No round yet
    if (!round) {
      return (
        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>ROUND CONTROL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <StatusDot color={C.g3} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>No round open</span>
          </div>
          <div style={{ fontSize: 11, color: C.g4, marginBottom: 12 }}>{active.length} player{active.length !== 1 ? 's' : ''} still in.</div>
          {liveDataError && <div style={{ background: C.redBg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.redText, marginBottom: 10 }}>⚠️ {liveDataError}</div>}
          <div style={{ height: 1, background: C.g2, marginBottom: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={BTN_TEAL} onClick={onActivateGameweek}>🌐 ACTIVATE GAMEWEEK (AUTO)</button>
            <button style={BTN_WHITE} onClick={onStartRound}>🟢 OPEN ROUND MANUALLY</button>
          </div>
        </Card>
      );
    }

    // Picking open
    if (round.status === 'picking') {
      const picks = Object.values(round.picks || {});
      const pickedCount = picks.filter(p => p.team).length;
      const total = picks.length;
      const pct = total > 0 ? (pickedCount / total) * 100 : 0;
      const unpicked = picks.filter(p => !p.team);
      const allPicked = pickedCount === total;

      return (
        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>ROUND CONTROL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <StatusDot color="#22C55E" />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Round {round.id} — Picking Open</span>
          </div>
          <div style={{ fontSize: 11, color: C.g4, marginBottom: 12 }}>{pickedCount} of {total} players have picked</div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: C.g2, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${C.teal}, ${C.tealMid})`, boxShadow: '0 1px 4px rgba(28,191,160,0.4)', transition: 'width 0.3s' }} />
          </div>

          {round.firstKickoff && (
            <div style={{ background: C.greenBg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.greenText, marginBottom: 10 }}>
              ⏱ Auto-closes 1 hour before kick-off ({formatMatchTime(round.firstKickoff)})
            </div>
          )}

          <div style={{ height: 1, background: C.g2, marginBottom: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={BTN_DARK} onClick={onLockPicks} disabled={!allPicked}>
              CLOSE PICKS &amp; LOCK ROUND
            </button>
            <button style={BTN_TEAL} onClick={onReminder}>
              SEND REMINDER TO NON-PICKERS
            </button>
            {!allPicked && (
              <div style={{ fontSize: 10, color: C.g3, textAlign: 'center' }}>
                {unpicked.length} player{unpicked.length !== 1 ? 's' : ''} haven't picked yet
              </div>
            )}
          </div>

          {/* Pick list */}
          {picks.length > 0 && (
            <>
              <div style={{ height: 1, background: C.g2, margin: '12px 0 8px' }} />
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 6 }}>PICKS</div>
              {picks.map((pick, i) => {
                const p = getPlayer(G, pick.playerId);
                return (
                  <div key={pick.playerId}>
                    {i > 0 && <div style={{ height: 1, background: C.g1 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.dark }}>{p?.name}</span>
                      {pick.team
                        ? <span style={{ fontSize: 13, color: C.teal, fontWeight: 700 }}>{pick.team} ✓</span>
                        : <span style={{ fontSize: 12, color: '#d97706' }}>Not picked yet</span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </Card>
      );
    }

    // Results — waiting for match results
    if (round.status === 'results') {
      const matches = cachedMatchday?.matches || [];
      const DONE = ['FINISHED', 'CANCELLED', 'POSTPONED', 'AWARDED', 'SUSPENDED'];
      const allDone = matches.length > 0 && matches.every(m => DONE.includes(m.status));
      const picks = Object.values(round.picks || {});
      const pickedTeams = [...new Set(picks.map(p => p.team).filter(Boolean))].sort();

      return (
        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>ROUND CONTROL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <StatusDot color={C.red} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Round {round.id} — Awaiting Results</span>
          </div>

          {/* Live match status */}
          {matches.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {liveDataError && <div style={{ background: C.redBg, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: C.redText, marginBottom: 8 }}>⚠️ {liveDataError}</div>}
              <div style={{ background: allDone ? C.greenBg : '#FEF3C7', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: allDone ? C.greenText : '#92400E', marginBottom: 8 }}>
                {allDone ? '✅ All matches done — results applied automatically.' : `⏳ Watching for results (checks every 5 min).${lastResultsCheck ? ' Last: ' + lastResultsCheck.toLocaleTimeString('en-GB') : ''}`}
              </div>
              {matches.slice(0, 6).map((m, i) => {
                let score = '';
                if (m.status === 'FINISHED') {
                  score = `${m.score?.fullTime?.home ?? '?'}–${m.score?.fullTime?.away ?? '?'}`;
                }
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: i > 0 ? `1px solid ${C.g1}` : 'none', fontSize: 13 }}>
                    <span style={{ color: C.dark }}>{m.homeTeam?.shortName || '?'} v {m.awayTeam?.shortName || '?'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.status === 'FINISHED' ? C.greenText : m.status === 'IN_PLAY' ? C.redText : C.g4 }}>
                      {score || (m.status === 'IN_PLAY' ? 'Live' : formatMatchTime(m.utcDate))}
                    </span>
                  </div>
                );
              })}
              <button style={{ ...BTN_WHITE, marginTop: 8, height: 36, fontSize: 11 }} onClick={onRefreshResults}>🔄 Refresh Now</button>
            </div>
          )}

          {/* Manual results entry */}
          <div style={{ height: 1, background: C.g2, marginBottom: 12 }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 8 }}>MANUAL ENTRY — Tick teams that won</div>
          <form id="results-form">
            {pickedTeams.map((team, i) => {
              const who = picks.filter(p => p.team === team).map(p => getPlayer(G, p.playerId)?.name).filter(Boolean).join(', ');
              return (
                <label key={team} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: i > 0 ? `1px solid ${C.g1}` : 'none', cursor: 'pointer' }}>
                  <input type="checkbox" name="winners" value={team} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.teal }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.dark }}>{team} <span style={{ color: C.g4, fontWeight: 400 }}>— {who}</span></span>
                </label>
              );
            })}
          </form>
          <div style={{ marginTop: 12 }}>
            <button style={BTN_DARK} onClick={() => onSubmitResults(Array.from(document.querySelectorAll('#results-form input[type=checkbox]:checked')).map(c => c.value))}>
              SUBMIT RESULTS &amp; ELIMINATE →
            </button>
          </div>
        </Card>
      );
    }

    // Round done
    if (round.status === 'done') {
      const picks = Object.values(round.picks || {});
      const survived = picks.filter(p => p.result === 'win');
      const eliminated = picks.filter(p => p.result === 'out');
      const cycleWinner = round.cycleWinner ? getPlayer(G, round.cycleWinner) : null;
      const cycleReset = cycleWinner || round.cycleNoWinner;

      return (
        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>ROUND CONTROL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <StatusDot color={C.g3} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>Round {round.id} — Complete</span>
          </div>

          {cycleReset && (
            <div style={{ background: cycleWinner ? C.greenBg : '#DBEAFE', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: cycleWinner ? C.greenText : '#1E40AF', marginBottom: 12 }}>
              {cycleWinner ? `🏆 ${cycleWinner.name} wins this cycle! All players reset.` : '🤝 No winner — all players reset for next round.'}
            </div>
          )}

          {survived.length > 0 && (
            <div style={{ background: C.greenBg, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.greenText, marginBottom: 8 }}>
              ✅ Won: {survived.map(p => `${getPlayer(G, p.playerId)?.name} (${p.team})`).join(', ')}
            </div>
          )}
          {eliminated.length > 0 && (
            <div style={{ background: C.redBg, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.redText, marginBottom: 12 }}>
              ❌ Out: {eliminated.map(p => `${getPlayer(G, p.playerId)?.name} (${p.team})`).join(', ')}
            </div>
          )}

          <div style={{ height: 1, background: C.g2, marginBottom: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={BTN_TEAL} onClick={onActivateGameweek}>🌐 ACTIVATE NEXT GAMEWEEK (AUTO)</button>
            <button style={BTN_WHITE} onClick={onStartRound}>🟢 OPEN ROUND {round.id + 1} MANUALLY</button>
          </div>
        </Card>
      );
    }

    return null;
  }

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ position: 'relative', zIndex: 1, padding: '56px 0 0' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: '-0.02em' }}>ADMIN</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>
            {G.gameName || gameCode}{round ? ` · Round ${round.id}` : ''}
          </div>
        </div>

        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Round control card */}
          {renderRoundControl()}

          {/* Players card */}
          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 4 }}>PLAYERS</div>
            <div style={{ fontSize: 11, color: C.g4, marginBottom: 10 }}>
              {ps.length} total · {active.length} alive · {ps.length - active.length} eliminated
            </div>
            <div style={{ height: 1, background: C.g2, marginBottom: 8 }} />
            {ps.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <div style={{ height: 1, background: C.g1 }} />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0' }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: p.active ? C.dark : C.g4 }}>{p.name}</span>
                  <Pill
                    label={p.active ? 'IN' : 'OUT'}
                    bg={p.active ? C.lime : C.g2}
                    color={p.active ? C.dark : C.g4}
                    style={{ borderRadius: '8px 8px 8px 2px', marginRight: 10 }}
                  />
                  <button
                    onClick={() => p.active ? onEliminate(p.id) : onReinstate(p.id)}
                    style={{
                      height: 24, padding: '0 10px', borderRadius: '6px 6px 6px 2px', border: 'none', cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 9, letterSpacing: '0.04em',
                      background: p.active ? C.redBg : C.greenBg,
                      color: p.active ? C.redText : C.greenText,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    {p.active ? 'Eliminate' : 'Reinstate'}
                  </button>
                </div>
              </div>
            ))}
          </Card>

          {/* Game management card */}
          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>GAME MANAGEMENT</div>
            <div style={{ height: 1, background: C.g2, marginBottom: 10 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={BTN_TEAL} onClick={onCopyLink}>COPY JOIN LINK</button>
              <button style={{ ...BTN_WHITE, color: C.g4 }} onClick={onSwitchToPlayer}>VIEW AS PLAYER</button>
              <button style={{ ...BTN_WHITE, color: C.redText, borderColor: C.redBg }} onClick={onReset}>RESET &amp; START NEW GAME</button>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav active="admin" onNav={onNav} isHost={true} />
    </div>
  );
}
