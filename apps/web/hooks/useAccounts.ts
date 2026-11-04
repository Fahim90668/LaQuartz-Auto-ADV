'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.listAccounts(),
    select: (data) => data.items,
  });
}

export function useAddAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label: string; token: string }) => api.addAccount(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['access'] });
    },
  });
}

export function useValidateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.validateAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useRemoveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['playgrounds'] });
    },
  });
}