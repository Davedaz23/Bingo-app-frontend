'use client';
import { useEffect, useRef } from 'react';

const COL_COLORS = [
  { letter: 'B', text: 'text-blue-400',    bg: 'bg-blue-900/40',    hit: 'bg-blue-600' },
  { letter: 'I', text: 'text-emerald-400', bg: 'bg-emerald-900/40', hit: 'bg-emerald-600' },
  { letter: 'N', text: 'text-amber-400',   bg: 'bg-amber-900/40',   hit: 'bg-amber-600' },
  { letter: 'G', text: 'text-purple-400',  bg: 'bg-purple-900/40',  hit: 'bg-purple-600' },
  { letter: 'O', text: 'text-red-400',     bg: 'bg-red-900/40',     hit: 'bg-red-600' },
];

interface Props {
  columns: (number | null)[][];
  calledNumbers: number[];
  highlight?: number | null;
}

export function BingoCardDisplay({ columns, calledNumbers, highlight }: Props) {
  const calledSet = new Set(calledNumbers);
  const prevHighlight = useRef<number | null>(null);

  // Build grid row by row for display
  // columns[col][row] — but we render row by row
  const rows: (number | null)[][] = [];
  for (let r = 0; r < 5; r++) {
    rows.push(columns.map(col => col[r]));
  }

  function isMarked(val: number | null): boolean {
    return val === null || calledSet.has(val);
  }

  function isLatest(val: number | null): boolean {
    return val !== null && val === highlight;
  }

  // Check win patterns to highlight winning line
  function getWinLines(): Set<string> {
    const lines = new Set<string>();
    // Rows
    for (let r = 0; r < 5; r++) {
      if (rows[r].every(v => isMarked(v))) {
        rows[r].forEach((_, c) => lines.add(`${r}-${c}`));
      }
    }
    // Cols
    for (let c = 0; c < 5; c++) {
      if (columns[c].every(v => isMarked(v))) {
        columns[c].forEach((_, r) => lines.add(`${r}-${c}`));
      }
    }
    // Diag
    if ([0,1,2,3,4].every(i => isMarked(columns[i][i]))) {
      [0,1,2,3,4].forEach(i => lines.add(`${i}-${i}`));
    }
    if ([0,1,2,3,4].every(i => isMarked(columns[i][4-i]))) {
      [0,1,2,3,4].forEach(i => lines.add(`${i}-${4-i}`));
    }
    return lines;
  }

  const winLines = getWinLines();
  const hasWin = winLines.size > 0;

  return (
    <div className={`rounded-2xl overflow-hidden border-2 ${hasWin ? 'border-green-500 win-glow' : 'border-slate-700'}`}>
      {/* Header row */}
      <div className="grid grid-cols-5 bg-slate-900">
        {COL_COLORS.map(col => (
          <div key={col.letter} className={`flex items-center justify-center py-2 text-sm font-black ${col.text}`}>
            {col.letter}
          </div>
        ))}
      </div>

      {/* Cell grid */}
      <div className="grid grid-cols-5 gap-0.5 bg-slate-950 p-0.5">
        {rows.map((row, r) =>
          row.map((val, c) => {
            const free = val === null;
            const marked = isMarked(val);
            const latest = isLatest(val);
            const winning = winLines.has(`${r}-${c}`);
            const col = COL_COLORS[c];

            return (
              <div
                key={`${r}-${c}`}
                className={`
                  relative aspect-square flex items-center justify-center rounded-lg
                  text-sm font-bold select-none transition-all duration-150
                  ${free ? 'bg-gradient-to-br from-emerald-800/60 to-emerald-900/40 text-emerald-400 text-[9px]' :
                    winning ? `${col.hit} text-white shadow-lg` :
                    latest ? `bg-amber-500 text-black ${hasWin ? '' : 'cell-hit'}` :
                    marked ? `${col.bg} border border-slate-600/50 ${col.text}` :
                    'bg-slate-800 text-slate-300'}
                `}
              >
                {free ? 'FREE' : val}
                {marked && !free && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    {winning ? null : marked && !latest ? (
                      <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    ) : null}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
