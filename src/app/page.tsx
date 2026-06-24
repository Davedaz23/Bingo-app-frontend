'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { authAPI, gameAPI } from '@/services/api';
import { GameScreen } from '@/components/game/GameScreen';
import { WaitingView } from '@/components/game/WaitingView';
import { PlayersScreen } from '@/components/game/PlayersScreen';
import { WinnerModal } from '@/components/game/WinnerModal';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ReconnectBanner } from '@/components/ui/ReconnectBanner';

type Screen = 'game' | 'cards' | 'players';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, login: contextLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('game');
  const [syncDone, setSyncDone] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Zustand stores
  const setGameUser = useAuthStore(s => s.setUser);
  const setGameTokens = useAuthStore(s => s.setTokens);
  const setGameCards = useGameStore(s => s.setCards);
  const gameUser = useAuthStore(s => s.user);
  const gameConnected = useGameStore(s => s.connected);
  const gameStatus = useGameStore(s => s.gameStatus);
  const winner = useGameStore(s => s.winner);
  const prizePool = useGameStore(s => s.prizePool);
  const playerCount = useGameStore(s => s.playerCount);

  const ws = useWebSocket();

  // Auto-navigate to game screen when game starts
  useEffect(() => {
    if (gameStatus === 'live' || gameStatus === 'ended') {
      setScreen('game');
    }
  }, [gameStatus]);

  // Telegram auth or dev login
  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) {
      if (process.env.NODE_ENV === 'development') setError('DEV_MODE');
      else setError('Open this app from Telegram');
      return;
    }
    authAPI.telegramAuth(initData)
      .then(res => contextLogin(res.data.user, res.data.tokens))
      .catch(err => setError(err?.response?.data?.message || 'Authentication failed'));
  }, []);

  // Sync AuthContext -> Zustand authStore for WebSocket + game components
  useEffect(() => {
    if (user && isAuthenticated) {
      const access = localStorage.getItem('access_token');
      const refresh = localStorage.getItem('refresh_token');
      if (access) {
        setGameTokens(access, refresh || '');
      }
      setGameUser(user as any);
      setSyncDone(true);
    }
  }, [user, isAuthenticated]);

  // Load cards after auth sync
  useEffect(() => {
    if (!syncDone) return;
    gameAPI.getCards(1).then(r => {
      const cards = [...r.data.cards];
      Promise.all([gameAPI.getCards(2), gameAPI.getCards(3), gameAPI.getCards(4)])
        .then(([r2, r3, r4]) => {
          setGameCards([...cards, ...r2.data.cards, ...r3.data.cards, ...r4.data.cards]);
        })
        .catch(() => setGameCards(cards));
    }).catch(() => {});
  }, [syncDone]);

  // Wait for auth and game user sync
  useEffect(() => {
    if (!isLoading && syncDone && gameUser) {
      setInitLoading(false);
    }
  }, [isLoading, syncDone, gameUser]);

  // ── Render ──
  if (isLoading) return <LoadingScreen />;
  if (error === 'DEV_MODE') return <DevLogin onLogin={(u, t) => { contextLogin(u, t); setError(null); }} />;
  if (error) return <ErrorView error={error} />;
  if (!user && !isAuthenticated) return <LoadingScreen />;
  if (initLoading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-bingo-bg overflow-hidden">
      {/* Reconnect Banner */}
      {!gameConnected && <ReconnectBanner />}

      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {screen === 'game' && gameStatus !== 'waiting' ? (
          <GameScreen onSelectCard={() => setScreen('cards')} ws={ws} />
        ) : screen === 'game' || screen === 'cards' ? (
          <WaitingView />
        ) : null}
        {screen === 'players' && <PlayersScreen />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav current={screen} onChange={setScreen} isAdmin={user?.role === 'admin'} />

      {/* Winner Modal */}
      {winner && <WinnerModal winner={winner} />}
    </div>
  );
}

// ── TopBar ──────────────────────────────────────────────────────────────────
function TopBar() {
  const { user } = useAuth();
  const { connected, onlinePlayers, prizePool, gameStatus } = useGameStore();

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-2 flex-shrink-0">
      <span className="text-base font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent shrink-0">🎱 BINGO</span>
      <div className="flex-1 flex items-center gap-1.5 overflow-hidden min-w-0">
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 shrink-0">
          <span className="text-yellow-400 text-[10px] font-bold">ብር</span>
          <span className="text-yellow-300 text-[11px] font-black">{user?.balance?.toFixed(0) ?? '0'}</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_4px_#4ade80]' : 'bg-slate-500'}`} />
          <span className="text-slate-300 text-[10px] font-semibold">{onlinePlayers.length}</span>
        </div>
        {prizePool > 0 && (
          <div className="flex items-center gap-1 bg-amber-900/40 border border-amber-700/40 rounded-full px-2 py-0.5 shrink-0">
            <span className="text-amber-400 text-[10px] font-black">{prizePool.toLocaleString()} ብር</span>
          </div>
        )}
      </div>
      <Link href="/profile">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
      </Link>
    </div>
  );
}

// ── Bottom Navigation ──────────────────────────────────────────────────────
function BottomNav({ current, onChange, isAdmin }: {
  current: Screen; onChange: (s: Screen) => void; isAdmin: boolean;
}) {
  const items: { id: Screen | '/wallet' | '/admin'; label: string; icon: string; route?: boolean }[] = [
    { id: 'game', label: 'Game', icon: '🎯' },
    { id: 'cards', label: 'Cards', icon: '🃏' },
    { id: 'players', label: 'Players', icon: '👥' },
    { id: '/wallet', label: 'Wallet', icon: '💰', route: true },
    ...(isAdmin ? [{ id: '/admin' as const, label: 'Admin', icon: '⚙️', route: true }] : []),
  ];

  return (
    <nav className="bg-slate-950 border-t border-slate-800 flex flex-shrink-0">
      {items.map(item => {
        if (item.route) {
          return (
            <Link key={item.id} href={item.id} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors text-slate-500 hover:text-slate-300">
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        }
        const active = current === item.id;
        return (
          <button key={item.id} onClick={() => onChange(item.id as Screen)} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${active ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-semibold">{item.label}</span>
            {active && <span className="w-4 h-0.5 bg-amber-400 rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}

// ── Dev Login ──────────────────────────────────────────────────────────────
function DevLogin({ onLogin }: { onLogin: (user: any, tokens: any) => void }) {
  const [phone, setPhone] = useState('+251912345678');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  async function handleLogin() {
    setLoading(true); setErr('');
    try {
      const res = await authAPI.login(phone, password);
      onLogin(res.data.user, res.data.tokens);
    } catch (e: any) { setErr(e?.response?.data?.message || 'Login failed'); }
    setLoading(false);
  }
  return (
    <div className="flex items-center justify-center h-screen bg-bingo-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">🎱 BINGO</div>
          <p className="text-slate-500 text-xs mt-1">DEV MODE</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider">Phone</label>
            <input className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider">Password</label>
            <input type="password" className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-xl py-3 disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Error View ─────────────────────────────────────────────────────────────
function ErrorView({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-bingo-bg">
      <div className="text-center p-6">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-amber-500 text-black font-bold px-6 py-2 rounded-xl">Retry</button>
      </div>
    </div>
  );
}
