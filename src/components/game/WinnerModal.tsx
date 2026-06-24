'use client';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export function WinnerModal({ winner }: {
  winner: {
    winnerId: string;
    winnerName: string;
    cardNumber: number;
    pattern: string;
    prizeAmount: number;
  }
}) {
  const { user, updateBalance } = useAuthStore();
  const { setWinner } = useGameStore();
  const isMe = user?.id === winner.winnerId;

  if (isMe) {
    updateBalance(user.balance + winner.prizeAmount);
  }

  const PATTERN_LABELS: Record<string, string> = {
    row_0: 'Top Row', row_1: 'Row 2', row_2: 'Middle Row', row_3: 'Row 4', row_4: 'Bottom Row',
    col_0: 'B Column', col_1: 'I Column', col_2: 'N Column', col_3: 'G Column', col_4: 'O Column',
    diag_tlbr: 'Diagonal ↘', diag_trbl: 'Diagonal ↙',
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={i}
            className="absolute text-2xl confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 0.8}s`,
              animationDuration: `${0.8 + Math.random() * 0.8}s`,
            }}
          >
            {['🎉','🎊','⭐','🏆','💰','🎱'][Math.floor(Math.random() * 6)]}
          </span>
        ))}
      </div>

      <div className="relative bg-slate-900 border border-amber-500/40 rounded-3xl p-7 w-full max-w-xs text-center slide-up">
        <div className="text-6xl mb-3">{isMe ? '🏆' : '🎱'}</div>

        {isMe ? (
          <>
            <h2 className="text-2xl font-black text-green-400 mb-1">BINGO! You Won!</h2>
            <p className="text-slate-400 text-sm mb-4">Congratulations {user?.name}!</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-black text-amber-400 mb-1">BINGO!</h2>
            <p className="text-slate-300 font-semibold mb-4">{winner.winnerName} won!</p>
          </>
        )}

        <div className="bg-gradient-to-br from-amber-900/40 to-yellow-900/20 border border-amber-600/30 rounded-2xl p-4 mb-5">
          <div className={`text-4xl font-black mb-1 ${isMe ? 'text-green-400 prize-glow' : 'text-amber-400'}`}>
            {winner.prizeAmount.toLocaleString()} ብር
          </div>
          <div className="text-xs text-slate-500">Prize amount</div>
          <div className="text-xs text-slate-600 mt-1">Card #{winner.cardNumber} · {PATTERN_LABELS[winner.pattern] || winner.pattern}</div>
        </div>

        {isMe && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-2.5 mb-4">
            <p className="text-green-400 text-xs font-semibold">✅ Prize added to your wallet</p>
          </div>
        )}

        <button
          onClick={() => setWinner(null)}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5"
        >
          {isMe ? 'Collect & Continue 🎉' : 'Continue Playing'}
        </button>
      </div>
    </div>
  );
}
