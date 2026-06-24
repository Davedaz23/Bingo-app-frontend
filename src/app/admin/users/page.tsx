'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    loadUsers();
  }, [isAuthenticated, user]);

  async function loadUsers() {
    setLoading(true);
    try { const res = await adminAPI.getPlayers(); setUsers(res.data.players); } catch {}
    setLoading(false);
  }

  async function toggleBan(userId: string, banned: boolean) {
    try { await adminAPI.banPlayer(userId, !banned); loadUsers(); } catch {}
  }

  if (!isAuthenticated || user?.role !== 'admin') return <div className="min-h-screen bg-bingo-bg flex items-center justify-center"><p className="text-slate-500">Admin access only</p></div>;

  return (
    <div className="min-h-screen bg-bingo-bg p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-slate-400 text-lg">←</Link>
        <h1 className="text-xl font-black text-white">👥 Users</h1>
        <button onClick={loadUsers} className="ml-auto text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700">Refresh</button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-600"><p>No players yet</p></div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-slate-800/60 border border-slate-700 rounded-xl flex items-center gap-3 px-3 py-3">
              <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-sm font-black">{u.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{u.name}</div>
                <div className="text-xs text-slate-500">{u.balance?.toFixed(2)} ብር · {u.phone}</div>
              </div>
              <button onClick={() => toggleBan(u.id, !!u.role)} className={`text-xs px-2 py-1 rounded-lg border ${false ? 'border-green-700/40 text-green-400' : 'border-red-700/40 text-red-400'}`}>
                Ban
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
