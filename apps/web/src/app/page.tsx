'use client';
import { useAuth } from '@/features/auth/contexts/auth-session.context';
import { redirect } from 'next/navigation';

export default function Home() {
  const { isLoading, session, isAuthenticated } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return redirect('/login');
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return <main>{session && <p>{JSON.stringify(session, null, 2)}</p>}</main>;
}
