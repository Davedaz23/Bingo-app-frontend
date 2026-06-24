'use client';

export function WelcomeBonusModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-7 max-w-xs w-full text-center slide-up">
        <div className="relative h-16 mb-2">
          {['🎉','🎊','⭐','✨','🎁'].map((e, i) => (
            <span key={i} className="absolute confetti text-2xl" style={{
              left: `${10 + i * 18}%`,
              animationDelay: `${i * 0.1}s`,
            }}>{e}</span>
          ))}
        </div>
        <div className="text-6xl mb-3">🎁</div>
        <h2 className="text-2xl font-black text-white mb-1">Welcome!</h2>
        <div className="bg-gradient-to-br from-amber-900/50 to-yellow-900/30 border border-amber-500/30 rounded-2xl p-4 mb-5">
          <div className="text-4xl font-black text-amber-400 prize-glow">50 ብር</div>
          <div className="text-sm text-amber-300/70 mt-1">Registration Bonus 🎉</div>
          <div className="text-xs text-slate-500 mt-1">Added to your wallet</div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5 text-base"
        >
          Start Playing! 🎱
        </button>
      </div>
    </div>
  );
}
