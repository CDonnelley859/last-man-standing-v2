import { useState } from 'react';
import { C, BG, SCREEN, WRAP } from '../tokens';
import DotBg from '../components/DotBg';
import BottomNav from '../components/BottomNav';
import SegTabs from '../components/SegTabs';
import Card from '../components/Card';
import Av from '../components/Av';
import Pill from '../components/Pill';
import { players, activePlayers, getPlayer, rounds, initials } from '../utils';
import { getTeamAbbr, getTeamColor } from '../teams';

const MEDAL = ['#e90052', '#9CA3AF', '#E5E7EB'];

function LeaderboardTab({ G, myPlayerId }) {
  const ps = players(G);
  const sortByPoints = (a, b) => (b.seasonPoints || 0) - (a.seasonPoints || 0) || a.name.localeCompare(b.name);
  const alive = ps.filter(p => p.active).sort(sortByPoints);
  const out = ps.filter(p => !p.active).sort(sortByPoints);

  // Build pick abbreviations per player (last 4 rounds)
  const doneRounds = rounds(G).filter(r => r.status === 'done').slice(-4);
  const getPickHistory = (pid) => doneRounds.map(r => {
    const pick = (r.picks || {})[pid];
    if (!pick?.team) return null;
    return { abbr: getTeamAbbr(pick.team), color: getTeamColor(pick.team), win: pick.result === 'win' };
  }).filter(Boolean);

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Survivors */}
      <div style={{ padding: '0 20px 8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.lime, borderRadius: 13, padding: '5px 12px', marginBottom: 10, boxShadow: '0 2px 8px rgba(233,0,82,0.4)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: C.dark }}>🏆 SURVIVORS</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {alive.map((p, i) => {
            const picks = getPickHistory(p.id);
            const isMe = p.id === myPlayerId;
            return (
              <Card key={p.id} accent="lime" style={{ padding: '10px 14px 10px 20px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: MEDAL[i] || C.g2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 9, color: C.dark }}>{i + 1}</div>
                <Av initials={initials(p.name)} color={C.teal} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.dark, marginBottom: 3 }}>{p.name}{isMe ? ' (you)' : ''}</div>
                  {picks.length > 0 && (
                    <div style={{ display: 'flex', gap: 3 }}>
                      {picks.map((pk, j) => (
                        <Pill key={j} label={pk.abbr} bg={pk.win ? C.lime : C.g2} color={pk.win ? C.dark : C.g4} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>{p.seasonPoints || 0}</div>
                  <div style={{ fontSize: 9, color: C.g4, marginTop: 1 }}>pts</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.teal, letterSpacing: '0.06em', marginLeft: 4 }}>ALIVE</span>
              </Card>
            );
          })}
          {alive.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '12px 0' }}>No active players.</div>}
        </div>
      </div>

      {/* Eliminated */}
      {out.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: C.g2, borderRadius: 13, padding: '5px 12px', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: C.g4 }}>✕ ELIMINATED</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {out.map(p => (
              <Card key={p.id} dim style={{ padding: '10px 14px 10px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <Av initials={initials(p.name)} size={36} dim />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.g4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.g3, marginTop: 2 }}>Out — Round {p.eliminatedRound || '?'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.g3 }}>{p.seasonPoints || 0}</div>
                  <div style={{ fontSize: 9, color: C.g3, marginTop: 1 }}>pts</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.g3, letterSpacing: '0.06em', marginLeft: 4 }}>OUT</span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeasonStatsTab({ G }) {
  const ps = players(G);
  const doneRounds = rounds(G).filter(r => r.status === 'done');
  const sortByPoints = (a, b) => (b.seasonPoints || 0) - (a.seasonPoints || 0);
  const leader = ps.sort(sortByPoints)[0];

  const mostCycleWins = ps.reduce((best, p) => (p.cycleWins || 0) > (best?.cycleWins || 0) ? p : best, null);

  // Most picked teams
  const teamCounts = {};
  doneRounds.forEach(r => {
    Object.values(r.picks || {}).forEach(p => {
      if (p.team) teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    });
  });
  const topTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount = topTeams[0]?.[1] || 1;

  const BOX = { padding: '14px 16px' };
  const LABEL = { fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.teal, marginBottom: 6 };

  return (
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 9, paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <Card style={{ ...BOX, flex: 1 }}>
          <div style={LABEL}>CURRENT LEADER</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, lineHeight: 1, marginBottom: 3 }}>{leader?.name || '—'}</div>
          <div style={{ fontSize: 10, color: C.g4 }}>{leader?.seasonPoints || 0} pts this season</div>
        </Card>
        <Card style={{ ...BOX, flex: 1 }}>
          <div style={LABEL}>MOST CYCLE WINS</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, lineHeight: 1, marginBottom: 3 }}>{mostCycleWins?.name || '—'}</div>
          <div style={{ fontSize: 10, color: C.g4 }}>{mostCycleWins?.cycleWins || 0} cycles won</div>
        </Card>
      </div>
      <div style={{ display: 'flex', gap: 9 }}>
        <Card style={{ ...BOX, flex: 1 }}>
          <div style={LABEL}>ROUNDS PLAYED</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, lineHeight: 1, marginBottom: 3 }}>{doneRounds.length}</div>
          <div style={{ fontSize: 10, color: C.g4 }}>completed rounds</div>
        </Card>
        <Card style={{ ...BOX, flex: 1 }}>
          <div style={LABEL}>PLAYERS</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, lineHeight: 1, marginBottom: 3 }}>{ps.length}</div>
          <div style={{ fontSize: 10, color: C.g4 }}>{activePlayers(G).length} still alive</div>
        </Card>
      </div>

      {topTeams.length > 0 && (
        <Card style={{ padding: '16px 16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 14 }}>Most Picked Teams</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topTeams.map(([team, count]) => (
              <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: C.dark, width: 90, flexShrink: 0 }}>{team}</span>
                <div style={{ flex: 1, height: 14, borderRadius: 4, background: C.g2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${C.lime}, ${C.limeDark})`, width: `${(count / maxCount) * 100}%`, boxShadow: '0 1px 4px rgba(255,255,255,0.2)' }} />
                </div>
                <span style={{ fontSize: 11, color: C.g4, width: 14, textAlign: 'right', flexShrink: 0 }}>{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PickHistoryTab({ G, myPlayerId }) {
  const ps = players(G);
  const doneRounds = rounds(G).filter(r => r.status === 'done');
  if (!doneRounds.length) {
    return <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 20px' }}>No completed rounds yet.</div>;
  }

  const DOT_COL = { win: '#22c55e', out: C.red, null: C.g2 };
  const TXT_COL = { win: '#16a34a', out: C.red, null: C.g3 };

  return (
    <div style={{ padding: '0 20px', paddingBottom: 8 }}>
      <Card style={{ padding: '14px 0 14px' }}>
        {/* Table header */}
        <div style={{ display: 'flex', alignItems: 'center', background: C.g1, borderRadius: 6, margin: '0 16px 10px', padding: '6px 4px' }}>
          <div style={{ width: 64, paddingLeft: 8, fontSize: 9, fontWeight: 700, color: C.g4 }}>PLAYER</div>
          {doneRounds.map(r => (
            <div key={r.id} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.g4 }}>Rd {r.id}</div>
          ))}
        </div>

        {ps.map((p, ri) => (
          <div key={p.id}>
            {ri > 0 && <div style={{ height: 1, background: C.g1, margin: '0 16px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 4px 8px 20px' }}>
              <div style={{ width: 56, fontSize: 12, fontWeight: 700, color: p.active ? C.dark : C.g4, flexShrink: 0 }}>{p.name}</div>
              {doneRounds.map(r => {
                const pk = (r.picks || {})[p.id];
                const result = pk?.result || null;
                const col = DOT_COL[result] || C.g2;
                const txt = TXT_COL[result] || C.g3;
                return (
                  <div key={r.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    {pk?.team && <span style={{ fontSize: 8, fontWeight: 700, color: txt, lineHeight: 1 }}>{getTeamAbbr(pk.team)}</span>}
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: col }} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ margin: '10px 16px 0', fontSize: 9, color: C.g3 }}>
          Green = survived · Red = eliminated
        </div>
      </Card>
    </div>
  );
}

const TABS = ['Leaderboard', 'Season Stats', 'Pick History'];

export default function StatsScreen({ G, myPlayerId, role, cachedMatchday, onLeave, onNav }) {
  const [tab, setTab] = useState('Leaderboard');

  return (
    <div style={{ ...SCREEN, position: 'relative' }}>
      <DotBg />
      <div style={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ ...WRAP, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: '56px 24px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>STANDINGS</div>
          {G?.gameName && (
            <div style={{ fontSize: 38, fontWeight: 900, color: C.white, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
              {G.gameName}
            </div>
          )}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {cachedMatchday ? `Gameweek ${cachedMatchday.matchday} · ` : ''}Season 2024/25
          </div>
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          <SegTabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === 'Leaderboard' && <LeaderboardTab G={G} myPlayerId={myPlayerId} />}
        {tab === 'Season Stats' && <SeasonStatsTab G={G} />}
        {tab === 'Pick History' && <PickHistoryTab G={G} myPlayerId={myPlayerId} />}

        {/* Leave game — players only */}
        {role !== 'host' && onLeave && (
          <div style={{ padding: '8px 20px 100px' }}>
            <button
              onClick={onLeave}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.08em', cursor: 'pointer',
              }}
            >
              LEAVE GAME
            </button>
          </div>
        )}
      </div>

      <BottomNav active="stats" onNav={onNav} isHost={role === 'host'} />
    </div>
  );
}
