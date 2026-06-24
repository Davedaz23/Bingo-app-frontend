'use client';
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { gameApi } from '@/lib/api';
import { GameScreen } from './game/GameScreen';
import { CardSelectScreen } from './game/CardSelectScreen';
import { WalletScreen } from './wallet/WalletScreen';
import { PlayersScreen } from './game/PlayersScreen';
import { AdminScreen } from './admin/AdminScreen';
import { TopBar } from './ui/TopBar';
import { BottomNav } from './ui/BottomNav';
import { WelcomeBonusModal } from './ui/WelcomeBonusModal';
import { WinnerModal } from './game/WinnerModal';
import { ReconnectBanner } from './ui/ReconnectBanner';

type Screen = 'game' | 'cards' | 'wallet' | 'players' | 'admin';

export function BingoApp({ isNew }: { isNew: boolean }) {
  const [screen, setScreen] = useState<Screen>('game');
  const [showBonus, setShowBonus] = useState(isNew);
  const { connected, winner, setCards } = useGameStore();
  const { user } = useAuthStore();
  const ws = useWebSocket();

  // Load all 400 card statuses on mount
  useEffect(() => {
    async function loadCards() {
      try {
        const res = await gameApi.getCards(1);
        setCards(res.data.cards);
        // Also load page 2, 3, 4 for all 400
        const [r2, r3, r4] = await Promise.all([
          gameApi.getCards(2),
          gameApi.getCards(3),
          gameApi.getCards(4),
        ]);
        setCards([...res.data.cards, ...r2.data.cards, ...r3.data.cards, ...r4.data.cards]);
      } catch {}
    }
    loadCards();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-bingo-bg overflow-hidden">
      {!connected && <ReconnectBanner />}

      <TopBar onAdminClick={() => setScreen('admin')} />

      <div className="flex-1 overflow-hidden relative">
        <div className={screen === 'game' ? 'block h-full overflow-y-auto' : 'hidden'}>
          <GameScreen onSelectCard={() => setScreen('cards')} ws={ws} />
        </div>
        <div className={screen === 'cards' ? 'block h-full overflow-y-auto' : 'hidden'}>
          <CardSelectScreen onDone={() => setScreen('game')} ws={ws} />
        </div>
        <div className={screen === 'wallet' ? 'block h-full overflow-y-auto' : 'hidden'}>
          <WalletScreen />
        </div>
        <div className={screen === 'players' ? 'block h-full overflow-y-auto' : 'hidden'}>
          <PlayersScreen />
        </div>
        {user?.role === 'admin' && (
          <div className={screen === 'admin' ? 'block h-full overflow-y-auto' : 'hidden'}>
            <AdminScreen ws={ws} />
          </div>
        )}
      </div>

      <BottomNav
        current={screen}
        onChange={setScreen}
        isAdmin={user?.role === 'admin'}
      />

      {showBonus && <WelcomeBonusModal onClose={() => setShowBonus(false)} />}
      {winner && <WinnerModal winner={winner} />}
    </div>
  );
}
