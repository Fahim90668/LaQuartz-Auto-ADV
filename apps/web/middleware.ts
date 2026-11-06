import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = new Set(['/', '/login', '/no-access', '/auth/callback']);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  if (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')
  ) {
    return res;
  }

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  const { data: hasAccess, error: accessError } = await supabase.rpc('fn_has_access', {
    p_user: user.id,
  });

  if (accessError) {
    console.error('[middleware] fn_has_access RPC failed:', {
      message: accessError.message,
      code: accessError.code,
      details: accessError.details,
      hint: accessError.hint,
      userId: user.id,
      pathname,
    });
  }

  if (accessError || !hasAccess) {
    if (pathname !== '/redeem') {
      const url = req.nextUrl.clone();
      url.pathname = '/no-access';
      return NextResponse.redirect(url);
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
