import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { User, UserRole } from '../types';
import { authApi } from '../api';

const TOKEN_KEY = 'csnews_token';
const USER_KEY  = 'csnews_user';

export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (minRole: UserRole) => boolean;
  canWrite: boolean;
  isAdmin: boolean;
}

const ROLE_LEVEL: Record<UserRole, number> = { Reader: 0, Editor: 1, Admin: 2 };

export const AuthContext = createContext<AuthStore | null>(null);

export function useAuthStore(): AuthStore {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used inside AuthProvider');
  return ctx;
}

export function useAuthState(): AuthStore {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); }
    catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const persist = (tok: string, u: User) => {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(tok);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      persist(res.token, res.user);
    } finally { setIsLoading(false); }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({ username, email, password });
      persist(res.token, res.user);
    } finally { setIsLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((minRole: UserRole) => {
    if (!user) return false;
    return ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole];
  }, [user]);

  return {
    user, token,
    isAuthenticated: !!token && !!user,
    isLoading, login, register, logout, hasRole,
    canWrite: !!user && ['Editor', 'Admin'].includes(user.role),
    isAdmin:  user?.role === 'Admin',
  };
}