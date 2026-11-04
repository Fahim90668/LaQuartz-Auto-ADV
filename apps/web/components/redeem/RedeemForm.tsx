'use client';

import { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

export function RedeemForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  const router = useRouter();

  const handleRedeem = async () => {
    setError(null);
    if (!code.trim()) return setError('Enter a code.');

    setLoading(true);
    try {
      const res = await api.redeem(code.trim().toUpperCase());
      if (!res.success) {
        setError(res.message);
        return;
      }
      toast({ kind: 'success', title: 'Code redeemed', description: res.message });
      await qc.invalidateQueries();
      router.push('/overview');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Redeem a code</CardTitle>
          <CardDescription>Enter your code to unlock the panel.</CardDescription>
        </div>
        <Ticket className="h-5 w-5 text-brand-pink" />
      </CardHeader>

      <div className="space-y-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ADVT-XXXX-XXXX-XXXX"
          className="text-center font-mono text-lg tracking-[0.2em]"
          maxLength={32}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button loading={loading} onClick={handleRedeem} className="w-full">
          Redeem
        </Button>
      </div>
    </Card>
  );
}