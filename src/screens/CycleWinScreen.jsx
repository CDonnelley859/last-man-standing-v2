import { C, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import { getPlayer } from '../utils';

// Stable confetti positions (no Math.random so they don't flicker on re-render)
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  x:        (i * 13 + 5) % 100,
  size:     (i % 4) * 2 + 4,
  delay:    (i * 0.11) % 2.5,
  duration: 2.4 + (i % 5) * 0.35,
  round:    i % 3 === 0,
  color:    ['#C8F06A', 'rgba(255,255,255,0.85)', 'rgba(28,191,160,0.9)', '#fbbf24', '#f472b6'][i % 5],
}));

export default function CycleWinScreen({ G, gameCode, myPlayerId, role, round, onNav }) {
  const myPlayer = getPlayer(G, myPlayerId);
  const pts = myPlayer?.seasonPoints || 0;

  function handleShare() {
    const url = `${location.origin}${location.pathname}?join=${gameCode}`;
    const msg = `🏆 ${myPlayer?.name} is the Last Man Standing!\n\nSurvived Round ${round?.id} — ${pts} pts this season.\n\nPlay along: ${url}`;
    navigator.clipboard.writeText(msg).catch(() => {});
    alert('Victory message copied! Paste it into WhatsApp.');
  }

  return (
    <div style={{ ...SCREEN, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes cwTrophy {
          0%   { transform: scale(0.3) rotate(-12deg); opacity: 0; }
          55%  { transform: scale(1.18) rotate(4deg);  opacity: 1; }
          75%  { transform: scale(0.94) rotate(-2deg); }
          100% { transform: scale(1)   rotate(0deg);  }
        }
        @keyframes cwFadeUp {
          from { transform: translateY(22px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes cwFall {
          0%   { transform: translateY(-30px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
        @keyframes cwRing {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.8); opacity: 0;    }
        }
      `}</style>

      {/* Confetti */}
      {CONFETTI.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${c.x}%`, top: -30, zIndex: 0,
          width: c.size, height: c.size,
          borderRadius: c.round ? '50%' : 3,
          background: c.color,
          animation: `cwFall ${c.duration}s ${c.delay}s ease-in forwards`,
          pointerEvents: 'none',
        }} />
      ))}

      <DotBg />

      <div style={{
        ...WRAP, position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        padding: '40px 28px 100px', textAlign: 'center',
      }}>

        {/* Trophy + pulse rings */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: `2px solid ${C.lime}`, animation: 'cwRing 1.6s 0.7s ease-out forwards', opacity: 0 }} />
          <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: `2px solid ${C.lime}`, animation: 'cwRing 1.6s 1.1s ease-out forwards', opacity: 0 }} />
          <div style={{ fontSize: 80, lineHeight: 1, animation: 'cwTrophy 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards', opacity: 0 }}>
            🏆
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: C.lime, marginBottom: 8, animation: 'cwFadeUp 0.5s 0.55s both' }}>
          LAST MAN STANDING
        </div>

        <div style={{ fontSize: 46, fontWeight: 900, color: C.white, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 6, animation: 'cwFadeUp 0.5s 0.65s both' }}>
          {myPlayer?.name || 'You'}
        </div>

        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 4, animation: 'cwFadeUp 0.5s 0.72s both' }}>
          Survived Round {round?.id}
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: C.lime, marginBottom: 28, animation: 'cwFadeUp 0.5s 0.78s both' }}>
          {pts} pts this season
        </div>

        {/* Lime divider */}
        <div style={{ width: 48, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${C.lime}, ${C.teal})`, marginBottom: 28, animation: 'cwFadeUp 0.4s 0.82s both' }} />

        {/* Buttons */}
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10, animation: 'cwFadeUp 0.5s 0.88s both' }}>
          <button
            onClick={handleShare}
            style={{
              height: 52, borderRadius: '14px 14px 14px 4px', border: 'none', cursor: 'pointer',
              background: C.lime, color: C.dark, fontFamily: 'Inter, sans-serif',
              fontWeight: 800, fontSize: 13, letterSpacing: '0.08em',
              boxShadow: '0 4px 24px rgba(200,240,106,0.55)',
            }}
          >
            📋 SHARE VICTORY
          </button>
          <button
            onClick={() => onNav('stats')}
            style={{
              height: 52, borderRadius: '14px 14px 14px 4px',
              border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              background: 'rgba(255,255,255,0.1)', color: C.white,
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13,
              letterSpacing: '0.06em', backdropFilter: 'blur(8px)',
            }}
          >
            VIEW STANDINGS →
          </button>
        </div>
      </div>

      <BottomNav active="stats" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
