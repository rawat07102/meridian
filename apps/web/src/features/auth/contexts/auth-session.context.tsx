'use client';
import React from 'react';
import { GuestSession, UserSession } from '../auth.interfaces';
import authApi from '../auth.api';

export interface AuthSessionContext {
  session: GuestSession | UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthSessionContext = React.createContext<AuthSessionContext | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<GuestSession | UserSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    }
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const apiRes = await authApi.login(email, password);
        localStorage.setItem('session', JSON.stringify(apiRes));
        setSession(apiRes);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [setSession],
  );

  const loginAsGuest = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const apiRes = await authApi.loginAsGuest();
      localStorage.setItem('session', JSON.stringify(apiRes));
      setSession(apiRes);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [setSession]);

  const logout = React.useCallback(async () => {
    localStorage.removeItem('session');
    setSession(null);
  }, [setSession]);

  const value = React.useMemo(() => {
    return { session, isLoading, login, loginAsGuest, logout, isAuthenticated: !!session };
  }, [session, isLoading, login, loginAsGuest, logout]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuth(): AuthSessionContext {
  const ctx = React.useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
