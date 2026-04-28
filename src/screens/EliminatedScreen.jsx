import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import { getPlayer } from '../utils';

export default function EliminatedScreen({ G, myPlayerId, role, onNav }) {
  const myPlayer = getPlayer(G, myPlayerId);
  const pts = myPlayer?.seasonPoints || 0;

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ ...WRAP, position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

        {/* Survival status */}
        <div style={{
          borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
          background: 'rgba(254,226,226,0.15)', border: '1px solid rgba(254,226,226,0.4)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 26, flexShrink: 0 }}>❌</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Out this cycle</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{pts} pt{pts !== 1 ? 's' : ''} this season</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(12px)', padding: '32px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>😬</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6 }}>
            You're out this cycle. Once someone wins, everyone's back in for the next round.
          </p>
        </div>
      </div>

      <BottomNav active="stats" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
