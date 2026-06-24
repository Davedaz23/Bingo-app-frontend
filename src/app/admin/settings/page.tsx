'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AppConfig } from '@/types';

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [config, setConfig] = useState<AppConfig>({});

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    adminAPI.getConfig().then(r => setConfig(r.data.config)).catch(() => {});
  }, [isAuthenticated, user]);

  async function updateConfig(key: string, value: any) {
    try {
      await adminAPI.updateConfig({ [key]: value });
      setConfig(prev => ({ ...prev, [key]: value }));
    } catch {}
  }

  if (!isAuthenticated || user?.role !== 'admin') return <div className="min-h-screen bg-bingo-bg flex items-center justify-center"><p className="text-slate-500">Admin access only</p></div>;

  const fields = [
    { key: 'entry_fee', label: 'Entry Fee (ብር)', type: 'number' },
    { key: 'call_interval_seconds', label: 'Call Interval (sec)', type: 'number' },
    { key: 'max_players', label: 'Max Players', type: 'number' },
    { key: 'registration_bonus', label: 'Registration Bonus (ብር)', type: 'number' },
    { key: 'min_deposit', label: 'Min Deposit (ብር)', type: 'number' },
    { key: 'min_withdrawal', label: 'Min Withdrawal (ብር)', type: 'number' },
    { key: 'house_fee_percent', label: 'House Fee (%)', type: 'number' },
  ];

  return (
    <div className="min-h-screen bg-bingo-bg p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-slate-400 text-lg">←</Link>
        <h1 className="text-xl font-black text-white">⚙️ Settings</h1>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl divide-y divide-slate-700/50">
        {fields.map(f => (
          <div key={f.key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-300 font-medium">{f.label}</span>
            <input type="number" className="w-24 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white text-right focus:border-amber-500 outline-none"
              value={(config[f.key] as string | number) ?? ''} onChange={e => updateConfig(f.key, Number(e.target.value))} />
          </div>
        ))}
        <ToggleRow label="Auto-call Numbers" value={!!config.auto_call} onChange={v => updateConfig('auto_call', v)} />
        <ToggleRow label="Allow Card Change" value={!!config.allow_card_change} onChange={v => updateConfig('allow_card_change', v)} />
        <ToggleRow label="Deposits Enabled" value={!!config.deposits_enabled} onChange={v => updateConfig('deposits_enabled', v)} />
        <ToggleRow label="Withdrawals Enabled" value={!!config.withdrawals_enabled} onChange={v => updateConfig('withdrawals_enabled', v)} />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
