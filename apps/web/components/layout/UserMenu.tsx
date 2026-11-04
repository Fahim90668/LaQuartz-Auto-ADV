'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { getBrowserSupabase } from '@/lib/supabase-browser';
import { useEffect, useState } from 'react';

export function UserMenu() {
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null);

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
        <button className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface-2 p-1 pr-3 transition-colors hover:border-border-strong">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/20">
              <User className="h-3 w-3 text-brand-pink" />
            </div>
          )}
          <span className="text-sm text-text-primary">{user?.name ?? 'Account'}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[200px] rounded-md border border-border-strong bg-surface-3 p-1 shadow-lg"
        >
          <div className="border-b border-border-subtle px-3 py-2">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-tertiary">{user?.email}</p>
          </div>
          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-text-secondary outline-none data-[highlighted]:bg-surface-2 data-[highlighted]:text-text-primary"
            >
              <Settings className="h-3.5 w-3.5" /> Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => void signOut()}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-danger outline-none data-[highlighted]:bg-danger/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}