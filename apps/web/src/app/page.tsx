'use client';
import { useAuth } from '@/features/auth/contexts/auth-session.context';
import { redirect } from 'next/navigation';

export default function Home() {
  const { isLoading, isAuthenticated } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return redirect('/login');
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return redirect(`/workspaces/${process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID}`);
}
