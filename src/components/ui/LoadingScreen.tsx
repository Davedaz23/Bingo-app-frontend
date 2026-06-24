'use client';
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-bingo-bg">
      <div className="text-5xl font-black bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent mb-6">
        🎱 BINGO
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-amber-400"
            style={{ animation: `pulse 1.2s ease ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
      <p className="text-slate-500 text-sm mt-4">Connecting to game server...</p>
    </div>
  );
}
