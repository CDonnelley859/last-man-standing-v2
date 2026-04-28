import { useState, useEffect } from 'react';
import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import Card from '../components/Card';
import { savedGames } from '../utils';

const INPUT = {
  height: 50, borderRadius: 12,
  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.22)',
  display: 'flex', alignItems: 'center', paddingLeft: 16,
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
};

const LABEL = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  color: 'rgba(255,255,255,0.75)', marginBottom: 6,
};

const INPUT_TEXT = {
  background: 'transparent', border: 'none', color: 'white',
  fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 15,
  padding: 0, width: '100%', outline: 'none',
};

const CTA = {
  width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
  background: `linear-gradient(135deg, #1a1a1a, #111111)`, color: 'white',
  fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '0.12em',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.07) inset',
};

export default function HomeScreen({ onCreateGame, onJoinGame, onContinueGame, onContinueGameWithTab }) {
  const [mode, setMode] = useState('join');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [gameName, setGameName] = useState('');
  const [hostName, setHostName] = useState('');
  const [error, setError] = useState('');
  const [games, setGames] = useState([]);

  useEffect(() => {
    setGames(savedGames());
    const urlCode = new URLSearchParams(window.location.search).get('join');
    if (urlCode) { setMode('join'); setJoinCode(urlCode.toUpperCase().slice(0, 4)); }
  }, []);

  async function handleSubmit() {
    setError('');
    if (mode === 'join') {
      if (!joinCode.trim() || !joinName.trim()) { setError('Enter both a game code and your name.'); return; }
      await onJoinGame(joinCode.trim().toUpperCase(), joinName.trim(), setError);
    } else {
      if (!hostName.trim()) { setError('Enter your name to create a game.'); return; }
      await onCreateGame(hostName.trim(), gameName.trim());
    }
  }

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ ...WRAP, position: 'relative', zIndex: 1, padding: '56px 20px 0' }}>
        {/* Hero */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>LAST MAN</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: '-0.02em' }}>STANDING</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Premier League 2024/25</div>
        </div>

        {/* Saved games */}
        {games.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>YOUR GAMES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {games.map(g => (
                <Card
                  key={g.code}
                  accent={g.role === 'host' ? 'lime' : 'teal'}
                  onClick={() => onContinueGame(g.code, g.role === 'host' ? 'player' : null)}
                  style={{ padding: '13px 16px 13px 20px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.gameName || g.code}</div>
                      <div style={{ fontSize: 11, color: C.g4 }}>{g.role === 'host' ? 'Host' : g.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {g.role === 'host' && (
                        <button
                          onClick={e => { e.stopPropagation(); onContinueGame(g.code); }}
                          style={{
                            background: C.dark, color: C.white, border: 'none', cursor: 'pointer',
                            borderRadius: '8px 8px 8px 2px', padding: '5px 10px',
                            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 9,
                            letterSpacing: '0.05em', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >⚙ ADMIN</button>
                      )}
                      <div style={{ background: C.teal, color: C.white, borderRadius: '8px 8px 8px 2px', padding: '4px 9px', fontWeight: 700, fontSize: 9, letterSpacing: '0.05em', boxShadow: '0 2px 6px rgba(28,191,160,0.45)' }}>
                        {g.code}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', marginBottom: 20 }} />

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.18)', borderRadius: 13, padding: 4, backdropFilter: 'blur(8px)', marginBottom: 20 }}>
          {['join', 'create'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: mode === m ? C.white : 'transparent',
                color: mode === m ? C.dark : 'rgba(255,255,255,0.65)',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.22)' : 'none',
                transition: 'all 0.18s',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {mode === 'join' ? (
            <>
              <div>
                <div style={LABEL}>GAME CODE</div>
                <div style={INPUT}>
                  <input
                    style={{ ...INPUT_TEXT, fontSize: 18, letterSpacing: '0.1em' }}
                    placeholder="e.g. X2VI"
                    value={joinCode}
                    maxLength={4}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('join-name')?.focus()}
                  />
                </div>
              </div>
              <div>
                <div style={LABEL}>YOUR NAME</div>
                <div style={INPUT}>
                  <input
                    id="join-name"
                    style={INPUT_TEXT}
                    placeholder="Enter your name…"
                    value={joinName}
                    onChange={e => setJoinName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={LABEL}>GAME NAME</div>
                <div style={INPUT}>
                  <input
                    style={INPUT_TEXT}
                    placeholder="e.g. Office League 2025…"
                    value={gameName}
                    onChange={e => setGameName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('host-name')?.focus()}
                  />
                </div>
              </div>
              <div>
                <div style={LABEL}>YOUR NAME</div>
                <div style={INPUT}>
                  <input
                    id="host-name"
                    style={INPUT_TEXT}
                    placeholder="Enter your name…"
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>
              </div>
              <div style={{ height: 44, borderRadius: 10, background: C.greenBg, display: 'flex', alignItems: 'center', paddingLeft: 14 }}>
                <span style={{ fontSize: 11, color: C.greenText }}>Your game code will be shared after creation</span>
              </div>
            </>
          )}
        </div>

        {error && <div style={{ color: C.red, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</div>}

        {/* CTA */}
        <button onClick={handleSubmit} style={CTA}>
          {mode === 'join' ? 'JOIN GAME' : 'CREATE GAME'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 9, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          {mode === 'join' ? 'No account needed. Enter the code from your host.' : 'Share the code with friends so they can join.'}
        </div>
      </div>

      <BottomNav
        active="home"
        onNav={tab => {
          if ((tab === 'pick' || tab === 'stats') && games.length > 0) {
            // Open the most recently saved game and jump straight to the tapped tab
            onContinueGame(games[games.length - 1].code, tab);
          }
        }}
        isHost={false}
      />
    </div>
  );
}
