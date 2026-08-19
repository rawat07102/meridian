'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { AuthSessionProvider } from '@/features/auth/contexts/auth-session.context';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        {children}
        <ReactQueryDevtools />
      </AuthSessionProvider>
    </QueryClientProvider>
  );
}
