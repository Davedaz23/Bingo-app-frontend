// ── User & Auth ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  phone: string;
  balance: number;
  role: 'player' | 'admin';
  totalWon: number;
  totalPlayed: number;
  telegramId?: string;
  telegramUsername?: string;
  telegramPhotoUrl?: string;
  createdAt?: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

// ── Game ─────────────────────────────────────────────────────────────────────
export type GameStatus = 'waiting' | 'live' | 'ended';
export type Screen = 'game' | 'cards' | 'wallet' | 'players' | 'admin';

export interface CardStatus {
  cardNumber: number;
  taken: boolean;
  mine: boolean;
}

export interface OnlinePlayer {
  userId: string;
  name: string;
  cardId: number | null;
  online: boolean;
}

export interface Winner {
  winnerId: string;
  winnerName: string;
  cardNumber: number;
  pattern: string;
  prizeAmount: number;
  calledNumbers: number[];
}

export interface GameState {
  gameNumber: number;
  status: GameStatus;
  calledNumbers: number[];
  currentCall: number | null;
  prizePool: number;
  playerCount: number;
  entryFee: number;
}

// ── Card ─────────────────────────────────────────────────────────────────────
export interface CardPreview {
  cardNumber: number;
  columns: (number | null)[][];
}

// ── Wallet / Payments ────────────────────────────────────────────────────────
export interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface DepositRequest {
  _id: string;
  userId: { _id: string; name: string; phone: string };
  amount: number;
  channel: string;
  userSmsText: string;
  adminSmsText?: string;
  status: 'pending' | 'sms_matched' | 'completed' | 'rejected';
  createdAt: string;
}

export interface DepositAccounts {
  cbe: string;
  cbebirr: string;
  abyssinia: string;
  telebirr: string;
  accountName: string;
}

export interface WithdrawalRequest {
  _id: string;
  userId: { _id: string; name: string; phone: string };
  amount: number;
  method: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  tokens: Tokens;
  isNew?: boolean;
  welcomeBonus?: number;
}

// ── Config ───────────────────────────────────────────────────────────────────
export interface AppConfig {
  entry_fee?: number;
  call_interval_seconds?: number;
  auto_call?: boolean;
  max_players?: number;
  allow_card_change?: boolean;
  registration_bonus?: number;
  min_deposit?: number;
  min_withdrawal?: number;
  house_fee_percent?: number;
  deposits_enabled?: boolean;
  withdrawals_enabled?: boolean;
  voice_call?: boolean;
  call_order?: 'random' | 'sequential';
  [key: string]: unknown;
}

// ── Telegram ─────────────────────────────────────────────────────────────────
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: { user?: TelegramUser };
        ready: () => void;
        expand: () => void;
        MainButton: { show: () => void; hide: () => void; setText: (t: string) => void };
        BackButton: { show: () => void; hide: () => void };
        themeParams: Record<string, string>;
        colorScheme: string;
        close: () => void;
      };
    };
  }
}
