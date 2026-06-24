'use client';
import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { gameApi } from '@/lib/api';
import { BingoCardDisplay } from './BingoCardDisplay';

interface CardPreview {
  cardNumber: number;
  columns: (number | null)[][];
}

export function CardSelectScreen({ onDone, ws }: { onDone: () => void; ws: any }) {
  const { cards, myCardNumber, setMyCard, setCards, updateCardTaken, calledNumbers, gameStatus } = useGameStore();
  const { user, updateBalance } = useAuthStore();
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<CardPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const filtered = useMemo(() => {
    if (!search) return cards;
    return cards.filter(c => String(c.cardNumber).includes(search));
  }, [cards, search]);

  async function openPreview(cardNumber: number) {
    try {
      const res = await gameApi.getCard(cardNumber);
      setPreview({ cardNumber, columns: res.data.card.columns });
    } catch {}
  }

  async function selectCard(cardNumber: number) {
    setLoading(true);
    setMsg('');
    try {
      // Try HTTP API directly (WebSocket is optimistic)
      await gameApi.selectCard(cardNumber);
      // Fetch full card data
      const res = await gameApi.getCard(cardNumber);
      setMyCard(cardNumber, res.data.card.columns);
      // Update cards list
      if (myCardNumber && myCardNumber !== cardNumber) {
        updateCardTaken(myCardNumber, false);
      }
      updateCardTaken(cardNumber, true);
      // Notify via WebSocket if connected
      ws.emitSelectCard(cardNumber, () => {});
      setPreview(null);
      setMsg('');
      onDone();
    } catch (err: any) {
      setMsg(err?.response?.data?.message || 'Card unavailable');
    }
    setLoading(false);
  }

  async function releaseCard() {
    if (!myCardNumber) return;
    setLoading(true);
    try {
      await gameApi.releaseCard(myCardNumber);
      ws.emitReleaseCard(myCardNumber, () => {});
      setMyCard(null, null);
      updateCardTaken(myCardNumber, false);
    } catch {}
    setLoading(false);
    setPreview(null);
  }

  return (
    <div className="p-3 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-black text-white">Select Card</h2>
          <p className="text-xs text-slate-500">
            {cards.filter(c => !c.taken).length} available · {cards.filter(c => c.taken).length} taken
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Mine</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Taken</span>
        </div>
      </div>

      {/* Search */}
      <input
        className="w-full mb-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 outline-none"
        placeholder="🔍 Search card #..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* My current card info */}
      {myCardNumber && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-2.5 mb-3 flex items-center justify-between">
          <span className="text-sm text-green-400 font-semibold">My card: <strong>#{myCardNumber}</strong></span>
          <button
            onClick={releaseCard}
            className="text-xs text-red-400 border border-red-700/40 rounded-lg px-2.5 py-1 hover:bg-red-900/20"
          >
            Release
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {filtered.map(card => (
          <button
            key={card.cardNumber}
            onClick={() => !card.taken || card.mine ? openPreview(card.cardNumber) : undefined}
            disabled={card.taken && !card.mine}
            className={`
              rounded-xl p-2 text-center transition-all border
              ${card.mine
                ? 'bg-green-900/30 border-green-600/60 ring-1 ring-green-500/30'
                : card.taken
                ? 'bg-red-950/60 border-red-900/50 opacity-50 cursor-not-allowed'
                : 'bg-slate-800 border-slate-700 hover:border-amber-500/60 hover:bg-slate-700 active:scale-95'}
              ${card.cardNumber === myCardNumber ? 'ring-2 ring-green-500' : ''}
            `}
          >
            <div className={`text-[10px] font-black ${card.mine ? 'text-green-400' : card.taken ? 'text-red-500' : 'text-slate-400'}`}>
              #{card.cardNumber}
            </div>
            {/* Mini dot grid */}
            <div className="grid grid-cols-5 gap-[1px] mt-1">
              {Array(25).fill(0).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-[1px] ${
                    card.mine ? 'bg-green-600' : card.taken ? 'bg-red-900' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Card Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 w-full max-w-md sheet-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">
                Card #{preview.cardNumber}
                {cards.find(c => c.cardNumber === preview.cardNumber)?.mine && (
                  <span className="ml-2 text-green-400 text-xs">(Your card)</span>
                )}
              </h3>
              <button onClick={() => setPreview(null)} className="text-slate-500 text-xl">✕</button>
            </div>

            <BingoCardDisplay columns={preview.columns} calledNumbers={calledNumbers} highlight={null} />

            {msg && <p className="text-red-400 text-sm mt-3 text-center">{msg}</p>}

            <div className="flex gap-2 mt-4">
              {cards.find(c => c.cardNumber === preview.cardNumber)?.mine ? (
                <>
                  <button
                    onClick={releaseCard}
                    disabled={loading}
                    className="flex-1 bg-red-800/60 border border-red-700/60 text-red-300 rounded-2xl py-3.5 font-bold text-sm"
                  >
                    Release Card
                  </button>
                  <button onClick={() => setPreview(null)} className="flex-1 bg-slate-700 text-slate-300 rounded-2xl py-3.5 font-bold text-sm">
                    Keep It
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => selectCard(preview.cardNumber)}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black rounded-2xl py-3.5 disabled:opacity-50"
                  >
                    {loading ? 'Selecting...' : 'Select This Card'}
                  </button>
                  <button onClick={() => setPreview(null)} className="w-12 bg-slate-700 text-slate-300 rounded-2xl font-bold text-lg">
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
