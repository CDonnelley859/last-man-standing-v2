import { useState, useEffect, useRef } from 'react';
import { C, BG, SCREEN } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { getPlayer, formatCountdown, formatMatchTime } from '../utils';
import { getTeamColor, getTeamAbbr } from '../teams';

export default function PickScreen({ G, gameCode, myPlayerId, role, round, cachedMatchday, onPick, onNav }) {
  const myPick = (round?.picks || {})[myPlayerId];
  const myPlayer = getPlayer(G, myPlayerId);
  const usedTeams = myPlayer?.usedTeams || {};
  const [countdown, setCountdown] = useState('');
  const [confirmed, setConfirmed] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!round?.closeTime) return;
    const tick = () => setCountdown(formatCountdown(new Date(round.closeTime) - Date.now()));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [round?.closeTime]);

  async function handlePick(team, fi, side) {
    if (!team) return;
    setConfirmed(team);
    await onPick(team);
  }

  // Build fixture pairs from API data
  const fixtures = cachedMatchday?.matches || [];

  const selectedTeam = confirmed || myPick?.team || null;
  const selectedColor = selectedTeam ? getTeamColor(selectedTeam) : C.teal;
  const selectedAbbr = selectedTeam ? getTeamAbbr(selectedTeam) : '?';

  // Determine opponent for selected team
  let selectedOpp = '—';
  if (selectedTeam && fixtures.length) {
    const fx = fixtures.find(m => {
      const h = m.homeTeam?.shortName || m.homeTeam?.name || '';
      const a = m.awayTeam?.shortName || m.awayTeam?.name || '';
      return h === selectedTeam || a === selectedTeam;
    });
    if (fx) {
      const h = fx.homeTeam?.shortName || fx.homeTeam?.name || '';
      selectedOpp = h === selectedTeam
        ? (fx.awayTeam?.shortName || fx.awayTeam?.name || '?')
        : h;
    }
  }

  // All available teams from picks entry or fallback
  const allTeams = Object.keys(usedTeams ? {} : {});

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 260, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(45px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '54px 0 0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          {cachedMatchday && (
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>
              GAMEWEEK {cachedMatchday.matchday}
            </div>
          )}
          <div style={{ fontSize: 26, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: '-0.02em' }}>SELECT YOUR TEAM</div>
        </div>

        {/* Countdown */}
        {round?.closeTime && (
          <div style={{ margin: '0 20px 16px', background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>PICKS CLOSE IN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: 2 }}>{countdown}</div>
          </div>
        )}

        {/* Selected hero */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: C.lime }}>
            {selectedTeam ? 'TEAM SELECTED' : 'NO PICK YET'}
          </div>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${selectedColor}cc, ${selectedColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 24, color: 'white',
            boxShadow: `0 4px 20px ${selectedColor}55, 0 0 0 3px rgba(255,255,255,0.18)`,
          }}>
            {selectedAbbr}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.white, letterSpacing: '-0.01em', lineHeight: 1 }}>
            {selectedTeam || '—'}
          </div>
          {selectedOpp !== '—' && (
            <div style={{ background: 'rgba(200,240,106,0.18)', color: C.lime, border: '1px solid rgba(200,240,106,0.35)', borderRadius: '10px 10px 10px 4px', padding: '4px 14px', fontWeight: 700, fontSize: 10 }}>
              vs {selectedOpp}
            </div>
          )}
        </div>

        {/* Fixture pairs from API */}
        {fixtures.length > 0 ? (
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              FIXTURES — TAP HOME OR AWAY TO PICK
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {fixtures.map((fx, i) => {
                const homeName = fx.homeTeam?.shortName || fx.homeTeam?.name || '?';
                const awayName = fx.awayTeam?.shortName || fx.awayTeam?.name || '?';
                const homeColor = getTeamColor(homeName);
                const awayColor = getTeamColor(awayName);
                const homeAbbr = getTeamAbbr(homeName);
                const awayAbbr = getTeamAbbr(awayName);
                const homeUsed = !!usedTeams[homeName];
                const awayUsed = !!usedTeams[awayName];
                const homeSel = selectedTeam === homeName;
                const awaySel = selectedTeam === awayName;

                return (
                  <div key={i} style={{
                    position: 'relative',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
                    background: C.white,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 38%)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 6 }}>
                      {/* Home */}
                      <div
                        onClick={() => !homeUsed && handlePick(homeName)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: homeUsed ? 'default' : 'pointer', opacity: homeUsed ? 0.4 : 1 }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: `radial-gradient(circle at 35% 35%, ${homeColor}cc, ${homeColor})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: 13, color: 'white',
                          boxShadow: homeSel ? `0 0 0 3px ${homeColor}, 0 4px 12px ${homeColor}66` : `0 2px 8px ${homeColor}44`,
                          transition: 'box-shadow 0.15s',
                        }}>
                          {homeAbbr}
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 12, color: C.dark, lineHeight: 1.2 }}>{homeName}</span>
                      </div>

                      <span style={{ fontSize: 9, color: C.g3, fontWeight: 600, flexShrink: 0, padding: '0 2px' }}>vs</span>

                      {/* Away */}
                      <div
                        onClick={() => !awayUsed && handlePick(awayName)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end', cursor: awayUsed ? 'default' : 'pointer', opacity: awayUsed ? 0.4 : 1 }}
                      >
                        <span style={{ fontWeight: 800, fontSize: 12, color: C.dark, lineHeight: 1.2, textAlign: 'right' }}>{awayName}</span>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: `radial-gradient(circle at 35% 35%, ${awayColor}cc, ${awayColor})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: 13, color: 'white',
                          boxShadow: awaySel ? `0 0 0 3px ${awayColor}, 0 4px 12px ${awayColor}66` : `0 2px 8px ${awayColor}44`,
                          transition: 'box-shadow 0.15s',
                        }}>
                          {awayAbbr}
                        </div>
                      </div>
                    </div>
                    {(homeUsed || awayUsed) && (
                      <div style={{ fontSize: 9, color: C.g3, textAlign: 'center', paddingBottom: 4 }}>
                        {homeUsed && awayUsed ? 'Both teams already used' : homeUsed ? `${homeName} already used` : `${awayName} already used`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Fallback: simple team grid
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              CHOOSE YOUR TEAM
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {Object.entries(usedTeams ? {} : {}).length === 0
                ? null
                : null}
            </div>
          </div>
        )}

        {/* Lock in button */}
        {selectedTeam && (
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ background: C.greenBg, borderRadius: 10, padding: '12px 16px', textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: C.greenText, fontWeight: 700 }}>✅ Pick saved: {selectedTeam}</span>
              <div style={{ fontSize: 11, color: C.greenText, marginTop: 2 }}>You can change it until the host locks picks.</div>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="pick" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
