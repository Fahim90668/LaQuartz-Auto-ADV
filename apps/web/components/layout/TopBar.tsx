'use client';

import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';

const labels: Record<string, string> = {
  '/overview': 'Overview',
  '/accounts': 'Accounts',
  '/playgrounds': 'Playgrounds',
  '/redeem': 'Redeem',
  '/settings': 'Settings',
};

export function TopBar() {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/')[1] ?? '');
  const title = labels[base] ?? 'Panel';

  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border-subtle bg-surface px-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-text-tertiary">Panel</p>
        <h1 className="text-h3 font-semibold text-text-primary">{title}</h1>
      </div>
      <UserMenu />
    </header>
  );
}