'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { id: '/', label: 'Game', icon: '🎯' },
    { id: '/wallet', label: 'Wallet', icon: '💰' },
    { id: '/withdrawals', label: 'Withdraw', icon: '⬆' },
    { id: '/profile', label: 'Profile', icon: '👤' },
    ...(isAdmin ? [{ id: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <nav className="bg-slate-950 border-t border-slate-800 flex flex-shrink-0">
      {items.map(item => {
        const active = pathname === item.id;
        return (
          <Link key={item.id} href={item.id} className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${active ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}>
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-semibold">{item.label}</span>
            {active && <span className="w-4 h-0.5 bg-amber-400 rounded-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
