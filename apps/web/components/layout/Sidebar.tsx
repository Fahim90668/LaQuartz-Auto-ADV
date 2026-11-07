'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Zap,
  LayoutDashboard,
  Users,
  Sparkles,
  Ticket,
  Settings,
  BookOpen,
} from 'lucide-react';
import { NavItem } from './NavItem';
import { cn } from '@/components/ui/cn';

const items = [
  { href: '/overview',    label: 'Overview',    icon: LayoutDashboard },
  { href: '/accounts',    label: 'Accounts',    icon: Users },
  { href: '/playgrounds', label: 'Playgrounds', icon: Sparkles },
  { href: '/redeem',      label: 'Redeem',      icon: Ticket },
  { href: '/docs',        label: 'Docs',        icon: BookOpen },
  { href: '/settings',    label: 'Settings',    icon: Settings },
];

function SidebarInner({
  onNavigate,
  showClose,
}: {
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-[var(--topbar-height)] items-center justify-between border-b border-border-subtle px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[image:var(--grad-brand)] shadow-md">
            <Zap className="h-4 w-4 text-[color:var(--accent-fg)]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              LaQuartz AUTO-ADV
            </p>
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Panel</p>
          </div>
        </div>

        {showClose && (
          <Dialog.Close asChild>
            <button
              type="button"
              className="shrink-0 rounded p-2 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        )}
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
                onClick={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border-subtle p-3">
        <Link
          href="/no-access"
          onClick={onNavigate}
          className="block rounded-md border border-border-subtle bg-surface-2 p-3 text-xs text-text-secondary transition-colors hover:border-brand-primary/50 hover:text-text-primary"
        >
          <p className="mb-1 font-medium text-text-primary">Need more access?</p>
          <p>Buy a code from our Discord server →</p>
        </Link>
      </div>
    </div>
  );
}

export interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-[var(--sidebar-width)] shrink-0 border-r border-border-subtle lg:block">
        <SidebarInner />
      </aside>

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden',
              'data-[state=open]:animate-[fade-in_180ms_ease-out]',
              'data-[state=closed]:animate-[fade-out_150ms_ease-in]',
            )}
          />
          <Dialog.Content
            aria-modal="true"
            aria-describedby={undefined}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] shadow-lg lg:hidden',
              'data-[state=open]:animate-[slide-in-left_220ms_cubic-bezier(0.32,0.72,0,1)]',
              'data-[state=closed]:animate-[slide-out-left_180ms_cubic-bezier(0.4,0,1,1)]',
              'focus:outline-none',
            )}
          >
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <SidebarInner showClose onNavigate={() => onOpenChange(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
