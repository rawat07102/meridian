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
    <main className="flex flex-col gap-6 h-screen w-screen items-center justify-center">
      <div className="flex flex-col gap-6 items-center border-border border p-6 rounded-4xl">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-semibold font-sans">Let's get back on track</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to login to your account.
          </p>
        </div>
        <Button className="w-full rounded-full p-2" onClick={handleGuestLogin} disabled={isPending}>
          {isPending ? 'Signing in...' : 'Continue as Guest'}
        </Button>
      </div>
      <p className="text-wrap max-w-50 text-center text-xs text-muted-foreground">
        By clicking continue, you agree to our Terms of Service and Privacy Policy
      </p>
    </main>
  );
}
