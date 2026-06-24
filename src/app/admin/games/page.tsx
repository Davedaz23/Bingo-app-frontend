'use client';
import { useState } from 'react';
import Link from 'next/link';
import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminGamesPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function handleStart() {
    setLoading('start');
    try {
      await adminAPI.startGame();
      setMsg('✅ Game started!');
    } catch { setMsg('❌ Failed to start game'); }
    setLoading(null);
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleReset() {
    if (!confirm('Reset game and release all cards?')) return;
    setLoading('reset');
    try {
      await adminAPI.resetGame();
      setMsg('✅ Game reset');
    } catch { setMsg('❌ Failed to reset'); }
    setLoading(null);
    setTimeout(() => setMsg(''), 3000);
  }

  if (!isAuthenticated || user?.role !== 'admin') return <div className="min-h-screen bg-bingo-bg flex items-center justify-center"><p className="text-slate-500">Admin access only</p></div>;

  return (
    <div className="min-h-screen bg-bingo-bg p-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-slate-400 text-lg">←</Link>
        <h1 className="text-xl font-black text-white">🎮 Game Management</h1>
      </div>

      {msg && <p className="text-sm text-center mb-4 text-amber-400 font-semibold">{msg}</p>}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleStart} disabled={loading === 'start'}
          className="bg-gradient-to-r from-green-700 to-green-500 text-white font-black rounded-2xl py-6 text-lg disabled:opacity-50">
          ▶ Start Game
        </button>
        <button onClick={handleReset} disabled={loading === 'reset'}
          className="bg-gradient-to-r from-red-900 to-red-700 text-white font-black rounded-2xl py-6 text-lg disabled:opacity-50">
          ⟳ Reset Game
        </button>
      </div>
    </div>
  );
}
