'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

type Tab = 'game' | 'numbers' | 'finance' | 'players';

export function AdminScreen({ ws }: { ws: any }) {
  const [tab, setTab] = useState<Tab>('game');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [players, setPlayers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [manualNum, setManualNum] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState('');

  useEffect(() => {
    adminApi.getConfig().then(r => setConfig(r.data.config)).catch(() => {});
    adminApi.getStats().then(r => setStats(r.data.stats)).catch(() => {});
    adminApi.getPlayers().then(r => setPlayers(r.data.players)).catch(() => {});
  }, []);

  async function saveConfig(key: string, value: any) {
    try {
      await adminApi.updateConfig({ [key]: value });
      setConfig(prev => ({ ...prev, [key]: value }));
    } catch {}
  }

  async function startGame() {
    setLoading('start');
    try {
      await adminApi.startGame();
      setMsg('✅ Game started!');
    } catch { setMsg('❌ Failed'); }
    setLoading('');
  }

  async function resetGame() {
    if (!confirm('Reset game and release all cards?')) return;
    setLoading('reset');
    try {
      await adminApi.resetGame();
      setMsg('✅ Game reset');
    } catch { setMsg('❌ Failed'); }
    setLoading('');
  }

  async function callManual() {
    const n = parseInt(manualNum);
    if (!n || n < 1 || n > 75) return setMsg('Enter 1–75');
    try {
      await adminApi.callNumber(n);
      setMsg(`📢 Called ${n}`);
    } catch {
      setMsg('❌ Failed to call number');
    }
    setManualNum('');
    setTimeout(() => setMsg(''), 2000);
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'game', label: 'Game', icon: '🎮' },
    { id: 'numbers', label: 'Numbers', icon: '📢' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'players', label: 'Players', icon: '👥' },
  ];

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-black text-white">⚙️ Admin Panel</h2>
        {stats && (
          <div className="text-xs text-slate-500">{stats.totalPlayers} players</div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Players', value: stats.totalPlayers },
            { label: 'Games', value: stats.gamesPlayed },
            { label: 'Deposits', value: `${stats.totalDeposits?.toFixed(0)} ብር` },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-2 text-center">
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-sm font-black text-amber-400">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
              tab === t.id
                ? 'bg-amber-500 text-black border-amber-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-center mb-3 text-amber-400 font-semibold">{msg}</p>}

      {/* Game Tab */}
      {tab === 'game' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={startGame}
              disabled={loading === 'start'}
              className="bg-gradient-to-r from-green-700 to-green-500 text-white font-black rounded-2xl py-4 text-base disabled:opacity-50"
            >
              ▶ Start Game
            </button>
            <button
              onClick={resetGame}
              disabled={loading === 'reset'}
              className="bg-gradient-to-r from-red-900 to-red-700 text-white font-black rounded-2xl py-4 text-base disabled:opacity-50"
            >
              ⟳ Reset
            </button>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl divide-y divide-slate-700/50">
            {[
              { key: 'entry_fee', label: 'Entry Fee (ብር)', type: 'number' },
              { key: 'call_interval_seconds', label: 'Call Interval (sec)', type: 'number' },
              { key: 'max_players', label: 'Max Players', type: 'number' },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-slate-300 font-medium">{f.label}</span>
                <input
                  type="number"
                  className="w-20 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white text-right focus:border-amber-500 outline-none"
                  value={config[f.key] ?? ''}
                  onChange={e => saveConfig(f.key, Number(e.target.value))}
                />
              </div>
            ))}
            <ToggleRow label="Auto-call Numbers" value={!!config.auto_call} onChange={v => saveConfig('auto_call', v)} />
            <ToggleRow label="Allow Card Change Mid-game" value={!!config.allow_card_change} onChange={v => saveConfig('allow_card_change', v)} />
          </div>
        </div>
      )}

      {/* Numbers Tab */}
      {tab === 'numbers' && (
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Manual Number Call</div>
            <div className="flex gap-2">
              <input
                type="number"
                min="1" max="75"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-white text-lg font-bold text-center focus:border-amber-500 outline-none"
                placeholder="1–75"
                value={manualNum}
                onChange={e => setManualNum(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && callManual()}
              />
              <button
                onClick={callManual}
                className="bg-amber-500 text-black font-black rounded-xl px-5 py-3 text-sm"
              >
                📢 Call
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">This broadcasts immediately to all players</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl divide-y divide-slate-700/50">
            <ToggleRow label="Voice Announcement" value={!!config.voice_call} onChange={v => saveConfig('voice_call', v)} />
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-300 font-medium">Call Order</span>
              <select
                className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white focus:border-amber-500 outline-none"
                value={config.call_order || 'random'}
                onChange={e => saveConfig('call_order', e.target.value)}
              >
                <option value="random">Random</option>
                <option value="sequential">Sequential</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {tab === 'finance' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl divide-y divide-slate-700/50">
          {[
            { key: 'registration_bonus', label: 'Registration Bonus (ብር)' },
            { key: 'min_deposit', label: 'Min Deposit (ብር)' },
            { key: 'min_withdrawal', label: 'Min Withdrawal (ብር)' },
            { key: 'house_fee_percent', label: 'House Fee (%)' },
          ].map(f => (
            <div key={f.key} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-300 font-medium">{f.label}</span>
              <input
                type="number"
                className="w-24 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white text-right focus:border-amber-500 outline-none"
                value={config[f.key] ?? ''}
                onChange={e => saveConfig(f.key, Number(e.target.value))}
              />
            </div>
          ))}
          <ToggleRow label="Deposits Enabled" value={!!config.deposits_enabled} onChange={v => saveConfig('deposits_enabled', v)} />
          <ToggleRow label="Withdrawals Enabled" value={!!config.withdrawals_enabled} onChange={v => saveConfig('withdrawals_enabled', v)} />
        </div>
      )}

      {/* Players Tab */}
      {tab === 'players' && (
        <div className="space-y-2">
          {players.length === 0 && <p className="text-slate-500 text-center py-8">No players yet</p>}
          {players.map(p => (
            <div key={p._id} className="bg-slate-800/60 border border-slate-700 rounded-xl flex items-center gap-3 px-3 py-3">
              <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center text-sm font-black">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                <div className="text-xs text-slate-500">{p.balance?.toFixed(2)} ብር</div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm(`Ban ${p.name}?`)) return;
                  await adminApi.banPlayer(p._id, !p.banned);
                  setPlayers(prev => prev.map(pl => pl._id === p._id ? { ...pl, banned: !pl.banned } : pl));
                }}
                className={`text-xs px-2 py-1 rounded-lg border ${
                  p.banned
                    ? 'border-green-700/40 text-green-400'
                    : 'border-red-700/40 text-red-400'
                }`}
              >
                {p.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
