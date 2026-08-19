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

  if (session?.type === 'guest') {
    return redirect(`/workspace/${session.workspaceId}`);
  }

  return redirect(`/workspace/mock-workspace-id`);
}
