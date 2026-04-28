import { C, BG, SCREEN } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { getPlayer, players, rounds } from '../utils';

export default function CompleteScreen({ G, myPlayerId, role, onReset, onLeave, onNav }) {
  const winner = G.winner ? getPlayer(G, G.winner) : null;
  const isHost = role === 'host';
  const doneRounds = rounds(G).filter(r => r.status === 'done');

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

        {winner ? (
          <div style={{
            background: `linear-gradient(135deg, ${C.dark}, #7c3aed)`,
            borderRadius: 16, padding: '36px 24px', textAlign: 'center', marginBottom: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🏆</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Last Man Standing</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: C.white }}>{winner.name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>Survived all {doneRounds.length} rounds</div>
          </div>
        ) : (
          <Card style={{ padding: '24px 20px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 8 }}>🤝 No winner</div>
            <div style={{ fontSize: 13, color: C.g4, lineHeight: 1.6 }}>Everyone went out in Round {doneRounds.length}. No last man standing this time.</div>
          </Card>
        )}

        <Card style={{ padding: '16px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>FINAL STANDINGS</div>
          {players(G).sort((a, b) => (b.seasonPoints || 0) - (a.seasonPoints || 0)).map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? `1px solid ${C.g1}` : 'none' }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.dark }}>{i + 1}. {p.name}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>{p.seasonPoints || 0} pts</span>
            </div>
          ))}
        </Card>

        <div style={{ height: 12 }} />

        <Card style={{ padding: '12px 16px' }}>
          <button
            onClick={isHost ? onReset : onLeave}
            style={{ width: '100%', height: 44, borderRadius: '12px 12px 12px 4px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.teal}, ${C.tealMid})`, color: C.white, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', boxShadow: '0 3px 12px rgba(28,191,160,0.35)' }}
          >
            {isHost ? 'START A NEW GAME' : 'LEAVE GAME'}
          </button>
        </Card>
      </div>

      <BottomNav active="stats" onNav={onNav} isHost={isHost} />
    </div>
  );
}
