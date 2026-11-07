'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';

const labels: Record<string, string> = {
  '/overview': 'Overview',
  '/accounts': 'Accounts',
  '/playgrounds': 'Playgrounds',
  '/redeem': 'Redeem',
  '/settings': 'Settings',
};

export interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const base = '/' + (pathname.split('/')[1] ?? '');
  const title = labels[base] ?? 'Panel';

  return (
    <header className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border-subtle bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="-ml-2 rounded-md p-2 text-text-secondary hover:bg-surface-2 hover:text-text-primary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-text-tertiary">Panel</p>
          <h1 className="truncate text-step-2 font-semibold text-text-primary">{title}</h1>
        </div>
      </div>

      <UserMenu />
    </header>
  );
}
