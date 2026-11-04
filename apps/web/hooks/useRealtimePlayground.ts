'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getBrowserSupabase } from '@/lib/supabase-browser';

export function useRealtimePlayground(playgroundId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!playgroundId) return;
    const supabase = getBrowserSupabase();

    const channel = supabase
      .channel(`playground:${playgroundId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_jobs',
          filter: `playground_id=eq.${playgroundId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['playground', playgroundId] });
          qc.invalidateQueries({ queryKey: ['playground', playgroundId, 'logs'] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'playgrounds',
          filter: `id=eq.${playgroundId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['playground', playgroundId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [playgroundId, qc]);
}