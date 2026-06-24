import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse, User, Tokens, CardStatus, CardPreview, Transaction, DepositRequest, DepositAccounts, WithdrawalRequest, AppConfig, GameState } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const ENC_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

// ── Encryption helpers (AES-256-GCM) ─────────────────────────────────────────
function hexToBytes(hex: string): Uint8Array {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptPayload(data: unknown): Promise<{ iv: string; ciphertext: string; tag: string }> {
  const keyBytes = hexToBytes(ENC_KEY.padEnd(64, '0').slice(0, 64));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt']);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, encoded);
  const enc = new Uint8Array(encrypted);
  const ciphertext = enc.slice(0, enc.length - 16);
  const tag = enc.slice(enc.length - 16);
  return { iv: bytesToHex(iv), ciphertext: bytesToHex(ciphertext), tag: bytesToHex(tag) };
}

async function decryptPayload(payload: { iv: string; ciphertext: string; tag: string }): Promise<unknown> {
  const keyBytes = hexToBytes(ENC_KEY.padEnd(64, '0').slice(0, 64));
  const iv = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const tag = hexToBytes(payload.tag);
  const combined = new Uint8Array(new ArrayBuffer(ciphertext.length + tag.length));
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);
  const key = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, combined.buffer as ArrayBuffer);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── API Client ───────────────────────────────────────────────────────────────
class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshing = false;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

    this.client.interceptors.request.use(async (config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      if (config.data && typeof config.data === 'object') {
        const encrypted = await encryptPayload(config.data);
        config.data = { data: encrypted };
      }
      return config;
    });

    this.client.interceptors.response.use(
      async (response) => {
        if (response.data?.data?.iv) {
          response.data = await decryptPayload(response.data.data);
        }
        return response;
      },
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry && this.refreshToken) {
          original._retry = true;
          const refreshed = await this.doRefresh();
          if (refreshed) {
            original.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client(original);
          }
        }
        return Promise.reject(error);
      },
    );

    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async doRefresh(): Promise<boolean> {
    if (this.refreshing) return false;
    this.refreshing = true;
    try {
      const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: this.refreshToken });
      const { tokens } = res.data;
      this.setTokens(tokens.access, tokens.refresh);
      return true;
    } catch {
      this.clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/';
      return false;
    } finally {
      this.refreshing = false;
    }
  }

  get = (url: string, config?: AxiosRequestConfig) => this.client.get(url, config);
  post = (url: string, data?: unknown, config?: AxiosRequestConfig) => this.client.post(url, data, config);
  patch = (url: string, data?: unknown, config?: AxiosRequestConfig) => this.client.patch(url, data, config);
  delete = (url: string, config?: AxiosRequestConfig) => this.client.delete(url, config);
}

export const api = new ApiClient();

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  telegramAuth: (initData: string) => api.post('/auth/telegram', { initData }) as Promise<{ data: AuthResponse }>,
  login: (phone: string, password: string) => api.post('/auth/login', { phone, password }) as Promise<{ data: AuthResponse }>,
  me: () => api.get('/auth/me') as Promise<{ data: { success: boolean; user: User } }>,
  logout: () => api.post('/auth/logout') as Promise<{ data: { success: boolean } }>,
};

// ── Wallet API ───────────────────────────────────────────────────────────────
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance') as Promise<{ data: { balance: number } }>,
  getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`) as Promise<{ data: { transactions: Transaction[] } }>,
  getDepositAccounts: () => api.get('/wallet/deposit/accounts') as Promise<{ data: { accounts: DepositAccounts } }>,
  requestDeposit: (amount: number, channel: string, smsText: string) =>
    api.post('/wallet/deposit', { amount, channel, smsText }) as Promise<{ data: { success: boolean; message: string } }>,
  withdraw: (amount: number, method: string, accountNumber: string) =>
    api.post('/wallet/withdraw', { amount, method, accountNumber }) as Promise<{ data: { success: boolean; message: string } }>,
  transfer: (toPhone: string, amount: number) => api.post('/wallet/transfer', { toPhone, amount }) as Promise<{ data: { balance: number; message: string } }>,
};

// ── Game API ─────────────────────────────────────────────────────────────────
export const gameAPI = {
  getCards: (page = 1) => api.get(`/game/cards?page=${page}&limit=100`) as Promise<{ data: { cards: CardStatus[] } }>,
  getCard: (cardNumber: number) => api.get(`/game/cards/${cardNumber}`) as Promise<{ data: { card: CardPreview } }>,
  selectCard: (cardNumber: number) => api.post('/game/cards/select', { cardNumber }) as Promise<{ data: { success: boolean } }>,
  releaseCard: (cardNumber: number) => api.post('/game/cards/release', { cardNumber }) as Promise<{ data: { success: boolean } }>,
  getCurrentGame: () => api.get('/game/current') as Promise<{ data: GameState }>,
};

// ── Admin API ────────────────────────────────────────────────────────────────
export const adminAPI = {
  getConfig: () => api.get('/admin/config') as Promise<{ data: { config: AppConfig } }>,
  updateConfig: (updates: Partial<AppConfig>) => api.patch('/admin/config', updates) as Promise<{ data: { success: boolean } }>,
  getPlayers: (page = 1) => api.get(`/admin/players?page=${page}`) as Promise<{ data: { players: User[]; total: number } }>,
  banPlayer: (userId: string, ban: boolean) => api.patch('/admin/players/ban', { userId, ban }) as Promise<{ data: { success: boolean } }>,
  adjustBalance: (userId: string, amount: number, reason: string) =>
    api.patch('/admin/players/balance', { userId, amount, reason }) as Promise<{ data: { balance: number } }>,
  getStats: () => api.get('/admin/stats') as Promise<{ data: { stats: { totalPlayers: number; gamesPlayed: number; totalDeposits: number } } }>,
  startGame: () => api.post('/admin/game/start') as Promise<{ data: { success: boolean } }>,
  resetGame: () => api.post('/admin/game/reset') as Promise<{ data: { success: boolean } }>,
  callNumber: (number: number) => api.post('/admin/game/call', { number }) as Promise<{ data: { success: boolean } }>,
  getDepositRequests: () => api.get('/admin/deposits') as Promise<{ data: { requests: DepositRequest[] } }>,
  matchSmsDeposit: (id: string, adminSmsText: string) =>
    api.post(`/admin/deposits/${id}/match`, { adminSmsText }) as Promise<{ data: { success: boolean } }>,
  confirmDeposit: (id: string) => api.post(`/admin/deposits/${id}/confirm`) as Promise<{ data: { success: boolean; balance: number } }>,
  rejectDeposit: (id: string) => api.post(`/admin/deposits/${id}/reject`) as Promise<{ data: { success: boolean } }>,
  getWithdrawals: () => api.get('/admin/withdrawals') as Promise<{ data: { withdrawals: WithdrawalRequest[] } }>,
  approveWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/approve`) as Promise<{ data: { success: boolean } }>,
  rejectWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/reject`) as Promise<{ data: { success: boolean } }>,
};
