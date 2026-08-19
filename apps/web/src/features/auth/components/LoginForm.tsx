'use client';

import { Button } from '@/components/ui/button';
import authApi from '../auth.api';

export default function LoginForm() {
  const handleGuestLogin = async () => {
    await authApi.loginAsGuest();
  };
  return <Button onClick={handleGuestLogin}>Continue as Guest</Button>;
}
