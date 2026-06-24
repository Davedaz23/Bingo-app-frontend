'use client';

const COLS = [
  { letter: 'B', range: [1, 15],  color: 'bg-blue-900/50 text-blue-300 border-blue-700/40' },
  { letter: 'I', range: [16, 30], color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40' },
  { letter: 'N', range: [31, 45], color: 'bg-amber-900/50 text-amber-300 border-amber-700/40' },
  { letter: 'G', range: [46, 60], color: 'bg-purple-900/50 text-purple-300 border-purple-700/40' },
  { letter: 'O', range: [61, 75], color: 'bg-red-900/50 text-red-300 border-red-700/40' },
];

export function CalledNumbersPanel({ numbers, latest }: { numbers: number[]; latest: number | null | undefined }) {
  const calledSet = new Set(numbers);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Called Numbers</span>
        <span className="text-xs text-slate-500">{numbers.length} / 75</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {COLS.map(col => (
          <div key={col.letter}>
            <div className="text-center text-[10px] font-black mb-1 opacity-70" style={{ color: 'inherit' }}>
              <span className={`inline-block px-1.5 py-0.5 rounded ${col.color.split(' ')[1]}`}>
                {col.letter}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {Array.from({ length: 15 }, (_, i) => {
                const num = col.range[0] + i;
                const called = calledSet.has(num);
                const isLatest = num === latest;
                return (
                  <div
                    key={num}
                    className={`
                      text-center text-[10px] font-bold rounded py-0.5 leading-none transition-all
                      ${isLatest ? 'bg-amber-500 text-black ring-pop scale-110' :
                        called ? `${col.color} border` :
                        'text-slate-700'}
                    `}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
