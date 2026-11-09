'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export type ContinuousType = 'onliner' | 'vc' | 'typer';
export type ContinuousStatus = 'pending' | 'active' | 'paused' | 'expired' | 'error';

export interface ContinuousService {
  id: string;
  userId: string;
  accountId: string;
  serviceType: ContinuousType;
  config: Record<string, unknown>;
  status: ContinuousStatus;
  startsAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  stoppedAt: string | null;
}

export interface CreateContinuousInput {
  accountId: string;
  serviceType: ContinuousType;
  durationSeconds: number;
  config: Record<string, unknown>;
}

export function useContinuousList() {
  return useQuery({
    queryKey: ['continuous'],
    queryFn: () => apiFetch<{ items: ContinuousService[] }>('/continuous'),
    select: (data) => data.items,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateContinuous() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateContinuousInput) =>
      apiFetch<{ id: string; expiresAt: string; status: string }>('/continuous', {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['continuous'] });
    },
  });
}

export function useStopContinuous() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/continuous/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['continuous'] });
    },
  });
  }
