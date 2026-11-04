'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { Toasts } from '@/components/ui/Toast';
import { type ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => getQueryClient());
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>
        {children}
        <Toasts />
      </TooltipProvider>
    </QueryClientProvider>
  );
}