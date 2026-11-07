'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, AlertTriangle } from 'lucide-react';
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
    if (err) setError(err);
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
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[image:var(--grad-brand)] shadow-glow">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-step-3 font-semibold text-text-primary">LaQuartz AUTO-ADV</h1>
          <p className="mt-2 text-sm text-text-secondary">
            License-gated Discord advertising automation.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 p-3 text-xs text-danger"
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button className="w-full" size="lg" loading={loading} onClick={handleSignIn}>
          Continue with Discord
        </Button>

        <p className="mt-6 text-center text-xs text-text-tertiary">
          We request <code className="font-mono">identify</code> and{' '}
          <code className="font-mono">email</code> only.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
    }
