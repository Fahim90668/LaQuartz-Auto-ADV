export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '—';
  const diff = Date.now() - ts;
  const abs = Math.abs(diff) / 1000;
  const past = diff >= 0;

  if (abs < 5) return past ? 'just now' : 'in a moment';
  if (abs < 60) return past ? `${Math.floor(abs)}s ago` : `in ${Math.floor(abs)}s`;
  if (abs < 3600) {
    const m = Math.floor(abs / 60);
    return past ? `${m}m ago` : `in ${m}m`;
  }
  if (abs < 86_400) {
    const h = Math.floor(abs / 3600);
    return past ? `${h}h ago` : `in ${h}h`;
  }
  const d = Math.floor(abs / 86_400);
  return past ? `${d}d ago` : `in ${d}d`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDurationSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec || parts.length === 0) parts.push(`${sec}s`);
  return parts.join(' ');
}

export function truncate(input: string, max = 60): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1)}…`;
}