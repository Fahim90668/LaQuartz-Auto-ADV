'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function usePlayground(id: string) {
  return useQuery({
    queryKey: ['playground', id],
    queryFn: () => api.getPlayground(id),
    refetchInterval: 10_000,
    enabled: Boolean(id),
  });
}

export function useStartPlayground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.startPlayground(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['playground', id] });
      qc.invalidateQueries({ queryKey: ['playgrounds'] });
    },
  });
}

export function useStopPlayground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.stopPlayground(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['playground', id] });
      qc.invalidateQueries({ queryKey: ['playgrounds'] });
    },
  });
}

export function useAddChannel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: import('@app/shared').ChannelInput) =>
      api.addPlaygroundChannel(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playground', id] }),
  });
}

export function useRemoveChannel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => api.removePlaygroundChannel(id, channelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playground', id] }),
  });
}

export function useAddMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.addPlaygroundMessage(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playground', id] }),
  });
}

export function usePlaygroundLogs(id: string, limit = 50) {
  return useQuery({
    queryKey: ['playground', id, 'logs', limit],
    queryFn: () => api.listPlaygroundLogs(id, limit),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
}