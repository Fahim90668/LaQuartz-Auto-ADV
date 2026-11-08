import { getServerSupabase } from '@/lib/supabase-server';
import { HomeContent } from '@/components/home/HomeContent';

export default async function HomePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAccess = false;
  if (user) {
    const { data } = await supabase.rpc('fn_has_access', { p_user: user.id });
    hasAccess = Boolean(data);
  }

  return <HomeContent authenticated={Boolean(user)} hasAccess={hasAccess} />;
}
