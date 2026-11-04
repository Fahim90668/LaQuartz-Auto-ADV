import 'server-only';

import { redirect } from 'next/navigation';
import { getServerSupabase } from './supabase-server';

export async function requireUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function requireAccess() {
  const { supabase, user } = await requireUser();
  const { data: hasAccess } = await supabase.rpc('fn_has_access', { p_user: user.id });
  if (!hasAccess) redirect('/no-access');
  return { supabase, user };
}