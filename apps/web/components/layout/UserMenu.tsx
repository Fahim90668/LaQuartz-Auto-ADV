'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Settings, Palette } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/auth';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { useAppearance } from '@/hooks/useAppearance';

export function UserMenu() {
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null);
  const openAppearance = useAppearance((s) => s.openDialog);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUser({
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.user_name,
        avatar: user.user_metadata?.avatar_url,
      });
    });
  }, []);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="btn-press flex items-center gap-2 rounded-md border border-border-subtle bg-surface-2 p-1 pr-3 hover:border-border-strong">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-7 w-7 rounded-full ring-2 ring-[color:var(--primary)]/30"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                color: 'var(--primary)',
              }}
            >
              <User className="h-3 w-3" aria-hidden />
            </div>
          )}
          <span className="max-w-[120px] truncate text-step--1 text-text-primary">
            {user?.name ?? 'Account'}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[240px] max-w-[300px] rounded-md border border-border-strong bg-surface-3 p-1 shadow-lg"
        >
          <div className="border-b border-border-subtle px-3 py-2">
            <p className="truncate text-step--1 font-medium text-text-primary" title={user?.name ?? ''}>
              {user?.name ?? 'Account'}
            </p>
            {user?.email && (
              <p className="mt-0.5 truncate text-step--2 text-text-tertiary" title={user.email}>
                {user.email}
              </p>
            )}
          </div>

          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-step--1 text-text-secondary outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-text-primary"
            >
              <Settings className="h-3.5 w-3.5" /> Settings
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={(e) => { e.preventDefault(); openAppearance(); }}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-step--1 text-text-secondary outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-text-primary"
          >
            <Palette className="h-3.5 w-3.5" /> Appearance
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border-subtle" />

          <DropdownMenu.Item
            onSelect={() => void signOut()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-step--1 text-danger outline-none data-[highlighted]:bg-danger/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
      }
