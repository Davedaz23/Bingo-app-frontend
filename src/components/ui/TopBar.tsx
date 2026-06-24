'use client';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export function TopBar({ onAdminClick }: { onAdminClick: () => void }) {
  const { user } = useAuthStore();
  const { connected, onlinePlayers, prizePool, gameStatus } = useGameStore();

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-2 flex-shrink-0">
      {/* Logo */}
      <button
        onClick={user?.role === 'admin' ? onAdminClick : undefined}
        className="text-base font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent shrink-0"
      >
        🎱 BINGO
      </button>

      {/* Player info pills */}
      <div className="flex-1 flex items-center gap-1.5 overflow-hidden min-w-0">
        {/* Balance */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 shrink-0">
          <span className="text-yellow-400 text-[10px] font-bold">ብር</span>
          <span className="text-yellow-300 text-[11px] font-black">
            {user?.balance?.toFixed(0) ?? '0'}
          </span>
        </div>

        {/* Online count */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_4px_#4ade80]' : 'bg-slate-500'}`} />
          <span className="text-slate-300 text-[10px] font-semibold">{onlinePlayers.length}</span>
        </div>

        {/* Prize pool */}
        {prizePool > 0 && (
          <div className="flex items-center gap-1 bg-amber-900/40 border border-amber-700/40 rounded-full px-2 py-0.5 shrink-0">
            <span className="text-amber-400 text-[10px] font-black prize-glow">{prizePool.toLocaleString()} ብር</span>
          </div>
        )}

        {/* Game status badge */}
        <div className={`hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 shrink-0 border ${
          gameStatus === 'live'
            ? 'bg-red-900/40 border-red-700/40 text-red-400'
            : gameStatus === 'ended'
            ? 'bg-slate-800 border-slate-600 text-slate-400'
            : 'bg-green-900/40 border-green-700/40 text-green-400'
        }`}>
          {gameStatus === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
          <span className="text-[10px] font-bold uppercase">{gameStatus}</span>
        </div>
      </div>

      {/* User avatar */}
      {user && (
        <div
          className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0"
          title={user.name}
        >
          {user.name[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}
