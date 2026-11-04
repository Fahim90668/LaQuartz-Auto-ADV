'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Ticket,
  Settings,
  Zap,
} from 'lucide-react';
import { NavItem } from './NavItem';

const items = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Users },
  { href: '/playgrounds', label: 'Playgrounds', icon: Sparkles },
  { href: '/redeem', label: 'Redeem', icon: Ticket },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border-subtle bg-surface">
      <div className="flex h-[var(--topbar-height)] items-center gap-2 border-b border-border-subtle px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--grad-brand)] shadow-md">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Auto Advertiser</p>
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <NavItem
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border-subtle p-3">
        <Link
          href="/no-access"
          className="block rounded-md border border-border-subtle bg-surface-2 p-3 text-xs text-text-secondary transition-colors hover:border-brand-primary/50 hover:text-text-primary"
        >
          <p className="mb-1 font-medium text-text-primary">Need more access?</p>
          <p>Buy a code from our Discord server →</p>
        </Link>
      </div>
    </aside>
  );
}