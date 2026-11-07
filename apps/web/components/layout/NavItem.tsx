'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/components/ui/cn';

export interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
}

export function NavItem({ href, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-[44px] items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
        'lg:min-h-0 lg:py-2',
        active
          ? 'bg-brand-primary/10 text-text-primary'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-brand-pink' : 'text-text-tertiary group-hover:text-text-secondary',
        )}
      />
      <span className="truncate font-medium">{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand-neon" />}
    </Link>
  );
}
