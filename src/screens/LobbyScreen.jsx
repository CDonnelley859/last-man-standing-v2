import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { players } from '../utils';

export default function LobbyScreen({ G, gameCode, myPlayerId, role, onLeave, onNav }) {
  const ps = players(G);

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ ...WRAP, position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: '-0.02em' }}>LOBBY</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>{G.gameName || gameCode}</div>
        </div>

        <Card style={{ padding: '16px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 4 }}>YOU'RE IN!</div>
          <div style={{ fontSize: 13, color: C.g4, marginBottom: 12 }}>Waiting for the host to start the game.</div>
          <div style={{ height: 1, background: C.g2, marginBottom: 8 }} />
          {ps.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <div style={{ height: 1, background: C.g1 }} />}
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.dark }}>{p.name}</span>
                {p.id === myPlayerId && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.teal, letterSpacing: '0.06em' }}>YOU</span>
                )}
              </div>
            </div>
          ))}
        </Card>

        {role !== 'host' && (
          <Card style={{ padding: '12px 16px' }}>
            <button
              onClick={onLeave}
              style={{ width: '100%', height: 40, borderRadius: '10px 10px 10px 4px', border: `1.5px solid ${C.g2}`, cursor: 'pointer', background: C.white, color: C.dark, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}
            >
              LEAVE GAME
            </button>
          </Card>
        )}
      </div>

      <BottomNav active="home" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
