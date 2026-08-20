'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAsGuest } from '@/features/auth/auth.actions';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGuestLogin = () => {
    startTransition(async () => {
      try {
        await loginAsGuest();
        router.push(`/workspaces/${process.env.NEXT_PUBLIC_WORKSPACE_ID}`);
        router.refresh();
      } catch (error) {
        console.error('Guest login failed:', error);
      }
    });
  };

  return (
    <main>
      <Button onClick={handleGuestLogin} disabled={isPending}>
        {isPending ? 'Signing in...' : 'Continue as Guest'}
      </Button>
    </main>
  );
}
