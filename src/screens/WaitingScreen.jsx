import { useState, useEffect, useRef } from 'react';
import { C, BG, SCREEN } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import { getPlayer, formatCountdown } from '../utils';

export default function WaitingScreen({ G, myPlayerId, role, round, message, onNav }) {
  const myPlayer = getPlayer(G, myPlayerId);
  const alive = myPlayer?.active !== false;
  const pts = myPlayer?.seasonPoints || 0;
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!round?.closeTime || round?.status !== 'picking') return;
    const tick = () => setCountdown(formatCountdown(new Date(round.closeTime) - Date.now()));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [round?.closeTime, round?.status]);

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

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
        {round?.closeTime && round?.status === 'picking' && (
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(8px)', marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>PICKS CLOSE IN</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: 2 }}>{countdown}</div>
          </div>
        )}

        {/* Waiting message */}
        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(12px)', padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontSize: 14 }}>{message}</p>
        </div>
      </div>

      <BottomNav active="pick" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
