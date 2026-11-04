'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useEntitlement() {
  return useQuery({
    queryKey: ['access'],
    queryFn: () => api.getAccess(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}