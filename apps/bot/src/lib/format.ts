export function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1)}…`;
}

export function formatDurationLabel(duration: 'lifetime' | '1m' | '3m'): string {
  switch (duration) {
    case 'lifetime':
      return 'Lifetime';
    case '1m':
      return '30 days (1 month)';
    case '3m':
      return '90 days (3 months)';
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `<t:${Math.floor(d.getTime() / 1000)}:F> (<t:${Math.floor(d.getTime() / 1000)}:R>)`;
}

export function formatUnix(ms: number): string {
  return `<t:${Math.floor(ms / 1000)}:F>`;
}

export function maskDiscordId(id: string | null | undefined): string {
  if (!id) return '—';
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}