'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePlaygroundInput } from '@app/shared';
import { api } from '@/lib/api-client';

export function usePlaygrounds() {
  return useQuery({
    queryKey: ['playgrounds'],
    queryFn: () => api.listPlaygrounds(),
    select: (data) => data.items,
    refetchInterval: 20_000,
  });
}

export function useCreatePlayground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlaygroundInput) => api.createPlayground(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playgrounds'] });
      qc.invalidateQueries({ queryKey: ['access'] });
    },
  });
}

export function useDeletePlayground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePlayground(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playgrounds'] }),
  });
}