'use client';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16',
];

export function PlayersScreen() {
  const { onlinePlayers } = useGameStore();
  const { user } = useAuthStore();

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-black text-white">Players</h2>
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>{onlinePlayers.length} online</span>
        </div>
      </div>

      {onlinePlayers.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <p className="text-4xl mb-3">👥</p>
          <p>No players connected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {onlinePlayers.map((player, idx) => {
            const isMe = player.userId === user?.id;
            const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div
                key={player.userId}
                className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
                  isMe
                    ? 'bg-amber-900/20 border-amber-700/30'
                    : 'bg-slate-800/60 border-slate-700/50'
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                  style={{ background: `${color}22`, color }}
                >
                  {player.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">{player.name}</span>
                    {isMe && <span className="text-[10px] text-amber-400 font-bold">YOU</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {player.cardId ? `Card #${player.cardId}` : 'No card selected'}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_#4ade80]" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
