// src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const { accessToken } = useAuthStore();
  const {
    setConnected,
    setCalledNumbers,
    setCurrentCall,
    setGameStatus,
    setGameNumber,
    setPrizePool,
    setPlayerCount,
    setOnlinePlayers,
    updateCardTaken,
    setWinner,
  } = useGameStore();

  const connect = useCallback(() => {
    if (!accessToken) return;
    if (socketRef.current?.connected) return;

    const s = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = s;
    socket = s;

    s.on('connect', () => {
      setConnected(true);
      clearTimeout(reconnectTimer.current);
    });

    s.on('disconnect', () => {
      setConnected(false);
      // Force reconnect attempt after 2s
      reconnectTimer.current = setTimeout(() => {
        if (!s.connected) s.connect();
      }, 2000);
    });

    s.on('connect_error', () => {
      setConnected(false);
    });

    // Game events
    s.on('game_state', (data) => {
      setGameStatus(data.status);
      setGameNumber(data.gameNumber);
      setCalledNumbers(data.calledNumbers || []);
      if (data.currentCall) setCurrentCall(data.currentCall);
      setPrizePool(data.prizePool || 0);
      setPlayerCount(data.playerCount || 0);
    });

    s.on('game_started', (data) => {
      setGameStatus('live');
      setGameNumber(data.gameNumber);
      setPrizePool(0);
      setCalledNumbers([]);
      setCurrentCall(null);
    });

    s.on('number_called', (data) => {
      setCurrentCall(data.number);
      setCalledNumbers(data.calledNumbers);
    });

    s.on('card_updated', (data) => {
      updateCardTaken(data.cardId, data.taken);
    });

    s.on('presence_update', (data) => {
      setOnlinePlayers(data.players || []);
    });

    s.on('prize_pool_updated', (data) => {
      setPrizePool(data.prizePool);
      setPlayerCount(data.playerCount);
    });

    s.on('game_won', (data) => {
      setGameStatus('ended');
      setWinner(data);
    });

    s.on('game_reset', () => {
      setGameStatus('waiting');
      setCalledNumbers([]);
      setCurrentCall(null);
      setPrizePool(0);
      setWinner(null);
    });
  }, [accessToken]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      socketRef.current?.disconnect();
    };
  }, [connect]);

  const emitSelectCard = (cardId: number, cb?: (result: { success: boolean; message?: string }) => void) => {
    if (!socketRef.current?.connected) { cb?.({ success: false, message: 'Not connected' }); return; }
    socketRef.current.emit('select_card', { cardId }, cb);
  };

  const emitReleaseCard = (cardId: number, cb?: (result: { success: boolean }) => void) => {
    if (!socketRef.current?.connected) { cb?.({ success: false }); return; }
    socketRef.current.emit('release_card', { cardId }, cb);
  };

  const emitAdminCall = (number: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('admin_call_number', { number });
  };

  const emitStartGame = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('admin_start_game', {});
  };

  const emitResetGame = () => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('admin_reset_game', {});
  };

  return { emitSelectCard, emitReleaseCard, emitAdminCall, emitStartGame, emitResetGame };
}

export { socket };
