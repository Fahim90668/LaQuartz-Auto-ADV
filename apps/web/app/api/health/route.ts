import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json({ web: 'ok', api: data, status: res.ok ? 'ok' : 'degraded' }, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { web: 'ok', api: 'unreachable', error: (err as Error).message },
      { status: 503 },
    );
  }
}