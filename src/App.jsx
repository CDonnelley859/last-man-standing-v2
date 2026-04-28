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
import CycleWinScreen from './screens/CycleWinScreen';

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

  const [toast, setToast] = useState(null);

  const listenerRef = useRef(null);
  const autoCloseRef = useRef(null);
  const pollingRef = useRef(null);
  const toastTimerRef = useRef(null);
  // Mutable refs to avoid stale closures in timers
  const GRef = useRef(null);
  const gameCodeRef = useRef(null);
  const cachedMatchdayRef = useRef(null);
  const cachedTeamsRef = useRef(null);

  function showToast(msg) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }

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
    const initialGameData = {
      status: 'active', gameName, winner: null, nextId: 2, cycleStartRound: 1,
      players: { p1: { id: 'p1', name, active: true, usedTeams: {}, eliminatedRound: null, cycleWins: 0, seasonPoints: 0 } },
      rounds: {},
    };
    await set(ref(db, `games/${code}`), initialGameData);
    setGameCode(code); setRole('host'); setMyPlayerId('p1'); setMyName(name); setHostView('admin');
    saveGame(code, 'host', 'p1', name, gameName);
    listenToGame(code, 'host');
    // Auto-activate the current gameweek — no manual steps needed
    await doActivateGameweek(code, initialGameData);
  }

  async function handleJoinGame(code, name, setError) {
    const alreadySaved = savedGames().find(g => g.code === code);
    if (alreadySaved) { await handleContinueGame(code); return; }
    const snap = await get(ref(db, `games/${code}`));
    if (!snap.exists()) { setError?.('Game not found — double-check the code.'); return; }
    const game = snap.val();
    if (game.status === 'complete') { setError?.('That game has already finished.'); return; }
    const taken = Object.values(game.players || {}).some(p => p.name.toLowerCase() === name.toLowerCase());
    if (taken) { setError?.('That name is already taken. Try a different one.'); return; }
    const nextId = game.nextId || 1;
    const pid = 'p' + nextId;
    const activeRound = currentRound(game);
    const updates = {};
    updates[`games/${code}/players/${pid}`] = { id: pid, name, active: true, usedTeams: {}, eliminatedRound: null, cycleWins: 0, seasonPoints: 0 };
    updates[`games/${code}/nextId`] = nextId + 1;
    // If picks are still open, add the new player to this round so they can pick
    if (activeRound?.status === 'picking') {
      updates[`games/${code}/rounds/r${activeRound.id}/picks/${pid}`] = { playerId: pid, team: null, result: null };
    }
    await update(ref(db), updates);
    setGameCode(code); setRole('player'); setMyPlayerId(pid); setMyName(name);
    saveGame(code, 'player', pid, name, game.gameName || code);
    listenToGame(code, 'player');
  }

  async function handleContinueGame(code, targetTab = null) {
    const saved = savedGames().find(g => g.code === code);
    if (!saved) return;
    const snap = await get(ref(db, `games/${code}`));
    if (!snap.exists()) { removeGame(code); return; }
    const gameData = snap.val();
    if (saved.pid && saved.role === 'player' && !(gameData.players || {})[saved.pid]) { removeGame(code); return; }
    setGameCode(code); setRole(saved.role); setMyPlayerId(saved.pid); setMyName(saved.name);
    // targetTab lets the HomeScreen nav jump straight to a specific view
    if (targetTab === 'stats') {
      setHostView('player'); setPlayerSubView('stats');
    } else if (targetTab === 'pick' || targetTab === 'player') {
      setHostView('player'); setPlayerSubView('main');
    } else {
      setHostView('admin'); setPlayerSubView('main');
    }
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

  async function doActivateGameweek(code, gameData) {
    try {
      const teams = await fetchTeams().catch(() => null);
      if (teams) { setCachedTeams(teams); cachedTeamsRef.current = teams; }
      const fixture = await fetchFixtures();
      setCachedMatchday(fixture); cachedMatchdayRef.current = fixture; setLiveDataError(null);
      const roundNum = rounds(gameData).length + 1;
      const picks = {};
      activePlayers(gameData).forEach(p => { picks[p.id] = { playerId: p.id, team: null, result: null }; });
      // Store closeTime (1 hr before first kick-off) in Firebase so all clients can display countdown
      const closeTime = fixture.firstKickoff
        ? new Date(new Date(fixture.firstKickoff).getTime() - 60 * 60 * 1000).toISOString()
        : null;
      await set(ref(db, `games/${code}/rounds/r${roundNum}`), {
        id: roundNum, status: 'picking', picks, winningTeams: {},
        matchday: fixture.matchday, firstKickoff: fixture.firstKickoff || null,
        closeTime,
      });
      scheduleAutoClose(fixture.firstKickoff, code, gameData);
      // Auto-copy a WhatsApp-ready message for players
      try {
        const url = `${location.origin}${location.pathname}?join=${code}`;
        const deadlineStr = closeTime
          ? new Date(closeTime).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : 'kick-off';
        const msg = `⚽ Last Man Standing — Gameweek ${fixture.matchday} is open!\n\nPick your team before ${deadlineStr}:\n${url}\n\nReply here when you've picked! 👍`;
        await navigator.clipboard.writeText(msg);
        showToast('📋 Player message copied — paste it into WhatsApp!');
      } catch { /* clipboard unavailable */ }
    } catch (e) {
      setLiveDataError('Could not fetch fixtures. Check your API key.');
    }
  }

  async function handleActivateGameweek() {
    await doActivateGameweek(gameCode, G);
  }

  async function handleStartRound() {
    const roundNum = rounds(G).length + 1;
    const picks = {};
    activePlayers(G).forEach(p => { picks[p.id] = { playerId: p.id, team: null, result: null }; });
    await set(ref(db, `games/${gameCode}/rounds/r${roundNum}`), { id: roundNum, status: 'picking', picks, winningTeams: {} });
  }

  async function handleLockPicks() {
    const round = currentRound(G);
    if (!round) return;
    const picks = Object.values(round.picks || {});
    const updates = {};
    const teams = getTeams();
    // Auto-assign any player who hasn't picked yet (respects their preference list)
    picks.filter(p => !p.team).forEach(pick => {
      const player = getPlayer(G, pick.playerId);
      const usedTeams = player?.usedTeams || {};
      const prefs = player?.pickPrefs || [];
      const firstFree = prefs.find(t => !usedTeams[t]) || teams.find(t => !usedTeams[t]);
      if (firstFree) {
        updates[`games/${gameCode}/rounds/r${round.id}/picks/${pick.playerId}/team`] = firstFree;
        updates[`games/${gameCode}/rounds/r${round.id}/picks/${pick.playerId}/autoPicked`] = true;
      }
    });
    picks.forEach(pick => {
      const team = updates[`games/${gameCode}/rounds/r${round.id}/picks/${pick.playerId}/team`] || pick.team;
      if (team) updates[`games/${gameCode}/players/${pick.playerId}/usedTeams/${team}`] = true;
    });
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

  async function handleUpdatePickPrefs(prefs) {
    if (!myPlayerId || !gameCode) return;
    await set(ref(db, `games/${gameCode}/players/${myPlayerId}/pickPrefs`), prefs.length ? prefs : null);
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
      const prefs = player?.pickPrefs || [];
      // Honour the player's ranked preference list; fall back to alphabetical
      const firstFree = prefs.find(t => !usedTeams[t]) || teams.find(t => !usedTeams[t]);
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

  // Toast overlay — fixed on top of whatever screen is showing
  const Toast = toast ? (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: '#111', color: '#fff',
      padding: '11px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700,
      boxShadow: '0 4px 24px rgba(0,0,0,0.55)', whiteSpace: 'nowrap',
      fontFamily: 'Inter, sans-serif', pointerEvents: 'none',
    }}>{toast}</div>
  ) : null;

  if (!gameCode || !G) {
    return <><HomeScreen onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} onContinueGame={(code, tab) => handleContinueGame(code, tab)} />{Toast}</>;
  }

  const round = currentRound(G);
  const myPlayer = getPlayer(G, myPlayerId);
  const commonProps = { G, gameCode, myPlayerId, role, round, onNav: handleNav };

  if (G.status === 'complete') {
    return <><CompleteScreen {...commonProps} onReset={handleReset} onLeave={handleLeave} />{Toast}</>;
  }

  if (G.status === 'setup') {
    if (role === 'host') {
      return <><SetupScreen {...commonProps} onStartGame={handleStartGame} onRemovePlayer={handleRemovePlayer} onCopyLink={handleCopyLink} onReset={handleReset} />{Toast}</>;
    }
    return <><LobbyScreen {...commonProps} onLeave={handleLeave} />{Toast}</>;
  }

  if (role === 'host' && hostView === 'admin') {
    return (
      <>
        <AdminScreen {...commonProps}
          cachedMatchday={cachedMatchday} liveDataError={liveDataError} lastResultsCheck={lastResultsCheck}
          onActivateGameweek={handleActivateGameweek} onStartRound={handleStartRound}
          onLockPicks={handleLockPicks} onSubmitResults={handleSubmitResults}
          onEliminate={handleEliminate} onReinstate={handleReinstate}
          onReset={handleReset} onCopyLink={handleCopyLink} onReminder={handleReminder}
          onRefreshResults={handleRefreshResults}
          onSwitchToPlayer={() => { setHostView('player'); setPlayerSubView('main'); }}
        />
        {Toast}
      </>
    );
  }

  if (playerSubView === 'stats') {
    return <><StatsScreen {...commonProps} cachedMatchday={cachedMatchday} />{Toast}</>;
  }

  if (!myPlayer?.active) {
    return <><EliminatedScreen {...commonProps} />{Toast}</>;
  }

  if (!round) {
    return <><WaitingScreen {...commonProps} message="Waiting for the host to start the next round…" />{Toast}</>;
  }

  if (round.status === 'picking') {
    return (
      <>
        <PickScreen
          {...commonProps}
          cachedMatchday={cachedMatchday}
          teams={getTeams()}
          pickPrefs={myPlayer?.pickPrefs || []}
          onPick={handlePlayerPick}
          onUpdatePickPrefs={handleUpdatePickPrefs}
        />
        {Toast}
      </>
    );
  }

  if (round.status === 'results') {
    return <><WaitingScreen {...commonProps} message="Results are being processed. Hang tight…" />{Toast}</>;
  }

  if (round.status === 'done') {
    if (round.cycleWinner === myPlayerId) {
      return <><CycleWinScreen {...commonProps} />{Toast}</>;
    }
    return <><RoundDoneScreen {...commonProps} />{Toast}</>;
  }

  return <><WaitingScreen {...commonProps} message="Waiting…" />{Toast}</>;
}
