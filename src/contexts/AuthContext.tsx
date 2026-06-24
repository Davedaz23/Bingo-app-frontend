'use client';
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, authAPI } from '@/services/api';
import type { User, Tokens } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => {
          api.clearTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newUser: User, tokens: Tokens) => {
    api.setTokens(tokens.access, tokens.refresh);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {});
    api.clearTokens();
    setUser(null);
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setUser(prev => prev ? { ...prev, balance } : null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data.user);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateBalance,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
