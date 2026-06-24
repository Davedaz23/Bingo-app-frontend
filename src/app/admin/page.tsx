'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI } from '@/services/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isLoading, isAuthenticated, router]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    adminAPI.getStats().then(r => setStats(r.data.stats)).catch(() => {});
  }, [isAuthenticated, user]);

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-bingo-bg"><p className="text-slate-500">Loading...</p></div>;
  if (!isAuthenticated || user?.role !== 'admin') return null;

  const links = [
    { href: '/admin/games', label: 'Game Management', icon: '🎮', desc: 'Start, reset, and manage games' },
    { href: '/admin/deposits', label: 'Deposit Requests', icon: '⬇', desc: 'Match and confirm SMS deposits' },
    { href: '/admin/withdrawals', label: 'Withdrawal Requests', icon: '⬆', desc: 'Approve or reject withdrawals' },
    { href: '/admin/users', label: 'User Management', icon: '👥', desc: 'Ban, credit, or manage users' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️', desc: 'Configure game parameters' },
  ];

  return (
    <div className="min-h-screen bg-bingo-bg p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-slate-400 text-lg">←</Link>
        <h1 className="text-xl font-black text-white">⚙️ Admin Panel</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500">Players</div>
            <div className="text-lg font-black text-amber-400">{stats.totalPlayers}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500">Games</div>
            <div className="text-lg font-black text-amber-400">{stats.gamesPlayed}</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500">Deposits</div>
            <div className="text-lg font-black text-amber-400">{stats.totalDeposits?.toFixed(0)} ብር</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {links.map(link => (
          <Link key={link.href} href={link.href}
            className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl p-4 hover:border-amber-700/40 transition-colors">
            <span className="text-2xl">{link.icon}</span>
            <div>
              <div className="text-sm font-bold text-white">{link.label}</div>
              <div className="text-xs text-slate-500">{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
