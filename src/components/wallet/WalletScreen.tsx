'use client';
import { useState, useEffect } from 'react';
import { walletApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type Action = 'deposit' | 'withdraw' | 'transfer' | null;
const METHODS = ['telebirr', 'cbe_birr', 'awash', 'dashen'];
const METHOD_LABELS: Record<string, string> = { telebirr: 'Telebirr', cbe_birr: 'CBE Birr', awash: 'Awash Bank', dashen: 'Dashen Bank' };

const TX_ICONS: Record<string, string> = {
  deposit: '⬇', withdrawal: '⬆', transfer_in: '↙', transfer_out: '↗', prize: '🏆', entry_fee: '🎱', bonus: '🎁', refund: '↩',
};
const TX_COLORS: Record<string, string> = {
  deposit: 'text-green-400', withdrawal: 'text-red-400', transfer_in: 'text-green-400',
  transfer_out: 'text-red-400', prize: 'text-amber-400', entry_fee: 'text-red-400',
  bonus: 'text-amber-400', refund: 'text-green-400',
};

export function WalletScreen() {
  const { user, updateBalance } = useAuthStore();
  const [action, setAction] = useState<Action>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('telebirr');
  const [toPhone, setToPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    walletApi.getTransactions().then(r => { setTxs(r.data.transactions); setTxLoading(false); }).catch(() => setTxLoading(false));
  }, []);

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMsg({ text: 'Enter a valid amount', ok: false });
    setLoading(true); setMsg(null);
    try {
      let res: any;
      if (action === 'deposit') res = await walletApi.deposit(amt, method);
      else if (action === 'withdraw') res = await walletApi.withdraw(amt, method);
      else if (action === 'transfer') {
        if (!toPhone) return setMsg({ text: 'Enter recipient phone', ok: false });
        res = await walletApi.transfer(toPhone, amt);
      }
      if (res?.data?.balance !== undefined) updateBalance(res.data.balance);
      setMsg({ text: res?.data?.message || 'Success!', ok: true });
      setAmount(''); setToPhone('');
      // Refresh transactions
      const r = await walletApi.getTransactions();
      setTxs(r.data.transactions);
      setTimeout(() => { setAction(null); setMsg(null); }, 1500);
    } catch (e: any) {
      setMsg({ text: e?.response?.data?.message || 'Failed', ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3 pb-2">
      {/* Balance card */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-5 mb-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Balance</div>
        <div className="text-4xl font-black text-amber-400">{user?.balance?.toFixed(2) ?? '0.00'} <span className="text-2xl">ብር</span></div>
        <div className="text-xs text-slate-600 mt-1">Available balance</div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Deposit', icon: '⬇', color: 'text-green-400 border-green-800/50 bg-green-900/20', action: 'deposit' as Action },
            { label: 'Withdraw', icon: '⬆', color: 'text-red-400 border-red-800/50 bg-red-900/20', action: 'withdraw' as Action },
            { label: 'Transfer', icon: '↗', color: 'text-blue-400 border-blue-800/50 bg-blue-900/20', action: 'transfer' as Action },
          ].map(btn => (
            <button
              key={btn.action}
              onClick={() => setAction(btn.action)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-95 ${btn.color}`}
            >
              <span className="text-xl">{btn.icon}</span>
              <span className="text-[11px] font-bold">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500 mb-0.5">Total Won</div>
          <div className="text-base font-black text-amber-400">{user?.totalWon?.toFixed(0) ?? '0'} ብር</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-500 mb-0.5">Games Played</div>
          <div className="text-base font-black text-slate-300">{user?.totalPlayed ?? '0'}</div>
        </div>
      </div>

      {/* Transactions */}
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Recent Transactions</div>
      {txLoading ? (
        <div className="text-center py-8 text-slate-600">Loading...</div>
      ) : txs.length === 0 ? (
        <div className="text-center py-8 text-slate-600">No transactions yet</div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-700/50">
          {txs.map(tx => (
            <div key={tx._id} className="flex items-center gap-3 px-3.5 py-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-base flex-shrink-0">
                {TX_ICONS[tx.type] || '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{tx.description}</div>
                <div className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleDateString('am-ET')}</div>
              </div>
              <div className={`text-sm font-black flex-shrink-0 ${TX_COLORS[tx.type] || 'text-slate-300'}`}>
                {['deposit','transfer_in','prize','bonus','refund'].includes(tx.type) ? '+' : '-'}{tx.amount.toFixed(2)} ብር
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {action && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 w-full max-w-md sheet-up">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-black text-white mb-4">
              {action === 'deposit' ? '⬇ Deposit Funds' : action === 'withdraw' ? '⬆ Withdraw Funds' : '↗ Transfer'}
            </h3>

            <div className="space-y-3">
              {action === 'transfer' && (
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Recipient Phone</label>
                  <input
                    className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none"
                    placeholder="+251 9XX XXX XXX"
                    value={toPhone}
                    onChange={e => setToPhone(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider">Amount (ብር)</label>
                <input
                  className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-amber-500 outline-none"
                  placeholder={action === 'deposit' ? 'Min 20 ብር' : 'Min 50 ብር'}
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              {action !== 'transfer' && (
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {METHODS.map(m => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          method === m
                            ? 'bg-amber-900/40 border-amber-600/60 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg && (
              <p className={`mt-3 text-sm font-semibold text-center ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>
                {msg.text}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => { setAction(null); setMsg(null); setAmount(''); }}
                className="w-14 bg-slate-700 text-slate-300 rounded-2xl font-bold text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
