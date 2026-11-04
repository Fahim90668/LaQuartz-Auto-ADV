'use client';

import { getBrowserSupabase } from './supabase-browser';

export async function signInWithDiscord(): Promise<void> {
  const supabase = getBrowserSupabase();
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo,
      scopes: 'identify email',
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getBrowserSupabase();
  await supabase.auth.signOut();
  window.location.href = '/';
}

export async function getCurrentUser() {
  const supabase = getBrowserSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}