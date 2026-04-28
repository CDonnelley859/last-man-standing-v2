import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { getPlayer, players } from '../utils';

export default function RoundDoneScreen({ G, gameCode, myPlayerId, role, round, onNav }) {
  const myPick = (round?.picks || {})[myPlayerId];
  const survived = myPick?.result === 'win';
  const cycleWinner = round?.cycleWinner ? getPlayer(G, round.cycleWinner) : null;
  const cycleReset = cycleWinner || round?.cycleNoWinner;
  const iWon = round?.cycleWinner === myPlayerId;
  const myPlayer = getPlayer(G, myPlayerId);
  const pts = myPlayer?.seasonPoints || 0;

  const allPicks = Object.values(round?.picks || {});
  const winners = allPicks.filter(p => p.result === 'win');
  const losers = allPicks.filter(p => p.result === 'out');

  function copyResult() {
    const lines = [`⚽ Last Man Standing — Round ${round.id} results\n`];
    winners.forEach(p => lines.push(`✅ ${getPlayer(G, p.playerId)?.name} — ${p.team} won`));
    losers.forEach(p => lines.push(`❌ ${getPlayer(G, p.playerId)?.name} — ${p.team}`));
    if (cycleWinner) lines.push(`\n🏆 ${cycleWinner.name} wins this cycle!`);
    navigator.clipboard.writeText(lines.join('\n'));
  }

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ ...WRAP, position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>

        {/* Status banner */}
        <div style={{
          borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
          background: survived ? 'rgba(209,250,229,0.15)' : 'rgba(254,226,226,0.15)',
          border: `1px solid ${survived ? 'rgba(209,250,229,0.4)' : 'rgba(254,226,226,0.4)'}`,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 26, flexShrink: 0 }}>{survived ? '✅' : '❌'}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{survived ? 'You survived!' : 'Out this round'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{pts} pt{pts !== 1 ? 's' : ''} this season</div>
          </div>
        </div>

        {/* Cycle winner banner */}
        {cycleReset && (
          <Card style={{ padding: '16px', marginBottom: 12, background: iWon ? C.lime : C.white }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 4 }}>
              {iWon ? '🏆 You won this cycle!' : cycleWinner ? `🏆 ${cycleWinner.name} wins this cycle!` : '🤝 No winner this cycle'}
            </div>
            <div style={{ fontSize: 12, color: C.g4 }}>
              {iWon || cycleWinner ? 'Everyone resets — new cycle starts next round.' : 'Everyone went out — all reset for the next round.'}
            </div>
          </Card>
        )}

        {/* Round results */}
        <Card style={{ padding: '16px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 10 }}>ROUND {round?.id} RESULTS</div>
          {allPicks.map((p, i) => {
            const pl = getPlayer(G, p.playerId);
            const isMe = p.playerId === myPlayerId;
            return (
              <div key={p.playerId}>
                {i > 0 && <div style={{ height: 1, background: C.g1 }} />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isMe ? 700 : 500, color: C.dark }}>
                    {pl?.name}{isMe ? ' (you)' : ''}
                  </span>
                  <span style={{ fontSize: 13, color: C.g4 }}>{p.team || '—'}</span>
                  {p.result === 'win' && <span style={{ fontSize: 9, fontWeight: 700, color: C.teal }}>✓ WON</span>}
                  {p.result === 'out' && <span style={{ fontSize: 9, fontWeight: 700, color: C.red }}>✕ OUT</span>}
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={copyResult}
              style={{ width: '100%', height: 40, borderRadius: '10px 10px 10px 4px', border: `1px solid ${C.g2}`, cursor: 'pointer', background: C.g1, color: C.dark, fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12 }}
            >
              📋 Copy result to share
            </button>
          </div>
        </Card>
      </div>

      <BottomNav active="stats" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
