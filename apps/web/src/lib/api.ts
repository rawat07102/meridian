'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const isServer = typeof window === 'undefined';
  const url = getTargetUrl(endpoint);

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach token if on server
  let cookieStore: CookieStore | null = null;
  if (isServer) {
    cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  // Execute Request
  let response = await fetch(url, { ...options, headers });

  // Handle Token Refresh on 401
  if (response.status === 401 && isServer && cookieStore) {
    console.log('[apiFetch] Refreshing token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const newAccessToken = await refreshAuthTokens(baseUrl!, cookieStore);

    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `API error (${response.status})`);
  }

  return response.json() as Promise<T>;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

function getTargetUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

export async function setAuthCookies(cookieStore: CookieStore, tokens: AuthTokens): Promise<void> {
  console.log('Setting auth cookies', tokens);
  cookieStore.set('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // maxAge: 60 * 15, // 15 mins
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  if (tokens.refreshToken) {
    cookieStore.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
}

function clearAuthCookies(cookieStore: CookieStore): void {
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}

async function refreshAuthTokens(
  baseUrl: string,
  cookieStore: CookieStore,
): Promise<string | null> {
  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuthCookies(cookieStore);
      return null;
    }

    const tokens: AuthTokens = await res.json();
    await setAuthCookies(cookieStore, tokens);
    return tokens.accessToken;
  } catch {
    clearAuthCookies(cookieStore);
    return null;
  }
}

export async function verifyAuthTokens(): Promise<void> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('accessToken')?.value || null;
  const refreshToken = cookieStore.get('refreshToken')?.value || null;
  if (!accessToken && !refreshToken) {
    return redirect('/auth/login');
  }
}
