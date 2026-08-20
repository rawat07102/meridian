'use client';
import React from 'react';
import { SignupData, UserSession } from '../auth.types';
import authApi from '../auth.api';

export interface AuthSessionContext {
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthSessionContext = React.createContext<AuthSessionContext | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    }
    setIsLoading(false);
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const apiRes = await authApi.login({ email, password });
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

  const signup = React.useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      try {
        const apiRes = await authApi.signup(data);
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
    return { session, isLoading, signup, login, loginAsGuest, logout, isAuthenticated: !!session };
  }, [session, isLoading, login, loginAsGuest, logout, signup]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuth(): AuthSessionContext {
  const ctx = React.useContext(AuthSessionContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
