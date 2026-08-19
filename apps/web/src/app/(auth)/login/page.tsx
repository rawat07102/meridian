'use client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/contexts/auth-session.context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isLoading, session, loginAsGuest } = useAuth();
  const router = useRouter();

  const handleLoginAsGuest = async () => {
    await loginAsGuest();
    router.push('/');
  };

  return (
    <main>
      {isLoading}
      {session && <p>{JSON.stringify(session, null, 2)}</p>}
      <Button onClick={handleLoginAsGuest}>Continue as Guest</Button>
    </main>
  );
}
