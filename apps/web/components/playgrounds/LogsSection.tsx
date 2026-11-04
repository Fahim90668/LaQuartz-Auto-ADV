'use client';

import { usePlaygroundLogs } from '@/hooks/usePlayground';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import { formatRelative } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/Skeleton';

const statusTone = (status: string) => {
  if (status === 'sent') return 'success' as const;
  if (status === 'rate_limited') return 'warning' as const;
  if (status === 'invalid_token') return 'danger' as const;
  return 'danger' as const;
};

export function LogsSection({ playgroundId }: { playgroundId: string }) {
  const { data, isLoading } = usePlaygroundLogs(playgroundId, 20);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent deliveries</CardTitle>
          <CardDescription>Last 20 send attempts.</CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !data || data.logs.length === 0 ? (
        <p className="rounded-md border border-dashed border-border-subtle p-6 text-center text-sm text-text-tertiary">
          No deliveries yet.
        </p>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Time</Th>
              <Th>Status</Th>
              <Th>Channel</Th>
              <Th>Latency</Th>
            </tr>
          </Thead>
          <Tbody>
            {data.logs.map((log) => (
              <Tr key={log.id}>
                <Td>{formatRelative(log.createdAt)}</Td>
                <Td>
                  <Badge tone={statusTone(log.status)}>{log.status}</Badge>
                </Td>
                <Td className="font-mono text-xs">{log.channelId.slice(-8)}</Td>
                <Td>{log.latencyMs ? `${log.latencyMs}ms` : '—'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Card>
  );
}