'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useEntitlement } from '@/hooks/useEntitlement';
import { signOut } from '@/lib/auth';
import { formatDate, formatRelative } from '@/lib/formatters';

export default function SettingsPage() {
  const { data } = useEntitlement();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-step-3 font-semibold text-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">Account and access information.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Access</CardTitle>
            <CardDescription>Your current entitlement status.</CardDescription>
          </div>
          <Badge tone={data?.hasAccess ? 'success' : 'danger'}>
            {data?.hasAccess ? 'Active' : 'None'}
          </Badge>
        </CardHeader>
        {data && (
          <div className="space-y-2 text-sm">
            <Row label="Playgrounds used" value={`${data.playgroundsUsed} / ${data.effectivePlaygroundLimit}`} />
            <Row
              label="Expires"
              value={
                data.isLifetime
                  ? 'Lifetime'
                  : data.soonestExpiry
                    ? `${formatDate(data.soonestExpiry)} (${formatRelative(data.soonestExpiry)})`
                    : '—'
              }
            />
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Session</CardTitle>
            <CardDescription>Sign out of this browser.</CardDescription>
          </div>
        </CardHeader>
        <Button variant="danger" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-2 last:border-0">
      <span className="text-text-tertiary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}