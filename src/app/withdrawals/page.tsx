'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { walletAPI } from '@/services/api';
import { BottomNav } from '@/components/ui/NavBar';

export default function WithdrawalsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isLoading, isAuthenticated, router]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('telebirr');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    walletAPI.getTransactions().then(r => {
      setWithdrawals(r.data.transactions.filter((tx: any) => tx.type === 'withdrawal' || tx.type === 'withdraw'));
    }).catch(() => {});
  }, [isAuthenticated]);

  async function submit() {
    setLoading(true); setMsg(null);
    try {
      const res = await walletAPI.withdraw(parseFloat(amount), method, accountNumber);
      setMsg({ text: res.data.message || 'Withdrawal submitted', ok: true });
      setAmount(''); setAccountNumber('');
      setTimeout(() => { setShowNew(false); setMsg(null); }, 2000);
    } catch (e: any) { setMsg({ text: e?.response?.data?.message || 'Failed', ok: false }); }
    setLoading(false);
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-bingo-bg"><p className="text-slate-500">Loading...</p></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen bg-bingo-bg">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between">
        <span className="text-base font-black text-white">⬆ Withdrawals</span>
        <button onClick={() => { setShowNew(true); setMsg(null); }} className="text-xs bg-amber-500 text-black font-bold px-3 py-1.5 rounded-lg">+ New</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {withdrawals.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <p className="text-4xl mb-3">⬆</p>
            <p>No withdrawal requests</p>
            <button onClick={() => setShowNew(true)} className="mt-3 bg-amber-500 text-black font-bold px-6 py-2 rounded-xl text-sm">Request Withdrawal</button>
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w: any) => (
              <div key={w._id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{w.description}</div>
                  <div className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-400">{w.amount.toFixed(2)} ብር</div>
                  <div className="text-[10px] text-slate-500">{w.status || 'completed'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showNew && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => { setShowNew(false); setMsg(null); }}>
            <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 w-full max-w-md sheet-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-black text-white mb-4">⬆ New Withdrawal</h3>
              <input type="number" placeholder="Amount (ብር)" className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
              <select className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="telebirr">Telebirr</option>
                <option value="cbebirr">CBE Birr</option>
              </select>
              <input placeholder="Account number" className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
              {msg && <p className={`text-sm font-semibold text-center mb-2 ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
              <button onClick={submit} disabled={loading || !amount || !accountNumber} className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5 disabled:opacity-50">{loading ? 'Processing...' : 'Submit'}</button>
            </div>
          </div>
        )}
      </div>

      <BottomNav isAdmin={user?.role === 'admin'} />
    </div>
  );
}
