import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { players } from '../utils';

export default function SetupScreen({ G, gameCode, myPlayerId, onStartGame, onRemovePlayer, onCopyLink, onReset, onNav }) {
  const ps = players(G);

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ ...WRAP, position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

        {/* Hero */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: '-0.02em' }}>GAME SETUP</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>{G.gameName || gameCode}</div>
        </div>

        {/* Code card */}
        <Card style={{ padding: '20px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>SHARE THIS CODE</div>
          <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: 10, color: C.dark, textAlign: 'center', paddingBottom: 8 }}>{gameCode}</div>
          <button
            onClick={onCopyLink}
            style={{
              width: '100%', height: 44, borderRadius: '12px 12px 12px 4px', border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.teal}, ${C.tealMid})`, color: C.white,
              fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
              boxShadow: '0 3px 12px rgba(233,0,82,0.35)',
            }}
          >
            COPY JOIN LINK
          </button>
        </Card>

        {/* Players card */}
        <Card style={{ padding: '16px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 4 }}>PLAYERS JOINED ({ps.length})</div>
          <div style={{ height: 1, background: C.g2, marginBottom: 8 }} />
          {ps.length === 0 && (
            <div style={{ fontSize: 13, color: C.g4, textAlign: 'center', padding: '12px 0' }}>No players yet — share the code above.</div>
          )}
          {ps.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <div style={{ height: 1, background: C.g1 }} />}
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.dark }}>{p.name}</span>
                {p.id === myPlayerId && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.teal, letterSpacing: '0.06em', marginRight: 8 }}>YOU</span>
                )}
                {p.id !== myPlayerId && (
                  <button
                    onClick={() => onRemovePlayer(p.id)}
                    style={{ background: C.redBg, color: C.redText, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 9, padding: '4px 10px', borderRadius: '6px 6px 6px 2px' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {ps.length > 0 && (
            <>
              <div style={{ height: 1, background: C.g2, margin: '8px 0' }} />
              <button
                onClick={onStartGame}
                style={{
                  width: '100%', height: 44, borderRadius: '12px 12px 12px 4px', border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${C.dark}, ${C.dark2})`, color: C.white,
                  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
                }}
              >
                START GAME WITH {ps.length} PLAYER{ps.length !== 1 ? 'S' : ''} →
              </button>
            </>
          )}
        </Card>

        {/* Reset */}
        <Card style={{ padding: '12px 16px' }}>
          <button
            onClick={onReset}
            style={{ width: '100%', height: 40, borderRadius: '10px 10px 10px 4px', border: `1.5px solid ${C.g2}`, cursor: 'pointer', background: C.white, color: C.dark, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}
          >
            CANCEL &amp; DELETE GAME
          </button>
        </Card>
      </div>

      <BottomNav active="admin" onNav={onNav} isHost={true} />
    </div>
  );
}
