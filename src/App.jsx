import { useState, useEffect, useRef } from 'react';
import { ref, set, get, update, remove, onValue, off } from 'firebase/database';
import { db } from './firebase';
import {
  genCode, savedGames, saveGame, removeGame, migrateLegacyLocalStorage,
  players, activePlayers, getPlayer, rounds, currentRound,
} from './utils';
import { fetchTeams, fetchFixtures, fetchMatchdayMatches } from './footballApi';
import { FALLBACK_TEAMS } from './teams';

import HomeScreen from './screens/HomeScreen';
import SetupScreen from './screens/SetupScreen';
import LobbyScreen from './screens/LobbyScreen';
import PickScreen from './screens/PickScreen';
import StatsScreen from './screens/StatsScreen';
import AdminScreen from './screens/AdminScreen';
import WaitingScreen from './screens/WaitingScreen';
import EliminatedScreen from './screens/EliminatedScreen';
import RoundDoneScreen from './screens/RoundDoneScreen';
import CompleteScreen from './screens/CompleteScreen';

export default function App() {
  const [gameCode, setGameCode] = useState(null);
  const [role, setRole] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myName, setMyName] = useState(null);
  const [G, setG] = useState(null);

  const [playerSubView, setPlayerSubView] = useState('main');
  const [hostView, setHostView] = useState('admin');

  const [cachedTeams, setCachedTeams] = useState(null);
  const [cachedMatchday, setCachedMatchday] = useState(null);
  const [liveDataError, setLiveDataError] = useState(null);
  const [lastResultsCheck, setLastResultsCheck] = useState(null);

  const listenerRef = useRef(null);
  const autoCloseRef = useRef(null);
  const pollingRef = useRef(null);
  // Mutable refs to avoid stale closures in timers
  const GRef = useRef(null);
  const gameCodeRef = useRef(null);
  const cachedMatchdayRef = useRef(null);
  const cachedTeamsRef = useRef(null);

  useEffect(() => { migrateLegacyLocalStorage(); }, []);

  // Keep refs in sync with state
  useEffect(() => { GRef.current = G; }, [G]);
  useEffect(() => { gameCodeRef.current = gameCode; }, [gameCode]);
  useEffect(() => { cachedMatchdayRef.current = cachedMatchday; }, [cachedMatchday]);
  useEffect(() => { cachedTeamsRef.current = cachedTeams; }, [cachedTeams]);

  function getTeams() { return cachedTeamsRef.current || FALLBACK_TEAMS; }

  // ── Firebase listener ────────────────────────────────────────────────────────

  function listenToGame(code, rle) {
    if (listenerRef.current) {
      off(ref(db, `games/${listenerRef.current}`));
    }
    const gameRef = ref(db, `games/${code}`);
    onValue(gameRef, snap => {
      const data = snap.val();
      if (!data) { returnToHome(); return; }
      setG(data);
      GRef.current = data;
      const round = currentRound(data);

      // Re-fetch fixture data if we're in a picking round but lost cachedMatchday (e.g. page refresh)
      if (round?.status === 'picking' && round.matchday && !cachedMatchdayRef.current) {
        fetchMatchdayMatches(round.matchday).then(matches => {
          const fixture = { matchday: round.matchday, matches, firstKickoff: round.firstKickoff || null };
          setCachedMatchday(fixture);
          cachedMatchdayRef.current = fixture;
        }).catch(() => {});
      }
      // Fetch team list if not already cached
      if (!cachedTeamsRef.current) {
        fetchTeams().then(t => { setCachedTeams(t); cachedTeamsRef.current = t; }).catch(() => {});
      }

      if (rle === 'host') {
        if (round?.status === 'picking' && round.firstKickoff && !autoCloseRef.current) {
          scheduleAutoClose(round.firstKickoff, code, data);
        }
        if (round?.status === 'results' && !pollingRef.current) {
          startResultsPolling(code, data);
        }
      }
    });
    listenerRef.current = code;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function returnToHome() {
    if (listenerRef.current) { off(ref(db, `games/${listenerRef.current}`)); listenerRef.current = null; }
    if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null; }
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    setGameCode(null); setRole(null); setMyPlayerId(null); setMyName(null); setG(null);
    setPlayerSubView('main'); setHostView('admin');
    setCachedMatchday(null); setLiveDataError(null); setLastResultsCheck(null);
  }

  function handleNav(tab) {
    if (tab === 'home') { returnToHome(); return; }
    if (tab === 'admin') { setHostView('admin'); setPlayerSubView('main'); return; }
    if (tab === 'stats') { setPlayerSubView('stats'); if (role !== 'host') setHostView('player'); return; }
    if (tab === 'pick') { setPlayerSubView('main'); setHostView('player'); return; }
  }

  // ── Game creation / joining ──────────────────────────────────────────────────

  async function handleCreateGame(name, gname) {
    let code;
    for (let i = 0; i < 10; i++) {
      code = genCode();
      const snap = await get(ref(db, `games/${code}`));
      if (!snap.exists()) break;
    }
    const gameName = gname || 'Last Man Standing';
    await set(ref(db, `games/${code}`), {
      status: 'setup', gameName, winner: null, nextId: 2, cycleStartRound: 1,
      players: { p1: { id: 'p1', name, active: true, usedTeams: {}, eliminatedRound: null, cycleWins: 0, seasonPoints: 0 } },
      rounds: {},
    });
    setGameCode(code); setRole('host'); setMyPlayerId('p1'); setMyName(name); setHostView('admin');
    saveGame(code, 'host', 'p1', name, gameName);
    listenToGame(code, 'host');
  }

  async function handleJoinGame(code, name, setError) {
    const alreadySaved = savedGames().find(g => g.code === code);
    if (alreadySaved) { await handleContinueGame(code); return; }
    const snap = await get(ref(db, `games/${code}`));
    if (!snap.exists()) { setError?.('Game not found — double-check the code.'); return; }
    const game = snap.val();
    if (game.status !== 'setup') { setError?.('That game has already started — ask the host for a new game.'); return; }
    const taken = Object.values(game.players || {}).some(p => p.name.toLowerCase() === name.toLowerCase());
    if (taken) { setError?.('That name is already taken. Try a different one.'); return; }
    const nextId = game.nextId || 1;
    const pid = 'p' + nextId;
    await set(ref(db, `games/${code}/players/${pid}`), { id: pid, name, active: true, usedTeams: {}, eliminatedRound: null, cycleWins: 0, seasonPoints: 0 });
    await set(ref(db, `games/${code}/nextId`), nextId + 1);
    setGameCode(code); setRole('player'); setMyPlayerId(pid); setMyName(name);
    saveGame(code, 'player', pid, name, game.gameName || code);
    listenToGame(code, 'player');
  }

  async function handleContinueGame(code) {
    const saved = savedGames().find(g => g.code === code);
    if (!saved) return;
    const snap = await get(ref(db, `games/${code}`));
    if (!snap.exists()) { removeGame(code); return; }
    const gameData = snap.val();
    if (saved.pid && saved.role === 'player' && !(gameData.players || {})[saved.pid]) { removeGame(code); return; }
    setGameCode(code); setRole(saved.role); setMyPlayerId(saved.pid); setMyName(saved.name);
    setHostView('admin'); setPlayerSubView('main');
    listenToGame(code, saved.role);
  }

  // ── Host actions ─────────────────────────────────────────────────────────────

  async function handleStartGame() {
    await set(ref(db, `games/${gameCode}/status`), 'active');
  }

  async function handleRemovePlayer(pid) {
    if (!confirm('Remove this player?')) return;
    await remove(ref(db, `games/${gameCode}/players/${pid}`));
  }

  async function handleActivateGameweek() {
    try {
      const teams = await fetchTeams().catch(() => null);
      if (teams) setCachedTeams(teams);
      const fixture = await fetchFixtures();
      setCachedMatchday(fixture); cachedMatchdayRef.current = fixture; setLiveDataError(null);
      const roundNum = rounds(G).length + 1;
      const picks = {};
      activePlayers(G).forEach(p => { picks[p.id] = { playerId: p.id, team: null, result: null }; });
      await set(ref(db, `games/${gameCode}/rounds/r${roundNum}`), {
        id: roundNum, status: 'picking', picks, winningTeams: {},
        matchday: fixture.matchday, firstKickoff: fixture.firstKickoff || null,
      });
      scheduleAutoClose(fixture.firstKickoff, gameCode, G);
    } catch (e) {
      setLiveDataError('Could not fetch fixtures. Check your API key.');
    }
  }

  async function handleStartRound() {
    const roundNum = rounds(G).length + 1;
    const picks = {};
    activePlayers(G).forEach(p => { picks[p.id] = { playerId: p.id, team: null, result: null }; });
    await set(ref(db, `games/${gameCode}/rounds/r${roundNum}`), { id: roundNum, status: 'picking', picks, winningTeams: {} });
  }

  async function handleLockPicks() {
    const round = currentRound(G);
    const picks = Object.values(round.picks || {});
    if (!picks.every(p => p.team)) { alert('Not everyone has picked yet — wait for all picks before locking.'); return; }
    const updates = {};
    picks.forEach(pick => { updates[`games/${gameCode}/players/${pick.playerId}/usedTeams/${pick.team}`] = true; });
    updates[`games/${gameCode}/rounds/r${round.id}/status`] = 'results';
    await update(ref(db), updates);
    startResultsPolling(gameCode, G);
  }

  async function handleSubmitResults(winnerTeams) {
    const round = currentRound(G);
    if (!round) return;
    const picks = Object.values(round.picks || {});
    const winSet = new Set(winnerTeams);
    await applyResults(round, picks, winSet, gameCode, G);
  }

  async function applyResults(round, picks, winSet, code, gameData) {
    const updates = {};
    const cycleStart = gameData.cycleStartRound || 1;
    const pointsThisRound = round.id - cycleStart + 1;
    picks.forEach(pick => {
      const result = winSet.has(pick.team) ? 'win' : 'out';
      updates[`games/${code}/rounds/r${round.id}/picks/${pick.playerId}/result`] = result;
      if (result === 'out') {
        updates[`games/${code}/players/${pick.playerId}/active`] = false;
        updates[`games/${code}/players/${pick.playerId}/eliminatedRound`] = round.id;
        updates[`games/${code}/players/${pick.playerId}/seasonPoints`] = (getPlayer(gameData, pick.playerId)?.seasonPoints || 0) + pointsThisRound;
      }
    });
    [...winSet].forEach(t => { updates[`games/${code}/rounds/r${round.id}/winningTeams/${t.replace(/\s+/g,'_')}`] = true; });
    updates[`games/${code}/rounds/r${round.id}/status`] = 'done';
    const survivors = players(gameData).filter(p => {
      if (!p.active) return false;
      const pick = picks.find(pk => pk.playerId === p.id);
      return pick && winSet.has(pick.team);
    });
    if (survivors.length === 1) {
      const winner = survivors[0];
      updates[`games/${code}/rounds/r${round.id}/cycleWinner`] = winner.id;
      updates[`games/${code}/players/${winner.id}/cycleWins`] = (winner.cycleWins || 0) + 1;
      updates[`games/${code}/players/${winner.id}/seasonPoints`] = (winner.seasonPoints || 0) + pointsThisRound + 1;
      updates[`games/${code}/cycleStartRound`] = round.id + 1;
      players(gameData).forEach(p => {
        updates[`games/${code}/players/${p.id}/active`] = true;
        updates[`games/${code}/players/${p.id}/eliminatedRound`] = null;
        updates[`games/${code}/players/${p.id}/usedTeams`] = {};
      });
    } else if (survivors.length === 0) {
      updates[`games/${code}/rounds/r${round.id}/cycleNoWinner`] = true;
      updates[`games/${code}/cycleStartRound`] = round.id + 1;
      players(gameData).forEach(p => {
        updates[`games/${code}/players/${p.id}/active`] = true;
        updates[`games/${code}/players/${p.id}/eliminatedRound`] = null;
        updates[`games/${code}/players/${p.id}/usedTeams`] = {};
      });
    }
    await update(ref(db), updates);
  }

  // ── Player actions ───────────────────────────────────────────────────────────

  async function handlePlayerPick(team) {
    const round = currentRound(G);
    if (!round || round.status !== 'picking' || !team) return;
    await set(ref(db, `games/${gameCode}/rounds/r${round.id}/picks/${myPlayerId}/team`), team);
  }

  async function handleEliminate(pid) {
    const p = getPlayer(G, pid);
    if (!confirm(`Manually eliminate ${p?.name}? You can reinstate them later.`)) return;
    const round = currentRound(G);
    await update(ref(db), {
      [`games/${gameCode}/players/${pid}/active`]: false,
      [`games/${gameCode}/players/${pid}/eliminatedRound`]: round?.id || 0,
    });
  }

  async function handleReinstate(pid) {
    const p = getPlayer(G, pid);
    if (!confirm(`Reinstate ${p?.name}? They'll be marked active again.`)) return;
    await update(ref(db), {
      [`games/${gameCode}/players/${pid}/active`]: true,
      [`games/${gameCode}/players/${pid}/eliminatedRound`]: null,
    });
  }

  async function handleReset() {
    if (!confirm('Delete this game and start fresh? Everything will be gone.')) return;
    const code = gameCode;
    returnToHome();
    removeGame(code);
    await remove(ref(db, `games/${code}`));
  }

  async function handleLeave() {
    if (!confirm("Leave this game? You'll be removed permanently.")) return;
    const code = gameCode;
    const pid = myPlayerId;
    returnToHome();
    removeGame(code);
    if (pid) await remove(ref(db, `games/${code}/players/${pid}`));
  }

  function handleCopyLink() {
    const url = `${location.origin}${location.pathname}?join=${gameCode}`;
    navigator.clipboard.writeText(url).then(() => alert('Link copied! Share it with your players.'));
  }

  function handleReminder() {
    const round = currentRound(G);
    const url = `${location.origin}${location.pathname}?join=${gameCode}`;
    const msg = `⚽ Last Man Standing — Round ${round?.id || '?'} is open and you haven't picked yet!\n\nPick your team here: ${url}`;
    navigator.clipboard.writeText(msg).then(() => alert('Reminder message copied! Paste it into WhatsApp or text.'));
  }

  // ── Auto-close & results polling ─────────────────────────────────────────────

  function scheduleAutoClose(firstKickoff, code, gameData) {
    if (!firstKickoff) return;
    if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null; }
    const closeAt = new Date(firstKickoff).getTime() - 60 * 60 * 1000;
    const delay = closeAt - Date.now();
    if (delay <= 0) { autoClosePicks(code, GRef.current || gameData); return; }
    autoCloseRef.current = setTimeout(() => autoClosePicks(code, GRef.current || gameData), delay);
  }

  async function autoClosePicks(code, gameData) {
    autoCloseRef.current = null;
    const round = currentRound(gameData);
    if (!round || round.status !== 'picking') return;
    const picks = Object.values(round.picks || {});
    const updates = {};
    const teams = getTeams();
    picks.filter(p => !p.team).forEach(pick => {
      const player = getPlayer(gameData, pick.playerId);
      const usedTeams = player?.usedTeams || {};
      const firstFree = teams.find(t => !usedTeams[t]);
      if (firstFree) {
        updates[`games/${code}/rounds/r${round.id}/picks/${pick.playerId}/team`] = firstFree;
        updates[`games/${code}/rounds/r${round.id}/picks/${pick.playerId}/autoPicked`] = true;
        updates[`games/${code}/players/${pick.playerId}/usedTeams/${firstFree}`] = true;
      }
    });
    picks.filter(p => p.team).forEach(pick => {
      updates[`games/${code}/players/${pick.playerId}/usedTeams/${pick.team}`] = true;
    });
    updates[`games/${code}/rounds/r${round.id}/status`] = 'results';
    await update(ref(db), updates);
  }

  function startResultsPolling(code, gameData) {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    const check = async () => {
      const current = GRef.current || gameData;
      const round = currentRound(current);
      if (!round || round.status !== 'results') { clearInterval(pollingRef.current); pollingRef.current = null; return; }
      setLastResultsCheck(new Date());
      try {
        const md = cachedMatchdayRef.current;
        if (!md?.matchday) return;
        const matches = await fetchMatchdayMatches(md.matchday);
        setCachedMatchday(prev => prev ? { ...prev, matches } : prev);
        const DONE = ['FINISHED', 'CANCELLED', 'POSTPONED', 'AWARDED', 'SUSPENDED'];
        if (matches.length > 0 && matches.every(m => DONE.includes(m.status))) {
          clearInterval(pollingRef.current); pollingRef.current = null;
          const winSet = new Set();
          matches.filter(m => m.status === 'FINISHED').forEach(m => {
            const h = m.score?.fullTime?.home ?? 0;
            const a = m.score?.fullTime?.away ?? 0;
            if (h > a) winSet.add(m.homeTeam.shortName || m.homeTeam.name);
            else if (a > h) winSet.add(m.awayTeam.shortName || m.awayTeam.name);
          });
          const snap = await get(ref(db, `games/${code}`));
          if (snap.exists()) {
            const freshData = snap.val();
            const freshRound = currentRound(freshData);
            if (freshRound?.status === 'results') {
              await applyResults(freshRound, Object.values(freshRound.picks || {}), winSet, code, freshData);
            }
          }
        }
      } catch { setLiveDataError('Could not fetch results.'); }
    };
    check();
    pollingRef.current = setInterval(check, 5 * 60 * 1000);
  }

  async function handleRefreshResults() {
    setLiveDataError(null);
    const md = cachedMatchday;
    if (!md?.matchday) return;
    try {
      const matches = await fetchMatchdayMatches(md.matchday);
      setCachedMatchday(prev => prev ? { ...prev, matches } : prev);
      setLastResultsCheck(new Date());
    } catch { setLiveDataError('Could not fetch results.'); }
  }

  // ── Routing ──────────────────────────────────────────────────────────────────

  if (!gameCode || !G) {
    return <HomeScreen onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} onContinueGame={handleContinueGame} />;
  }

  const round = currentRound(G);
  const myPlayer = getPlayer(G, myPlayerId);
  const commonProps = { G, gameCode, myPlayerId, role, round, onNav: handleNav };

  if (G.status === 'complete') {
    return <CompleteScreen {...commonProps} onReset={handleReset} onLeave={handleLeave} />;
  }

  if (G.status === 'setup') {
    if (role === 'host') {
      return <SetupScreen {...commonProps} onStartGame={handleStartGame} onRemovePlayer={handleRemovePlayer} onCopyLink={handleCopyLink} onReset={handleReset} />;
    }
    return <LobbyScreen {...commonProps} onLeave={handleLeave} />;
  }

  if (role === 'host' && hostView === 'admin') {
    return (
      <AdminScreen {...commonProps}
        cachedMatchday={cachedMatchday} liveDataError={liveDataError} lastResultsCheck={lastResultsCheck}
        onActivateGameweek={handleActivateGameweek} onStartRound={handleStartRound}
        onLockPicks={handleLockPicks} onSubmitResults={handleSubmitResults}
        onEliminate={handleEliminate} onReinstate={handleReinstate}
        onReset={handleReset} onCopyLink={handleCopyLink} onReminder={handleReminder}
        onRefreshResults={handleRefreshResults}
        onSwitchToPlayer={() => { setHostView('player'); setPlayerSubView('main'); }}
      />
    );
  }

  if (playerSubView === 'stats') {
    return <StatsScreen {...commonProps} cachedMatchday={cachedMatchday} />;
  }

  if (!myPlayer?.active) {
    return <EliminatedScreen {...commonProps} />;
  }

  if (!round) {
    return <WaitingScreen {...commonProps} message="Waiting for the host to start the next round…" />;
  }

  if (round.status === 'picking') {
    return <PickScreen {...commonProps} cachedMatchday={cachedMatchday} teams={getTeams()} onPick={handlePlayerPick} />;
  }

  if (round.status === 'results') {
    return <WaitingScreen {...commonProps} message="Results are being processed. Hang tight…" />;
  }

  if (round.status === 'done') {
    return <RoundDoneScreen {...commonProps} />;
  }

  return <WaitingScreen {...commonProps} message="Waiting…" />;
}
