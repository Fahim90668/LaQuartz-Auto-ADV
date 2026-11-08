'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signInWithDiscord } from '@/lib/auth';
import { getBrowserSupabase } from '@/lib/supabase-browser';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const err = params.get('error');
    if (err) setError(decodeURIComponent(err));
  }, [params]);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/overview');
    });
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithDiscord();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="app-shell relative min-h-screen overflow-hidden">
      {/* Ambient gradient mesh — layered radial washes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(600px circle at 20% 10%, var(--accent, #a020f0) 0%, transparent 60%),' +
            'radial-gradient(500px circle at 80% 90%, var(--break, #22d3ee) 0%, transparent 60%)',
          opacity: 0.12,
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] space-y-8">
          {/* Brand */}
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-[image:var(--grad-brand)] shadow-glow">
              <Zap className="h-7 w-7 text-[color:var(--accent-fg)]" aria-hidden />
            </div>
            <h1 className="text-step-3 font-semibold tracking-tight text-text-primary">
              Welcome to LaQuartz
            </h1>
            <p className="mt-2 text-step-0 text-text-secondary">
              Sign in to manage your Discord advertising campaigns.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-lg border border-border-subtle bg-surface/90 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                className="mb-5 flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-step--1 text-danger"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              loading={loading}
              disabled={loading}
              onClick={handleSignIn}
              aria-describedby="signin-hint"
            >
              {loading ? 'Redirecting…' : 'Continue with Discord'}
              {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
            </Button>

            <p
              id="signin-hint"
              className="mt-4 text-center text-step--2 text-text-tertiary"
            >
              We request <code className="font-mono">identify</code> and{' '}
              <code className="font-mono">email</code> only.
            </p>
          </div>

          {/* Footer text */}
          <p className="text-center text-step--2 text-text-tertiary">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>

          <p className="text-center text-step--2">
            <Link
              href="/"
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
    }
