'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const labels: Record<string, string> = {
  '/overview': 'Overview',
  '/accounts': 'Accounts',
  '/playgrounds': 'Playgrounds',
  '/247': '24/7 Services',
  '/redeem': 'Redeem',
  '/docs': 'Docs',
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
          <p className="text-[10px] font-medium uppercase tracking-wider break-color">Panel</p>
          <h1 className="truncate text-step-1 font-semibold text-[color:var(--header)]">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
