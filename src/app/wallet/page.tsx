'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { walletAPI } from '@/services/api';
import { BottomNav } from '@/components/ui/NavBar';
import type { Transaction } from '@/types';

const CHANNELS = [
  { id: 'cbe', label: 'CBE', account: '1000123456789' },
  { id: 'cbebirr', label: 'CBE Birr', account: '251912345678' },
  { id: 'abyssinia', label: 'Abyssinia', account: '10123456789' },
  { id: 'telebirr', label: 'Telebirr', account: '251912345678' },
];

export default function WalletPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateBalance } = useAuth();
  const [balance, setBalance] = useState(user?.balance || 0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/');
  }, [isLoading, isAuthenticated, router]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [channel, setChannel] = useState('cbebirr');
  const [smsText, setSmsText] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [method, setMethod] = useState('telebirr');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);

  useEffect(() => {
    walletAPI.getBalance().then(r => { setBalance(r.data.balance); updateBalance(r.data.balance); }).catch(() => {});
    loadTransactions();
  }, []);

  async function loadTransactions(page = 1) {
    try {
      const res = await walletAPI.getTransactions(page);
      setTxs(prev => page === 1 ? res.data.transactions : [...prev, ...res.data.transactions]);
      setTxPage(page);
    } catch {}
  }

  async function submitDeposit() {
    setLoading(true); setMsg(null);
    try {
      const res = await walletAPI.requestDeposit(parseFloat(amount) || 0, channel, smsText);
      setMsg({ text: res.data.message || 'Deposit request submitted', ok: true });
      setSmsText(''); setAmount('');
      walletAPI.getBalance().then(r => { setBalance(r.data.balance); updateBalance(r.data.balance); });
      setTimeout(() => { setShowDeposit(false); setMsg(null); }, 2000);
    } catch (e: any) { setMsg({ text: e?.response?.data?.message || 'Failed', ok: false }); }
    setLoading(false);
  }

  async function submitWithdraw() {
    setLoading(true); setMsg(null);
    try {
      const res = await walletAPI.withdraw(parseFloat(amount), method, accountNumber);
      setMsg({ text: res.data.message || 'Withdrawal submitted', ok: true });
      setAmount(''); setAccountNumber('');
      walletAPI.getBalance().then(r => { setBalance(r.data.balance); updateBalance(r.data.balance); });
      setTimeout(() => { setShowWithdraw(false); setMsg(null); }, 2000);
    } catch (e: any) { setMsg({ text: e?.response?.data?.message || 'Failed', ok: false }); }
    setLoading(false);
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-bingo-bg"><p className="text-slate-500">Loading...</p></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen bg-bingo-bg">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-3 py-2 flex items-center">
        <span className="text-base font-black text-white">💰 Wallet</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-2">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-5 mb-4">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Available Balance</div>
          <div className="text-4xl font-black text-amber-400">{balance.toFixed(2)} <span className="text-2xl">ብር</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => { setShowDeposit(true); setShowWithdraw(false); setMsg(null); }}
            className="bg-green-900/30 border border-green-700/40 text-green-400 rounded-2xl py-3 font-bold text-sm hover:bg-green-900/50 transition-colors">⬇ Deposit</button>
          <button onClick={() => { setShowWithdraw(true); setShowDeposit(false); setMsg(null); }}
            className="bg-red-900/30 border border-red-700/40 text-red-400 rounded-2xl py-3 font-bold text-sm hover:bg-red-900/50 transition-colors">⬆ Withdraw</button>
        </div>

        {/* Transactions */}
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Recent Transactions</div>
        {txs.length === 0 ? (
          <div className="text-center py-8 text-slate-600 bg-slate-800/30 rounded-2xl">No transactions yet</div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-700/50">
            {txs.map(tx => (
              <div key={tx._id} className="flex items-center gap-3 px-3.5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{tx.description}</div>
                  <div className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <div className={`text-sm font-black flex-shrink-0 ${['deposit','prize','bonus','refund'].includes(tx.type) ? 'text-green-400' : 'text-red-400'}`}>
                  {['deposit','prize','bonus','refund'].includes(tx.type) ? '+' : '-'}{tx.amount.toFixed(2)} ብር
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SMS Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => { setShowDeposit(false); setMsg(null); }}>
            <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 w-full max-w-md sheet-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-black text-white mb-2">⬇ SMS Deposit</h3>
              <p className="text-xs text-slate-500 mb-4">Transfer to one of the accounts below, then paste the SMS confirmation you receive.</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {CHANNELS.map(ch => (
                  <button key={ch.id} onClick={() => setChannel(ch.id)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${channel === ch.id ? 'bg-amber-900/40 border-amber-600/60 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    <div className="font-bold">{ch.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{ch.account}</div>
                  </button>
                ))}
              </div>

              <input type="number" placeholder="Amount (ብር)" className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
              <textarea placeholder="Paste SMS confirmation text here..." className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none resize-none h-20" value={smsText} onChange={e => setSmsText(e.target.value)} />
              {msg && <p className={`text-sm font-semibold text-center mb-2 ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
              <button onClick={submitDeposit} disabled={loading || !smsText || !amount} className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5 disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Deposit'}
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => { setShowWithdraw(false); setMsg(null); }}>
            <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 w-full max-w-md sheet-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-black text-white mb-4">⬆ Withdraw Funds</h3>
              <input type="number" placeholder="Amount (ብር)" className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={amount} onChange={e => setAmount(e.target.value)} />
              <select className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="telebirr">Telebirr</option>
                <option value="cbebirr">CBE Birr</option>
              </select>
              <input placeholder="Account number" className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
              {msg && <p className={`text-sm font-semibold text-center mb-2 ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>}
              <button onClick={submitWithdraw} disabled={loading || !amount || !accountNumber} className="w-full bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5 disabled:opacity-50">
                {loading ? 'Processing...' : 'Submit Withdrawal'}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav isAdmin={user?.role === 'admin'} />
    </div>
  );
}
