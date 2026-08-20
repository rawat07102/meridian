'use client';

import { useTransition } from 'react';
import { loginAsGuest } from '@/features/auth/auth.actions';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();

  const handleGuestLogin = () => {
    startTransition(async () => loginAsGuest());
  };

  return (
    <main>
      <Button onClick={handleGuestLogin} disabled={isPending}>
        {isPending ? 'Signing in...' : 'Continue as Guest'}
      </Button>
    </main>
  );
}
