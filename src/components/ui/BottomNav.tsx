'use client';

// ── BottomNav ────────────────────────────────────────────────────────────────
export function BottomNav({ current, onChange, isAdmin }: {
  current: string;
  onChange: (s: any) => void;
  isAdmin: boolean;
}) {
  const items = [
    { id: 'game',    label: 'Game',    icon: '🎯' },
    { id: 'cards',   label: 'Cards',   icon: '🃏' },
    { id: 'wallet',  label: 'Wallet',  icon: '💰' },
    { id: 'players', label: 'Players', icon: '👥' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <nav className="bg-slate-950 border-t border-slate-800 flex flex-shrink-0">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
            current === item.id
              ? 'text-amber-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span className="text-[10px] font-semibold">{item.label}</span>
          {current === item.id && (
            <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
}
