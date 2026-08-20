'use server';

import { setAuthCookies, apiFetch } from '@/lib/api';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function loginAsGuest() {
  const email = 'guest@meridian.com';
  const password = 'Password123!';

  const res = await apiFetch<LoginResponse>('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await setAuthCookies(await cookies(), res);
  redirect(`/workspaces/${process.env.NEXT_PUBLIC_WORKSPACE_ID}`);
}
