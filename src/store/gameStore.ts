// src/store/gameStore.ts
import { create } from 'zustand';

interface OnlinePlayer {
  userId: string;
  name: string;
  cardId: number | null;
  online: boolean;
}

interface CardStatus {
  cardNumber: number;
  taken: boolean;
  mine: boolean;
}

interface Winner {
  winnerId: string;
  winnerName: string;
  cardNumber: number;
  pattern: string;
  prizeAmount: number;
  calledNumbers: number[];
}

interface GameState {
  connected: boolean;
  gameStatus: 'waiting' | 'live' | 'ended';
  gameNumber: number;
  calledNumbers: number[];
  currentCall: number | null;
  prizePool: number;
  playerCount: number;
  onlinePlayers: OnlinePlayer[];
  myCardNumber: number | null;
  myCardData: (number | null)[][] | null;
  cards: CardStatus[];
  winner: Winner | null;

  setConnected: (v: boolean) => void;
  setGameStatus: (v: 'waiting' | 'live' | 'ended') => void;
  setGameNumber: (v: number) => void;
  setCalledNumbers: (v: number[]) => void;
  setCurrentCall: (v: number | null) => void;
  setPrizePool: (v: number) => void;
  setPlayerCount: (v: number) => void;
  setOnlinePlayers: (v: OnlinePlayer[]) => void;
  setMyCard: (cardNumber: number | null, columns: (number | null)[][] | null) => void;
  setCards: (v: CardStatus[]) => void;
  updateCardTaken: (cardId: number, taken: boolean) => void;
  setWinner: (v: Winner | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  connected: false,
  gameStatus: 'waiting',
  gameNumber: 0,
  calledNumbers: [],
  currentCall: null,
  prizePool: 0,
  playerCount: 0,
  onlinePlayers: [],
  myCardNumber: null,
  myCardData: null,
  cards: [],
  winner: null,

  setConnected: (connected) => set({ connected }),
  setGameStatus: (gameStatus) => set({ gameStatus }),
  setGameNumber: (gameNumber) => set({ gameNumber }),
  setCalledNumbers: (calledNumbers) => set({ calledNumbers }),
  setCurrentCall: (currentCall) => set({ currentCall }),
  setPrizePool: (prizePool) => set({ prizePool }),
  setPlayerCount: (playerCount) => set({ playerCount }),
  setOnlinePlayers: (onlinePlayers) => set({ onlinePlayers }),
  setMyCard: (myCardNumber, myCardData) => set({ myCardNumber, myCardData }),
  setCards: (cards) => set({ cards }),
  updateCardTaken: (cardId, taken) =>
    set((s) => ({
      cards: s.cards.map((c) => c.cardNumber === cardId ? { ...c, taken } : c),
    })),
  setWinner: (winner) => set({ winner }),
}));
