'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/ui/NavBar';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-bingo-bg"><p className="text-slate-500">Loading...</p></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen bg-bingo-bg">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2 flex items-center">
        <span className="text-base font-black text-white">👤 Profile</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black mb-3">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h2 className="text-lg font-black text-white">{user?.name}</h2>
          <span className="text-xs text-slate-500 mt-1">{user?.phone}</span>
          <span className={`mt-2 text-xs font-bold px-2.5 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-amber-900/40 text-amber-400 border border-amber-700/40' : 'bg-blue-900/40 text-blue-400 border border-blue-700/40'}`}>
            {user?.role?.toUpperCase()}
          </span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl divide-y divide-slate-700/50 mb-4">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-300">Balance</span>
            <span className="text-sm font-bold text-amber-400">{user?.balance?.toFixed(2)} ብር</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-300">Total Won</span>
            <span className="text-sm font-bold text-green-400">{user?.totalWon?.toFixed(0)} ብር</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-300">Games Played</span>
            <span className="text-sm font-bold text-white">{user?.totalPlayed || 0}</span>
          </div>
        </div>

        <button onClick={logout} className="w-full bg-red-900/30 border border-red-700/40 text-red-400 rounded-2xl py-3 font-bold text-sm hover:bg-red-900/50 transition-colors">
          Logout
        </button>
      </div>

      <BottomNav isAdmin={user?.role === 'admin'} />
    </div>
  );
}
