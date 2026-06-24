'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { WithdrawalRequest } from '@/types';

export default function AdminWithdrawalsPage() {
  const { user, isAuthenticated } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    load();
  }, [isAuthenticated, user]);

  async function load() {
    setLoading(true);
    try { const res = await adminAPI.getWithdrawals(); setWithdrawals(res.data.withdrawals); } catch {}
    setLoading(false);
  }

  async function approve(id: string) {
    try { await adminAPI.approveWithdrawal(id); setMsg('✅ Approved'); load(); setTimeout(() => setMsg(''), 2000); } catch { setMsg('❌ Failed'); }
  }

  async function reject(id: string) {
    try { await adminAPI.rejectWithdrawal(id); setMsg('✅ Rejected'); load(); setTimeout(() => setMsg(''), 2000); } catch { setMsg('❌ Failed'); }
  }

  if (!isAuthenticated || user?.role !== 'admin') return <div className="min-h-screen bg-bingo-bg flex items-center justify-center"><p className="text-slate-500">Admin access only</p></div>;

  return (
    <div className="min-h-screen bg-bingo-bg p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-slate-400 text-lg">←</Link>
        <h1 className="text-xl font-black text-white">⬆ Withdrawal Requests</h1>
        <button onClick={load} className="ml-auto text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700">Refresh</button>
      </div>
      {msg && <p className="text-sm text-center mb-3 text-amber-400 font-semibold">{msg}</p>}
      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading...</p>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-16 text-slate-600"><p>No withdrawal requests</p></div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map(w => (
            <div key={w._id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-white">{w.userId?.name}</span>
                  <span className="text-xs text-slate-500 ml-2">{w.userId?.phone}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${w.status === 'approved' ? 'bg-green-900/40 text-green-400' : w.status === 'rejected' ? 'bg-red-900/40 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                  {w.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-3">{w.method} · {w.amount.toFixed(2)} ብር · {w.accountNumber}</div>
              {w.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => approve(w._id)} className="flex-1 bg-green-600 text-white font-bold rounded-xl py-2 text-xs">Approve</button>
                  <button onClick={() => reject(w._id)} className="flex-1 bg-red-800/60 text-red-300 rounded-xl py-2 text-xs">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
