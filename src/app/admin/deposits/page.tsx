'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DepositRequest } from '@/types';

export default function AdminDepositsPage() {
  const { user, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminSms, setAdminSms] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    loadRequests();
  }, [isAuthenticated, user]);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await adminAPI.getDepositRequests();
      setRequests(res.data.requests);
    } catch {}
    setLoading(false);
  }

  async function matchSms(id: string) {
    if (!adminSms) return;
    try {
      await adminAPI.matchSmsDeposit(id, adminSms);
      setAdminSms('');
      setActionId(null);
      setMsg('✅ SMS matched');
      loadRequests();
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('❌ Match failed'); }
  }

  async function confirmDeposit(id: string) {
    try {
      await adminAPI.confirmDeposit(id);
      setMsg('✅ Deposit confirmed, user credited');
      loadRequests();
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('❌ Confirmation failed'); }
  }

  async function rejectDeposit(id: string) {
    try {
      await adminAPI.rejectDeposit(id);
      setMsg('✅ Deposit rejected');
      loadRequests();
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('❌ Failed'); }
  }

  if (!isAuthenticated || user?.role !== 'admin') return <div className="min-h-screen bg-bingo-bg flex items-center justify-center"><p className="text-slate-500">Admin access only</p></div>;

  return (
    <div className="min-h-screen bg-bingo-bg p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-slate-400 text-lg">←</Link>
        <h1 className="text-xl font-black text-white">⬇ Deposit Requests</h1>
        <button onClick={loadRequests} className="ml-auto text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700">Refresh</button>
      </div>

      {msg && <p className="text-sm text-center mb-3 text-amber-400 font-semibold">{msg}</p>}

      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading...</p>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-slate-600"><p>No deposit requests</p></div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req._id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-white">{req.userId?.name || 'Unknown'}</span>
                  <span className="text-xs text-slate-500 ml-2">{req.userId?.phone}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.status === 'completed' ? 'bg-green-900/40 text-green-400' : req.status === 'sms_matched' ? 'bg-amber-900/40 text-amber-400' : req.status === 'rejected' ? 'bg-red-900/40 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                  {req.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mb-2">
                {req.channel} · {req.amount.toFixed(2)} ብር · {new Date(req.createdAt).toLocaleString()}
              </div>
              <div className="bg-slate-900 rounded-xl p-2.5 mb-3">
                <div className="text-[10px] text-slate-600 uppercase mb-1">User SMS</div>
                <div className="text-xs text-slate-300">{req.userSmsText}</div>
              </div>

              {req.status === 'pending' && (
                <div>
                  {actionId === req._id ? (
                    <div className="space-y-2">
                      <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none resize-none h-16" placeholder="Paste your SMS confirmation..." value={adminSms} onChange={e => setAdminSms(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => matchSms(req._id)} className="flex-1 bg-amber-500 text-black font-bold rounded-xl py-2 text-xs">Match</button>
                        <button onClick={() => { setActionId(null); setAdminSms(''); }} className="px-3 bg-slate-700 text-slate-300 rounded-xl text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setActionId(req._id)} className="w-full bg-amber-500/20 border border-amber-700/40 text-amber-400 rounded-xl py-2 text-xs font-bold">Match SMS</button>
                  )}
                </div>
              )}

              {req.status === 'sms_matched' && (
                <div className="flex gap-2">
                  <button onClick={() => confirmDeposit(req._id)} className="flex-1 bg-green-600 text-white font-bold rounded-xl py-2 text-xs">Confirm & Credit</button>
                  <button onClick={() => rejectDeposit(req._id)} className="flex-1 bg-red-800/60 text-red-300 rounded-xl py-2 text-xs">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
