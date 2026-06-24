// @ts-nocheck
// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const ENC_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '';

// AES-256-GCM encrypt using Web Crypto API
async function encryptPayload(data: unknown): Promise<{ iv: string; ciphertext: string; tag: string }> {
  const keyBytes = hexToBytes(ENC_KEY.padEnd(64, '0').slice(0, 64));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encBuf = keyBytes.buffer as ArrayBuffer;
  const key = await crypto.subtle.importKey('raw', encBuf, 'AES-GCM', false, ['encrypt']);
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, encoded);
  // Web Crypto appends 16-byte auth tag at the end
  const enc = new Uint8Array(encrypted);
  const ciphertext = enc.slice(0, enc.length - 16);
  const tag = enc.slice(enc.length - 16);
  return {
    iv: bytesToHex(iv),
    ciphertext: bytesToHex(ciphertext),
    tag: bytesToHex(tag),
  };
}

// AES-256-GCM decrypt
async function decryptPayload(payload: { iv: string; ciphertext: string; tag: string }): Promise<unknown> {
  const keyBytes = hexToBytes(ENC_KEY.padEnd(64, '0').slice(0, 64));
  const iv = hexToBytes(payload.iv);
  const ciphertext = hexToBytes(payload.ciphertext);
  const tag = hexToBytes(payload.tag);
  const buf = new ArrayBuffer(ciphertext.length + tag.length);
  const combined = new Uint8Array(buf);
  combined.set(ciphertext as unknown as ArrayLike<number>, 0);
  combined.set(tag as unknown as ArrayLike<number>, ciphertext.length);
  const key = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, buf);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

function hexToBytes(hex: string): Uint8Array {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshing = false;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, timeout: 10000 });

    // Request interceptor — attach token and encrypt body
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

    // Response interceptor — decrypt body and refresh token on 401
    this.client.interceptors.response.use(
      async (response) => {
        if (response.data?.data) {
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
      }
    );

    // Load from localStorage
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
      window.location.href = '/';
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

// Auth APIs
export const authApi = {
  // Primary: Telegram Mini App auto-auth (no registration form needed)
  telegramAuth: (initData: string) => api.post('/auth/telegram', { initData }),
  // Fallback: dev/admin login
  login: (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Wallet APIs
export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`),
  deposit: (amount: number, method: string) => api.post('/wallet/deposit', { amount, method }),
  withdraw: (amount: number, method: string) => api.post('/wallet/withdraw', { amount, method }),
  transfer: (toPhone: string, amount: number) => api.post('/wallet/transfer', { toPhone, amount }),
};

// Game APIs
export const gameApi = {
  getCards: (page = 1) => api.get(`/game/cards?page=${page}&limit=100`),
  getCard: (cardNumber: number) => api.get(`/game/cards/${cardNumber}`),
  selectCard: (cardNumber: number) => api.post('/game/cards/select', { cardNumber }),
  releaseCard: (cardNumber: number) => api.post('/game/cards/release', { cardNumber }),
  getCurrentGame: () => api.get('/game/current'),
};

// Admin APIs
export const adminApi = {
  getConfig: () => api.get('/admin/config'),
  updateConfig: (updates: Record<string, unknown>) => api.patch('/admin/config', updates),
  getPlayers: (page = 1) => api.get(`/admin/players?page=${page}`),
  banPlayer: (userId: string, ban: boolean) => api.patch('/admin/players/ban', { userId, ban }),
  adjustBalance: (userId: string, amount: number, reason: string) =>
    api.patch('/admin/players/balance', { userId, amount, reason }),
  getStats: () => api.get('/admin/stats'),
  startGame: () => api.post('/admin/game/start'),
  resetGame: () => api.post('/admin/game/reset'),
  callNumber: (number: number) => api.post('/admin/game/call', { number }),
};

// Add telegramAuth to authApi (patch at module level)
// Already exported above — add this line to authApi:
// telegramAuth: (initData: string) => api.post('/auth/telegram', { initData }),
// login: (phone: string, password: string) => api.post('/auth/login', { phone, password }),
