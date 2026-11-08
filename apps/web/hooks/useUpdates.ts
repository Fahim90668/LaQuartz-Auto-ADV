'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBrowserSupabase } from '@/lib/supabase-browser';

export interface Update {
  id: string;
  title: string;
  body: string;
  version: string | null;
  tags: string[];
  published_at: string;
}

export function useUpdates() {
  return useQuery({
    queryKey: ['updates'],
    queryFn: async (): Promise<Update[]> => {
      const { data, error } = await getBrowserSupabase()
        .from('updates')
        .select('id,title,body,version,tags,published_at')
        .order('published_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Update[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });
}

export function useReadUpdates() {
  return useQuery({
    queryKey: ['updates', 'reads'],
    queryFn: async (): Promise<string[]> => {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('update_reads')
        .select('update_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.update_id as string);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkUpdateRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updateId: string) => {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('update_reads')
        .insert({ user_id: user.id, update_id: updateId });
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['updates', 'reads'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updateIds: string[]) => {
      if (updateIds.length === 0) return;
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = updateIds.map((update_id) => ({
        user_id: user.id,
        update_id,
      }));
      const { error } = await supabase
        .from('update_reads')
        .upsert(rows, { onConflict: 'user_id,update_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['updates', 'reads'] });
    },
  });
        }
