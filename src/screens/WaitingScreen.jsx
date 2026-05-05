import { useState, useEffect, useRef } from 'react';
import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import { getPlayer, formatCountdown } from '../utils';
import { getTeamColor, getTeamAbbr } from '../teams';

export default function WaitingScreen({ G, myPlayerId, role, round, message, onNav }) {
  const myPlayer = getPlayer(G, myPlayerId);
  const alive = myPlayer?.active !== false;
  const pts = myPlayer?.seasonPoints || 0;
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);

  // Derive closeTime from stored value or calculate from firstKickoff (1 hour before)
  const closeTime = round?.closeTime ||
    (round?.firstKickoff ? new Date(new Date(round.firstKickoff).getTime() - 60 * 60 * 1000).toISOString() : null);

  useEffect(() => {
    if (!closeTime || round?.status !== 'picking') return;
    const tick = () => setCountdown(formatCountdown(new Date(closeTime) - Date.now()));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [closeTime, round?.status]);

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ ...WRAP, position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

        {/* Survival status */}
        <div style={{
          borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
          background: alive ? 'rgba(209,250,229,0.15)' : 'rgba(254,226,226,0.15)',
          border: `1px solid ${alive ? 'rgba(209,250,229,0.4)' : 'rgba(254,226,226,0.4)'}`,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 26, flexShrink: 0 }}>{alive ? '✅' : '❌'}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{alive ? 'Still in!' : 'Out this cycle'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{pts} pt{pts !== 1 ? 's' : ''} this season</div>
          </div>
        </div>

        {/* Countdown if round is open */}
        {closeTime && round?.status === 'picking' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(8px)', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>PICKS CLOSE IN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: 2 }}>{countdown}</div>
          </div>
        )}

        {/* Waiting message */}
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(12px)', padding: '20px', textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontSize: 14, margin: 0 }}>{message}</p>
        </div>

        {/* This week's picks */}
        {round?.picks && Object.keys(round.picks).length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              THIS WEEK'S PICKS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.values(G?.players || {})
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(player => {
                  const pick = (round.picks || {})[player.id];
                  if (!pick) return null;
                  const hasTeam = !!pick.team;
                  const color = hasTeam ? getTeamColor(pick.team) : null;
                  const abbr = hasTeam ? getTeamAbbr(pick.team) : null;
                  return (
                    <div key={player.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px',
                      opacity: player.active === false ? 0.55 : 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{player.name}</span>
                        {player.active === false && (
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em' }}>OUT</span>
                        )}
                        {pick.autoPicked && (
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em' }}>AUTO</span>
                        )}
                      </div>
                      {hasTeam ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                            background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 900, color: 'white',
                          }}>{abbr}</div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{pick.team}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Not picked yet</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="pick" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
