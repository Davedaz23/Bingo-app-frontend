'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { BingoCardDisplay } from './BingoCardDisplay';
import { CalledNumbersPanel } from './CalledNumbersPanel';

const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const LETTER_COLORS: Record<string, string> = {
  B: 'text-blue-400', I: 'text-emerald-400', N: 'text-amber-400', G: 'text-purple-400', O: 'text-red-400',
};

export function GameScreen({ onSelectCard, ws }: { onSelectCard: () => void; ws: any }) {
  const { gameStatus, gameNumber, calledNumbers, currentCall, prizePool, playerCount, myCardNumber, myCardData, winner } = useGameStore();
  const { user } = useAuthStore();
  const [prevCall, setPrevCall] = useState<number | null>(null);
  const [callAnim, setCallAnim] = useState(false);
  const callRef = useRef<number | null>(null);

  // Animate on new call
  useEffect(() => {
    if (currentCall && currentCall !== callRef.current) {
      callRef.current = currentCall;
      setCallAnim(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCallAnim(true);
          setPrevCall(currentCall);
        });
      });
    }
  }, [currentCall]);

  const currentLetter = currentCall ? LETTERS[Math.floor((currentCall - 1) / 15)] : null;

  return (
    <div className="p-3 pb-2 space-y-3">
      {/* Prize Pool Banner */}
      <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-700/30 rounded-2xl px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-amber-600 uppercase tracking-widest font-bold">Prize Pool</div>
          <div className={`text-3xl font-black text-amber-400 ${prizePool > 0 ? 'prize-glow' : ''}`}>
            {prizePool.toLocaleString()} ብር
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{playerCount} players · 50 ብር entry</div>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            gameStatus === 'live' ? 'bg-red-900/40 border-red-600/40 text-red-400' :
            gameStatus === 'ended' ? 'bg-slate-800 border-slate-600 text-slate-400' :
            'bg-green-900/40 border-green-600/40 text-green-400'
          }`}>
            {gameStatus === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
            {gameStatus === 'live' ? `LIVE #${gameNumber}` :
             gameStatus === 'ended' ? 'ENDED' : 'WAITING'}
          </div>
          <div className="text-xs text-slate-500 mt-1">{calledNumbers.length}/75 called</div>
        </div>
      </div>

      {/* Current Call — big visual */}
      {(currentCall || gameStatus === 'live') && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            {currentCall ? (
              <div className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-amber-500/50 ${callAnim ? 'number-flash' : ''}`}>
                <span className={`text-xs font-black ${currentLetter ? LETTER_COLORS[currentLetter] : ''}`}>
                  {currentLetter}
                </span>
                <span className="text-3xl font-black text-white leading-none">{currentCall}</span>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                <span className="text-slate-500 text-xs text-center">Waiting for first call</span>
              </div>
            )}
            <div className="flex-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Latest Call</div>
              {currentCall && currentLetter && (
                <div className={`text-lg font-black ${LETTER_COLORS[currentLetter]}`}>
                  {currentLetter}-{currentCall}
                </div>
              )}
              <div className="text-xs text-slate-400 mt-1">
                {calledNumbers.length > 0
                  ? `${calledNumbers.length} numbers called`
                  : 'Game starting soon...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Called Numbers Panel */}
      <CalledNumbersPanel numbers={calledNumbers} latest={currentCall} />

      {/* My Card */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            My Card {myCardNumber && <span className="text-amber-400 ml-1">#{myCardNumber}</span>}
          </div>
          <button
            onClick={onSelectCard}
            className="text-xs bg-slate-800 border border-slate-600 hover:border-amber-500 text-slate-300 rounded-lg px-2.5 py-1 transition-colors font-medium"
          >
            {myCardNumber ? '↺ Change' : '+ Select Card'}
          </button>
        </div>

        {myCardData && myCardNumber ? (
          <BingoCardDisplay
            columns={myCardData}
            calledNumbers={calledNumbers}
            highlight={currentCall}
          />
        ) : (
          <div className="bg-slate-800/60 border border-dashed border-slate-600 rounded-2xl py-10 text-center">
            <div className="text-4xl mb-3">🃏</div>
            <p className="text-slate-400 font-semibold">No card selected</p>
            <p className="text-slate-600 text-sm mt-1">Select a card to play</p>
            <button
              onClick={onSelectCard}
              className="mt-4 bg-amber-500 text-black font-black rounded-xl px-6 py-2.5 text-sm"
            >
              Pick a Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
