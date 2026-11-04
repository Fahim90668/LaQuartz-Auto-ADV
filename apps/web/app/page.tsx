import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase-server';

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: hasAccess } = await supabase.rpc('fn_has_access', { p_user: user.id });
  if (!hasAccess) redirect('/no-access');

  redirect('/overview');
}